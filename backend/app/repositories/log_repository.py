from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Literal

from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.log import Log
from app.schemas.log import LogCreate, LogUpdate

SortColumn = Literal["timestamp", "severity", "source"]
Order = Literal["asc", "desc"]


def _sev_case(s: str):
    return func.sum(case((Log.severity == s, 1), else_=0))


class LogRepository:
    @staticmethod
    async def create(session: AsyncSession, data: LogCreate) -> Log:
        log = Log(
            timestamp=data.timestamp or datetime.now(timezone.utc),
            severity=data.severity,
            source=data.source,
            message=data.message,
        )
        session.add(log)
        await session.flush()
        await session.refresh(log)
        return log

    @staticmethod
    async def get_sources(session: AsyncSession) -> list[str]:
        result = await session.execute(
            select(Log.source).distinct().order_by(Log.source)
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_by_id(session: AsyncSession, log_id: int) -> Log | None:
        result = await session.execute(select(Log).where(Log.id == log_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def list(
        session: AsyncSession,
        *,
        start: datetime | None = None,
        end: datetime | None = None,
        severities: list[str] | None = None,
        source: str | None = None,
        sort_by: SortColumn = "timestamp",
        order: Order = "desc",
        page: int = 1,
        limit: int = 50,
    ) -> tuple[list[Log], int]:
        stmt = select(Log)
        stmt = _apply_filters(stmt, start=start, end=end, severities=severities, source=source)

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total: int = (await session.execute(count_stmt)).scalar_one()

        sort_col = getattr(Log, sort_by)
        stmt = stmt.order_by(sort_col.desc() if order == "desc" else sort_col.asc())
        stmt = stmt.offset((page - 1) * limit).limit(limit)

        result = await session.execute(stmt)
        return list(result.scalars().all()), total

    @staticmethod
    async def update(session: AsyncSession, log: Log, data: LogUpdate) -> Log:
        for field in data.model_fields_set:
            value = getattr(data, field)
            if value is not None:
                setattr(log, field, value)
        await session.flush()
        await session.refresh(log)
        return log

    @staticmethod
    async def delete(session: AsyncSession, log: Log) -> None:
        await session.delete(log)
        await session.flush()

    @staticmethod
    async def get_summary(
        session: AsyncSession,
        *,
        start: datetime | None = None,
        end: datetime | None = None,
        severities: list[str] | None = None,
        source: str | None = None,
    ) -> dict[str, Any]:
        # source フィルタは分析系のため完全一致
        def filtered(stmt):
            return _apply_filters(
                stmt, start=start, end=end, severities=severities, source=source, source_exact=True
            )

        # severity 全体集計
        summary_stmt = filtered(
            select(
                _sev_case("INFO").label("INFO"),
                _sev_case("WARNING").label("WARNING"),
                _sev_case("ERROR").label("ERROR"),
                _sev_case("CRITICAL").label("CRITICAL"),
            ).select_from(Log)
        )
        summary_row = (await session.execute(summary_stmt)).one()
        summary = {
            "INFO": summary_row.INFO or 0,
            "WARNING": summary_row.WARNING or 0,
            "ERROR": summary_row.ERROR or 0,
            "CRITICAL": summary_row.CRITICAL or 0,
        }

        # source 別ヒストグラム
        hist_stmt = filtered(
            select(
                Log.source,
                _sev_case("INFO").label("INFO"),
                _sev_case("WARNING").label("WARNING"),
                _sev_case("ERROR").label("ERROR"),
                _sev_case("CRITICAL").label("CRITICAL"),
            )
            .select_from(Log)
            .group_by(Log.source)
            .order_by(Log.source)
        )
        hist_rows = (await session.execute(hist_stmt)).all()
        histogram = [
            {
                "source": row.source,
                "INFO": row.INFO or 0,
                "WARNING": row.WARNING or 0,
                "ERROR": row.ERROR or 0,
                "CRITICAL": row.CRITICAL or 0,
            }
            for row in hist_rows
        ]

        return {"summary": summary, "histogram": histogram}

    @staticmethod
    async def get_timeseries(
        session: AsyncSession,
        *,
        start: datetime | None = None,
        end: datetime | None = None,
        severities: list[str] | None = None,
        source: str | None = None,
        interval: Literal["hour", "day", "week"] = "day",
    ) -> list[dict[str, Any]]:
        pg_interval = {"hour": "hour", "day": "day", "week": "week"}[interval]
        trunc = func.date_trunc(pg_interval, Log.timestamp)
        stmt = _apply_filters(
            select(
                trunc.label("timestamp"),
                _sev_case("INFO").label("INFO"),
                _sev_case("WARNING").label("WARNING"),
                _sev_case("ERROR").label("ERROR"),
                _sev_case("CRITICAL").label("CRITICAL"),
            )
            .select_from(Log)
            .group_by(trunc)
            .order_by(trunc),
            start=start,
            end=end,
            severities=severities,
            source=source,
            source_exact=True,
        )
        rows = (await session.execute(stmt)).all()
        return [
            {
                "timestamp": row.timestamp,
                "INFO": row.INFO or 0,
                "WARNING": row.WARNING or 0,
                "ERROR": row.ERROR or 0,
                "CRITICAL": row.CRITICAL or 0,
            }
            for row in rows
        ]

    @staticmethod
    async def list_for_csv(
        session: AsyncSession,
        *,
        start: datetime | None = None,
        end: datetime | None = None,
        severities: list[str] | None = None,
        source: str | None = None,
    ) -> list[Log]:
        stmt = select(Log)
        stmt = _apply_filters(stmt, start=start, end=end, severities=severities, source=source)
        stmt = stmt.order_by(Log.timestamp.asc())
        result = await session.execute(stmt)
        return list(result.scalars().all())


def _apply_filters(
    stmt,
    *,
    start: datetime | None = None,
    end: datetime | None = None,
    severities: list[str] | None = None,
    source: str | None = None,
    source_exact: bool = False,
):
    if start is not None:
        stmt = stmt.where(Log.timestamp >= start)
    if end is not None:
        stmt = stmt.where(Log.timestamp <= end)
    if severities:
        stmt = stmt.where(Log.severity.in_(severities))
    if source:
        if source_exact:
            stmt = stmt.where(Log.source == source)
        else:
            stmt = stmt.where(Log.source.ilike(f"%{source}%"))
    return stmt

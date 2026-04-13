from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.log import Log
from app.repositories.log_repository import LogRepository, Order, SortColumn
from app.schemas.log import LogCreate, LogUpdate


class LogService:
    @staticmethod
    async def create(session: AsyncSession, data: LogCreate) -> Log:
        return await LogRepository.create(session, data)

    @staticmethod
    async def get_sources(session: AsyncSession) -> list[str]:
        return await LogRepository.get_sources(session)

    @staticmethod
    async def get_by_id(session: AsyncSession, log_id: int) -> Log:
        log = await LogRepository.get_by_id(session, log_id)
        if log is None:
            raise HTTPException(status_code=404, detail="Log not found")
        return log

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
        _validate_date_range(start, end)
        return await LogRepository.list(
            session,
            start=start,
            end=end,
            severities=severities,
            source=source,
            sort_by=sort_by,
            order=order,
            page=page,
            limit=limit,
        )

    @staticmethod
    async def update(session: AsyncSession, log_id: int, data: LogUpdate) -> Log:
        log = await LogRepository.get_by_id(session, log_id)
        if log is None:
            raise HTTPException(status_code=404, detail="Log not found")
        return await LogRepository.update(session, log, data)

    @staticmethod
    async def delete(session: AsyncSession, log_id: int) -> None:
        log = await LogRepository.get_by_id(session, log_id)
        if log is None:
            raise HTTPException(status_code=404, detail="Log not found")
        await LogRepository.delete(session, log)

    @staticmethod
    async def get_summary(
        session: AsyncSession,
        *,
        start: datetime | None = None,
        end: datetime | None = None,
        severities: list[str] | None = None,
        source: str | None = None,
    ) -> dict[str, Any]:
        _validate_date_range(start, end)
        return await LogRepository.get_summary(
            session,
            start=start,
            end=end,
            severities=severities,
            source=source,
        )

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
        _validate_date_range(start, end)
        return await LogRepository.get_timeseries(
            session,
            start=start,
            end=end,
            severities=severities,
            source=source,
            interval=interval,
        )

    @staticmethod
    async def list_for_csv(
        session: AsyncSession,
        *,
        start: datetime | None = None,
        end: datetime | None = None,
        severities: list[str] | None = None,
        source: str | None = None,
    ) -> list[Log]:
        _validate_date_range(start, end)
        return await LogRepository.list_for_csv(
            session,
            start=start,
            end=end,
            severities=severities,
            source=source,
        )


def _validate_date_range(start: datetime | None, end: datetime | None) -> None:
    if start is not None and end is not None and start > end:
        raise HTTPException(status_code=400, detail="start must be before end")

from __future__ import annotations

import csv
import io
import math
from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.schemas.log import (
    AnalyticsSummaryResponse,
    HistogramEntry,
    LogCreate,
    LogListResponse,
    LogResponse,
    LogUpdate,
    SeveritySummary,
    TimeseriesEntry,
    TimeseriesResponse,
)
from app.services.log_service import LogService

router = APIRouter(prefix="/api/v1/logs", tags=["logs"])


# ─── 分析・CSV（/{log_id} より前に定義してルート衝突を防ぐ）────────────────────

@router.get("/analytics/summary", response_model=AnalyticsSummaryResponse)
async def get_analytics_summary(
    start: datetime | None = Query(default=None),
    end: datetime | None = Query(default=None),
    severity: list[str] | None = Query(default=None),
    source: str | None = Query(default=None),
    session: AsyncSession = Depends(get_session),
) -> AnalyticsSummaryResponse:
    result = await LogService.get_summary(
        session, start=start, end=end, severities=severity, source=source
    )
    return AnalyticsSummaryResponse(
        summary=SeveritySummary(**result["summary"]),
        histogram=[HistogramEntry(**entry) for entry in result["histogram"]],
    )


@router.get("/analytics/timeseries", response_model=TimeseriesResponse)
async def get_analytics_timeseries(
    start: datetime | None = Query(default=None),
    end: datetime | None = Query(default=None),
    severity: list[str] | None = Query(default=None),
    source: str | None = Query(default=None),
    interval: Literal["hour", "day", "week"] = Query(default="day"),
    session: AsyncSession = Depends(get_session),
) -> TimeseriesResponse:
    data = await LogService.get_timeseries(
        session,
        start=start,
        end=end,
        severities=severity,
        source=source,
        interval=interval,
    )
    return TimeseriesResponse(
        interval=interval,
        data=[TimeseriesEntry(**entry) for entry in data],
    )


@router.get("/export/csv")
async def export_csv(
    start: datetime | None = Query(default=None),
    end: datetime | None = Query(default=None),
    severity: list[str] | None = Query(default=None),
    source: str | None = Query(default=None),
    session: AsyncSession = Depends(get_session),
) -> StreamingResponse:
    logs = await LogService.list_for_csv(
        session, start=start, end=end, severities=severity, source=source
    )

    output = io.StringIO()
    output.write("\ufeff")  # UTF-8 BOM
    writer = csv.writer(output)
    writer.writerow(["id", "timestamp", "severity", "source", "message"])
    for log in logs:
        writer.writerow(
            [log.id, log.timestamp.isoformat(), log.severity, log.source, log.message]
        )

    filename = f"logs_{datetime.now(timezone.utc).strftime('%Y%m%d')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ─── CRUD ──────────────────────────────────────────────────────────────────────

@router.get("", response_model=LogListResponse)
async def list_logs(
    start: datetime | None = Query(default=None),
    end: datetime | None = Query(default=None),
    severity: list[str] | None = Query(default=None),
    source: str | None = Query(default=None),
    sort_by: Literal["timestamp", "severity", "source"] = Query(default="timestamp"),
    order: Literal["asc", "desc"] = Query(default="desc"),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=50, ge=1, le=200),
    session: AsyncSession = Depends(get_session),
) -> LogListResponse:
    logs, total = await LogService.list(
        session,
        start=start,
        end=end,
        severities=severity,
        source=source,
        sort_by=sort_by,
        order=order,
        page=page,
        limit=limit,
    )
    pages = math.ceil(total / limit) if total > 0 else 0
    return LogListResponse(
        data=[LogResponse.model_validate(log) for log in logs],
        total=total,
        page=page,
        limit=limit,
        pages=pages,
    )


@router.post("", response_model=LogResponse, status_code=201)
async def create_log(
    data: LogCreate,
    session: AsyncSession = Depends(get_session),
) -> LogResponse:
    log = await LogService.create(session, data)
    return LogResponse.model_validate(log)


@router.get("/{log_id}", response_model=LogResponse)
async def get_log(
    log_id: int,
    session: AsyncSession = Depends(get_session),
) -> LogResponse:
    log = await LogService.get_by_id(session, log_id)
    return LogResponse.model_validate(log)


@router.patch("/{log_id}", response_model=LogResponse)
async def update_log(
    log_id: int,
    data: LogUpdate,
    session: AsyncSession = Depends(get_session),
) -> LogResponse:
    log = await LogService.update(session, log_id, data)
    return LogResponse.model_validate(log)


@router.delete("/{log_id}", status_code=204)
async def delete_log(
    log_id: int,
    session: AsyncSession = Depends(get_session),
) -> None:
    await LogService.delete(session, log_id)

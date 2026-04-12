from datetime import datetime
from typing import Annotated, Literal, Optional

from pydantic import BaseModel, Field

SeverityType = Literal["INFO", "WARNING", "ERROR", "CRITICAL"]


class LogCreate(BaseModel):
    timestamp: Optional[datetime] = None
    severity: SeverityType
    source: Annotated[str, Field(min_length=1, max_length=255)]
    message: Annotated[str, Field(min_length=1)]


class LogUpdate(BaseModel):
    timestamp: Optional[datetime] = None
    severity: Optional[SeverityType] = None
    source: Optional[Annotated[str, Field(min_length=1, max_length=255)]] = None
    message: Optional[Annotated[str, Field(min_length=1)]] = None


class LogResponse(BaseModel):
    id: int
    timestamp: datetime
    severity: str
    source: str
    message: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class LogListResponse(BaseModel):
    data: list[LogResponse]
    total: int
    page: int
    limit: int
    pages: int


class SeveritySummary(BaseModel):
    INFO: int = 0
    WARNING: int = 0
    ERROR: int = 0
    CRITICAL: int = 0


class HistogramEntry(BaseModel):
    source: str
    INFO: int = 0
    WARNING: int = 0
    ERROR: int = 0
    CRITICAL: int = 0


class TimeseriesEntry(BaseModel):
    timestamp: datetime
    INFO: int = 0
    WARNING: int = 0
    ERROR: int = 0
    CRITICAL: int = 0


class AnalyticsSummaryResponse(BaseModel):
    summary: SeveritySummary
    histogram: list[HistogramEntry]


class TimeseriesResponse(BaseModel):
    interval: Literal["hour", "day", "week"]
    data: list[TimeseriesEntry]

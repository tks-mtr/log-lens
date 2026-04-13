from datetime import datetime, timezone

import pytest
from pydantic import ValidationError

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


class TestLogCreate:
    def test_valid_all_fields(self):
        ts = datetime(2026, 4, 1, 12, 0, 0, tzinfo=timezone.utc)
        log = LogCreate(
            timestamp=ts,
            severity="ERROR",
            source="api-server",
            message="Connection timeout",
        )
        assert log.timestamp == ts
        assert log.severity == "ERROR"
        assert log.source == "api-server"
        assert log.message == "Connection timeout"

    def test_timestamp_optional(self):
        log = LogCreate(severity="INFO", source="app", message="Started")
        assert log.timestamp is None

    def test_all_severity_values(self):
        for sev in ("INFO", "WARNING", "ERROR", "CRITICAL"):
            log = LogCreate(severity=sev, source="app", message="msg")
            assert log.severity == sev

    def test_invalid_severity_raises(self):
        with pytest.raises(ValidationError):
            LogCreate(severity="DEBUG", source="app", message="msg")

    def test_empty_source_raises(self):
        with pytest.raises(ValidationError):
            LogCreate(severity="INFO", source="", message="msg")

    def test_empty_message_raises(self):
        with pytest.raises(ValidationError):
            LogCreate(severity="INFO", source="app", message="")

    def test_missing_severity_raises(self):
        with pytest.raises(ValidationError):
            LogCreate(source="app", message="msg")

    def test_missing_source_raises(self):
        with pytest.raises(ValidationError):
            LogCreate(severity="INFO", message="msg")

    def test_missing_message_raises(self):
        with pytest.raises(ValidationError):
            LogCreate(severity="INFO", source="app")

    def test_source_max_length_raises(self):
        with pytest.raises(ValidationError):
            LogCreate(severity="INFO", source="a" * 256, message="msg")

    def test_source_max_length_exactly_succeeds(self):
        log = LogCreate(severity="INFO", source="a" * 255, message="msg")
        assert len(log.source) == 255


class TestLogUpdate:
    def test_all_optional_empty(self):
        update = LogUpdate()
        assert update.severity is None
        assert update.source is None
        assert update.message is None
        assert update.timestamp is None

    def test_partial_severity_only(self):
        update = LogUpdate(severity="CRITICAL")
        assert update.severity == "CRITICAL"
        assert update.source is None

    def test_partial_source_only(self):
        update = LogUpdate(source="new-service")
        assert update.source == "new-service"
        assert update.severity is None

    def test_invalid_severity_raises(self):
        with pytest.raises(ValidationError):
            LogUpdate(severity="TRACE")

    def test_empty_source_raises(self):
        with pytest.raises(ValidationError):
            LogUpdate(source="")

    def test_empty_message_raises(self):
        with pytest.raises(ValidationError):
            LogUpdate(message="")

    def test_model_fields_set_tracks_provided_fields(self):
        update = LogUpdate(severity="ERROR")
        assert "severity" in update.model_fields_set
        assert "source" not in update.model_fields_set

    def test_explicit_none_tracked_in_model_fields_set(self):
        # Service層は model_fields_set で「明示的にNullを渡した」かを判別できる
        update = LogUpdate(timestamp=None)
        assert "timestamp" in update.model_fields_set


class TestLogResponse:
    def test_from_dict(self):
        ts = datetime(2026, 4, 1, 12, 0, 0, tzinfo=timezone.utc)
        created_at = datetime(2026, 4, 1, 12, 0, 1, tzinfo=timezone.utc)
        response = LogResponse(
            id=1,
            timestamp=ts,
            severity="ERROR",
            source="api-server",
            message="Connection timeout",
            created_at=created_at,
            updated_at=created_at,
        )
        assert response.id == 1
        assert response.timestamp == ts
        assert response.severity == "ERROR"
        assert response.source == "api-server"
        assert response.message == "Connection timeout"
        assert response.created_at == created_at
        assert response.updated_at == created_at

    def test_from_attributes(self):
        ts = datetime(2026, 4, 1, 12, 0, 0, tzinfo=timezone.utc)
        created_at = datetime(2026, 4, 1, 12, 0, 1, tzinfo=timezone.utc)

        class FakeLog:
            id = 1
            timestamp = ts
            severity = "ERROR"
            source = "api-server"
            message = "Connection timeout"

        FakeLog.created_at = created_at
        FakeLog.updated_at = created_at

        response = LogResponse.model_validate(FakeLog(), from_attributes=True)
        assert response.id == 1
        assert response.timestamp == ts
        assert response.severity == "ERROR"
        assert response.source == "api-server"
        assert response.message == "Connection timeout"
        assert response.created_at == created_at
        assert response.updated_at == created_at


class TestLogListResponse:
    def test_valid(self):
        entry = LogResponse(
            id=1,
            timestamp=datetime(2026, 4, 1, tzinfo=timezone.utc),
            severity="INFO",
            source="app",
            message="msg",
            created_at=datetime(2026, 4, 1, tzinfo=timezone.utc),
            updated_at=datetime(2026, 4, 1, tzinfo=timezone.utc),
        )
        response = LogListResponse(data=[entry], total=1, page=1, limit=50, pages=1)
        assert response.total == 1
        assert len(response.data) == 1
        assert response.pages == 1
        assert response.page == 1
        assert response.limit == 50

    def test_empty_data(self):
        response = LogListResponse(data=[], total=0, page=1, limit=50, pages=0)
        assert response.data == []
        assert response.total == 0
        assert response.pages == 0


class TestAnalyticsSummaryResponse:
    def test_valid(self):
        response = AnalyticsSummaryResponse(
            summary=SeveritySummary(INFO=120, WARNING=45, ERROR=30, CRITICAL=5),
            histogram=[
                HistogramEntry(source="api-server", INFO=80, WARNING=20, ERROR=15, CRITICAL=2),
                HistogramEntry(source="worker", INFO=40, WARNING=25, ERROR=15, CRITICAL=3),
            ],
        )
        assert response.summary.INFO == 120
        assert response.summary.WARNING == 45
        assert response.summary.ERROR == 30
        assert response.summary.CRITICAL == 5
        assert len(response.histogram) == 2
        assert response.histogram[0].source == "api-server"
        assert response.histogram[0].INFO == 80
        assert response.histogram[0].WARNING == 20
        assert response.histogram[0].ERROR == 15
        assert response.histogram[0].CRITICAL == 2
        assert response.histogram[1].source == "worker"
        assert response.histogram[1].INFO == 40

    def test_default_zero_counts(self):
        entry = HistogramEntry(source="worker")
        assert entry.INFO == 0
        assert entry.WARNING == 0
        assert entry.ERROR == 0
        assert entry.CRITICAL == 0

    def test_empty_histogram(self):
        response = AnalyticsSummaryResponse(
            summary=SeveritySummary(),
            histogram=[],
        )
        assert response.histogram == []


class TestTimeseriesResponse:
    def test_valid(self):
        ts1 = datetime(2026, 4, 1, tzinfo=timezone.utc)
        ts2 = datetime(2026, 4, 2, tzinfo=timezone.utc)
        response = TimeseriesResponse(
            interval="day",
            data=[
                TimeseriesEntry(timestamp=ts1, INFO=50, WARNING=10, ERROR=5, CRITICAL=1),
                TimeseriesEntry(timestamp=ts2, INFO=60, WARNING=15, ERROR=8, CRITICAL=0),
            ],
        )
        assert response.interval == "day"
        assert len(response.data) == 2
        assert response.data[0].timestamp == ts1
        assert response.data[0].INFO == 50
        assert response.data[0].WARNING == 10
        assert response.data[0].ERROR == 5
        assert response.data[0].CRITICAL == 1
        assert response.data[1].timestamp == ts2

    def test_interval_hour(self):
        response = TimeseriesResponse(interval="hour", data=[])
        assert response.interval == "hour"

    def test_interval_week(self):
        response = TimeseriesResponse(interval="week", data=[])
        assert response.interval == "week"

    def test_invalid_interval_raises(self):
        with pytest.raises(ValidationError):
            TimeseriesResponse(interval="month", data=[])

    def test_default_zero_counts(self):
        entry = TimeseriesEntry(timestamp=datetime(2026, 4, 1, tzinfo=timezone.utc))
        assert entry.INFO == 0
        assert entry.WARNING == 0
        assert entry.ERROR == 0
        assert entry.CRITICAL == 0

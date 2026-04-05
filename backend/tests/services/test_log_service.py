"""
Service 層の単体テスト（venv で実行・Repository をモック）。
"""
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException

from app.repositories.log_repository import LogRepository
from app.schemas.log import LogCreate, LogUpdate
from app.services.log_service import LogService


def make_mock_log(**kwargs) -> MagicMock:
    defaults = {
        "id": 1,
        "timestamp": datetime(2026, 4, 1, 12, 0, 0, tzinfo=timezone.utc),
        "severity": "INFO",
        "source": "test-service",
        "message": "test message",
        "created_at": datetime(2026, 4, 1, 12, 0, 1, tzinfo=timezone.utc),
        "updated_at": datetime(2026, 4, 1, 12, 0, 1, tzinfo=timezone.utc),
    }
    defaults.update(kwargs)
    log = MagicMock()
    for k, v in defaults.items():
        setattr(log, k, v)
    return log


class TestCreate:
    async def test_delegates_to_repository(self):
        session = AsyncMock()
        data = LogCreate(severity="INFO", source="app", message="test")
        mock_log = make_mock_log()

        with patch.object(LogRepository, "create", new=AsyncMock(return_value=mock_log)) as mock:
            result = await LogService.create(session, data)
            mock.assert_awaited_once_with(session, data)

        assert result == mock_log


class TestGetById:
    async def test_returns_log_when_found(self):
        session = AsyncMock()
        mock_log = make_mock_log(id=42)

        with patch.object(LogRepository, "get_by_id", new=AsyncMock(return_value=mock_log)):
            result = await LogService.get_by_id(session, 42)

        assert result == mock_log

    async def test_raises_404_when_not_found(self):
        session = AsyncMock()

        with patch.object(LogRepository, "get_by_id", new=AsyncMock(return_value=None)):
            with pytest.raises(HTTPException) as exc_info:
                await LogService.get_by_id(session, 999)

        assert exc_info.value.status_code == 404
        assert exc_info.value.detail == "Log not found"


class TestList:
    async def test_delegates_to_repository(self):
        session = AsyncMock()
        mock_logs = [make_mock_log()]
        mock_return = (mock_logs, 1)

        with patch.object(LogRepository, "list", new=AsyncMock(return_value=mock_return)) as mock:
            result = await LogService.list(session)
            mock.assert_awaited_once()

        assert result == mock_return

    async def test_raises_400_when_start_after_end(self):
        session = AsyncMock()
        start = datetime(2026, 4, 5, tzinfo=timezone.utc)
        end = datetime(2026, 4, 1, tzinfo=timezone.utc)

        with pytest.raises(HTTPException) as exc_info:
            await LogService.list(session, start=start, end=end)

        assert exc_info.value.status_code == 400

    async def test_allows_equal_start_end(self):
        session = AsyncMock()
        same_dt = datetime(2026, 4, 1, tzinfo=timezone.utc)

        with patch.object(LogRepository, "list", new=AsyncMock(return_value=([], 0))):
            result = await LogService.list(session, start=same_dt, end=same_dt)

        assert result == ([], 0)

    async def test_allows_only_start(self):
        session = AsyncMock()

        with patch.object(LogRepository, "list", new=AsyncMock(return_value=([], 0))):
            result = await LogService.list(
                session, start=datetime(2026, 4, 1, tzinfo=timezone.utc)
            )

        assert result == ([], 0)

    async def test_allows_only_end(self):
        session = AsyncMock()

        with patch.object(LogRepository, "list", new=AsyncMock(return_value=([], 0))):
            result = await LogService.list(
                session, end=datetime(2026, 4, 1, tzinfo=timezone.utc)
            )

        assert result == ([], 0)


class TestUpdate:
    async def test_delegates_to_repository(self):
        session = AsyncMock()
        mock_log = make_mock_log(id=1)
        updated_log = make_mock_log(id=1, severity="ERROR")
        data = LogUpdate(severity="ERROR")

        with patch.object(LogRepository, "get_by_id", new=AsyncMock(return_value=mock_log)):
            with patch.object(LogRepository, "update", new=AsyncMock(return_value=updated_log)) as mock_update:
                result = await LogService.update(session, 1, data)
                mock_update.assert_awaited_once_with(session, mock_log, data)

        assert result == updated_log

    async def test_raises_404_when_not_found(self):
        session = AsyncMock()

        with patch.object(LogRepository, "get_by_id", new=AsyncMock(return_value=None)):
            with pytest.raises(HTTPException) as exc_info:
                await LogService.update(session, 999, LogUpdate())

        assert exc_info.value.status_code == 404
        assert exc_info.value.detail == "Log not found"


class TestDelete:
    async def test_delegates_to_repository(self):
        session = AsyncMock()
        mock_log = make_mock_log(id=1)

        with patch.object(LogRepository, "get_by_id", new=AsyncMock(return_value=mock_log)):
            with patch.object(LogRepository, "delete", new=AsyncMock()) as mock_delete:
                await LogService.delete(session, 1)
                mock_delete.assert_awaited_once_with(session, mock_log)

    async def test_raises_404_when_not_found(self):
        session = AsyncMock()

        with patch.object(LogRepository, "get_by_id", new=AsyncMock(return_value=None)):
            with pytest.raises(HTTPException) as exc_info:
                await LogService.delete(session, 999)

        assert exc_info.value.status_code == 404
        assert exc_info.value.detail == "Log not found"


class TestGetSummary:
    async def test_delegates_to_repository(self):
        session = AsyncMock()
        mock_result = {"summary": {"INFO": 5}, "histogram": []}

        with patch.object(LogRepository, "get_summary", new=AsyncMock(return_value=mock_result)) as mock:
            result = await LogService.get_summary(session)
            mock.assert_awaited_once()

        assert result == mock_result

    async def test_raises_400_when_start_after_end(self):
        session = AsyncMock()

        with pytest.raises(HTTPException) as exc_info:
            await LogService.get_summary(
                session,
                start=datetime(2026, 4, 5, tzinfo=timezone.utc),
                end=datetime(2026, 4, 1, tzinfo=timezone.utc),
            )

        assert exc_info.value.status_code == 400

    async def test_allows_equal_start_end(self):
        session = AsyncMock()
        same_dt = datetime(2026, 4, 1, tzinfo=timezone.utc)
        mock_result = {"summary": {"INFO": 0, "WARNING": 0, "ERROR": 0, "CRITICAL": 0}, "histogram": []}

        with patch.object(LogRepository, "get_summary", new=AsyncMock(return_value=mock_result)):
            result = await LogService.get_summary(session, start=same_dt, end=same_dt)

        assert result == mock_result

    async def test_allows_only_start(self):
        session = AsyncMock()
        mock_result = {"summary": {}, "histogram": []}

        with patch.object(LogRepository, "get_summary", new=AsyncMock(return_value=mock_result)):
            result = await LogService.get_summary(
                session, start=datetime(2026, 4, 1, tzinfo=timezone.utc)
            )

        assert result == mock_result

    async def test_allows_only_end(self):
        session = AsyncMock()
        mock_result = {"summary": {}, "histogram": []}

        with patch.object(LogRepository, "get_summary", new=AsyncMock(return_value=mock_result)):
            result = await LogService.get_summary(
                session, end=datetime(2026, 4, 1, tzinfo=timezone.utc)
            )

        assert result == mock_result


class TestGetTimeseries:
    async def test_delegates_to_repository(self):
        session = AsyncMock()
        mock_result = [{"timestamp": datetime(2026, 4, 1, tzinfo=timezone.utc), "INFO": 5}]

        with patch.object(LogRepository, "get_timeseries", new=AsyncMock(return_value=mock_result)) as mock:
            result = await LogService.get_timeseries(session, interval="day")
            mock.assert_awaited_once()

        assert result == mock_result

    async def test_raises_400_when_start_after_end(self):
        session = AsyncMock()

        with pytest.raises(HTTPException) as exc_info:
            await LogService.get_timeseries(
                session,
                start=datetime(2026, 4, 5, tzinfo=timezone.utc),
                end=datetime(2026, 4, 1, tzinfo=timezone.utc),
            )

        assert exc_info.value.status_code == 400

    async def test_allows_equal_start_end(self):
        session = AsyncMock()
        same_dt = datetime(2026, 4, 1, tzinfo=timezone.utc)

        with patch.object(LogRepository, "get_timeseries", new=AsyncMock(return_value=[])):
            result = await LogService.get_timeseries(session, start=same_dt, end=same_dt)

        assert result == []

    async def test_allows_only_start(self):
        session = AsyncMock()

        with patch.object(LogRepository, "get_timeseries", new=AsyncMock(return_value=[])):
            result = await LogService.get_timeseries(
                session, start=datetime(2026, 4, 1, tzinfo=timezone.utc)
            )

        assert result == []

    async def test_allows_only_end(self):
        session = AsyncMock()

        with patch.object(LogRepository, "get_timeseries", new=AsyncMock(return_value=[])):
            result = await LogService.get_timeseries(
                session, end=datetime(2026, 4, 1, tzinfo=timezone.utc)
            )

        assert result == []


class TestListForCsv:
    async def test_delegates_to_repository(self):
        session = AsyncMock()
        mock_logs = [make_mock_log()]

        with patch.object(LogRepository, "list_for_csv", new=AsyncMock(return_value=mock_logs)) as mock:
            result = await LogService.list_for_csv(session)
            mock.assert_awaited_once()

        assert result == mock_logs

    async def test_raises_400_when_start_after_end(self):
        session = AsyncMock()

        with pytest.raises(HTTPException) as exc_info:
            await LogService.list_for_csv(
                session,
                start=datetime(2026, 4, 5, tzinfo=timezone.utc),
                end=datetime(2026, 4, 1, tzinfo=timezone.utc),
            )

        assert exc_info.value.status_code == 400

    async def test_allows_equal_start_end(self):
        session = AsyncMock()
        same_dt = datetime(2026, 4, 1, tzinfo=timezone.utc)

        with patch.object(LogRepository, "list_for_csv", new=AsyncMock(return_value=[])):
            result = await LogService.list_for_csv(session, start=same_dt, end=same_dt)

        assert result == []

    async def test_allows_only_start(self):
        session = AsyncMock()

        with patch.object(LogRepository, "list_for_csv", new=AsyncMock(return_value=[])):
            result = await LogService.list_for_csv(
                session, start=datetime(2026, 4, 1, tzinfo=timezone.utc)
            )

        assert result == []

    async def test_allows_only_end(self):
        session = AsyncMock()

        with patch.object(LogRepository, "list_for_csv", new=AsyncMock(return_value=[])):
            result = await LogService.list_for_csv(
                session, end=datetime(2026, 4, 1, tzinfo=timezone.utc)
            )

        assert result == []

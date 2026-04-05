"""
Repository 層の統合テスト（実 PostgreSQL 使用）。
Docker 環境（db-test コンテナ）で実行する。
"""
from datetime import datetime, timedelta, timezone

from app.models.log import Log
from app.repositories.log_repository import LogRepository
from app.schemas.log import LogCreate, LogUpdate


def make_log_create(**kwargs) -> LogCreate:
    defaults = {
        "timestamp": datetime(2026, 4, 1, 12, 0, 0, tzinfo=timezone.utc),
        "severity": "INFO",
        "source": "test-service",
        "message": "test message",
    }
    defaults.update(kwargs)
    return LogCreate(**defaults)


class TestCreate:
    async def test_create_returns_log(self, session):
        data = make_log_create()
        log = await LogRepository.create(session, data)
        assert log.id is not None
        assert log.severity == "INFO"
        assert log.source == "test-service"
        assert log.message == "test message"

    async def test_create_sets_created_at(self, session):
        before = datetime.now(timezone.utc)
        log = await LogRepository.create(session, make_log_create())
        after = datetime.now(timezone.utc)
        ts = log.created_at.replace(tzinfo=timezone.utc) if log.created_at.tzinfo is None else log.created_at
        assert before - timedelta(seconds=1) <= ts <= after + timedelta(seconds=1)

    async def test_create_with_explicit_timestamp(self, session):
        ts = datetime(2026, 3, 15, 9, 0, 0, tzinfo=timezone.utc)
        log = await LogRepository.create(session, make_log_create(timestamp=ts))
        assert log.timestamp == ts

    async def test_create_without_timestamp_defaults_to_now(self, session):
        before = datetime.now(timezone.utc)
        log = await LogRepository.create(session, make_log_create(timestamp=None))
        after = datetime.now(timezone.utc)
        # タイムゾーン情報を統一して比較
        ts = log.timestamp.replace(tzinfo=timezone.utc) if log.timestamp.tzinfo is None else log.timestamp
        assert before - timedelta(seconds=1) <= ts <= after + timedelta(seconds=1)


class TestGetById:
    async def test_get_existing(self, session):
        created = await LogRepository.create(session, make_log_create())
        found = await LogRepository.get_by_id(session, created.id)
        assert found is not None
        assert found.id == created.id

    async def test_get_nonexistent_returns_none(self, session):
        result = await LogRepository.get_by_id(session, 999999)
        assert result is None


class TestList:
    async def _create_logs(self, session, specs: list[dict]) -> list[Log]:
        logs = []
        for spec in specs:
            logs.append(await LogRepository.create(session, make_log_create(**spec)))
        return logs

    async def test_list_returns_all(self, session):
        await self._create_logs(session, [{}, {}, {}])
        logs, total = await LogRepository.list(session)
        assert total == 3
        assert len(logs) == 3

    async def test_filter_by_severity(self, session):
        await self._create_logs(session, [
            {"severity": "ERROR"},
            {"severity": "INFO"},
            {"severity": "ERROR"},
        ])
        logs, total = await LogRepository.list(session, severities=["ERROR"])
        assert all(log.severity == "ERROR" for log in logs)
        assert total == 2

    async def test_filter_by_multiple_severities(self, session):
        await self._create_logs(session, [
            {"severity": "ERROR"},
            {"severity": "CRITICAL"},
            {"severity": "INFO"},
        ])
        logs, total = await LogRepository.list(session, severities=["ERROR", "CRITICAL"])
        assert all(log.severity in ("ERROR", "CRITICAL") for log in logs)
        assert total == 2

    async def test_filter_by_source_partial_match(self, session):
        await self._create_logs(session, [
            {"source": "api-server"},
            {"source": "api-gateway"},
            {"source": "worker"},
        ])
        logs, total = await LogRepository.list(session, source="api")
        assert all("api" in log.source for log in logs)
        assert total == 2

    async def test_filter_by_date_range(self, session):
        await self._create_logs(session, [
            {"timestamp": datetime(2026, 4, 1, tzinfo=timezone.utc)},
            {"timestamp": datetime(2026, 4, 5, tzinfo=timezone.utc)},
            {"timestamp": datetime(2026, 4, 10, tzinfo=timezone.utc)},
        ])
        logs, total = await LogRepository.list(
            session,
            start=datetime(2026, 4, 2, tzinfo=timezone.utc),
            end=datetime(2026, 4, 8, tzinfo=timezone.utc),
        )
        assert total == 1  # Apr 5 のみ範囲内
        assert len(logs) == 1
        assert logs[0].timestamp == datetime(2026, 4, 5, tzinfo=timezone.utc)

    async def test_list_date_range_start_equals_end(self, session):
        ts = datetime(2026, 4, 5, tzinfo=timezone.utc)
        await self._create_logs(session, [
            {"timestamp": ts},
            {"timestamp": datetime(2026, 4, 4, tzinfo=timezone.utc)},
            {"timestamp": datetime(2026, 4, 6, tzinfo=timezone.utc)},
        ])
        logs, total = await LogRepository.list(session, start=ts, end=ts)
        assert total == 1
        assert logs[0].timestamp == ts

    async def test_list_with_empty_severities_returns_all(self, session):
        await self._create_logs(session, [
            {"severity": "INFO"},
            {"severity": "ERROR"},
        ])
        # 空リストはフィルタなし扱い → 全件返る
        logs, total = await LogRepository.list(session, severities=[])
        assert total == 2

    async def test_list_with_empty_source_returns_all(self, session):
        await self._create_logs(session, [
            {"source": "svc-a"},
            {"source": "svc-b"},
        ])
        # 空文字列はフィルタなし扱い → 全件返る
        logs, total = await LogRepository.list(session, source="")
        assert total == 2

    async def test_sort_by_timestamp_desc(self, session):
        src = "sort-test-desc"
        await self._create_logs(session, [
            {"timestamp": datetime(2026, 6, 1, tzinfo=timezone.utc), "source": src},
            {"timestamp": datetime(2026, 6, 3, tzinfo=timezone.utc), "source": src},
            {"timestamp": datetime(2026, 6, 2, tzinfo=timezone.utc), "source": src},
        ])
        logs, _ = await LogRepository.list(session, source=src, sort_by="timestamp", order="desc")
        timestamps = [log.timestamp for log in logs]
        assert timestamps == sorted(timestamps, reverse=True)

    async def test_sort_by_timestamp_asc(self, session):
        src = "sort-test-asc"
        await self._create_logs(session, [
            {"timestamp": datetime(2026, 6, 3, tzinfo=timezone.utc), "source": src},
            {"timestamp": datetime(2026, 6, 1, tzinfo=timezone.utc), "source": src},
        ])
        logs, _ = await LogRepository.list(session, source=src, sort_by="timestamp", order="asc")
        timestamps = [log.timestamp for log in logs]
        assert timestamps == sorted(timestamps)

    async def test_pagination(self, session):
        await self._create_logs(session, [{} for _ in range(5)])
        logs_p1, total = await LogRepository.list(session, page=1, limit=2)
        logs_p2, _ = await LogRepository.list(session, page=2, limit=2)
        assert len(logs_p1) == 2
        assert len(logs_p2) == 2
        assert total == 5
        ids_p1 = {log.id for log in logs_p1}
        ids_p2 = {log.id for log in logs_p2}
        assert ids_p1.isdisjoint(ids_p2)

    async def test_list_with_limit_one(self, session):
        await self._create_logs(session, [{}, {}, {}])
        logs, total = await LogRepository.list(session, limit=1)
        assert len(logs) == 1
        assert total == 3

    async def test_list_pagination_out_of_range_returns_empty(self, session):
        await self._create_logs(session, [{}, {}])
        logs, total = await LogRepository.list(session, page=999, limit=50)
        assert logs == []
        assert total == 2


class TestUpdate:
    async def test_update_severity(self, session):
        log = await LogRepository.create(session, make_log_create(severity="INFO"))
        updated = await LogRepository.update(session, log, LogUpdate(severity="ERROR"))
        assert updated.severity == "ERROR"
        assert updated.source == "test-service"  # 変更なし

    async def test_update_multiple_fields(self, session):
        log = await LogRepository.create(session, make_log_create())
        updated = await LogRepository.update(
            session, log, LogUpdate(severity="CRITICAL", message="critical error")
        )
        assert updated.severity == "CRITICAL"
        assert updated.message == "critical error"

    async def test_update_timestamp(self, session):
        log = await LogRepository.create(session, make_log_create())
        new_ts = datetime(2025, 1, 1, 0, 0, 0, tzinfo=timezone.utc)
        updated = await LogRepository.update(session, log, LogUpdate(timestamp=new_ts))
        assert updated.timestamp == new_ts

    async def test_update_empty_does_not_change(self, session):
        log = await LogRepository.create(session, make_log_create(severity="INFO", source="svc"))
        updated = await LogRepository.update(session, log, LogUpdate())
        assert updated.severity == "INFO"
        assert updated.source == "svc"


class TestDelete:
    async def test_delete_removes_log(self, session):
        log = await LogRepository.create(session, make_log_create())
        log_id = log.id
        await LogRepository.delete(session, log)
        found = await LogRepository.get_by_id(session, log_id)
        assert found is None


class TestGetSummary:
    async def _seed(self, session):
        specs = [
            {"severity": "INFO", "source": "api"},
            {"severity": "INFO", "source": "api"},
            {"severity": "WARNING", "source": "api"},
            {"severity": "ERROR", "source": "worker"},
            {"severity": "CRITICAL", "source": "worker"},
        ]
        for spec in specs:
            await LogRepository.create(session, make_log_create(**spec))

    async def test_summary_counts_by_severity(self, session):
        await self._seed(session)
        result = await LogRepository.get_summary(session)
        assert result["summary"]["INFO"] == 2
        assert result["summary"]["WARNING"] == 1
        assert result["summary"]["ERROR"] == 1
        assert result["summary"]["CRITICAL"] == 1

    async def test_histogram_groups_by_source(self, session):
        await self._seed(session)
        result = await LogRepository.get_summary(session)
        assert len(result["histogram"]) == 2
        sources = sorted(entry["source"] for entry in result["histogram"])
        assert sources == ["api", "worker"]

    async def test_summary_with_source_filter(self, session):
        await self._seed(session)
        result = await LogRepository.get_summary(session, source="api")
        assert result["summary"]["ERROR"] == 0
        assert result["summary"]["INFO"] == 2
        assert result["summary"]["WARNING"] == 1


class TestGetTimeseries:
    async def test_timeseries_day_interval(self, session):
        for day in (1, 2, 3):
            await LogRepository.create(
                session,
                make_log_create(
                    timestamp=datetime(2026, 4, day, tzinfo=timezone.utc),
                    severity="ERROR",
                ),
            )
        result = await LogRepository.get_timeseries(
            session,
            start=datetime(2026, 4, 1, tzinfo=timezone.utc),
            end=datetime(2026, 4, 3, tzinfo=timezone.utc),
            interval="day",
        )
        assert len(result) == 3
        assert all(entry["ERROR"] == 1 for entry in result)

    async def test_timeseries_returns_all_severity_keys(self, session):
        await LogRepository.create(
            session,
            make_log_create(
                timestamp=datetime(2026, 5, 1, tzinfo=timezone.utc),
                severity="INFO",
            ),
        )
        result = await LogRepository.get_timeseries(
            session,
            start=datetime(2026, 5, 1, tzinfo=timezone.utc),
            end=datetime(2026, 5, 1, tzinfo=timezone.utc),
            interval="day",
        )
        assert len(result) == 1
        entry = result[0]
        for key in ("timestamp", "INFO", "WARNING", "ERROR", "CRITICAL"):
            assert key in entry
        assert entry["INFO"] == 1
        assert entry["WARNING"] == 0
        assert entry["ERROR"] == 0
        assert entry["CRITICAL"] == 0

    async def test_timeseries_no_data_in_range_returns_empty(self, session):
        # 2026-03 のデータを追加し、2026-06 の範囲で検索 → 空
        await LogRepository.create(
            session,
            make_log_create(timestamp=datetime(2026, 3, 1, tzinfo=timezone.utc)),
        )
        result = await LogRepository.get_timeseries(
            session,
            start=datetime(2026, 6, 1, tzinfo=timezone.utc),
            end=datetime(2026, 6, 30, tzinfo=timezone.utc),
            interval="day",
        )
        assert result == []


class TestListForCsv:
    async def test_returns_logs_matching_filters(self, session):
        await LogRepository.create(
            session,
            make_log_create(severity="ERROR", source="csv-test"),
        )
        await LogRepository.create(
            session,
            make_log_create(severity="INFO", source="csv-test"),
        )
        logs = await LogRepository.list_for_csv(session, severities=["ERROR"], source="csv-test")
        assert len(logs) == 1
        assert logs[0].severity == "ERROR"
        assert logs[0].source == "csv-test"

    async def test_returns_all_without_filters(self, session):
        await LogRepository.create(session, make_log_create(source="csv-all"))
        logs = await LogRepository.list_for_csv(session)
        assert len(logs) == 1

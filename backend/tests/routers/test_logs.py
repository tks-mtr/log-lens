"""
Router 層の統合テスト（実 PostgreSQL + httpx AsyncClient 使用）。
Docker 環境（db-test コンテナ）で実行する。
"""
import math
from datetime import datetime, timedelta, timezone

from httpx import AsyncClient

BASE = "/api/v1/logs"


async def create_log(client: AsyncClient, **kwargs) -> dict:
    """テスト用ログをAPIで作成してレスポンスを返す。"""
    payload = {
        "severity": "INFO",
        "source": "test-service",
        "message": "test message",
        **kwargs,
    }
    resp = await client.post(BASE, json=payload)
    assert resp.status_code == 201, resp.text
    return resp.json()


class TestCreateLog:
    async def test_returns_201_with_log(self, client):
        resp = await client.post(BASE, json={
            "severity": "ERROR",
            "source": "api-server",
            "message": "Connection timeout",
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["severity"] == "ERROR"
        assert data["source"] == "api-server"
        assert data["message"] == "Connection timeout"
        assert "id" in data
        assert "created_at" in data
        assert "updated_at" in data

    async def test_timestamp_defaults_to_now_when_omitted(self, client):
        before = datetime.now(timezone.utc)
        resp = await client.post(BASE, json={
            "severity": "INFO", "source": "app", "message": "started",
        })
        after = datetime.now(timezone.utc)
        assert resp.status_code == 201
        ts_str = resp.json()["timestamp"]
        assert ts_str is not None
        ts = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
        assert before - timedelta(seconds=5) <= ts <= after + timedelta(seconds=5)

    async def test_returns_422_on_invalid_severity(self, client):
        resp = await client.post(BASE, json={
            "severity": "DEBUG", "source": "app", "message": "msg",
        })
        assert resp.status_code == 422

    async def test_returns_422_on_empty_source(self, client):
        resp = await client.post(BASE, json={
            "severity": "INFO", "source": "", "message": "msg",
        })
        assert resp.status_code == 422

    async def test_returns_422_on_missing_required_field(self, client):
        resp = await client.post(BASE, json={"source": "app", "message": "msg"})
        assert resp.status_code == 422


class TestGetLog:
    async def test_returns_200_with_log(self, client):
        created = await create_log(client)
        resp = await client.get(f"{BASE}/{created['id']}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == created["id"]
        assert data["severity"] == created["severity"]
        assert data["source"] == created["source"]
        assert data["message"] == created["message"]

    async def test_returns_404_when_not_found(self, client):
        resp = await client.get(f"{BASE}/999999")
        assert resp.status_code == 404
        assert resp.json()["detail"] == "Log not found"


class TestListLogs:
    async def test_returns_200_with_list_shape(self, client):
        await create_log(client)
        resp = await client.get(BASE)
        assert resp.status_code == 200
        body = resp.json()
        for key in ("data", "total", "page", "limit", "pages"):
            assert key in body

    async def test_filter_by_severity(self, client):
        src = "filter-sev-test"
        await create_log(client, severity="ERROR", source=src)
        await create_log(client, severity="INFO", source=src)
        resp = await client.get(f"{BASE}?severity=ERROR&source={src}")
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert len(data) == 1
        assert all(log["severity"] == "ERROR" for log in data)

    async def test_filter_by_multiple_severities(self, client):
        src = "multi-sev-test"
        await create_log(client, severity="ERROR", source=src)
        await create_log(client, severity="CRITICAL", source=src)
        await create_log(client, severity="INFO", source=src)
        resp = await client.get(f"{BASE}?severity=ERROR&severity=CRITICAL&source={src}")
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert len(data) == 2
        assert all(log["severity"] in ("ERROR", "CRITICAL") for log in data)

    async def test_pagination(self, client):
        src = "pagination-test"
        for _ in range(3):
            await create_log(client, source=src)
        resp = await client.get(f"{BASE}?source={src}&page=1&limit=2")
        assert resp.status_code == 200
        body = resp.json()
        assert body["limit"] == 2
        assert body["page"] == 1
        assert body["total"] == 3
        assert len(body["data"]) == 2

    async def test_pagination_out_of_range_returns_empty_data(self, client):
        src = "pagination-oob-test"
        await create_log(client, source=src)
        resp = await client.get(f"{BASE}?source={src}&page=999&limit=50")
        assert resp.status_code == 200
        body = resp.json()
        assert body["data"] == []
        assert body["total"] == 1

    async def test_pages_calculated_correctly(self, client):
        src = "pages-calc-test"
        for _ in range(5):
            await create_log(client, source=src)
        resp = await client.get(f"{BASE}?source={src}&limit=2")
        body = resp.json()
        assert body["pages"] == math.ceil(body["total"] / 2)

    async def test_limit_max_returns_422(self, client):
        resp = await client.get(f"{BASE}?limit=201")
        assert resp.status_code == 422

    async def test_returns_400_when_start_after_end(self, client):
        resp = await client.get(
            f"{BASE}?start=2026-04-05T00:00:00Z&end=2026-04-01T00:00:00Z"
        )
        assert resp.status_code == 400

    async def test_start_equals_end_returns_matching_logs(self, client):
        src = "date-eq-test"
        await create_log(client, source=src, timestamp="2026-04-05T00:00:00Z")
        await create_log(client, source=src, timestamp="2026-04-04T00:00:00Z")
        resp = await client.get(
            f"{BASE}?source={src}&start=2026-04-05T00:00:00Z&end=2026-04-05T00:00:00Z"
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["total"] == 1


class TestUpdateLog:
    async def test_returns_200_with_updated_fields(self, client):
        created = await create_log(client, severity="INFO")
        resp = await client.patch(
            f"{BASE}/{created['id']}", json={"severity": "ERROR"}
        )
        assert resp.status_code == 200
        updated = resp.json()
        assert updated["severity"] == "ERROR"
        assert updated["source"] == created["source"]  # 変更なし

    async def test_partial_update_preserves_other_fields(self, client):
        created = await create_log(client, severity="INFO", source="original-svc")
        resp = await client.patch(
            f"{BASE}/{created['id']}", json={"message": "updated message"}
        )
        assert resp.status_code == 200
        updated = resp.json()
        assert updated["message"] == "updated message"
        assert updated["severity"] == "INFO"
        assert updated["source"] == "original-svc"

    async def test_returns_404_when_not_found(self, client):
        resp = await client.patch(f"{BASE}/999999", json={"severity": "ERROR"})
        assert resp.status_code == 404
        assert resp.json()["detail"] == "Log not found"

    async def test_updated_at_present_and_valid_after_patch(self, client):
        created = await create_log(client, severity="INFO")
        resp = await client.patch(
            f"{BASE}/{created['id']}", json={"severity": "WARNING"}
        )
        assert resp.status_code == 200
        updated = resp.json()
        # updated_at フィールドが存在し、有効な ISO 8601 日時文字列であること
        assert updated["updated_at"] is not None
        # ISO 8601 としてパース可能であること
        ts = datetime.fromisoformat(updated["updated_at"].replace("Z", "+00:00"))
        # 合理的な日時範囲内であること（1970年以降、未来すぎない）
        assert ts > datetime(2020, 1, 1, tzinfo=timezone.utc)
        assert ts < datetime.now(timezone.utc) + timedelta(minutes=1)

    async def test_empty_body_patch_returns_200_without_changes(self, client):
        created = await create_log(client, severity="INFO", source="patch-empty-test")
        resp = await client.patch(f"{BASE}/{created['id']}", json={})
        assert resp.status_code == 200
        updated = resp.json()
        # 空ボディでは何も変更されないこと
        assert updated["severity"] == created["severity"]
        assert updated["source"] == created["source"]
        assert updated["message"] == created["message"]


class TestDeleteLog:
    async def test_returns_204_no_content(self, client):
        created = await create_log(client)
        resp = await client.delete(f"{BASE}/{created['id']}")
        assert resp.status_code == 204
        assert resp.content == b""

    async def test_log_not_found_after_delete(self, client):
        created = await create_log(client)
        await client.delete(f"{BASE}/{created['id']}")
        resp = await client.get(f"{BASE}/{created['id']}")
        assert resp.status_code == 404

    async def test_returns_404_when_not_found(self, client):
        resp = await client.delete(f"{BASE}/999999")
        assert resp.status_code == 404
        assert resp.json()["detail"] == "Log not found"


class TestAnalyticsSummary:
    async def test_returns_200_with_correct_shape(self, client):
        await create_log(client, severity="ERROR")
        resp = await client.get(f"{BASE}/analytics/summary")
        assert resp.status_code == 200
        body = resp.json()
        assert "summary" in body
        assert "histogram" in body
        for key in ("INFO", "WARNING", "ERROR", "CRITICAL"):
            assert key in body["summary"]

    async def test_histogram_entry_has_correct_structure(self, client):
        src = "hist-struct-test"
        await create_log(client, severity="ERROR", source=src)
        await create_log(client, severity="WARNING", source=src)
        resp = await client.get(f"{BASE}/analytics/summary?source={src}")
        assert resp.status_code == 200
        body = resp.json()
        histogram = body["histogram"]
        assert len(histogram) >= 1
        entry = histogram[0]
        # 各エントリに source と全 severity フィールドが存在すること
        assert "source" in entry
        for key in ("INFO", "WARNING", "ERROR", "CRITICAL"):
            assert key in entry
        # 値が数値型であること
        assert isinstance(entry["INFO"], int)
        assert isinstance(entry["WARNING"], int)
        assert isinstance(entry["ERROR"], int)
        assert isinstance(entry["CRITICAL"], int)
        # source が一致すること
        assert entry["source"] == src
        # 投入したデータと集計値が一致すること
        assert entry["ERROR"] == 1
        assert entry["WARNING"] == 1

    async def test_returns_400_when_start_after_end(self, client):
        resp = await client.get(
            f"{BASE}/analytics/summary"
            "?start=2026-04-05T00:00:00Z&end=2026-04-01T00:00:00Z"
        )
        assert resp.status_code == 400


class TestAnalyticsTimeseries:
    async def test_returns_200_with_correct_shape(self, client):
        await create_log(client)
        resp = await client.get(f"{BASE}/analytics/timeseries")
        assert resp.status_code == 200
        body = resp.json()
        assert body["interval"] == "day"
        assert "data" in body

    async def test_timeseries_data_entry_has_correct_structure(self, client):
        src = "ts-struct-test"
        await create_log(client, severity="ERROR", source=src)
        await create_log(client, severity="INFO", source=src)
        resp = await client.get(f"{BASE}/analytics/timeseries?source={src}")
        assert resp.status_code == 200
        body = resp.json()
        data = body["data"]
        assert len(data) >= 1
        entry = data[0]
        # 各エントリに timestamp と全 severity フィールドが存在すること
        assert "timestamp" in entry
        for key in ("INFO", "WARNING", "ERROR", "CRITICAL"):
            assert key in entry
        # 値が数値型であること
        assert isinstance(entry["INFO"], int)
        assert isinstance(entry["WARNING"], int)
        assert isinstance(entry["ERROR"], int)
        assert isinstance(entry["CRITICAL"], int)

    async def test_interval_param(self, client):
        await create_log(client)
        resp = await client.get(f"{BASE}/analytics/timeseries?interval=hour")
        assert resp.status_code == 200
        assert resp.json()["interval"] == "hour"

    async def test_returns_400_when_start_after_end(self, client):
        resp = await client.get(
            f"{BASE}/analytics/timeseries"
            "?start=2026-04-05T00:00:00Z&end=2026-04-01T00:00:00Z"
        )
        assert resp.status_code == 400


class TestExportCsv:
    async def test_returns_csv_content_type(self, client):
        await create_log(client)
        resp = await client.get(f"{BASE}/export/csv")
        assert resp.status_code == 200
        assert "text/csv" in resp.headers["content-type"]

    async def test_content_disposition_attachment(self, client):
        resp = await client.get(f"{BASE}/export/csv")
        assert resp.status_code == 200
        assert "attachment" in resp.headers["content-disposition"]
        assert "logs_" in resp.headers["content-disposition"]

    async def test_csv_has_correct_column_headers(self, client):
        src = "csv-header-test"
        await create_log(client, source=src)
        resp = await client.get(f"{BASE}/export/csv?source={src}")
        assert resp.status_code == 200
        # UTF-8 BOM を除去してデコード
        content = resp.content.decode("utf-8-sig")
        first_line = content.splitlines()[0]
        assert first_line == "id,timestamp,severity,source,message"

    async def test_csv_has_data_rows(self, client):
        src = "csv-data-test"
        await create_log(client, severity="ERROR", source=src, message="csv row check")
        resp = await client.get(f"{BASE}/export/csv?source={src}")
        assert resp.status_code == 200
        content = resp.content.decode("utf-8-sig")
        lines = content.splitlines()
        assert len(lines) == 2  # ヘッダー + 1データ行
        data_row = lines[1]
        assert "ERROR" in data_row
        assert src in data_row
        assert "csv row check" in data_row

    async def test_csv_filter_by_severity(self, client):
        src = "csv-sev-test"
        await create_log(client, severity="ERROR", source=src)
        await create_log(client, severity="INFO", source=src)
        resp = await client.get(f"{BASE}/export/csv?source={src}&severity=ERROR")
        assert resp.status_code == 200
        content = resp.content.decode("utf-8-sig")
        lines = [line for line in content.splitlines() if line]
        assert len(lines) == 2  # ヘッダー + 1件のみ
        assert "ERROR" in lines[1]
        assert "INFO" not in lines[1]


class TestGetSources:
    async def test_get_sources_returns_list(self, client):
        await create_log(client, source="alpha-service")
        await create_log(client, source="beta-service")
        await create_log(client, source="alpha-service")
        resp = await client.get(f"{BASE}/sources")
        assert resp.status_code == 200
        sources = resp.json()
        assert isinstance(sources, list)
        assert "alpha-service" in sources
        assert "beta-service" in sources

    async def test_get_sources_returns_distinct_sorted(self, client):
        await create_log(client, source="z-svc")
        await create_log(client, source="a-svc")
        await create_log(client, source="a-svc")
        resp = await client.get(f"{BASE}/sources")
        assert resp.status_code == 200
        sources = resp.json()
        assert sources == sorted(set(sources))

    async def test_get_sources_returns_empty_when_no_logs(self, client):
        resp = await client.get(f"{BASE}/sources")
        assert resp.status_code == 200
        assert resp.json() == []

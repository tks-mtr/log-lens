"""テストデータ投入スクリプト。fixtures/seed_data.json の固定データを使用。
データが既に存在する場合はスキップ（べき等）。依存は標準ライブラリのみ。"""
import json
import os
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

BASE_URL = os.environ.get("API_BASE_URL", "http://localhost:8000") + "/api/v1/logs"
FIXTURE = Path(__file__).parent / "fixtures" / "seed_data.json"


def _get(url: str) -> tuple[int, dict]:
    try:
        with urllib.request.urlopen(url, timeout=3) as res:
            return res.status, json.loads(res.read())
    except urllib.error.HTTPError as e:
        return e.code, {}
    except Exception:
        return 0, {}


def _post(url: str, data: dict) -> int:
    body = json.dumps(data).encode()
    req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=5) as res:
            return res.status
    except urllib.error.HTTPError as e:
        return e.code
    except Exception:
        return 0


def wait_for_api(max_retries: int = 20, interval: int = 3) -> bool:
    health_url = BASE_URL.replace("/api/v1/logs", "/health")
    for i in range(max_retries):
        status, _ = _get(health_url)
        if status == 200:
            print("API is ready.")
            return True
        print(f"Waiting for API... ({i + 1}/{max_retries})")
        time.sleep(interval)
    return False


def already_seeded() -> bool:
    status, body = _get(f"{BASE_URL}?limit=1")
    if status == 200:
        total = body.get("total", 0)
        if total > 0:
            print(f"Seed skipped: {total} records already exist.")
            return True
    return False


def seed() -> None:
    records = json.loads(FIXTURE.read_text())
    ok = 0
    for entry in records:
        status = _post(BASE_URL, entry)
        if status == 201:
            ok += 1
        else:
            print(f"FAIL {status}: {entry}")
    print(f"Inserted {ok}/{len(records)} records.")


if __name__ == "__main__":
    if not wait_for_api():
        print("API did not become ready. Exiting.")
        raise SystemExit(1)
    if not already_seeded():
        seed()

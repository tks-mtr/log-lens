# Backend 実装プラン

> ブランチ: `feature/backend`

---

## 作業ステップ

### Step 1 — プラン作成・コミット [ ]
- **成果物:** `docs/design/backend_plan.md`
- **内容:** ブランチ作成後・Step 2 実装前に単独でコミットする

### Step 2 — プロジェクト初期設定 [x]
- **テスト実行環境:** venv（DB不要）
- **成果物:**
  - `backend/Dockerfile`
  - `backend/requirements.txt`
  - `backend/.env.example`
  - `docker-compose.yml`（app + DB + テスト用DB コンテナ）
  - `backend/app/main.py`（FastAPI 初期化・CORS・アクセスログ middleware）
  - `backend/app/core/config.py`（pydantic-settings による環境変数管理）
  - `backend/app/core/logging.py`（ロギング設定）
  - `backend/tests/core/test_config.py`

### Step 3 — DB / マイグレーション設定 [ ]
- **テスト実行環境:** Docker（`db-test` コンテナ使用）
- **成果物:**
  - `backend/app/core/database.py`（SQLAlchemy v2 AsyncSession 設定）
  - `backend/app/models/log.py`（`logs` テーブルモデル定義）
  - `backend/alembic/`（初期マイグレーション）
  - `backend/tests/conftest.py`（テスト用DB接続・セッション設定 ※ database.py に依存するため Step 3 で作成）

### Step 4 — スキーマ定義 [ ]
- **テスト実行環境:** venv（DB不要）
- **成果物:** `backend/app/schemas/log.py`
- **内容:**
  - `LogCreate`: POST /logs リクエスト（timestamp 任意・他必須）
  - `LogUpdate`: PATCH /logs/{id} リクエスト（全フィールド任意・部分更新）
  - `LogResponse`: 単一ログレスポンス（GET /logs/{id}・POST・PATCH 共通）
  - `LogListResponse`: 一覧レスポンス（`data / total / page / limit / pages`）
  - `AnalyticsSummaryResponse`: GET /logs/analytics/summary レスポンス（`summary / histogram`）
  - `TimeseriesResponse`: GET /logs/analytics/timeseries レスポンス（`interval / data`）

### Step 5 — Repository 層（TDD） [ ]
- **テスト実行環境:** Docker（`db-test` コンテナ使用・実 PostgreSQL 必須）
- **成果物:**
  - `backend/app/repositories/log_repository.py`
  - `backend/tests/repositories/test_log_repository.py`
- **内容:** CRUD・フィルタ検索・集計クエリ・CSVエクスポート

### Step 6 — Service 層（TDD） [ ]
- **テスト実行環境:** venv（Repository をモックして単体テスト）
- **成果物:**
  - `backend/app/services/log_service.py`
  - `backend/tests/services/test_log_service.py`
- **内容:** ビジネスロジック（timestamp デフォルト設定・バリデーション）・Repository 呼び出し

### Step 7 — Router 層（TDD） [ ]
- **テスト実行環境:** Docker（`db-test` コンテナ使用・実DB でフルスタック統合テスト）
- **成果物:**
  - `backend/app/routers/logs.py`
  - `backend/tests/routers/test_logs.py`
- **内容:** 全エンドポイント実装（CRUD + analytics/summary + analytics/timeseries + export/csv）。httpx AsyncClient でテスト

### Step 8 — 動作確認 [ ]
- **内容:** `docker-compose up` で起動・Swagger UI（`/docs`）で全エンドポイントを手動確認・pytest 全件グリーン確認

---

## 実装の注意点

| 項目 | 内容 |
|------|------|
| TDD | テストを先に書き、グリーンになるまで実装を進める |
| timestamp デフォルト | DB の DEFAULT なし。Service 層で `datetime.now(timezone.utc)` を設定 |
| severity バリデーション | Pydantic `Literal` + DB CHECK 制約の二重バリデーション |
| 空文字バリデーション | `source` / `message` は空文字不可（Pydantic `min_length=1`） |
| 日時範囲バリデーション | `start > end` の場合は 400 Bad Request を返す（Service 層で検証） |
| source フィルタ | 一覧（GET /logs）は部分一致 / 分析系は完全一致 |
| ソート | `sort_by` 選択肢: `timestamp` / `severity` / `source`・デフォルト: `timestamp`。`order` デフォルト: `desc` |
| timeseries interval | 選択肢: `hour` / `day` / `week`・デフォルト: `day` |
| pagination | `total` は COUNT(*) クエリで取得。`page` デフォルト: 1・`limit` デフォルト: 50・最大: 200。レスポンスに `data / total / page / limit / pages` を含める |
| DELETE | 204 No Content（レスポンスボディなし） |
| CSV | UTF-8 BOM付き・カラム順: `id, timestamp, severity, source, message`・ファイル名: `logs_YYYYMMDD.csv` |
| エラーハンドリング | 400 / 404 / 422 / 500。500 はスタックトレースをログに記録し、レスポンスには含めない |
| アクセスログ | middleware でメソッド・パス・ステータスコード・処理時間を INFO レベルで出力（NF-03） |

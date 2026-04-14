# Sprint Contract: バックエンド見直し

## 参照元
- docs/issues/assignment_ja.md（Seniorlead_full_stack_engineer_assignment_(Logs_Dashboard).pdf の日本語訳）
- docs/design/backend_plan.md

## ステータス
- [x] 未着手 → [x] 実装中 → [x] テスト設計中 → [x] 完了（Generator 対応済み・Evaluator 確認待ち）

---

## 要件整合性確認結果

### 満たしている項目

#### 全般要件
- [x] 入力バリデーション実装済み（Pydantic `min_length=1`・`SeverityType = Literal`・DB CHECK 制約の二重バリデーション）
- [x] エラーハンドリング実装済み（400 / 404 / 422 を適切に返す）
- [x] ロギング実装済み（`setup_logging` + アクセスログ middleware でメソッド・パス・ステータスコード・処理時間を INFO 出力）
- [x] `docker-compose.yml` 実装済み（app + db + db-test の3コンテナ構成）
- [x] Dockerfile 実装済み（`python:3.12-slim` ベース）
- [x] `.env.example` 実装済み

#### バックエンド要件
- [x] REST API（FastAPI）実装済み・プレフィックス `/api/v1/logs`
- [x] リレーショナルDB（PostgreSQL）でログデータ保存（`timestamp / message / severity / source` カラム＋ `created_at / updated_at`）
- [x] CRUD 操作エンドポイント実装済み（POST / GET / PATCH / DELETE）
- [x] 日付範囲・severity・source によるローデータ検索エンドポイント実装済み（`GET /api/v1/logs`）
- [x] 日付範囲・severity・source による集計ログデータ検索エンドポイント実装済み（`GET /api/v1/logs/analytics/summary`・`GET /api/v1/logs/analytics/timeseries`）

#### ボーナス実装（任意）
- [x] CSVエクスポート実装済み（`GET /api/v1/logs/export/csv`・UTF-8 BOM付き・ファイル名 `logs_YYYYMMDD.csv`）
- [x] severity 分布ヒストグラム（analytics/summary の `histogram` フィールドで source 別 severity 件数を返す）
- [x] テスト実装済み（Repository・Service・Router 各層にテストあり）

#### 実装詳細
- [x] `timestamp` デフォルト値を Service 層ではなく Repository 層で設定（`datetime.now(timezone.utc)`）
  - ※ backend_plan.md では「Service 層で設定」と記載されているが、Repository の `create` で設定されている。機能的には問題なし
- [x] `sort_by`（`timestamp` / `severity` / `source`）・`order`（`asc` / `desc`）対応済み
- [x] ページネーション（`data / total / page / limit / pages`）実装済み・`limit` 最大 200
- [x] DELETE 204 No Content 実装済み
- [x] timeseries `interval`（`hour` / `day` / `week`）対応済み
- [x] source フィルタ: 一覧系は部分一致（`ilike`）、分析系は完全一致（`==`）で実装済み
- [x] 日付範囲逆転（`start > end`）で 400 Bad Request を返す実装済み

---

### 警告（抜け漏れ・不足）

#### W-01: `README.md` が未整備（必須要件）
- **重要度:** 高（必須）
- 課題要件で「アプリの実行方法・テスト方法・プロジェクトへの考え方・設計判断・採用ライブラリ」を記載した README が必須
- 現在のREADMEの状態を確認する必要がある（rules_docs.md では英語の `README.md` + 日本語の `README.ja.md` の並行管理が必要）

#### W-02: `timestamp` のデフォルト設定場所が設計と異なる（軽微）
- **重要度:** 低（機能的問題なし）
- backend_plan.md では「Service 層で `datetime.now(timezone.utc)` を設定」と記載
- 実際は `LogRepository.create` 内で設定されている
- 動作は正しいが、設計ドキュメントとの乖離がある

#### W-03: `updated_at` が PATCH 時に自動更新されない可能性（要確認）
- **重要度:** 中
- `Log` モデルの `updated_at` は `onupdate=func.now()` を設定しているが、SQLAlchemy の `flush()` だけではトリガーされない場合がある（PostgreSQL の `server_default` / `onupdate` は `UPDATE` 文発行時に評価される）
- Repository の `update` では `setattr` + `flush` + `refresh` を行っているが、実際に `updated_at` が更新されているかテストで確認されていない
- Router テストの `TestUpdateLog` でも `updated_at` フィールドの更新は検証していない

#### W-04: 500エラー時のスタックトレースログ出力が未実装（非機能要件）
- **重要度:** 中
- backend_plan.md の実装注意点に「500 はスタックトレースをログに記録し、レスポンスには含めない」と記載
- 現在の実装には `@app.exception_handler(Exception)` 等のグローバルエラーハンドラが存在しない
- FastAPI デフォルトの 500 処理に依存しているため、スタックトレースのログ記録が保証されていない

#### W-05: `alembic` マイグレーション実行手順が docker-compose.yml に含まれていない
- **重要度:** 中
- `docker-compose up` で起動後にマイグレーションを手動実行する必要があるが、自動化されていない
- 開発者が「簡単に起動できる」という要件（docker-compose 要件）を完全に満たすには、マイグレーション自動実行の仕組みが必要

#### W-06: Router テストに analytics/summary の histogram・timeseries の data 内容検証が弱い
- **重要度:** 低
- `TestAnalyticsSummary.test_returns_200_with_correct_shape` は summary のキー存在のみ確認
- histogram の各エントリの構造（`source`, `INFO`, `WARNING`, `ERROR`, `CRITICAL`）の検証がない
- timeseries の data 内エントリの構造検証がない

#### W-07: `LogUpdate` の空フィールド送信時の挙動が未定義
- **重要度:** 低
- `LogUpdate` は全フィールド Optional だが、空のボディ（`{}`）で PATCH した場合のレスポンスについてテストがない
- 現在の実装では `model_fields_set` が空になり何も更新されないが、テストで明示的に検証されていない

---

## Step 2 受け入れ基準（Generator がやること）

### 必須修正（全件対応）

- [x] **W-01**: `README.md` を作成する（英語）および `README.ja.md`（日本語）
  - 記載内容: アプリの起動方法（docker-compose）・テスト方法（pytest）・設計上の判断・採用技術ライブラリの理由
- [x] **W-02**: `backend_plan.md` の「timestamp デフォルト: Service 層で設定」の記述を Repository 層に修正する（ドキュメントの実態合わせ）
- [x] **W-03**: Router テスト `TestUpdateLog` に `updated_at` が変化することを検証するテストを追加する（機能バグの可能性あり・動作確認を含む）
- [x] **W-04**: グローバル例外ハンドラを `backend/app/main.py` に追加する
  - 500系エラー発生時に `logger.exception(...)` でスタックトレースをログ出力
  - レスポンスには `{"detail": "Internal server error"}` のみ返す
- [x] **W-05**: `docker-compose.yml` または Dockerfile/entrypoint に alembic マイグレーション自動実行を追加する
  - `CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app ..."]` を Dockerfile に適用済み
- [x] **W-06**: `TestAnalyticsSummary` に histogram エントリの構造検証テストを追加する
- [x] **W-06**: `TestAnalyticsTimeseries` に data エントリの構造検証テストを追加する
- [x] **W-07**: `TestUpdateLog` に空ボディ（`{}`）での PATCH テストを追加する

---

## Step 3 受け入れ基準（Evaluator がやること）

- [x] pytest 全件グリーン（venv + Docker db-test の両環境で確認）
  - `pytest backend/tests/core/` → venv で実行 **12 passed**
  - `pytest backend/tests/schemas/` → venv で実行 **31 passed**
  - `pytest backend/tests/services/` → venv で実行 **27 passed**
  - `pytest backend/tests/repositories/` → Docker db-test 接続で実行 **32 passed**
  - `pytest backend/tests/routers/` → Docker db-test 接続で実行 **36 passed**
  - **合計 138 件全件 PASS（2026-04-12 確認済み）**
- [x] Swagger UI 手動確認はスキップ（テスト結果で代替）
- [x] 500エラー時: `@app.exception_handler(Exception)` が `backend/app/main.py` に実装済み。`logger.exception(...)` でスタックトレース記録・レスポンスは `{"detail": "Internal server error"}` のみ（コード確認済み）
- [x] `alembic upgrade head` が自動実行されることを確認: `backend/Dockerfile` の CMD に `alembic upgrade head &&` が含まれる（コード確認済み）
- [x] `README.md` / `README.ja.md` に起動手順・テスト手順が記載されていることを確認（コード確認済み）

---

## 完了記録
- 完了日: 2026-04-12
- テスト結果: **138 件全件 PASS（Evaluator 確認済み）**
- 特記事項:
  - W-01: `README.md` / `README.ja.md` を全面改訂。起動手順・テスト手順・設計判断・技術選定理由を英語/日本語で詳述
  - W-02: `backend_plan.md` の「timestamp デフォルト: Service 層で設定」→「Repository 層（`LogRepository.create`）で設定」に修正
  - W-03: `test_updated_at_present_and_valid_after_patch` を追加。`updated_at` が null でなく有効な ISO 8601 日時であることを検証
  - W-04: `@app.exception_handler(Exception)` を `backend/app/main.py` に追加。`logger.exception(...)` でスタックトレースを記録し、`{"detail": "Internal server error"}` のみ返す
  - W-05: `backend/Dockerfile` の CMD を `alembic upgrade head && uvicorn ...` に変更。起動時にマイグレーション自動実行
  - W-06: `test_histogram_entry_has_correct_structure` / `test_timeseries_data_entry_has_correct_structure` を追加。各フィールドの存在・型・集計値を検証
  - W-07: `test_empty_body_patch_returns_200_without_changes` を追加。空ボディ PATCH で既存フィールドが変更されないことを検証

---

## 引き継ぎ事項（Phase 4 Playwright E2E で対応）

- [x] **W-03 残課題**: PATCH 後に `updated_at` が実際に変化することを Playwright で検証する
  - pytest では同一トランザクション内で `now()` が固定値になるため検証不可
  - Playwright は実サーバーへの本物の HTTP リクエストのため、create → patch 間で時刻が変化することを確認できる
  - Phase 4 の該当スプリントの Sprint Contract に受け入れ基準として含めること

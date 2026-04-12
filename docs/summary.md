# 開発サマリー

> 設計・実装の意思決定ログ。新しいエントリは先頭に追加する（降順）。

---

## 2026-04-12 | Phase 3.5 ハーネス設計・Phase 3.6 バックエンド見直し完了

### 実施した作業

#### Phase 3.5 — ハーネス設計見直し（`feature/harness-review`）
- Anthropic Engineering 記事をもとに Planner / Generator / Evaluator の3エージェント構成を設計
- `.claude/rules/rules_harness.md` を新規作成（エージェント詳細・起動方法・ファイルフォーマット定義）
- `CLAUDE.md` のフェーズ表に Phase 3.5・3.6 を追加、`Claudeの役割` セクションを `@` インポート形式に変更
- `docs/harness/` ディレクトリを新設（Sprint Contract・Feedback・Handoff の格納先）

#### Phase 3.6 — バックエンド見直し（`feature/backend-review`）
- **Planner エージェント**: 課題 PDF と `backend_plan.md` を照合し W-01〜W-07 の7件を検出・Sprint Contract 作成
- **Generator エージェント**: W-01〜W-07 を全件修正
- **Evaluator エージェント**: 全テスト 138件 PASS を確認・Sprint Contract を最終承認

### 修正内容（W-01〜W-07）

| ID | 内容 |
|----|------|
| W-01 | `README.md`（英語）/ `README.ja.md`（日本語）を新規作成 |
| W-02 | `backend_plan.md` の `timestamp` デフォルト設定の記述を Repository 層に修正 |
| W-03 | `updated_at` 有効性検証テストを追加（変化の確認は Phase 4 Playwright に引き継ぎ） |
| W-04 | `main.py` にグローバル例外ハンドラを追加（`logger.exception` + safe response） |
| W-05 | `Dockerfile` CMD に `alembic upgrade head` を追加し起動時マイグレーションを自動化 |
| W-06 | analytics histogram・timeseries のデータ構造検証テストを追加 |
| W-07 | 空ボディ PATCH テストを追加 |

### 設計上の意思決定

- **`rules_harness.md` を `.claude/rules/` に配置**: `docs/design/` ではなく Claudeの振る舞いルールとして他の `rules_*.md` と統一
- **Sprint Contract は `_plan.md` を参照元とする独立ファイル**: `_plan.md`（作業ステップ管理）と Sprint Contract（受け入れ基準）を役割分離
- **Agent ツールでエージェント起動、Task ツールで進捗管理**: 役割を明確に分離
- **W-03 の残課題を Sprint Contract に明記**: pytest では同一トランザクション内で `now()` が固定値になるため完全な検証が困難。Phase 4 の Playwright E2E で `updated_at` の変化を検証する

### 動作確認（2026-04-12 時点）

- 全テスト 138件グリーン（venv 70件 + Docker 68件）
- PR #3 時点での 134件から4件追加

---

## 2026-04-11 | feature/backend コードレビュー・リファクタリング・テストルール整備

### 実施した作業

- **コードレビュー実施**: 全バックエンドコードを正常系・異常系・境界値・セキュリティ・型ヒント・重複の観点でレビュー
- **設計書との照合**: レビュー結果を `requirements_specification.md` / `backend_plan.md` と照合し、CSV BOM（仕様通り）・Service層（設計通り）の指摘を取り下げ
- **`sev_case` 関数の共通化**: `get_summary` と `get_timeseries` に重複していたローカル関数をモジュールレベルの `_sev_case()` に集約
- **`tests/` 配下の `__init__.py` 全削除**: pytest は `__init__.py` なしでテスト検出可能。`tests/schemas/__init__.py` の削除漏れも対応
- **`noqa: E731` の解消**: `lambda` 代入を `def` に書き換え
- **`pytest-env` / `pytest-cov` 追加**: `pyproject.toml` の `env =` オプション未認識 warning を解消。カバレッジ計測を可能に
- **カバレッジ計測**: 全体 92%。`routers/logs.py` 71%（CSV エクスポートテスト不足）、`database.py` 56%（本番接続コードはテスト差し替えのため未実行）
- **コミット履歴整理**: `git commit --fixup` + `git rebase --autosquash` で各修正を対応する Step コミットに統合
- **CLAUDE.md にコードレビューのルール追加**: レビュー前に設計書を必ず読むルール・指摘の分類（設計書違反 vs コード品質問題）を明文化
- **`.claude/rules.md` 作成**: テスト実装ルール（正常系・異常系・境界値の必須化・境界値チェックリスト・アサーション・モック方針・テスト名規則）を分離管理

### 設計上の意思決定

- **コードレビューのルール**: 設計書を読まずにレビューすると「仕様通りの実装」を誤って指摘するリスクがある（CSV BOM の件が教訓）。レビュー前に `requirements_specification.md` と `_plan.md` を必読とするルールを追加
- **テストルールを `.claude/rules.md` に分離**: `CLAUDE.md` の肥大化を防ぐため詳細ルールを別ファイルに切り出し、`CLAUDE.md` から参照する方針を採用。Claude Code はインポート構文非対応のため手動参照

### 動作確認（2026-04-11 時点）

- 全テスト 107件グリーン（warning なし）
- カバレッジ 92%（`pytest-cov` 導入済み）

---

## 2026-04-06 | feature/backend Step 4〜7 完了・次回 Step 8 から

### 完了した作業（Step 4〜7）

- **Step 4 — スキーマ定義**: `backend/app/schemas/log.py`（8 Pydantic モデル）・`tests/schemas/test_log_schemas.py`（30件グリーン）
- **Step 5 — Repository 層**: `backend/app/repositories/log_repository.py`（CRUD + analytics + CSV）・`tests/repositories/test_log_repository.py`（26件グリーン・Docker）
- **Step 6 — Service 層**: `backend/app/services/log_service.py`（404/400 チェック・日付範囲バリデーション）・`tests/services/test_log_service.py`（18件グリーン・venv）
- **Step 7 — Router 層**: `backend/app/routers/logs.py`（8エンドポイント）・`backend/app/main.py`（router組み込み）・`backend/app/core/database.py`（get_session commit/rollback）・`tests/routers/test_logs.py`（28件グリーン・Docker）

### 設計上の意思決定

- `from __future__ import annotations`: `@staticmethod` に `list` という名前を使うと Python 3.12 で builtin `list` が隠蔽される。`annotations` の遅延評価で回避
- `get_session` に commit/rollback を集約: Route ハンドラーでは `session.commit()` を呼ばず、DI 関数側でトランザクションを完結させる。テストの `override_get_session` は commit しないことでロールバックが効く
- analytics/CSV ルートを `/{log_id}` より前に定義: FastAPI はルートを順番に評価するため `/analytics/summary` が `/{log_id}` にマッチしてしまう問題を防ぐ
- `get_summary`/`get_timeseries` のカルテシアン積バグを修正: サブクエリの `select_from` と `Log.column` 直接参照を混在させると `FROM subquery, logs` の総当たりになる。`.select_from(Log)` に統一して解消

### 動作確認（2026-04-06 時点）

- Docker 統合テスト（Repository + Router）: 54件全グリーン
- venv ユニットテスト（Core + Schema + Service）: 53件全グリーン
- 合計 107件グリーン

### 次回やること（Step 8〜PR）

1. **Step 8 — 最終確認**
   - `docker compose run --rm app python -m pytest` で全テスト一括実行（107件グリーン確認）
   - `docker compose up app db -d` → `http://localhost:8000/docs` で Swagger UI を手動確認
   - 各エンドポイントを curl または Swagger で動作確認
2. **PR直前コミット**（`chore:` プレフィックス）
   - `CLAUDE.md` / `SKILL.md` / `.vscode/settings.json` / `README.md` / `README.ja.md` / `docs/summary.md`
3. `/summary` 実行 → `docs/summary.md` と `docs/local/summary_local.md` を更新
4. **PR作成**: `feature/backend` → `develop`（PR本文フォーマットに従う）

---

## 2026-04-05 | feature/backend Step 3 進行中（database.py / models / alembic 設定完了）

### 実装内容（Step 3 — DB / マイグレーション設定・途中）

- `backend/app/core/database.py`: SQLAlchemy v2 AsyncSession 設定。`create_async_engine` + `async_sessionmaker` + `get_session`（DI用ジェネレータ）+ `Base`（DeclarativeBase）
- `backend/app/models/log.py`: `logs` テーブルモデル定義。CHECK 制約・3インデックスを `__table_args__` で定義。`updated_at` は `onupdate=func.now()` で自動更新
- `backend/alembic/`: `alembic init` で初期化。`env.py` を非同期対応に書き換え。`DATABASE_URL` は `settings.database_url` 経由で一元管理（`alembic.ini` の `sqlalchemy.url` は空）

### 次にやること（次セッション開始時）

1. `docker compose up db -d` で DB 起動
2. `docker compose run --rm app alembic revision --autogenerate -m "create logs table"` で初期マイグレーション生成
3. `docker compose run --rm app alembic upgrade head` でマイグレーション適用
4. `tests/conftest.py` 作成
5. Step 3 成果物をコミット

---

## 2026-04-05 | feature/backend Step 2 完了・Docker 動作確認

### 実装内容（Step 2 — プロジェクト初期設定）

- `backend/Dockerfile` / `requirements.txt` / `.env.example`: Python 3.12-slim ベース・uvicorn[standard] で起動
- `docker-compose.yml`: app + db（5432）+ db-test（5433）の3コンテナ構成
- `backend/app/core/config.py`: pydantic-settings による環境変数管理（`DATABASE_URL` / `LOG_LEVEL` / `ALLOWED_ORIGINS`）
- `backend/app/core/logging.py`: Python 標準 logging による設定
- `backend/app/main.py`: FastAPI 初期化・CORSMiddleware・アクセスログ middleware（`perf_counter` でミリ秒計測）
- `backend/tests/core/test_config.py`: 5件グリーン（venv で実行）

### 設計上の意思決定

- **テスト実行環境を層別に分離**: Core / Schema / Service は venv（DB不要・高速 TDD）、Repository / Router は Docker（実 PostgreSQL 必須）。`requirements_specification.md` § 6 と `backend_plan.md` に明記
- **Service テストは Repository をモック**: Service 単体テストとして実施。Router テストは実DB でフルスタック統合テスト
- **`_plan.md` はブランチ作成後すぐコミット**: Step 1 として独立コミットするルールを `backend_plan.md` と `CLAUDE.md` に追加
- **`.vscode/settings.json` を PR 直前コミットに追加**: インタープリタパスをプロジェクトで共有するため

### 動作確認

- `tests/core/test_config.py` 5件グリーン（venv で実行）
  - デフォルト値・カスタム値・`DATABASE_URL` 未設定時の ValidationError・`allowed_origins_list` の分割動作を確認
- Colima + `docker compose up app db` で起動確認
  - `http://localhost:8000/docs`（Swagger UI）アクセス可
  - `http://localhost:8000/health` → `{"status": "ok"}` を確認

### 環境整備

- venv: `backend/.venv/`（`.gitignore` 対象）
- `.claude/skills/*` を gitignore 対象に。`summary` スキルのみ共有（`!.claude/skills/summary`）

---

## 2026-04-05 | feature/system-design PR 準備完了

### システム設計ドキュメント（`docs/system/`）

- `screen_flow.md`: 4画面（ダッシュボード・ログ一覧・ログ詳細・ログ作成）の遷移図を Mermaid `flowchart` で作成
- `er_diagram.md`: `logs` テーブルの定義・インデックス・CHECK制約・参考DDLを記載。Mermaid `erDiagram` を採用
- `sequence.md`: UC-01〜07（一覧/詳細/作成/編集/削除/ダッシュボード/CSVエクスポート）を Mermaid `sequenceDiagram` で作成

### 設計上の意思決定

- **api_spec.md を作成しない**: FastAPI が `/docs`（Swagger UI）・`/redoc`（ReDoc）を自動生成するため、手書き仕様書は不要と判断。エンドポイント定義は `requirements_specification.md` を正とし、実装後は Swagger UI が正式仕様となる
- **Mermaid 記法を採用**: ASCII art は画面・ユースケース増加時に保守困難になるため、全図を Mermaid に統一。GitHub でネイティブレンダリングされ、VS Code では Markdown Preview Mermaid Support 拡張で確認可能
- **シーケンス図に `alt` / `par` を活用**: 404 分岐（`alt`）・ダッシュボードの並列リクエスト（`par`）を Mermaid の構文で正確に表現

### CLAUDE.md 追記

- 前フェーズの `_plan.md` を読むルールを追加（実装時の引き継ぎ事項確認のため）
- 現フェーズの作業中に前フェーズの設計修正が必要な場合は修正するルールを追加
- CLAUDE.md と README の更新は同一コミットにまとめるルールを追加

---

## 2026-04-05 | feature/requirements-docs PR 準備完了

### README 更新
- `README.md`（英語デフォルト）・`README.ja.md`（日本語）を新規作成
- アーキテクチャセクションを追加（レイヤードアーキテクチャ: Router → Service → Repository）
- テストフレームワーク（pytest + httpx / Vitest + RTL）を Tech Stack に追記

### CLAUDE.md 追記
- プロジェクト全体フェーズ一覧を追加（要求定義〜結合・仕上げの5フェーズ）
- 各フェーズ開始前に `_plan.md` を作成するルールを追加
- 作業開始前の必須手順に「現フェーズ・次フェーズの `_plan.md` を読む」を追加

---

## 2026-04-05 | 要件定義完了・feature/requirements-docs PR 準備完了

### 要件定義ドキュメント（`docs/requirements/requirements_specification.md`）
- 技術スタック・レイヤードアーキテクチャ・ディレクトリ構成を確定
- DB設計: `logs` テーブル（BIGSERIAL / TIMESTAMPTZ / VARCHAR / TEXT）・インデックス・severity CHECK制約
- API設計: CRUD 5エンドポイント + 分析2エンドポイント + CSV エクスポート
  - 全エンドポイントのリクエスト／レスポンス形式・ステータスコードを定義
  - `severity` の複数指定（`?severity=ERROR&severity=CRITICAL`）対応
  - `source` フィルタ: 一覧は部分一致・分析系は完全一致（用途の違いによる設計判断）
- テスト方針: TDD・pytest（Backend）/ Vitest + RTL（Frontend）・層別テスト対象を定義
- エラーハンドリング: 400 / 404 / 422 / 500 + アクセスログ（NF-03 対応）
- 設定管理: Backend `.env` / Frontend `.env.local` / `.env.example` をリポジトリ管理

### 技術選定追記
- Frontend テスト: **Vitest + React Testing Library** を追加（Jest より高速・Next.js との親和性）

### CLAUDE.md 追記
- 「設計に対する姿勢」セクションを追加（設計は AI 駆動開発の最重要工程・複数視点でのレビュー徹底）

### コミット構成（feature/requirements-docs）
- `chore: add project rules and summary skill`（CLAUDE.md・backlog.md・doc_structure.md 含む）
- `docs: add requirements documents`（business_requirements.md・personas_usecases.md・requirements_plan.md）
- `docs: add requirements specification`（requirements_specification.md）
- `docs: add design planning documents`（tech_selection.md・system_design_plan.md）

---

## 2026-04-05 | 要求定義フェーズ完了・Git運用ルール整備

### 要求定義ドキュメント
- `docs/requirements/business_requirements.md`: 機能要求（F-01〜F-18）・非機能要求を確定
  - 削除は管理者のみ（F-05）、ロールは概念定義・画面は管理者ロールで構築
- `docs/requirements/personas_usecases.md`: ペルソナ3名（Kenji / Yuki / Hanako）・UC-01〜UC-05を定義
  - ユースケースからDBカラム（timestamp / message / severity / source）・ダッシュボード指標を導出
- `docs/requirements/requirements_plan.md`: Step 1（要求定義）完了・Step 2（要件定義）未着手

### CLAUDE.md ルール整備
- 資料間の整合性チェックルールを追加（doc_structure.md・_plan.md・相対パスリンク・上位ドキュメント参照）
- コミット対象のルールを追加（各ステップの成果物のみ・_plan.md の成果物リストを参照）
- doc_structure.md・backlog.md は初回設定ファイルコミットに含め、以降の修正は PR 前にまとめる
- summary.md は各フェーズ完了時（PR 前）にコミット
- READMEルールを追加（英語デフォルト・README.ja.md を並行管理）

### コミット構成（feature/requirements-docs）
- `chore: add project rules and summary skill`（CLAUDE.md・backlog.md・doc_structure.md 含む）
- `docs: add requirements documents`（business_requirements.md・personas_usecases.md・requirements_plan.md）

---

## 2026-04-04 | プロジェクト初期セットアップ

### プロジェクト名
- **LogLens** に決定（「ログから価値を見出す」というコンセプト）

### リポジトリ
- GitHub プライベートリポジトリとして作成
- デフォルトブランチ: `main`
- 初回コミット: `.gitignore` のみ

### Git運用方針
- Gitflow を採用
- ブランチ構成: `main` / `develop` / `feature/*` / `fix/*` / `release/*` / `hotfix/*`
- `main` / `develop` への直接プッシュ禁止・PR経由でマージ

### CLAUDE.md 更新
- ドキュメント作成・レビューは最低2回見直すルールを追加
- Git運用ルール（Gitflow）を追記：PR作成前に `/summary` 実行するルールを明記

### 設計計画
- 設計フェーズを2ブランチに分割
  - `feature/requirements-docs`: 要求定義 → 要件定義 → 技術選定（`docs/requirements/requirements_plan.md`）
  - `feature/system-design`: 技術選定 → 画面遷移図 → ER図 → API仕様書 → シーケンス図（`docs/design/system_design_plan.md`）
- 正しい設計順序を意識：要求定義 → 要件定義 → 技術選定の順で進める

### 技術選定（`docs/design/tech_selection.md`）
- Backend: **FastAPI**（Starlette ベース・Python 型ヒント活用・Pydantic v2 によるランタイムバリデーション）
- DB: **PostgreSQL**（`DATE_TRUNC`・ウィンドウ関数による時系列集計に強い）
- Frontend: **Next.js**（App Router・TypeScript・React エコシステム）
- 周辺ライブラリ: SQLAlchemy v2 + Alembic / TanStack Query / React Hook Form + Zod / Recharts / shadcn/ui

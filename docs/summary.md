# 開発サマリー

> 設計・実装の意思決定ログ。新しいエントリは先頭に追加する（降順）。

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

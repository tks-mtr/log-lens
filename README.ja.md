# LogLens

アプリケーションログの記録・検索・分析を一元化する Web アプリケーション。ログデータから意味のある指標を可視化し、システムの状態把握・問題の早期発見・意思決定を支援するサービス。

---

## 機能一覧

- **ダッシュボード** — severity 別サマリーカード・時系列トレンドチャート（Hour / Day / Week）・source 別 severity 分布ヒストグラム
- **ログ一覧** — フィルタ・ソート・ページネーション付きログ表示・CSV エクスポート
- **ログ詳細** — 個別ログの閲覧・編集・削除
- **ログ作成** — バリデーション付きフォームからログを新規作成
- **Source コンボボックス** — DB に存在する source 名を自動補完
- **ダーク / ライトモード** — システム設定連動のテーマ切替

---

## 起動方法

### 前提条件

- Docker および Docker Compose

### アプリケーションの起動

```bash
git clone https://github.com/tks-mtr/log-lens.git
cd log-lens

# 環境変数ファイルのコピー
cp backend/.env.example backend/.env

# ビルドして全サービスを起動
docker-compose up --build
```

起動時に `alembic upgrade head` が自動実行され、データベースのマイグレーションが適用される。
初回起動時は `seed` サービスが 800件の固定テストデータを自動投入する（2回目以降はスキップ）。

### シードデータ設計

シードデータは、実際のログ分布に近い偏りを意図的に持たせて設計している。

| 項目 | 設計内容 |
|------|---------|
| 総件数 | 800件 |
| 期間 | 2026-03-14 〜 2026-04-12（約1ヶ月） |
| 時間帯集中 | 業務時間帯（09:00〜18:00）にログが偏る |
| バーストイベント | 2026-03-22・2026-04-05 に ERROR/CRITICAL が急増 |

**severity 分布**（実際のプロダクション比率に近い値）:

| Severity | 件数 | 割合 |
|----------|------|------|
| INFO | ~504 | ~63% |
| WARNING | ~161 | ~20% |
| ERROR | ~94 | ~12% |
| CRITICAL | ~41 | ~5% |

**source 分布**（トラフィック量に応じた重み付け）:

| Source | 件数 | 意図 |
|--------|------|------|
| api-gateway | 240 | 全リクエストが通過 — 最大ボリューム |
| auth-service | 180 | 認証イベントが頻繁に発生 |
| user-service | 160 | 中程度のボリューム |
| payment-service | 120 | 少量だが重要度が高い |
| notification-service | 100 | バッチ処理中心 — 最小ボリューム |

**severity × source の相関**:
- `payment-service` — ERROR/CRITICAL の割合が高め（決済障害を想定）
- `auth-service` — WARNING の割合が高め（不審なアクセス試行を想定）
- `api-gateway` — INFO が大半（通常アクセスログを想定）

| サービス | URL |
|---------|-----|
| Backend API | http://localhost:8000 |
| API ドキュメント (Swagger UI) | http://localhost:8000/docs |
| Frontend | http://localhost:3000 |

### ローカル開発（Docker なし）

フロントエンドをローカルで開発サーバーとして起動する場合:

```bash
cd frontend
cp .env.local.example .env.local  # 必要に応じて NEXT_PUBLIC_API_URL を設定
npm install
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開く。

### ヘルスチェック

```bash
curl http://localhost:8000/health
# {"status":"ok"}
```

---

## テスト方法

### Backend テスト

テストは2つの環境に分かれている。

**Docker なし（ユニットテスト — DB 不要）:**

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Core config テスト
pytest tests/core/

# Schema テスト
pytest tests/schemas/

# Service 層テスト（Repository はモック）
pytest tests/services/
```

**Docker あり（統合テスト — db-test コンテナ必要）:**

```bash
# テスト用 DB のみ起動
docker compose up -d db-test

# Repository 統合テスト（実 PostgreSQL）
pytest backend/tests/repositories/

# Router 統合テスト
pytest backend/tests/routers/
```

**カバレッジ付き全テスト実行（144件）:**

```bash
docker-compose up -d db-test
cd backend
pytest --cov=app --cov-report=term-missing
```

### Frontend テスト

```bash
cd frontend

# ユニットテスト（Vitest）— 84件
npm run test

# E2E テスト（Playwright）— 18件
# バックエンド + DB の起動が必要
docker compose up -d app db
npx playwright test
# Playwright は webServer 設定によりフロントエンド開発サーバーを自動起動する
```

---

## API 一覧

| メソッド | エンドポイント | 説明 |
|---------|-------------|------|
| POST | `/api/v1/logs` | ログエントリの作成 |
| GET | `/api/v1/logs` | フィルタ・ページネーション付きログ一覧 |
| GET | `/api/v1/logs/{id}` | ログエントリの取得 |
| PATCH | `/api/v1/logs/{id}` | ログエントリの部分更新 |
| DELETE | `/api/v1/logs/{id}` | ログエントリの削除（204 No Content） |
| GET | `/api/v1/logs/analytics/summary` | severity サマリーと source 別ヒストグラム |
| GET | `/api/v1/logs/analytics/timeseries` | interval 指定による時系列集計 |
| GET | `/api/v1/logs/export/csv` | UTF-8 BOM 付き CSV エクスポート |
| GET | `/api/v1/logs/sources` | 重複なし・昇順の source 名一覧 |

---

## 設計思想

### 開発方針

バックエンド・フロントエンドともにテスト駆動開発（TDD）で実装。テストを先に書くことで設計の意図を明文化し、リグレッションを防ぎながら機能を作成。

### コンセプト

> **「ログから価値を見出す」**

ログを「見る」だけでなく、「判断できる」状態にすることを目指した。ダッシュボードで以下のようにデータの可視化を行なった。

- **今、システムに異常はないか？** → severity 別サマリーカード
- **いつ・どこで問題が起きたか？** → 時系列トレンドチャート + source フィルタ
- **全体の傾向はどうか？** → severity 分布ヒストグラム

### ペルソナ

| ペルソナ | 主な用途 |
|---------|---------|
| 運用保守担当 | 日常監視・異常の早期検知 |
| バックエンド開発者 | エラー原因の調査・特定 |
| チームリード | システム全体の健全性トレンド把握 |

各ペルソナのユースケース：

- **運用保守担当**: ダッシュボードを起点に severity サマリーで異常を検知し、Log List で CRITICAL / ERROR を絞り込んで詳細を確認する
- **バックエンド開発者**: source フィルタでサービス名を指定し、時系列チャートで障害発生時刻を特定してから Log List でログを精査する
- **チームリード**: 週次・月次でダッシュボードのトレンドを確認し、severity 分布の変化からシステム品質の傾向を把握する

### バックエンドアーキテクチャ

Backend は**レイヤードアーキテクチャ**を採用し、各関心事を分離してテスタビリティを高めている。

```
Router → Service → Repository → PostgreSQL
```

- **Router**: HTTP ルーティングを担当。リクエスト／レスポンスのバリデーションは Pydantic スキーマに委譲する
- **Service**: ビジネスロジックを集約（日付範囲バリデーション・フィルタ処理）。Router と Repository を疎結合に保つ
- **Repository**: SQLAlchemy v2 の `AsyncSession` による DB アクセスを管理する

### 主な設計上の判断

| 項目 | 判断内容 | 理由 |
|------|---------|------|
| `timestamp` のデフォルト設定 | `LogRepository.create` で `datetime.now(timezone.utc)` を設定 | Service 層をインフラの関心事から切り離す。DB 書き込みは Repository が責任を持つ |
| severity バリデーション | Pydantic `Literal` + PostgreSQL `CHECK` 制約の二重バリデーション | スキーマレベルで無効値を拒否し、DB に到達させない多層防御 |
| source フィルタ戦略 | 一覧は部分一致（`ilike`）、分析系は完全一致 | 一覧はキーワード検索の UX を提供；分析は source 名による正確なグルーピングが必要 |
| 500 エラー時の応答 | スタックトレースは `logger.exception` でログ記録し、レスポンスには含めない | セキュリティ上の要件：内部エラーの詳細をクライアントに漏洩させない |
| CSV エクスポート | UTF-8 BOM 付き・ファイル名 `logs_YYYYMMDD.csv` | BOM により Excel での文字化けを防止 |
| `updated_at` の更新 | SQLAlchemy クライアントサイド `onupdate=func.now()` + `flush()` + `refresh()` | UPDATE 文発行時に新しいタイムスタンプが DB から反映される |
| 起動時マイグレーション | Dockerfile CMD に `alembic upgrade head` を含める | コンテナ起動時に常に最新スキーマが適用され、手動実行が不要 |

---

## 技術スタック

| 区分 | 採用技術 | 選定理由 |
|------|---------|---------|
| Backend | FastAPI (Python) | Python 型ヒントによる型安全な実装・OpenAPI 自動生成・async ネイティブ |
| Database | PostgreSQL | `DATE_TRUNC`・ウィンドウ関数による時系列集計に強い |
| ORM | SQLAlchemy v2 + Alembic | Python ORM の事実上標準・`--autogenerate` によるマイグレーション管理 |
| Frontend | Next.js (TypeScript) | App Router によるファイルベースルーティング・React エコシステムの活用 |
| UI | Tailwind CSS + shadcn/ui | ユーティリティファーストで高速実装・Radix UI ベースのカスタマイズ性 |
| チャート | Recharts | React 向け SVG ベースの宣言的 API |
| サーバー状態管理 | TanStack Query | キャッシュ・ローディング・エラー状態の自動管理 |
| フォーム | React Hook Form + Zod | 再レンダリング最小化・TypeScript 型推論と統合したバリデーション |
| Backend テスト | pytest + httpx | FastAPI 公式推奨・`AsyncClient` による非同期エンドポイントテスト |
| Frontend テスト | Vitest + React Testing Library | Jest より高速で Next.js との親和性が高い・テストをソースと同階層に配置 |
| Infrastructure | Docker + docker-compose | 開発環境の一発起動・再現性の確保 |

詳細な技術選定の比較・根拠は [`docs/design/tech_selection.md`](docs/design/tech_selection.md) を参照。

---

## ロールと権限

認証機能は実装スコープ外とし、画面は管理者ロールで構築している。ロールは概念として以下のように定義する。

| ロール | 操作権限 |
|--------|---------|
| 管理者（Admin） | 全操作（CRUD・削除含む） |
| 一般ユーザー | 閲覧・検索・作成・編集（削除不可） |

---

## 設計ドキュメントの閲覧

`docs/system/` 配下の設計ドキュメント（ER図・画面遷移図・シーケンス図）は [Mermaid](https://mermaid.js.org/) 記法を使用している。VS Code でローカルプレビューのため、以下の拡張機能をインストールを推奨：

- [Markdown Preview Mermaid Support](https://marketplace.visualstudio.com/items?itemName=bierner.markdown-mermaid)

---

## AI 駆動開発

本プロジェクトは [Claude Code](https://claude.ai/code) を用いた AI 駆動開発で構築。AI を適切に導くようハーネス設計を含めて実装した。

### ハーネス設計: Planner / Generator / Evaluator

[Anthropic のハーネス設計](https://www.anthropic.com/engineering/harness-design-long-running-apps) を参考に、各スプリントを Claude Code の `Agent` ツールで起動する3つの専門エージェントで分担した。

```
Main Claude（オーケストレーター）
  │
  ├─ Planner   — 要件 + スプリント計画を読み → Sprint Contract を作成
  ├─ Generator — Sprint Contract をもとに機能実装 + テスト設計
  └─ Evaluator — テスト設計レビュー → pytest / Vitest / Playwright 実行 → フィードバック
```

Generator ↔ Evaluator のループをスプリントごとに繰り返し、全受け入れ基準が通過した時点で完了とする。Sprint Contract（`docs/sprint/`）・構造化ルールファイル（`.claude/rules/`）・カスタムスラッシュコマンド（`/summary`・`/add_memo`）・プロジェクト全体指示（`CLAUDE.md`）も整備し、セッションをまたいでも AI の振る舞いが一貫するよう設計した。

---

## やりたかったこと（≒ ボーナスアイデア）

実装スコープ外だが、以下の機能を将来的に実現したい：

- **LLM ディベートによる価値判断**: 複数の LLM がログデータに対して異なる視点で分析・議論し、単一モデルでは見落としがちな異常パターンや根本原因の候補を提示する
- **認証・権限管理**: JWT による管理者／一般ユーザーのロール分離
- **リテンションポリシー**: 一定期間経過したログの自動削除
- **リアルタイム更新**: WebSocket による Push 通知（現状は手動更新ボタンで代替）
- **認証・権限管理（フロントエンド）**: ルート保護とロールベース UI

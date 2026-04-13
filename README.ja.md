# LogLens

アプリケーションログの記録・検索・分析を一元化する Web アプリケーション。ログデータから意味のある指標を可視化し、システムの状態把握・問題の早期発見・意思決定を支援する。

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
初回起動時は `seed` サービスが 201件の固定テストデータを自動投入する（2回目以降はスキップ）。

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
docker-compose up -d db-test

# Repository 統合テスト（実 PostgreSQL）
pytest backend/tests/repositories/

# Router 統合テスト（フルスタック）
pytest backend/tests/routers/
```

**カバレッジ付き全テスト実行:**

```bash
docker-compose up -d db-test
cd backend
pytest --cov=app --cov-report=term-missing
```

### Frontend テスト

```bash
cd frontend

# ユニットテスト（Vitest）
npm run test

# E2E テスト（Playwright）— 開発サーバーの起動が必要
npm run dev &
npx playwright test
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

### コンセプト

> **「ログから価値を見出す（Log Lens）」**

ログを「見る」だけでなく、「判断できる」状態にすることを目指した。ダッシュボードは単なるデータ表示ではなく、以下の問いに答えられるよう設計している。

- **今、システムに異常はないか？** → severity 別サマリーカード
- **いつ・どこで問題が起きたか？** → 時系列トレンドチャート + source フィルタ
- **全体の傾向はどうか？** → severity 分布ヒストグラム

### ペルソナ

| ペルソナ | 主な用途 |
|---------|---------|
| 運用保守担当 | 日常監視・異常の早期検知 |
| バックエンド開発者 | エラー原因の調査・特定 |
| チームリード | システム全体の健全性トレンド把握 |

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

`docs/system/` 配下の設計ドキュメント（ER図・画面遷移図・シーケンス図）は [Mermaid](https://mermaid.js.org/) 記法を使用している。VS Code でローカルプレビューするには以下の拡張機能をインストールすること：

- [Markdown Preview Mermaid Support](https://marketplace.visualstudio.com/items?itemName=bierner.markdown-mermaid)

GitHub 上では Mermaid がネイティブレンダリングされるため、拡張機能は不要。

---

## やりたかったこと

実装スコープ外だが、以下の機能を将来的に実現したい：

- **認証・権限管理**: JWT による管理者／一般ユーザーのロール分離
- **リテンションポリシー**: 一定期間経過したログの自動削除
- **リアルタイム更新**: WebSocket による Push 通知（現状は手動更新ボタンで代替）
- **認証・権限管理（フロントエンド）**: ルート保護とロールベース UI

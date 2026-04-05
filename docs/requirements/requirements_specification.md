# 要件定義書

> 「どう作るか」を定義する。技術選定の根拠は [`docs/design/tech_selection.md`](../design/tech_selection.md) を参照。

---

## 1. 技術スタック

| 層 | 技術 |
|----|------|
| Backend | FastAPI (Python) + Pydantic v2 |
| DB | PostgreSQL |
| ORM / マイグレーション | SQLAlchemy v2 + Alembic |
| Frontend | Next.js (TypeScript) / App Router |
| UI | Tailwind CSS + shadcn/ui |
| チャート | Recharts |
| サーバー状態管理 | TanStack Query |
| フォーム / バリデーション | React Hook Form + Zod |
| テスト (Backend) | pytest + httpx |
| テスト (Frontend) | Vitest + React Testing Library |
| インフラ | Docker + docker-compose |

---

## 2. アーキテクチャ設計

### Backend（レイヤードアーキテクチャ）

```
Router（HTTPルーティング）
  └── Service（ビジネスロジック）
        └── Repository（DBアクセス）
              └── PostgreSQL
```

- **Router**: FastAPI の `APIRouter` でエンドポイントを定義。リクエスト／レスポンスのバリデーションは Pydantic スキーマに委譲する
- **Service**: ビジネスロジックを集約。Router と Repository を疎結合に保つ
- **Repository**: SQLAlchemy v2 の `AsyncSession` を使用した DB アクセスを担当。SQL の詳細をサービス層から隠蔽する
- **CORS**: `main.py` に `CORSMiddleware` を設定し、フロントエンド（`localhost:3000`）からのアクセスを許可する。許可オリジンは `ALLOWED_ORIGINS` 環境変数で管理する

### Frontend（App Router + Client Components）

- **Server Components**: レイアウト・静的要素に使用
- **Client Components**: フィルタ・フォーム・チャートなどのインタラクティブな要素に使用
- **TanStack Query**: API 通信のキャッシュ・ローディング・エラー状態を一元管理

---

## 3. ディレクトリ構成

### Backend

```
backend/
├── app/
│   ├── main.py               ← FastAPI アプリ初期化・ミドルウェア設定
│   ├── core/
│   │   ├── config.py         ← 環境変数管理（pydantic-settings）
│   │   ├── database.py       ← DB セッション管理
│   │   └── logging.py        ← ロギング設定
│   ├── models/
│   │   └── log.py            ← SQLAlchemy モデル定義
│   ├── schemas/
│   │   └── log.py            ← Pydantic スキーマ（リクエスト／レスポンス）
│   ├── routers/
│   │   └── logs.py           ← ログ関連エンドポイント
│   ├── services/
│   │   └── log_service.py    ← ビジネスロジック
│   └── repositories/
│       └── log_repository.py ← DB アクセス
├── alembic/                  ← マイグレーションファイル
├── tests/
│   ├── conftest.py
│   ├── core/
│   │   └── test_config.py
│   ├── routers/
│   │   └── test_logs.py
│   ├── services/
│   │   └── test_log_service.py
│   └── repositories/
│       └── test_log_repository.py
├── requirements.txt
├── .env.example              ← 環境変数のサンプル（git 管理対象）
└── Dockerfile
```

### Frontend

```
frontend/
├── src/
│   ├── app/
│   │   ├── globals.css           ← Tailwind CSS グローバルスタイル
│   │   ├── layout.tsx
│   │   ├── page.tsx              ← ダッシュボード（/）
│   │   └── logs/
│   │       ├── page.tsx          ← ログ一覧（/logs）
│   │       ├── new/
│   │       │   └── page.tsx      ← ログ作成（/logs/new）
│   │       └── [id]/
│   │           └── page.tsx      ← ログ詳細・編集・削除（/logs/[id]）
│   ├── components/
│   │   ├── ui/                   ← shadcn/ui コンポーネント
│   │   ├── logs/
│   │   │   ├── LogList.tsx
│   │   │   ├── LogList.test.tsx
│   │   │   ├── LogForm.tsx
│   │   │   └── LogForm.test.tsx
│   │   └── dashboard/
│   │       ├── SummaryCard.tsx
│   │       ├── SummaryCard.test.tsx
│   │       ├── TimeseriesChart.tsx
│   │       └── TimeseriesChart.test.tsx
│   ├── hooks/                    ← TanStack Query カスタムフック
│   │   ├── useLogs.ts
│   │   └── useLogs.test.ts
│   ├── lib/
│   │   ├── api.ts                ← API クライアント（fetch ラッパー）
│   │   ├── api.test.ts
│   │   └── utils.ts
│   └── types/
│       └── log.ts                ← ログ関連の型定義
├── next.config.ts            ← Next.js 設定
├── tsconfig.json             ← TypeScript 設定
├── vitest.config.ts          ← Vitest 設定
├── .env.local                ← フロントエンド環境変数（git 管理対象外）
├── package.json
└── Dockerfile
```

---

## 4. DB 設計

### logs テーブル

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| `id` | BIGSERIAL | PK | サロゲートキー |
| `timestamp` | TIMESTAMPTZ | NOT NULL | ログ発生日時 |
| `message` | TEXT | NOT NULL | ログメッセージ本文 |
| `severity` | VARCHAR(10) | NOT NULL | `INFO` / `WARNING` / `ERROR` / `CRITICAL` |
| `source` | VARCHAR(255) | NOT NULL | ログ発生源（サービス名・モジュール名など） |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | レコード作成日時 |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | レコード最終更新日時（PostgreSQL は `ON UPDATE` 相当の機能がないため、SQLAlchemy の `onupdate=func.now()` で自動更新する） |

### インデックス

| 対象カラム | 目的 |
|-----------|------|
| `timestamp` | 日付範囲フィルタ・ソート |
| `severity` | severity フィルタ・集計 |
| `source` | source フィルタ・集計 |

### severity の制約

`severity` は以下の値のみ許容する（DB の CHECK 制約 + Pydantic の `Literal` 型で二重バリデーション）。

```
INFO / WARNING / ERROR / CRITICAL
```

---

## 5. API 設計

ベースパス: `/api/v1`

### ログ CRUD

| メソッド | パス | 説明 |
|---------|------|------|
| `GET` | `/logs` | ログ一覧取得（フィルタ・ソート・ページネーション） |
| `POST` | `/logs` | ログ新規作成 |
| `GET` | `/logs/{id}` | ログ詳細取得 |
| `PATCH` | `/logs/{id}` | ログ更新 |
| `DELETE` | `/logs/{id}` | ログ削除 |

**POST /logs リクエスト形式**

```json
{
  "timestamp": "2026-04-01T12:00:00Z",
  "severity": "ERROR",
  "source": "api-server",
  "message": "Connection timeout"
}
```

- `timestamp`: 省略時は受付時刻（`NOW()`）を使用する
- `severity`: `INFO` / `WARNING` / `ERROR` / `CRITICAL` のいずれか（必須）
- `source`・`message`: 必須。空文字は不可
- レスポンス: **201 Created** + 作成されたログオブジェクト（`GET /logs/{id}` と同一形式）

**GET /logs/{id} / POST /logs / PATCH /logs/{id} 単一ログレスポンス形式**

```json
{
  "id": 1,
  "timestamp": "2026-04-01T12:00:00Z",
  "severity": "ERROR",
  "source": "api-server",
  "message": "Connection timeout",
  "created_at": "2026-04-01T12:00:01Z",
  "updated_at": "2026-04-01T12:00:01Z"
}
```

- `GET /logs/{id}`: **200 OK**
- `POST /logs`: **201 Created**
- `PATCH /logs/{id}`: **200 OK**
- `DELETE /logs/{id}`: **204 No Content**（ボディなし）

**PATCH /logs/{id} リクエスト形式**

すべてのフィールドが任意（部分更新）。省略したフィールドは変更しない。

```json
{
  "timestamp": "2026-04-01T13:00:00Z",
  "severity": "CRITICAL",
  "source": "api-server",
  "message": "Updated message"
}
```

**GET /logs クエリパラメータ**

| パラメータ | 型 | 説明 |
|-----------|----|------|
| `start` | datetime (ISO 8601) | 開始日時（inclusive） |
| `end` | datetime (ISO 8601) | 終了日時（inclusive） |
| `severity` | string (複数指定可) | `INFO` / `WARNING` / `ERROR` / `CRITICAL`。複数指定は `?severity=ERROR&severity=CRITICAL` 形式 |
| `source` | string | 部分一致検索（一覧はキーワード検索用途のため部分一致、分析系は集計軸として使うため完全一致） |
| `sort_by` | string | ソートカラム: `timestamp` / `severity` / `source`（デフォルト: `timestamp`） |
| `order` | `asc` / `desc` | ソート順（デフォルト: `desc`） |
| `page` | int | ページ番号（デフォルト: 1） |
| `limit` | int | 1ページあたり件数（デフォルト: 50, 最大: 200） |

**GET /logs レスポンス形式**

```json
{
  "data": [
    {
      "id": 1,
      "timestamp": "2026-04-01T12:00:00Z",
      "severity": "ERROR",
      "source": "api-server",
      "message": "Connection timeout",
      "created_at": "2026-04-01T12:00:01Z",
      "updated_at": "2026-04-01T12:00:01Z"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 50,
  "pages": 2
}
```

### 分析

| メソッド | パス | 説明 |
|---------|------|------|
| `GET` | `/logs/analytics/summary` | severity 別ログ件数サマリー（ヒストグラム用データを含む） |
| `GET` | `/logs/analytics/timeseries` | 時系列ログ件数トレンド |

**共通クエリパラメータ（分析系）**

| パラメータ | 型 | 説明 |
|-----------|----|------|
| `start` | datetime | 開始日時 |
| `end` | datetime | 終了日時 |
| `severity` | string (複数指定可) | フィルタ条件。複数指定は `?severity=ERROR&severity=CRITICAL` 形式 |
| `source` | string | フィルタ条件（完全一致） |
| `interval` | `hour` / `day` / `week` | 時系列の粒度（timeseries のみ、デフォルト: `day`） |

**GET /logs/analytics/summary レスポンス形式**

severity 別件数（サマリーカード用）と日付範囲・source ごとの severity 分布（ヒストグラム用）を同一エンドポイントで返す。

```json
{
  "summary": {
    "INFO": 120,
    "WARNING": 45,
    "ERROR": 30,
    "CRITICAL": 5
  },
  "histogram": [
    { "source": "api-server", "INFO": 80, "WARNING": 20, "ERROR": 15, "CRITICAL": 2 },
    { "source": "worker",     "INFO": 40, "WARNING": 25, "ERROR": 15, "CRITICAL": 3 }
  ]
}
```

**GET /logs/analytics/timeseries レスポンス形式**

```json
{
  "interval": "day",
  "data": [
    { "timestamp": "2026-04-01T00:00:00Z", "INFO": 50, "WARNING": 10, "ERROR": 5, "CRITICAL": 1 },
    { "timestamp": "2026-04-02T00:00:00Z", "INFO": 60, "WARNING": 15, "ERROR": 8, "CRITICAL": 0 }
  ]
}
```

### ボーナス

| メソッド | パス | 説明 |
|---------|------|------|
| `GET` | `/logs/export/csv` | CSV ダウンロード（GET /logs と同一フィルタ、文字コード: UTF-8 BOM付き、カラム順: `id, timestamp, severity, source, message`、`Content-Disposition: attachment; filename="logs_YYYYMMDD.csv"`） |

---

## 6. テスト方針

テストはすべて **TDD（テスト駆動開発）** で実施する。テストが通ることを確認しながら実装を進める。

| 層 | フレームワーク | 対象 | 実行環境 |
|----|-------------|------|---------|
| Backend / Core | pytest | 設定管理・ロギング設定 | venv（DB不要） |
| Backend / Schema | pytest | Pydantic バリデーション | venv（DB不要） |
| Backend / Service | pytest | ビジネスロジック・バリデーション。Repository はモックして単体テスト | venv（DB不要） |
| Backend / Repository | pytest | DB クエリの正確性（本番と同じ PostgreSQL をテスト用コンテナとして使用） | Docker（実DB必須） |
| Backend / Router | pytest + httpx `AsyncClient` | エンドポイントの入出力・ステータスコード。実DB を使ったフルスタック統合テスト | Docker（実DB必須） |
| Frontend / Component | Vitest + React Testing Library | レンダリング・ユーザー操作 | ローカル |
| Frontend / Hooks | Vitest | TanStack Query フックの状態管理 | ローカル |
| Frontend / Lib | Vitest | API クライアント・ユーティリティ関数 | ローカル |

---

## 7. エラーハンドリング方針

| ステータスコード | 条件 | レスポンス形式 |
|----------------|------|--------------|
| 400 | リクエストの意味的な不整合（例: `start > end`） | `{"detail": "<message>"}` |
| 404 | 指定 ID のログが存在しない | `{"detail": "Log not found"}` |
| 422 | Pydantic バリデーションエラー | FastAPI デフォルト形式 |
| 500 | 予期せぬサーバーエラー | `{"detail": "Internal server error"}` |

- すべてのエラーは Python 標準の `logging` モジュールでサーバーサイドにログ出力する
- 500 エラー時はスタックトレースをログに記録し、レスポンスには詳細を含めない
- FastAPI の `middleware` でアクセスログ（メソッド・パス・ステータスコード・処理時間）を `INFO` レベルで出力する（NF-03 対応）

---

## 8. 設定管理

- 環境変数は `pydantic-settings` の `BaseSettings` で一元管理する
- `.env` ファイルで開発環境の変数を定義し、`docker-compose` で注入する

**Backend（`.env`）**

| 変数名 | 説明 |
|--------|------|
| `DATABASE_URL` | PostgreSQL 接続 URL |
| `LOG_LEVEL` | ログ出力レベル（デフォルト: `INFO`） |
| `ALLOWED_ORIGINS` | CORS 許可オリジン（カンマ区切り） |

**Frontend（`.env.local`）**

| 変数名 | 説明 |
|--------|------|
| `NEXT_PUBLIC_API_URL` | Backend API のベース URL（例: `http://localhost:8000/api/v1`） |

- `.env` / `.env.local` は git 管理対象外とし、`.env.example` をリポジトリに含めて初期セットアップの参考とする

# 技術選定ドキュメント

> 各技術の採用理由を明確にするため、主要な代替案とのメリット・デメリットを比較した上で選定する。

---

## Backend フレームワーク

| フレームワーク | 概要 | メリット | デメリット |
|--------------|------|---------|-----------|
| **FastAPI** ✅ | Starlette（ASGI フレームワーク）をベースに構築された Python 製の非同期 Web フレームワーク。Python の型ヒントを活用した設計と OpenAPI 自動生成を特徴とする | Python 型ヒントによる型安全な実装 / Pydantic v2 によるランタイムバリデーション・シリアライゼーション / OpenAPI (Swagger UI) の自動生成でフロントエンドとの連携確認が容易 / async ネイティブで I/O バウンドな処理に強い / 軽量でボイラープレートが少なく小〜中規模 API に最適 | 管理画面・認証・ORM などのフルスタック機能は標準提供されない / Django と比べてエコシステムはやや未成熟 |
| Django REST Framework | Django をベースにした REST API フレームワーク。「電池付属」設計でフルスタック機能を標準提供する | 認証・管理画面・ORM など機能が豊富で開発開始が速い / エコシステムが最も成熟しており情報量が多い | デフォルトは同期ベースで FastAPI より低速（ASGI 対応は Django 3.1+ からあるが設定が複雑） / 今回のような軽量 API には過剰なボイラープレートが多い |
| Flask + Flask-RESTX | Python 製のマイクロフレームワーク。必要最小限の機能のみ提供し、構成を自由に決められる | 軽量でシンプル・自由度が高い / 学習コストが低い | 型安全性がなくバリデーションを自前実装する必要がある / 非同期対応が限定的 / Swagger UI は生成できるが各エンドポイントへのアノテーション付与を手動で行う必要があり FastAPI より手間がかかる |

**選定理由:** 課題が「入力バリデーション・エラーハンドリング・ロギングのベストプラクティス」を明示しており、Pydantic v2 によるランタイムバリデーションと OpenAPI 自動生成を標準で備える FastAPI が最も要件に合致する。今回の規模では Django の管理機能・ORM は不要であり、Flask より型安全性が高い FastAPI を採用する。

---

## データベース

| DB | 概要 | メリット | デメリット |
|----|------|---------|-----------|
| **PostgreSQL** ✅ | オープンソースのオブジェクトリレーショナル DB。高度な SQL 機能・拡張性・信頼性で定評がある | `DATE_TRUNC`・ウィンドウ関数・JSONB など高度なクエリ機能を持ち、時系列集計に強い / docker-compose との親和性が高く開発環境の再現が容易 / 本番実績が豊富でスケーラビリティがある | SQLite と比べて起動に Docker 等のセットアップが必要（docker-compose で解消） |
| MySQL / MariaDB | 最も普及した RDBMS の一つ。Web 系システムで広く採用されている | 広く普及しており情報量が多い / MySQL 8.0+ からウィンドウ関数対応 | PostgreSQL と比べて `DATE_TRUNC` 相当の関数がなく時系列集計の柔軟性が低い / JSONB のような高度なネイティブ JSON 型サポートがない |
| SQLite | ファイルベースの組み込み RDBMS。サーバー不要で動作する | セットアップ不要でプロトタイプ・テスト環境に最適 | WAL モードでも並行書き込みに制限があり本番運用には不向き / `DATE_TRUNC` 相当の時系列集計関数がなく日時処理の柔軟性が低い |
| MongoDB | ドキュメント指向の NoSQL DB。スキーマレスで柔軟なデータ構造を持つ | スキーマ変更に柔軟 / 水平スケーリングが容易 | 課題が「リレーショナルDB」を明示しており要件不適合 / Aggregation Pipeline は強力だが SQL に慣れている場合は習得コストが高い |

**選定理由:** 課題が「リレーショナルDB」を明示しており、かつダッシュボードの集計要件（日付範囲・severity・source での時系列集計）に対して PostgreSQL の `DATE_TRUNC`・ウィンドウ関数・`GROUP BY` が最も適している。MySQL は集計の柔軟性で劣り、SQLite は本番運用に不向きなため PostgreSQL を採用する。

---

## Frontend フレームワーク

| フレームワーク | 概要 | メリット | デメリット |
|--------------|------|---------|-----------|
| **Next.js** ✅ | React ベースのフルスタックフレームワーク。App Router・SSR/SSG・Server Components を標準提供する | App Router によるファイルベースルーティングで複数ページ構成を直感的に管理 / Server Components（Next.js 13+）でパフォーマンス最適化が可能 / TypeScript との親和性が高い / React エコシステム（TanStack Query・shadcn/ui 等）をそのまま活用可能 / 課題の推奨技術スタックに明記 | Vite + React より設定・概念が多く学習コストが若干高い |
| Vite + React | Vite をビルドツールとした純粋な SPA 構成。シンプルさと高速な開発体験を特徴とする | 軽量でシンプル・設定が少ない / HMR が高速で開発体験が良い | ルーティングは React Router 等を別途導入する必要がある / SSR が必要な場合は設定が煩雑 / 複数ページ管理が Next.js より煩雑になりやすい |
| Remix | React ベースのフルスタックフレームワーク。サーバーサイドのローダー・アクション設計に強みを持つ | Web 標準に準拠したフォーム処理・ローダー設計が洗練されている | Next.js と比べてエコシステム・情報量が少ない / 課題推奨外であり採点者への説明コストが高い |
| Nuxt.js | Vue.js ベースのフルスタックフレームワーク。Next.js の Vue 版に相当する | Vue.js エコシステムと統合した直感的な設計 | 課題が React ベースを推奨しており要件不適合 |

**選定理由:** 課題が Next.js を推奨しており、ダッシュボード・一覧・詳細・作成の複数ページ構成に App Router のファイルベースルーティングが有効に機能する。TypeScript・React エコシステムの組み合わせが開発生産性とコード品質の両立に最適であるため採用する。

---

## 周辺ライブラリ

### Backend

| 用途 | 採用 | 主な代替 | 選定理由 |
|------|------|---------|---------|
| ORM | SQLAlchemy v2 | Tortoise-ORM / Peewee | Python ORM の事実上標準。Alembic との連携が容易で、型安全な Mapped 記法（v2）が使いやすい。Tortoise-ORM は async ネイティブだが情報量が少ない |
| マイグレーション | Alembic | aerich（Tortoise用） | SQLAlchemy 公式のマイグレーションツール。`--autogenerate` オプションでモデル定義からスキーマ差分を自動検出してマイグレーションファイルを生成できる |
| バリデーション | Pydantic v2 | marshmallow | FastAPI に内蔵されており追加コストなし。v2 で大幅にパフォーマンス向上。型アノテーションと自然に統合できる |
| テスト | pytest + httpx | unittest | FastAPI 公式推奨。`AsyncClient` を使った非同期エンドポイントのテストが容易 |

### Frontend

| 用途 | 採用 | 主な代替 | 選定理由 |
|------|------|---------|---------|
| スタイリング | Tailwind CSS + shadcn/ui | MUI / Chakra UI / CSS Modules | Tailwind はユーティリティファーストで高速実装が可能。shadcn/ui は Radix UI ベースのコピペ型コンポーネントで、デザインをカスタマイズしやすく Tailwind と相性が良い。MUI は学習コストと bundle サイズが大きい |
| チャート | Recharts | Chart.js / Nivo / Victory | React 向けに設計された SVG ベースの宣言的 API を持つ。Chart.js は Canvas ベースで React との統合に追加ラッパーが必要。Nivo は高機能だが bundle サイズが大きい |
| サーバー状態管理 | TanStack Query | SWR / Redux Toolkit Query | キャッシュ・ローディング・エラー状態・再取得を自動管理。SWR より機能が豊富で、ページネーション・楽観的更新などダッシュボード要件に対応しやすい |
| フォーム | React Hook Form + Zod | Formik + Yup | React Hook Form は非制御コンポーネントベースで再レンダリングを最小化。Zod はスキーマ定義と TypeScript 型推論が統合されており、バックエンドの Pydantic モデルと概念的に対応できる |
| テスト | Vitest + React Testing Library | Jest + RTL | Vitest は Vite ベースで Next.js との設定親和性が高く Jest より高速。React Testing Library はコンポーネントをユーザー視点でテストする標準ライブラリ。テストはソースと同階層に配置（コロケーション）し TDD を実践する |

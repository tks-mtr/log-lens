# LogLens

アプリケーションログの記録・検索・分析を一元化する Web アプリケーション。ログデータから意味のある指標を可視化し、システムの状態把握・問題の早期発見・意思決定を支援する。

---

## 設計ドキュメントの閲覧

`docs/system/` 配下の設計ドキュメント（ER図・画面遷移図・シーケンス図）は [Mermaid](https://mermaid.js.org/) 記法を使用している。VS Code でローカルプレビューするには以下の拡張機能をインストールすること：

- [Markdown Preview Mermaid Support](https://marketplace.visualstudio.com/items?itemName=bierner.markdown-mermaid)

GitHub 上では Mermaid がネイティブレンダリングされるため、拡張機能は不要。

---

## 起動方法

```bash
git clone https://github.com/tks-mtr/log-lens.git
cd log-lens
docker-compose up --build
```

| サービス | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API ドキュメント (Swagger UI) | http://localhost:8000/docs |

---

## テスト方法

```bash
# Backend テスト
docker-compose exec backend pytest

# Frontend テスト
docker-compose exec frontend npm test
```

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

詳細は [`docs/requirements/personas_usecases.md`](docs/requirements/personas_usecases.md) を参照。

### ロールと権限

認証機能は実装スコープ外とし、画面は管理者ロールで構築している。ロールは概念として以下のように定義する。

| ロール | 操作権限 |
|--------|---------|
| 管理者（Admin） | 全操作（CRUD・削除含む） |
| 一般ユーザー | 閲覧・検索・作成・編集（削除不可） |

認証・権限管理の実装は将来の改善案として [`docs/backlog.md`](docs/backlog.md) に記載している。

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
| Frontend テスト | Vitest + React Testing Library | Jest より高速で Next.js との親和性が高い・テストをソースと同階層に配置（コロケーション） |
| Infrastructure | Docker + docker-compose | 開発環境の一発起動・再現性の確保 |

詳細な技術選定の比較・根拠は [`docs/design/tech_selection.md`](docs/design/tech_selection.md) を参照。

---

## アーキテクチャ

Backend は**レイヤードアーキテクチャ**を採用し、各関心事を分離してテスタビリティを高めている。

```
Router → Service → Repository → PostgreSQL
```

- **Router**: HTTP ルーティングを担当。リクエスト／レスポンスのバリデーションは Pydantic スキーマに委譲する
- **Service**: ビジネスロジックを集約。Router と Repository を疎結合に保つ
- **Repository**: SQLAlchemy v2 の `AsyncSession` による DB アクセスを管理する

Frontend は Next.js の **App Router** を採用し、Server Components（レイアウト・静的コンテンツ）と Client Components（フィルタ・フォーム・チャート）を明確に分離。API 通信は TanStack Query で一元管理する。

---

## やりたかったこと

実装スコープ外だが、以下の機能を将来的に実現したい。詳細は [`docs/backlog.md`](docs/backlog.md) を参照。

- **認証・権限管理**: JWT による管理者／一般ユーザーのロール分離
- **リテンションポリシー**: 一定期間経過したログの自動削除
- **リアルタイム更新**: WebSocket による Push 通知（現状は手動更新ボタンで代替）
- **AI ディベートエンジン**: OSS LLM 2台によるディベート形式のインサイト自動抽出

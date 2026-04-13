# フロントエンド実装プラン

> ブランチ: `feature/frontend`

---

## 技術スタック

| 用途 | 技術 |
|------|------|
| フレームワーク | Next.js (App Router) + TypeScript |
| スタイリング | Tailwind CSS + shadcn/ui |
| チャート | Recharts |
| サーバー状態管理 | TanStack Query |
| フォーム / バリデーション | React Hook Form + Zod |
| テスト (UT) | Vitest + React Testing Library |
| テスト (E2E) | Playwright |

---

## ページ構成

| ページ | パス | 概要 |
|--------|------|------|
| ダッシュボード | `/` | severity別サマリーカード・時系列チャート・ヒストグラム |
| ログ一覧 | `/logs` | テーブル・フィルタ・ページネーション・CSVエクスポート |
| ログ詳細・編集 | `/logs/[id]` | 詳細表示・インライン編集・削除 |
| ログ作成 | `/logs/new` | 新規作成フォーム |

共通サイドバー（`app/layout.tsx`）からダッシュボード・ログ一覧へナビゲーション。

---

## 作業ステップ

### Sprint 1 — レイアウト設計 [ ]

- **エージェント:** なし（設計のみ・コード不要）
- **成果物:** `docs/design/frontend_layout.md`
- **内容:**
  - v0.dev または shadcn/ui Blocks でレイアウトの見た目を確認する（コードは不要・参考のみ）
  - 確認結果をもとに以下をテキストで `frontend_layout.md` に記述する
    - カラースキーム（shadcn/ui テーマ・アクセントカラー）
    - サイドバーの構成（幅・ナビ項目・アイコン有無）
    - 使用する shadcn/ui コンポーネント一覧
    - 各ページのレイアウト概要（テキストベースのワイヤーフレーム）
  - Sprint 2 以降の Generator がこのドキュメントを読んで実装できる粒度で記述する

---

### Sprint 2 — プロジェクト初期設定 [ ]

- **エージェント:** Generator → Evaluator
- **読み込むファイル:**
  - `docs/sprint/sprint_frontend_setup_contract.md`
  - `docs/design/frontend_layout.md`（Sprint 1 成果物）
- **成果物:**
  - `frontend/` ディレクトリ（Next.js プロジェクト）
  - `frontend/package.json`
  - `frontend/next.config.ts`
  - `frontend/vitest.config.ts`
  - `frontend/src/app/layout.tsx`（サイドバー含む共通レイアウト）
  - `frontend/src/types/log.ts`（型定義）
  - `frontend/src/lib/api.ts`（API クライアント）
  - `frontend/src/lib/api.test.ts`
  - Playwright 設定（`playwright.config.ts`）
  - `frontend/Dockerfile`・`docker-compose.yml` への frontend サービス追加
- **内容:**
  - Next.js + TypeScript + Tailwind + shadcn/ui のセットアップ
  - Vitest + React Testing Library の設定
  - Playwright のセットアップ
  - API クライアント（`NEXT_PUBLIC_API_URL` ベース）の実装とUT
  - 共通レイアウト（サイドバー）の実装

---

### Sprint 3 — ダッシュボード [ ]

- **エージェント:** Planner → Generator → Evaluator
- **読み込むファイル:**
  - `docs/sprint/sprint_dashboard_contract.md`
  - `docs/design/frontend_layout.md`
- **成果物:**
  - `frontend/src/app/page.tsx`（ダッシュボードページ）
  - `frontend/src/components/dashboard/SummaryCard.tsx` + テスト
  - `frontend/src/components/dashboard/TimeseriesChart.tsx` + テスト
  - `frontend/src/components/dashboard/Histogram.tsx` + テスト
  - `frontend/src/components/dashboard/FilterPanel.tsx` + テスト
  - `frontend/src/hooks/useAnalytics.ts` + テスト
  - Playwright E2E: `tests/e2e/dashboard.spec.ts`
- **内容:**
  - `GET /analytics/summary` → severityサマリーカード・ヒストグラム
  - `GET /analytics/timeseries` → 時系列チャート（interval切替）
  - 日付範囲・severity・sourceフィルタ

---

### Sprint 4 — ログ一覧 [ ]

- **エージェント:** Planner → Generator → Evaluator
- **読み込むファイル:**
  - `docs/sprint/sprint_log_list_contract.md`
- **成果物:**
  - `frontend/src/app/logs/page.tsx`（ログ一覧ページ）
  - `frontend/src/components/logs/LogTable.tsx` + テスト
  - `frontend/src/components/logs/LogFilterPanel.tsx` + テスト
  - `frontend/src/components/logs/Pagination.tsx` + テスト
  - `frontend/src/hooks/useLogs.ts` + テスト
  - Playwright E2E: `tests/e2e/log_list.spec.ts`
- **内容:**
  - `GET /logs`（フィルタ・ソート・ページネーション）
  - CSVエクスポートボタン（`GET /logs/export/csv`）
  - 行クリックでログ詳細へ遷移
  - 新規作成ボタンで `/logs/new` へ遷移

---

### Sprint 5 — ログ詳細・編集・作成 [ ]

- **エージェント:** Planner → Generator → Evaluator
- **読み込むファイル:**
  - `docs/sprint/sprint_log_detail_contract.md`
- **成果物:**
  - `frontend/src/app/logs/[id]/page.tsx`（ログ詳細・編集・削除）
  - `frontend/src/app/logs/new/page.tsx`（ログ作成）
  - `frontend/src/components/logs/LogForm.tsx` + テスト
  - `frontend/src/components/logs/DeleteDialog.tsx` + テスト
  - Playwright E2E: `tests/e2e/log_detail.spec.ts`
  - Playwright E2E: `tests/e2e/log_create.spec.ts`
- **内容:**
  - `GET /logs/{id}` → 詳細表示
  - `PATCH /logs/{id}` → インライン編集（React Hook Form + Zod）
  - `DELETE /logs/{id}` → 確認ダイアログ → ログ一覧へリダイレクト
  - `POST /logs` → 作成成功後ログ一覧へリダイレクト
  - **W-03 引き継ぎ**: PATCH後に `updated_at` が変化することをPlaywrightで検証

---

### Sprint Fix — バグ修正・環境整備 [ ]

- **エージェント:** なし（手動修正）
- **読み込むファイル:**
  - `docs/sprint/sprint_fix_contract.md`
  - `docs/local/memo.md`（画面操作確認メモ）
- **成果物:**
  - `frontend/Dockerfile`（npm ci → npm install）
  - `docker-compose.yml`（seed サービス追加）
  - `backend/seed.py` + `backend/fixtures/seed_data.json`
  - `frontend/src/components/logs/LogForm.tsx`（Zod v4 対応）
  - `frontend/src/components/common/AppSidebar.tsx`（asChild 削除・タイトル修正）
  - `frontend/src/components/common/ThemeToggle.tsx`（2ボタン化・hydration 修正・余白修正）
  - `frontend/src/app/layout.tsx`（タイトル修正）
  - `docs/design/frontend_layout.md`（タイトル修正）
  - 時系列チャート Hour 表示改善・ログ一覧ホバー改善
- **内容:**
  - Docker ビルドエラーの解消（Linux 向けオプション依存関係）
  - 固定シードスクリプトによるテストデータ自動投入（101件・べき等）
  - Zod v4 API 変更への対応
  - shadcn/ui `@base-ui/react` 移行に伴う `asChild` エラー解消
  - ThemeToggle UX 改善（2ボタン・ハイライト・hydration 修正）
  - タイトル「Log Monitor」→「LogLens」/「Log Lens」統一
  - 時系列チャート Hour 表示の見づらさ改善
  - ログ一覧ホバー時の視認性改善

---

## 完了条件

- [ ] Sprint 1〜5 の全ステップ完了
- [ ] Vitest 全件グリーン
- [ ] Playwright 全件グリーン
- [ ] PR直前コミット（CLAUDE.md / README.md / README.ja.md / docs/summary.md / 本ファイル）完了

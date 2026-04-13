# Sprint Contract: フロントエンド初期設定（Sprint 2）

## 参照元
- docs/design/frontend_plan.md（Sprint 2）
- docs/design/frontend_layout.md
- docs/issues/assignment_ja.md（課題要件）
- docs/requirements/requirements_specification.md（API仕様・型定義）

## ステータス
- [x] 未着手 → [x] 実装中 → [x] テスト設計中 → [x] 完了

---

## 受け入れ基準

### セットアップ・設定

- [x] `frontend/` ディレクトリに Next.js + TypeScript + App Router プロジェクトが存在する
- [x] `frontend/package.json` に以下の依存ライブラリが含まれる
  - `next`, `react`, `react-dom`, `typescript`
  - `tailwindcss`, `@shadcn/ui`（または `shadcn` CLI でセットアップ済み）
  - `@tanstack/react-query`
  - `react-hook-form`, `zod`
  - `recharts`
  - `next-themes`（テーマ切り替え用）
  - `lucide-react`（アイコン用）
- [x] `frontend/next.config.ts` が存在し、API URL の環境変数（`NEXT_PUBLIC_API_URL`）を参照できる設定になっている
- [x] `frontend/vitest.config.ts` が存在し、React Testing Library と jsdom 環境が設定されている
- [x] `playwright.config.ts`（プロジェクトルート or `frontend/` 直下）が存在し、`baseURL` として `http://localhost:3000` が設定されている
- [x] `frontend/.env.local.example` が存在し、`NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1` のサンプルが記載されている
- [x] `frontend/Dockerfile` が存在する（Node.js ベース・マルチステージビルド対応が望ましい）
- [x] `docker-compose.yml` の `services` に `frontend` が追加されており、`http://localhost:3000` でアクセスできる設定になっている

### 型定義（`frontend/src/types/log.ts`）

- [x] 以下の型が定義されている
  - `Severity`: `"INFO" | "WARNING" | "ERROR" | "CRITICAL"` のユニオン型
  - `Log`: `id`, `timestamp`, `severity`, `source`, `message`, `created_at`, `updated_at` を持つインターフェース
  - `LogListResponse`: `data: Log[]`, `total`, `page`, `limit`, `pages` を持つインターフェース
  - `CreateLogInput`: `timestamp?`, `severity`, `source`, `message` を持つインターフェース（POST /logs 用）
  - `UpdateLogInput`: 全フィールドが Optional の部分更新型（PATCH /logs/{id} 用）
  - `AnalyticsSummaryResponse`: `summary`（severity別件数）と `histogram`（source別severity件数配列）を持つインターフェース
  - `AnalyticsTimeseriesResponse`: `interval` と `data`（時系列エントリ配列）を持つインターフェース
  - `LogListParams`: GET /logs クエリパラメータ型（`start?`, `end?`, `severity?`, `source?`, `sort_by?`, `order?`, `page?`, `limit?`）

### API クライアント（`frontend/src/lib/api.ts`）

- [x] `NEXT_PUBLIC_API_URL` をベースURLとして使用する
- [x] 以下の関数が実装されている
  - `getLogs(params: LogListParams): Promise<LogListResponse>` — GET /logs
  - `getLog(id: number): Promise<Log>` — GET /logs/{id}
  - `createLog(input: CreateLogInput): Promise<Log>` — POST /logs
  - `updateLog(id: number, input: UpdateLogInput): Promise<Log>` — PATCH /logs/{id}
  - `deleteLog(id: number): Promise<void>` — DELETE /logs/{id}
  - `getAnalyticsSummary(params): Promise<AnalyticsSummaryResponse>` — GET /logs/analytics/summary
  - `getAnalyticsTimeseries(params): Promise<AnalyticsTimeseriesResponse>` — GET /logs/analytics/timeseries
  - `exportLogsCSV(params): string` — GET /logs/export/csv の URL 生成（ダウンロード用 URL を返す関数）
- [x] HTTP エラー（4xx / 5xx）時に適切な `Error` をスローする

### 共通レイアウト（`frontend/src/app/layout.tsx`）

- [x] `ThemeProvider`（`next-themes`）でラップされており、ダーク / ライト切り替えが機能する
- [x] サイドバーが表示される（固定幅）
  - タイトル: **Log Lens**（太字）
  - テーマ切り替えトグル（Sun / Moon アイコン）が表示される
  - ナビ項目: "Dashboard"（BarChart2 アイコン）と "Log List"（List アイコン）
  - アクティブなリンクが rounded rectangle でハイライトされる
- [x] `ThemeToggle` コンポーネントが `frontend/src/components/common/ThemeToggle.tsx` として分離されている
- [x] ページコンテンツ領域（`{children}`）がサイドバーの右側に `flex-1` で表示される

### Playwright 設定

- [x] `playwright.config.ts` が存在する
- [x] `baseURL: "http://localhost:3000"` が設定されている
- [x] `tests/e2e/` ディレクトリが存在する（空でも可）
- [x] `package.json`（または `frontend/package.json`）に Playwright の実行スクリプトが含まれている

---

## テスト合格基準

### Vitest（`frontend/src/lib/api.test.ts`）

以下のテストケースがすべて PASS すること（`vitest run` で確認）。

| テストケース | 種別 | 内容 |
|------------|------|------|
| `test_getLogs_正常系_ページネーション付きレスポンスを返す` | 正常系 | モック fetch で `LogListResponse` 形式のレスポンスを返す |
| `test_getLogs_クエリパラメータが正しくURLに付与される` | 正常系 | `severity`, `source`, `page`, `limit` が URL クエリに含まれる |
| `test_getLogs_severityが複数の場合_クエリに複数パラメータが付与される` | 境界値 | `?severity=ERROR&severity=CRITICAL` 形式になる |
| `test_getLog_正常系_単一ログを返す` | 正常系 | ID 指定で `Log` オブジェクトを返す |
| `test_getLog_404_Errorをスローする` | 異常系 | 404 レスポンス時に `Error` をスロー |
| `test_createLog_正常系_201でLogを返す` | 正常系 | POST body が正しく送信され、`Log` が返る |
| `test_createLog_422_Errorをスローする` | 異常系 | バリデーションエラー時に `Error` をスロー |
| `test_updateLog_正常系_PATCHで更新済みLogを返す` | 正常系 | 部分更新リクエストが正しく送信される |
| `test_updateLog_空ボディ_変更なしでLogを返す` | 境界値 | 空オブジェクト `{}` を送信しても 200 で返る |
| `test_deleteLog_正常系_204でvoidを返す` | 正常系 | DELETE リクエストが成功し void を返す |
| `test_deleteLog_存在しないID_Errorをスローする` | 異常系 | 404 レスポンス時に `Error` をスロー |
| `test_getAnalyticsSummary_正常系_summaryとhistogramを返す` | 正常系 | `summary` / `histogram` 両フィールドを含む |
| `test_getAnalyticsTimeseries_正常系_intervalとdataを返す` | 正常系 | `interval` / `data` 両フィールドを含む |
| `test_exportLogsCSV_正しいURLを生成する` | 正常系 | フィルタパラメータを含む CSV エクスポート URL が正しい |

**合格基準:** 全 14 件以上が PASS すること

### Playwright

- 設定ファイル（`playwright.config.ts`）の存在確認のみ（実テストは Sprint 3 以降）
- `npx playwright --version` が正常に実行できること

---

## 警告（抜け漏れ・注意点）

### W-01: `next-themes` はレイアウトと密結合になりやすい（実装注意）
- **重要度:** 低
- `ThemeProvider` は `app/layout.tsx` の Server Component と `"use client"` の境界に注意が必要
- `ThemeProvider` を使う際は `suppressHydrationWarning` を `<html>` タグに付与すること

### W-02: shadcn/ui の `Sidebar` コンポーネントは CLI でインストールが必要（セットアップ注意）
- **重要度:** 中
- `npx shadcn@latest add sidebar` でインストールするが、`components.json` が未存在だと失敗する
- `npx shadcn@latest init` を先に実行する必要がある

### W-03: `NEXT_PUBLIC_API_URL` の末尾スラッシュ統一（実装注意）
- **重要度:** 低
- `NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1`（末尾スラッシュなし）を前提として `api.ts` を実装すること
- URL 結合時の二重スラッシュ防止のため、各関数内で `/` の扱いを統一すること

### W-04: `docker-compose.yml` への frontend サービス追加時、バックエンドの CORS 設定との整合が必要
- **重要度:** 中
- バックエンドの `ALLOWED_ORIGINS` に `http://localhost:3000` が含まれていること（`.env.example` で確認）
- `docker-compose.yml` でフロントエンドから `http://backend:8000` に通信する場合は、コンテナ内 URL と `NEXT_PUBLIC_API_URL`（ブラウザ側）を区別すること
- ブラウザからは `http://localhost:8000/api/v1`、サーバーサイド（SSR）からは `http://backend:8000/api/v1` が必要な場合がある
- Sprint 2 では `NEXT_PUBLIC_API_URL` のみ使用（Client Components のみ）のため、`http://localhost:8000/api/v1` で統一して問題ない

### W-05: W-03 引き継ぎ（バックエンド見直しより）— Playwright で `updated_at` の変化を検証
- **重要度:** 中
- `sprint_backend_review_contract.md` の引き継ぎ事項より: PATCH 後に `updated_at` が実際に変化することを Playwright で検証すること
- Sprint 5（ログ詳細・編集）の Sprint Contract に受け入れ基準として含めること
- Sprint 2 では対応不要だが、見落とし防止のため記載

### W-06: Playwright は `devDependencies` に追加し、CI/CD での実行を考慮すること
- **重要度:** 低
- `@playwright/test` を `devDependencies` に追加し、`npx playwright install` でブラウザをインストールすること
- `frontend/Dockerfile` では Playwright ブラウザのインストールは不要（E2E は別途実行）

---

## 完了記録（Generator が記入）
- 完了日: 2026-04-12
- テスト結果: Vitest 20件 PASS / Playwright 設定確認 OK（v1.59.1）
- 特記事項:
  - Vitest 20件（Sprint Contract の必須14件を超えて実装: getLogs×5, getLog×2, createLog×2, updateLog×2, deleteLog×2, getAnalyticsSummary×2, getAnalyticsTimeseries×1, exportLogsCSV×2, buildSearchParams×2）
  - W-01 対応: `suppressHydrationWarning` を `<html>` タグに付与、ThemeProvider を Client Component として分離
  - W-02 対応: `npx shadcn@latest init` 後に `npx shadcn@latest add sidebar ...` を実行
  - W-03 対応: BASE_URL の末尾スラッシュを除去し、二重スラッシュを防止
  - W-04 確認: バックエンド `.env.example` に `ALLOWED_ORIGINS=http://localhost:3000` 設定済み
  - W-06 対応: `@playwright/test` を `devDependencies` に追加
  - FastAPI 422 エラーは `detail` が配列形式のため、`handleResponse` で配列対応を追加
  - next-themes の型定義 (`ComponentProps<typeof NextThemesProvider>`) を使用してラッパーを安全に実装

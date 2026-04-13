# Sprint Contract: ダッシュボード（Sprint 3）

## 参照元

- `docs/design/frontend_plan.md`（Sprint 3）
- `docs/design/frontend_layout.md`
- `docs/requirements/requirements_specification.md`（Section 5: API 設計 — 分析エンドポイント）
- `docs/issues/assignment_ja.md`

---

## ステータス

- [x] 未着手 → [x] 実装中 → [x] テスト設計中 → [x] 完了

---

## 受け入れ基準

### コンポーネント

- [x] **C-01**: `SummaryCard.tsx` — severity（INFO / WARNING / ERROR / CRITICAL）ごとに件数・アイコン・背景色を表示する
- [x] **C-02**: `SummaryCard.tsx` — severity に対応した背景色（INFO: `bg-blue-900/50`、WARNING: `bg-yellow-900/50`、ERROR: `bg-orange-900/50`、CRITICAL: `bg-red-950/50`）とアイコン（Info / AlertTriangle / AlertCircle / Target）が正しく出力される
- [x] **C-03**: `TimeseriesChart.tsx` — Recharts `LineChart` で INFO / WARNING / ERROR / CRITICAL の4線を描画する
- [x] **C-04**: `TimeseriesChart.tsx` — Hour / Day / Week の interval 切替タブが表示され、選択状態に応じて `interval` パラメータが変わる
- [x] **C-05**: `Histogram.tsx` — Recharts `BarChart`（積み上げ）で source ごとの severity 分布を描画する
- [x] **C-06**: `Histogram.tsx` — 色分けが INFO(青) / WARNING(黄) / ERROR(橙) / CRITICAL(赤) で統一されている
- [x] **C-07**: `FilterPanel.tsx` — DatePicker（開始・終了）、Severity multi-select、Source テキスト入力、Apply ボタンを含む
- [x] **C-08**: `FilterPanel.tsx` — Severity のデフォルト値は "All Severities"（全件対象）である
- [x] **C-09**: `FilterPanel.tsx` — Source は完全一致フィルタであることがプレースホルダー "Enter source (exact match)..." で明示されている
- [x] **C-10**: `app/page.tsx` — サマリーカード×4・TimeseriesChart・Histogram・FilterPanel を統合し、ダッシュボードとして一画面に表示する

### API 連携

- [x] **A-01**: `useAnalytics` フック（または `useAnalyticsSummary` / `useAnalyticsTimeseries`）が `GET /logs/analytics/summary` を呼び出し、`summary`・`histogram` を取得できる
- [x] **A-02**: `GET /logs/analytics/summary` の共通クエリパラメータ（`start`、`end`、`severity`（複数指定可）、`source`）が FilterPanel の状態と連動している
- [x] **A-03**: `useAnalytics` フックが `GET /logs/analytics/timeseries` を呼び出し、`interval`・`data` を取得できる
- [x] **A-04**: `GET /logs/analytics/timeseries` の `interval` パラメータが TimeseriesChart の切替タブと連動している（`hour` / `day` / `week`）
- [x] **A-05**: FilterPanel の Apply ボタン押下時に両 API が再フェッチされる（TanStack Query の `queryKey` にフィルタ状態を含む）
- [x] **A-06**: API ローディング中にスケルトン or スピナーが表示される
- [x] **A-07**: API エラー時にエラーメッセージが UI 上に表示される（ユーザーがエラーを認識できる）

### Vitest

- [x] **V-01**: `SummaryCard` — 正常系: 各 severity の件数・アイコン・背景色クラスが正しくレンダリングされる（4パターン）
- [x] **V-02**: `SummaryCard` — 境界値: count=0 のとき "0" が表示される
- [x] **V-03**: `TimeseriesChart` — 正常系: データが渡されたとき `<LineChart>` が描画される（Recharts のモック可）
- [x] **V-04**: `TimeseriesChart` — 正常系: Hour / Day / Week タブ切替で `onIntervalChange` コールバックが呼ばれる
- [x] **V-05**: `TimeseriesChart` — 境界値: `data=[]`（空配列）のとき空グラフ or "No data" メッセージが表示され、クラッシュしない
- [x] **V-06**: `Histogram` — 正常系: `histogram` データが渡されたとき `<BarChart>` が描画される
- [x] **V-07**: `Histogram` — 境界値: `histogram=[]` のとき空グラフ or "No data" メッセージが表示され、クラッシュしない
- [x] **V-08**: `FilterPanel` — 正常系: Apply ボタン押下で `onApply` コールバックが現在の入力値を引数として呼ばれる
- [x] **V-09**: `FilterPanel` — 正常系: Severity を選択して Apply すると選択値が `onApply` に渡される
- [x] **V-10**: `FilterPanel` — 境界値: 全フィールド空状態で Apply したとき `onApply` がデフォルト値（start/end=undefined、severities=[]、source=""）で呼ばれる
- [x] **V-11**: `useAnalytics` フック — 正常系: モックした API が summary レスポンスを返すとき `summary` が正しく取得される（`renderHook` + msw or vi.mock）
- [x] **V-12**: `useAnalytics` フック — 正常系: モックした API が timeseries レスポンスを返すとき `data` が正しく取得される
- [x] **V-13**: `useAnalytics` フック — 異常系: API が 500 を返すとき `isError=true` になる
- [x] **V-14**: `useAnalytics` フック — 境界値: フィルタ変更時に `queryKey` が変わり再フェッチが発生する（`queryKey` の構造をアサート）

### Playwright E2E

- [x] **E-01**: ダッシュボード（`/`）にアクセスしたとき、4つのサマリーカード（INFO / WARNING / ERROR / CRITICAL）が表示される
- [x] **E-02**: 各サマリーカードの件数が 0 以上の数値として表示される
- [x] **E-03**: TimeseriesChart（Line Chart）エリアが表示される
- [x] **E-04**: Histogram（Bar Chart）エリアが表示される
- [x] **E-05**: interval 切替タブ（Hour / Day / Week）が表示され、クリックでアクティブタブが切り替わる
- [x] **E-06**: FilterPanel の DatePicker・Severity・Source・Apply ボタンが表示される
- [x] **E-07**: 日付範囲を入力して Apply を押すと、サマリーカードとチャートが再描画される（ローディング → 完了の状態遷移）
- [x] **E-08**: Severity フィルタで ERROR のみ選択して Apply すると、サマリーカードの ERROR 以外が 0 になる（またはフィルタが API に渡されている）
- [x] **E-09**: サイドバーの "Dashboard" リンクが `/` にアクセスしたときアクティブ表示になる
- [x] **E-10**: サイドバーの "Log List" リンクをクリックすると `/logs` へ遷移する

---

## テスト合格基準

- **Vitest**: 14 件以上 PASS（V-01〜V-14）
- **Playwright**: 10 件以上 PASS（E-01〜E-10）

---

## 警告

- **W-01**: `frontend_plan.md` の成果物に `Histogram.tsx` が含まれているが、`requirements_specification.md` のディレクトリ構成（Section 3）には記載がない。ヒストグラムはボーナス機能として位置付けられているが、Sprint 3 では実装対象とする。Generator は `frontend/src/components/dashboard/Histogram.tsx` として実装すること。
- **W-02**: `GET /logs/analytics/summary` と `GET /logs/analytics/timeseries` の完全 URL は `/api/v1/logs/analytics/summary`・`/api/v1/logs/analytics/timeseries` である（ベースパス `/api/v1` を忘れないこと）。
- **W-03**: `source` フィルタはダッシュボード（分析系）では**完全一致**、ログ一覧では**部分一致**であることに注意。FilterPanel の Source 入力はプレースホルダーで "exact match" を明示すること（`requirements_specification.md` Section 5 参照）。
- **W-04**: `GET /logs/analytics/summary` の `severity` クエリパラメータは複数指定形式（`?severity=ERROR&severity=CRITICAL`）を使用する。URLSearchParams で配列を展開する際は `append` を使うこと（`api.ts` の実装方針に従う）。
- **W-05**: `requirements_specification.md` のディレクトリ構成（Section 3）では `useAnalytics.ts` の記載がなく、`useLogs.ts` のみ記載されている。Sprint 3 では `frontend/src/hooks/useAnalytics.ts` を新規作成する。Sprint 4 の `useLogs.ts` と役割が混同しないよう注意すること。
- **W-06**: 課題要件（`assignment_ja.md`）は「チャート: 時系列のログ件数トレンドを表示する」を必須要件として定義している。TimeseriesChart は必須実装であり、Histogram はボーナス扱い。Playwright E2E でも TimeseriesChart の表示確認（E-03）を必ず含めること。
- **W-07**: Recharts コンポーネントは JSDOM 環境（Vitest）でレンダリングが失敗するケースがある。`vi.mock('recharts', ...)` またはカスタムラッパーでモック化し、Vitest テストが安定して通るようにすること。

---

## 完了記録（Generator が記入）

- 完了日: 2026-04-12
- テスト結果: Vitest 47件 PASS / Playwright 10件 PASS
- 特記事項:
  - Vitest: `tests/e2e/**` を exclude に追加（Playwright テストが誤って Vitest に取り込まれる問題を修正）
  - W-07 対応: `vi.mock('recharts', ...)` で Recharts コンポーネントをモック化し、JSDOM 環境での安定動作を実現
  - E-09 対応: `data-active` 属性は存在せず、AppSidebar の isActive 実装は `bg-accent` クラスを付与する方式であることを実際の DOM から確認し、テストを修正
  - E-07 対応: `waitForResponse` を `click` と同時に `Promise.all` で待機するよう修正し、タイムアウトを解消
  - TanStack Query の `QueryClientProvider` を `layout.tsx` に `QueryProvider` ラッパー経由で追加
  - `/logs` ページのスタブ（Sprint 4 用）を作成（E-10 のナビゲーションテストに必要）
  - 受け入れ基準 C-01〜C-10、A-01〜A-07、V-01〜V-14、E-01〜E-10 すべて PASS

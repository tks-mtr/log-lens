# Sprint Contract: ログ一覧（Sprint 4）

## 参照元

- `docs/design/frontend_plan.md`（Sprint 4）
- `docs/design/frontend_layout.md`（ログ一覧レイアウト設計）
- `docs/requirements/requirements_specification.md`（Section 5: API 設計 — GET /logs・GET /logs/export/csv）
- `docs/issues/assignment_ja.md`

---

## ステータス

- [x] 未着手 → [x] 実装中 → [x] テスト設計中 → [x] 完了

---

## 受け入れ基準

### コンポーネント

- [x] **C-01**: `LogTable.tsx` — id / timestamp / severity / source / message の5カラムを持つテーブルを描画する
- [x] **C-02**: `LogTable.tsx` — severity カラムに Badge コンポーネントを使用し、INFO(青) / WARNING(黄) / ERROR(橙) / CRITICAL(赤) の色分けが正しく表示される
- [x] **C-03**: `LogTable.tsx` — timestamp / severity / source の列ヘッダ（↕）をクリックするとソート方向（asc / desc）が切り替わり、対応する `sort_by` と `order` パラメータが変化する
- [x] **C-04**: `LogTable.tsx` — 行クリックで `/logs/[id]` へ遷移する（Next.js `router.push` またはリンク）
- [x] **C-05**: `LogTable.tsx` — 各行右端の [Edit] ボタンをクリックしても `/logs/[id]` へ遷移する
- [x] **C-06**: `LogFilterPanel.tsx` — DatePicker（開始・終了）・Severity multi-select・Source テキスト入力（部分一致）・CSV ボタン・+ New Log ボタンを含む
- [x] **C-07**: `LogFilterPanel.tsx` — Source 入力のプレースホルダーが部分一致であることを示す（例: "Search by source..."）（※ダッシュボードの完全一致と区別すること）
- [x] **C-08**: `LogFilterPanel.tsx` — CSV ボタン押下で `GET /logs/export/csv` を現在のフィルタ条件付きで呼び出し、ファイルをダウンロードする
- [x] **C-09**: `LogFilterPanel.tsx` — + New Log ボタン押下で `/logs/new` へ遷移する
- [x] **C-10**: `Pagination.tsx` — 現在のページ番号・総ページ数（`pages`）を表示し、Prev / Next ボタンでページ送りできる
- [x] **C-11**: `Pagination.tsx` — 1ページあたりの件数を Select で選択できる（デフォルト: 50、最大: 200）
- [x] **C-12**: `Pagination.tsx` — 先頭ページで Prev が無効化され、末尾ページで Next が無効化される
- [x] **C-13**: `app/logs/page.tsx` — LogTable / LogFilterPanel / Pagination を統合し、ログ一覧として一画面に表示する
- [x] **C-14**: `app/logs/page.tsx` — ページタイトル "Log List" が表示される

### API 連携

- [x] **A-01**: `useLogs` フックが `GET /api/v1/logs` を呼び出し、`data`（ログ配列）・`total`・`page`・`limit`・`pages` を取得できる
- [x] **A-02**: `GET /logs` の全クエリパラメータ（`start`・`end`・`severity`（複数指定可）・`source`・`sort_by`・`order`・`page`・`limit`）がフィルタ・ソート・ページネーションの状態と連動している
- [x] **A-03**: `severity` の複数指定は `?severity=ERROR&severity=CRITICAL` 形式（URLSearchParams の `append`）で送信される
- [x] **A-04**: フィルタ条件変更時に `page` が 1 にリセットされる
- [x] **A-05**: TanStack Query の `queryKey` にフィルタ・ソート・ページネーションの全状態を含め、状態変化時に再フェッチが発生する
- [x] **A-06**: API ローディング中にスケルトン or スピナーが表示される
- [x] **A-07**: API エラー時にエラーメッセージが UI 上に表示される
- [x] **A-08**: `GET /logs/export/csv` を呼び出す際、現在のフィルタ条件（`start`・`end`・`severity`・`source`）が同一形式でクエリパラメータに含まれる

### Vitest

- [x] **V-01**: `LogTable` — 正常系: ログデータ配列が渡されたとき、全行が id / timestamp / severity / source を含む形でレンダリングされる
- [x] **V-02**: `LogTable` — 正常系: severity Badge の色クラスが INFO / WARNING / ERROR / CRITICAL で正しく異なる（4パターン）
- [x] **V-03**: `LogTable` — 正常系: timestamp 列ヘッダをクリックすると `onSortChange` コールバックが `{ sort_by: 'timestamp', order: 'asc' }` で呼ばれる
- [x] **V-04**: `LogTable` — 正常系: 同じ列ヘッダを再クリックすると order が `asc` → `desc` に反転する
- [x] **V-05**: `LogTable` — 正常系: 行クリックで `onRowClick` コールバックがログの `id` を引数として呼ばれる
- [x] **V-06**: `LogTable` — 境界値: `logs=[]`（空配列）のとき空テーブル or "No data" メッセージが表示され、クラッシュしない
- [x] **V-07**: `LogFilterPanel` — 正常系: フィルタ変更後に Apply 押下で `onApply` コールバックが現在の入力値を引数として呼ばれる
- [x] **V-08**: `LogFilterPanel` — 正常系: + New Log ボタン押下で `onNewLog` コールバックが呼ばれる（または `/logs/new` へ遷移する）
- [x] **V-09**: `LogFilterPanel` — 境界値: 全フィールド空状態で Apply したとき `onApply` がデフォルト値で呼ばれる
- [x] **V-10**: `Pagination` — 正常系: `page=1`, `pages=5` のとき、Prev が無効・Next が有効・"Page 1 / 5" が表示される
- [x] **V-11**: `Pagination` — 正常系: `page=5`, `pages=5` のとき、Next が無効・Prev が有効である
- [x] **V-12**: `Pagination` — 正常系: Next ボタン押下で `onPageChange(2)` コールバックが呼ばれる
- [x] **V-13**: `Pagination` — 境界値: `pages=1` のとき Prev・Next の両方が無効化される
- [x] **V-14**: `Pagination` — 正常系: limit Select で値を変更すると `onLimitChange` コールバックが新しい値で呼ばれる
- [x] **V-15**: `useLogs` フック — 正常系: モックした API がリストレスポンスを返すとき `data` / `total` / `pages` が正しく取得される（`renderHook` + vi.mock）
- [x] **V-16**: `useLogs` フック — 正常系: フィルタ変更時に `queryKey` が変わり再フェッチが発生する（`queryKey` の構造をアサート）
- [x] **V-17**: `useLogs` フック — 異常系: API が 500 を返すとき `isError=true` になる
- [x] **V-18**: `useLogs` フック — 境界値: `limit=1`（最小）で呼び出したとき、`limit=1` がクエリパラメータに含まれる

### Playwright E2E

- [x] **E-01**: `/logs` にアクセスしたとき "Log List" タイトルとテーブルが表示される
- [x] **E-02**: テーブルに少なくとも1行のログが表示される（DBにデータが存在する前提）
- [x] **E-03**: severity Badge が INFO / WARNING / ERROR / CRITICAL のいずれかで表示される
- [x] **E-04**: Severity フィルタで ERROR のみ選択して Apply すると、テーブルの全行の severity が ERROR になる（またはフィルタが API に渡されている）
- [x] **E-05**: Source 入力に値を入力して Apply すると、テーブルの件数が変化する（または API に source パラメータが渡される）
- [x] **E-06**: timestamp 列ヘッダをクリックするとソートが切り替わる（行の並び順が変化する、または URL パラメータが変わる）
- [x] **E-07**: Prev / Next ボタンが表示され、Next をクリックするとページが2ページ目に進む（件数が十分にある前提）
- [x] **E-08**: limit Select で "10" を選択すると、テーブルの表示件数が最大10件になる
- [x] **E-09**: CSV ボタンをクリックすると `GET /logs/export/csv` へのリクエストが発生する（または download が始まる）
- [x] **E-10**: + New Log ボタンをクリックすると `/logs/new` へ遷移する
- [x] **E-11**: テーブルの行をクリックすると `/logs/[id]` へ遷移する
- [x] **E-12**: サイドバーの "Log List" リンクが `/logs` にアクセスしたときアクティブ表示になる

---

## テスト合格基準

- **Vitest**: 18 件以上 PASS（V-01〜V-18）
- **Playwright**: 12 件以上 PASS（E-01〜E-12）

---

## 警告

- **W-01**: `source` フィルタはログ一覧（`GET /logs`）では**部分一致**、ダッシュボード（分析系）では**完全一致**である。`LogFilterPanel` の Source 入力プレースホルダーで部分一致であることを明示すること（`requirements_specification.md` Section 5 参照）。Sprint 3 の W-03 からの引き継ぎ事項。
- **W-02**: `GET /logs` の `severity` クエリパラメータは複数指定形式（`?severity=ERROR&severity=CRITICAL`）を使用する。`URLSearchParams` で配列を展開する際は `append` を使うこと（Sprint 3 の W-04 と同様）。
- **W-03**: `GET /logs/export/csv` の完全 URL は `/api/v1/logs/export/csv` である（ベースパス `/api/v1` を忘れないこと）。CSVダウンロードは `window.open` または `<a>` タグの `download` 属性を使って実装する。fetch を使う場合は Blob URL に変換してダウンロードトリガーを発火させること。
- **W-04**: `requirements_specification.md` のディレクトリ構成（Section 3）では `components/logs/` に `LogList.tsx` と記載されているが、`frontend_plan.md` の成果物では `LogTable.tsx` / `LogFilterPanel.tsx` / `Pagination.tsx` に分割されている。`frontend_plan.md` の構成を優先して実装すること。
- **W-05**: フィルタ条件変更時は `page` を 1 にリセットすること。フィルタ変更後に2ページ目以降が残ると、対象データが存在しない場合に空テーブルが表示されるバグになる。
- **W-06**: `GET /logs` の `limit` の最大値は 200（`requirements_specification.md` Section 5 参照）。Select の選択肢は最大 200 を超えないよう設計すること。
- **W-07**: `app/logs/page.tsx` は Sprint 3 完了時点でスタブ（"coming in Sprint 4" の文言のみ）として存在する。Sprint 4 では本実装に置き換えること。
- **W-08**: 課題要件（`assignment_ja.md`）の「検索・フィルタ・ソート・ページネーション」はすべて必須要件である。CSVエクスポートはボーナス機能だが、`frontend_plan.md` の Sprint 4 成果物に含まれているため実装対象とする。

---

## 完了記録（Generator が記入）

- 完了日: 2026-04-12
- テスト結果: Vitest 71件 PASS（うちログ一覧新規 18件以上） / Playwright 12件 PASS（E-01〜E-12 全件）
- 特記事項:
  - W-01: `LogFilterPanel` の Source プレースホルダーを "Search by source..." に設定し、部分一致を明示
  - W-03: CSV ダウンロードは `<a>` タグ生成方式（`document.createElement('a')`）で実装
  - W-05: `handleApplyFilters` / `handleSortChange` / `handleLimitChange` すべてで `setPage(1)` を呼びページリセット
  - W-06: Pagination の limit Select 最大値は 200（選択肢: 10/25/50/100/200）
  - W-07: `app/logs/page.tsx` のスタブを本実装（LogTable + LogFilterPanel + Pagination 統合）に置き換え済み
  - E-03: Playwright strict mode エラー（`or()` チェーン）を修正し、各バッジを個別にアサート

# Sprint Contract: バグ修正・環境整備（Sprint Fix）

## 参照元

- `docs/design/frontend_plan.md`（Sprint Fix）
- `docs/local/memo.md`（画面操作確認メモ）

---

## ステータス

- [ ] 未着手 / [ ] 実装中 / [ ] テスト設計中 / [x] 完了

---

## 受け入れ基準

### 環境・ビルド

- [x] **E-01**: `frontend/Dockerfile` — `npm ci` → `npm install` に変更し、Docker ビルドが Linux 環境でエラーなく完了する
- [x] **E-02**: `docker-compose.yml` — `seed` サービスを追加し、`docker compose up` 初回起動時に101件の固定テストデータが自動投入される
- [x] **E-03**: `seed` サービスは2回目以降の起動でデータが既存の場合スキップする（べき等）
- [x] **E-04**: `backend/fixtures/seed_data.json` — 固定シードデータ201件（期間: 過去30日間・severity分布: INFO 90 / WARNING 60 / ERROR 35 / CRITICAL 16。INFO均一・WARNING中盤増加・ERROR/CRITICALはday18〜19インシデント集中）

### コード修正

- [x] **C-01**: `LogForm.tsx` — Zod v4 対応: `z.enum` の第2引数 `errorMap` → `error` に変更・配列に `as const` 追加。`npm run build` が TypeScript エラーなしで完了する
- [x] **C-02**: `AppSidebar.tsx` — `SidebarMenuButton` の `asChild` prop を削除し `Link > SidebarMenuButton` 構造に変更。ブラウザコンソールに `asChild` 関連エラーが出力されない
- [x] **C-03**: `AppSidebar.tsx` / `layout.tsx` / `frontend_layout.md` — タイトルを「Log Monitor」→「LogLens」/「Log Lens」に統一

### バックエンド追加

- [x] **B-01**: `GET /api/v1/logs/sources` — DB に存在する source 名の一覧を重複なし・昇順で返すエンドポイントを追加する（Router / Service / Repository / テスト）
- [x] **B-02**: `lib/api.ts` — `getSources(): Promise<string[]>` を追加する

### UI/UX 修正

- [x] **U-01**: `ThemeToggle.tsx` — Light / Dark 2ボタン並列形式に変更。選択中ボタンを `bg-primary text-primary-foreground` でハイライト表示する
- [x] **U-02**: `ThemeToggle.tsx` — `mounted` + `useEffect` ガードを追加し SSR/CSR 間の hydration mismatch を解消する
- [x] **U-03**: `ThemeToggle.tsx` — `w-fit overflow-hidden` でコンテナ右側の余白を解消する
- [x] **U-04**: ログ一覧フィルター — Severity を選択したとき「All Severities」のプレースホルダーが消えてレイアウトが崩れる問題を修正する
- [x] **U-05**: ログ一覧フィルター — Source の入力欄をテキストボックスからコンボボックスに変更する（`GET /api/v1/logs/sources` から候補を取得・自由入力による部分一致検索も維持する）
- [x] **U-06**: 時系列チャート（Log Count Over Time）— ダークモードでホバー時に tooltip の日時小見出し（ラベル）が背景色と同化して見えなくなる問題を修正する（Recharts `<Tooltip>` のスタイル調整）
- [x] **U-07**: 時系列チャート（Log Count Over Time）— Y 軸の目盛りが小数（0.5, 1.5 等）で表示されている問題を修正する。ログ件数は整数のみのため `<YAxis allowDecimals={false}>` を設定する
- [x] **U-08**: 時系列チャート・Severity Distribution by Source — レスポンシブで横幅が狭くなったとき、凡例（legend）が上段: CRITICAL / ERROR、下段: WARNING / INFO の2行2列に折り返すよう調整する（現状は WARNING のみ下段に落ちて不均等）
- [x] **U-09**: Severity Distribution by Source — X 軸ラベルが重なって間引かれる問題を修正する。カスタム tick コンポーネントで奇数インデックスのラベルを下段にずらす2段表示を実装する（`interval={0}` + カスタム tick）
- [x] **U-10**: ダッシュボード — Hour / Day / Week タブ切替時に severity サマリーカードと Severity Distribution by Source が不要に再フェッチされてチラつく問題を修正する。interval の変更は timeseries クエリにのみ影響し、summary クエリのキャッシュは再利用されるべき（`useAnalytics` のクエリキー設計を見直す）
- [x] **U-11**: ログ詳細画面 — message が長い場合にコンテナ枠を超えてはみ出す問題を修正する。`break-words` + `min-w-0` で CSS Grid 内での枠内折り返し表示にする
- [x] **U-12**: Dashboard FilterPanel — Source の入力欄をコンボボックスに変更する（`useSources` フックで候補取得・自由入力も維持）
- [x] **U-13**: LogForm（新規作成・編集フォーム）— Source の入力欄をセレクトボックスに変更する（`useSources` フックで候補取得。編集時に既存 source が選択肢にない場合は先頭に追加して表示）

---

## テスト合格基準

- **Vitest**: 既存テスト全件 PASS（修正によるデグレなし）
- **Playwright**: 既存テスト全件 PASS（修正によるデグレなし）

---

## 警告

- **W-01**: `npm ci` → `npm install` の変更は Docker ビルド内のみの影響。`@rolldown/binding-wasm32-wasi` 等の Linux 向けオプション依存関係が macOS 生成の lock file に含まれないため回避策として採用。
- **W-02**: `z.enum` の `errorMap` は Zod v3 の API。v4 では `error` プロパティを使用する。同様のパターンが他ファイルに存在する場合は同様に修正すること。
- **W-03**: `ThemeToggle` の `asChild` 廃止は shadcn/ui が内部実装を `@base-ui/react` に切り替えたことに起因。他コンポーネントで `asChild` を使用している箇所も同様の問題が発生する可能性がある。

---

## 完了記録（完了時に記入）

- 完了日: 2026-04-14
- テスト結果: Vitest 84件 PASS / Playwright 18件 PASS
- 特記事項: U-04（Hour 表示改善）はフォーマット変更が視認性低下を招いたため見送り・削除。シードデータを 201件・severity 偏り付きに拡張。
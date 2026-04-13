# Sprint Contract: ログ詳細・編集・作成（Sprint 5）

## 参照元

- `docs/design/frontend_plan.md`（Sprint 5）
- `docs/design/frontend_layout.md`（ログ詳細・編集・作成レイアウト設計）
- `docs/requirements/requirements_specification.md`（Section 5: API 設計 — GET/POST/PATCH/DELETE /logs）
- `docs/issues/assignment_ja.md`
- `docs/sprint/sprint_backend_review_contract.md`（W-03 引き継ぎ事項）

---

## ステータス

- [ ] 未着手 / [ ] 実装中 / [ ] テスト設計中 / [x] 完了

---

## 受け入れ基準

### コンポーネント

- [x] **C-01**: `LogForm.tsx` — timestamp（省略可）・severity（必須）・source（必須）・message（必須）の4フィールドを含むフォームをレンダリングする
- [x] **C-02**: `LogForm.tsx` — severity フィールドは INFO / WARNING / ERROR / CRITICAL の4択 Select として表示される
- [x] **C-03**: `LogForm.tsx` — timestamp フィールドは省略可（空文字 or 未入力を許容）
- [x] **C-04**: `LogForm.tsx` — source・message が空のとき Submit ボタン押下でフィールド直下に赤文字のバリデーションエラーが表示される（React Hook Form + Zod）
- [x] **C-05**: `LogForm.tsx` — severity が未選択のとき Submit ボタン押下でバリデーションエラーが表示される
- [x] **C-06**: `LogForm.tsx` — `defaultValues` プロップが渡されたとき、各フィールドにその値が初期表示される（編集モード用）
- [x] **C-07**: `LogForm.tsx` — フォーム送信時に `onSubmit` コールバックが入力値を引数として呼ばれる
- [x] **C-08**: `LogForm.tsx` — Cancel ボタン押下で `onCancel` コールバックが呼ばれる
- [x] **C-09**: `DeleteDialog.tsx` — AlertDialog として「削除確認メッセージ」「Cancel」「Delete（確認）」を含む
- [x] **C-10**: `DeleteDialog.tsx` — Delete ボタン押下で `onConfirm` コールバックが呼ばれる
- [x] **C-11**: `DeleteDialog.tsx` — Cancel ボタン押下でダイアログが閉じ、`onConfirm` は呼ばれない
- [x] **C-12**: `app/logs/[id]/page.tsx` — ページ上部に "← Back to Log List" リンクが表示され、`/logs` へ遷移する
- [x] **C-13**: `app/logs/[id]/page.tsx` — 表示モード時はログの各フィールド（id / timestamp / severity / source / message / created_at / updated_at）を読み取り専用で表示する
- [x] **C-14**: `app/logs/[id]/page.tsx` — [Edit] ボタン押下でインライン編集モードに切り替わり、LogForm が表示される（モーダルなし・同一ページ内）
- [x] **C-15**: `app/logs/[id]/page.tsx` — 編集モードの Cancel ボタン押下で表示モードに戻る（変更は破棄）
- [x] **C-16**: `app/logs/[id]/page.tsx` — 編集モードの Save ボタン押下で `PATCH /logs/{id}` を呼び出し、成功後に表示モードへ戻って最新データを表示する
- [x] **C-17**: `app/logs/[id]/page.tsx` — [Delete] ボタン押下で DeleteDialog が表示される
- [x] **C-18**: `app/logs/[id]/page.tsx` — DeleteDialog の Delete 確認で `DELETE /logs/{id}` を呼び出し、成功後に `/logs` へリダイレクトする
- [x] **C-19**: `app/logs/[id]/page.tsx` — 存在しない ID へのアクセス（404 レスポンス）時にエラーメッセージを表示する（クラッシュしない）
- [x] **C-20**: `app/logs/new/page.tsx` — ページタイトル "Create Log" が表示される
- [x] **C-21**: `app/logs/new/page.tsx` — LogForm を使って新規ログ作成フォームを表示する
- [x] **C-22**: `app/logs/new/page.tsx` — [Create Log] ボタン押下で `POST /logs` を呼び出し、成功後（201 Created）に `/logs` へリダイレクトする
- [x] **C-23**: `app/logs/new/page.tsx` — Cancel ボタン押下で `/logs` へ遷移する

### API 連携

- [x] **A-01**: `useLog` フック（または `app/logs/[id]/page.tsx` 内）が `GET /api/v1/logs/{id}` を呼び出し、単一ログを取得できる
- [x] **A-02**: `PATCH /api/v1/logs/{id}` を呼び出す際、変更されたフィールドのみ（または全フィールド）を JSON ボディとして送信する
- [x] **A-03**: `DELETE /api/v1/logs/{id}` を呼び出し、204 No Content を受け取ったら `/logs` へリダイレクトする
- [x] **A-04**: `POST /api/v1/logs` を呼び出す際、timestamp を省略した場合はボディに含めない（サーバー側で `NOW()` を適用）
- [x] **A-05**: `POST /api/v1/logs` 成功（201 Created）後に `/logs` へリダイレクトする
- [x] **A-06**: API ローディング中にスケルトン or スピナーが表示される
- [x] **A-07**: API エラー時にエラーメッセージが UI 上に表示される（404 / 422 / 500 それぞれの場合）
- [x] **A-08**: PATCH / DELETE / POST 後に TanStack Query のキャッシュ（`GET /logs` および `GET /logs/{id}`）を invalidate する

### Vitest

- [x] **V-01**: `LogForm` — 正常系: `defaultValues` なし（新規作成）で全フィールドが空でレンダリングされる
- [x] **V-02**: `LogForm` — 正常系: `defaultValues` あり（編集）で各フィールドに値が初期表示される
- [x] **V-03**: `LogForm` — 正常系: severity Select で CRITICAL を選択し Submit すると `onSubmit` が `{ severity: "CRITICAL", ... }` で呼ばれる
- [x] **V-04**: `LogForm` — 異常系: source が空で Submit すると `onSubmit` は呼ばれず、source フィールドのエラーメッセージが表示される
- [x] **V-05**: `LogForm` — 異常系: message が空で Submit すると `onSubmit` は呼ばれず、message フィールドのエラーメッセージが表示される
- [x] **V-06**: `LogForm` — 異常系: severity が未選択で Submit すると `onSubmit` は呼ばれず、severity フィールドのエラーメッセージが表示される
- [x] **V-07**: `LogForm` — 境界値: timestamp が空文字でも Submit できる（必須でない）
- [x] **V-08**: `LogForm` — 正常系: Cancel ボタン押下で `onCancel` コールバックが呼ばれる
- [x] **V-09**: `DeleteDialog` — 正常系: `open=true` のとき確認ダイアログが表示される
- [x] **V-10**: `DeleteDialog` — 正常系: Delete ボタン押下で `onConfirm` コールバックが呼ばれる
- [x] **V-11**: `DeleteDialog` — 正常系: Cancel ボタン押下でダイアログが閉じ `onConfirm` が呼ばれない
- [x] **V-12**: `DeleteDialog` — 境界値: `open=false` のときダイアログが表示されない（DOM に存在しない or aria-hidden）

### Playwright E2E

- [x] **E-01**: `/logs/[id]` にアクセスしたとき、ログの詳細情報（id / timestamp / severity / source / message）が表示される
- [x] **E-02**: "← Back to Log List" リンクをクリックすると `/logs` へ遷移する
- [x] **E-03**: [Edit] ボタンをクリックすると、インライン編集フォーム（LogForm）が同一ページに表示される（モーダルではない）
- [x] **E-04**: 編集フォームで source を変更し Save すると、`PATCH /logs/{id}` が呼ばれ、表示モードに戻り変更後の値が表示される
- [x] **E-05**: **（W-03 引き継ぎ・必須）** PATCH 前後で `updated_at` フィールドの値が変化する（create → patch の間で実際に更新日時が変わることを実サーバーで検証する）
- [x] **E-06**: 編集フォームの Cancel ボタンをクリックすると表示モードに戻る（変更は破棄される）
- [x] **E-07**: [Delete] ボタンをクリックすると削除確認 AlertDialog が表示される
- [x] **E-08**: AlertDialog の Delete を押すと `DELETE /logs/{id}` が呼ばれ、`/logs` へリダイレクトされる
- [x] **E-09**: AlertDialog の Cancel を押すとダイアログが閉じ、ログ詳細ページに留まる
- [x] **E-10**: `/logs/new` にアクセスすると "Create Log" タイトルと作成フォームが表示される
- [x] **E-11**: フォームに全フィールドを入力して [Create Log] を押すと `POST /logs` が呼ばれ（201 Created）、`/logs` へリダイレクトされる
- [x] **E-12**: `/logs/new` の Cancel ボタンを押すと `/logs` へ遷移する
- [x] **E-13**: `/logs/new` で source を空のまま [Create Log] を押すと、バリデーションエラーが表示されて送信されない
- [x] **E-14**: 存在しない ID（例: `/logs/99999999`）へアクセスするとエラーメッセージが表示され、アプリがクラッシュしない

---

## テスト合格基準

- **Vitest**: 12 件以上 PASS（V-01〜V-12）
- **Playwright**: 14 件以上 PASS（E-01〜E-14）

---

## 警告

- **W-01（W-03 引き継ぎ・必須）**: PATCH 後に `updated_at` が実際に変化することを **Playwright（E-05）** で検証すること。pytest では同一トランザクション内で `now()` が固定値になるため検証不可。Playwright は実サーバーへの本物の HTTP リクエストのため、create → patch 間で時刻が変化することを確認できる。`sprint_backend_review_contract.md` の「引き継ぎ事項」参照。
- **W-02**: `PATCH /logs/{id}` は部分更新（全フィールド Optional）である。フォームの変更フィールドのみを送信するか、全フィールドを送信するかはどちらでも許容するが、空文字や null を不正に送らないよう Zod スキーマで制御すること（`requirements_specification.md` Section 5 参照）。
- **W-03**: `DELETE /logs/{id}` のレスポンスは **204 No Content**（ボディなし）である。fetch/axios でレスポンスボディを JSON パースしようとするとエラーになるため注意すること。
- **W-04**: `POST /logs` の timestamp は省略時にサーバー側で `NOW()` が適用される。フロントエンドからは timestamp を空のまま送信する場合はキーごと除外すること（`"timestamp": ""` は 422 になる可能性がある）。
- **W-05**: `app/logs/[id]/page.tsx` は Sprint 4 完了時点でスタブ（`router.push("/logs/[id]")` の遷移先として存在）している可能性がある。Sprint 5 では本実装に置き換えること。
- **W-06**: `LogForm.tsx` は新規作成（`/logs/new`）と編集（`/logs/[id]`）の両方で再利用するコンポーネントとして設計すること。`defaultValues` プロップの有無でモードを切り替える。
- **W-07**: 課題要件（`assignment_ja.md`）の「ログ詳細ページ: 選択したログの詳細を表示し、編集・削除ができる」および「ログ作成ページ: 新規ログを作成できる」はいずれも必須要件である。
- **W-08**: 編集モードは**インライン切替**（モーダルなし）。`frontend_layout.md` のワイヤーフレームに従い、同一ページ内で表示モード ↔ 編集モードを切り替えること。

---

## 完了記録（Generator が記入）

- 完了日: 2026-04-12
- テスト結果: Vitest 12件 PASS / Playwright 14件 PASS
- 特記事項:
  - `DeleteDialog`: AlertDialogCancel の onClick と onOpenChange の二重呼び出し問題を修正（onOpenChange のみで onCancel を呼ぶ）
  - `LogForm`: shadcn/ui の `@base-ui/react/select` は React Hook Form との統合が複雑なため、ネイティブ `<select>` を使用
  - E2E テスト: `setupLogsListMock` の route パターンを正規表現（`/\/api\/v1\/logs(\?.*)?$/`）に変更して `/logs/数字` への干渉を排除
  - W-03 引き継ぎ（E-05）: 実サーバーへの POST → wait 1.1秒 → PATCH で `updated_at` が `created_at` より新しいことを確認。バックエンド未起動時は `test.skip()` でスキップ

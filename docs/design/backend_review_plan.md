# バックエンド見直しプラン

> ブランチ: `feature/backend-review`

---

## 目的

ハーネス設計（Phase 3.5）で定義したエージェント構成を用いて、バックエンド実装（Phase 3）を3つの視点から見直す。
フロントエンド実装（Phase 4）に入る前に、品質・要件整合性・動作確認を完結させる。

---

## 作業ステップ

### Step 1 — Planner：要件整合性確認 [x]

- **エージェント:** Planner
- **読み込むファイル:**
  - `docs/issues/Seniorlead_full_stack_engineer_assignment_(Logs_Dashboard).pdf`
  - `docs/design/backend_plan.md`
- **成果物:** `docs/sprint/sprint_backend_review_contract.md`
- **内容:**
  - 課題PDFの要件・制約・評価基準とバックエンド実装を照合する
  - 抜け漏れ・未実装項目があれば Sprint Contract に警告として記載する
  - Step 2・Step 3 の受け入れ基準を Sprint Contract に定義する

---

### Step 2 — Generator：コード見直し・修正 [x]

- **エージェント:** Generator
- **読み込むファイル:**
  - `docs/sprint/sprint_backend_review_contract.md`
- **成果物:** 修正済みコード・テスト
- **内容:**
  - Sprint Contract の指摘事項をもとにコードを修正する
  - テストカバレッジの不足箇所を補完する（境界値・異常系）
  - 設計上の問題（命名・責務・重複等）をリファクタリングする
  - 完了後に Sprint Contract の完了記録を記入する

---

### Step 3 — Evaluator：テスト実行・最終確認 [x]

- **エージェント:** Evaluator
- **読み込むファイル:**
  - `docs/sprint/sprint_backend_review_contract.md`
  - `.claude/rules/rules_test.md`
- **成果物:** テスト結果レポート（Sprint Contract 内に記録）
- **内容:**
  - 全テスト実行（`docker compose run --rm app python -m pytest`）
  - Sprint Contract の受け入れ基準に照らして合否を判定する
  - Fail の場合は Generator へフィードバックして修正を依頼する
  - Pass の場合は Sprint Contract に完了記録を記入する

---

## 完了条件

- [x] Sprint Contract の全受け入れ基準が満たされている
- [x] 全テストがグリーン（138件 PASS）
- [x] PR直前コミット（CLAUDE.md / README.md / README.ja.md / docs/summary.md）完了

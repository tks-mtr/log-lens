# ハーネス設計ルール

> 参考: [Harness Design for Long-Running Applications](https://www.anthropic.com/engineering/harness-design-long-running-apps)

---

## 概要

フロントエンド実装フェーズ（Phase 4）に向けて、Claude Code の `Agent` ツールを用いたサブエージェント駆動の開発ハーネスを設計する。
Planner / Generator / Evaluator の3エージェントが役割を分担し、スプリント単位で実装・検証を回す。

---

## エージェント構成

| エージェント | 対応する視点 | 役割 |
|------------|------------|------|
| **Planner** | 試験官（前半） | 課題要件との整合確認・Sprint Contract 作成 |
| **Generator** | 実装者 | 機能実装・テスト設計・Handoff 更新 |
| **Evaluator** | 試験官（後半） | テスト設計レビュー・テスト実行・フィードバック作成 |

---

## エージェント詳細

### Planner

**読み込むファイル（必須）:**
- `docs/issues/Seniorlead_full_stack_engineer_assignment_(Logs_Dashboard).pdf`
- `docs/design/frontend_plan.md`（該当スプリントのステップ）

**処理順序:**
1. 課題 PDF を読み、要件・制約・評価基準を把握する
2. `frontend_plan.md` の該当スプリントを読み、作業ステップ・成果物を把握する
3. 整合性を確認し、抜け漏れがあれば Sprint Contract に警告として記載する
4. `docs/sprint/sprint_<name>_contract.md` を作成する

---

### Generator

**読み込むファイル（必須）:**
- `docs/sprint/sprint_<name>_contract.md`
- `docs/sprint/sprint_<name>_feedback.md`（ループ中のみ）

**処理内容:**
- Sprint Contract をもとに機能を実装する
- テスト設計を作成する（後述のテスト種別を参照）
- スプリント完了時に進行状況を同期し、`handoff.md` を更新する

---

### Evaluator

**読み込むファイル（必須）:**
- `docs/sprint/sprint_<name>_contract.md`
- `.claude/rules/rules_test.md`

**処理内容（テスト設計レビューフェーズ）:**
- Sprint Contract の全受け入れ基準を網羅しているか確認する
- 境界値・異常系が含まれているか確認する（`rules_test.md` 準拠）
- NG の場合は `docs/sprint/sprint_<name>_feedback.md` を作成してループを継続する
- OK の場合はテスト実行フェーズへ進む

**処理内容（テスト実行フェーズ）:**
- pytest / Vitest / Playwright を実行する
- Pass → 完了記録を Sprint Contract に記入する
- Fail → 具体的な失敗箇所を Generator へフィードバックする

---

## エージェント起動方法

### ツールの役割分担

| ツール | 用途 |
|--------|------|
| `Agent` ツール | Planner / Generator / Evaluator を**起動**する |
| `TaskCreate` / `TaskUpdate` | スプリント単位の**進捗**を追跡する |

### Agent ツールによる起動パターン

```
# Planner 起動
Agent ツール（subagent_type: "general-purpose"）
  prompt: "以下のファイルを読み Sprint Contract を作成してください。
           - docs/issues/Seniorlead_full_stack_engineer_assignment_(Logs_Dashboard).pdf
           - docs/design/frontend_plan.md（Step X）
           出力先: docs/sprint/sprint_<name>_contract.md"

# Generator 起動（実装）
Agent ツール（subagent_type: "general-purpose"）
  prompt: "docs/sprint/sprint_<name>_contract.md を読み、
           機能実装とテスト設計（pytest / Vitest / Playwright）を行ってください。"

# Evaluator 起動（テスト設計レビュー）
Agent ツール（subagent_type: "general-purpose"）
  prompt: "docs/sprint/sprint_<name>_contract.md と .claude/rules/rules_test.md を読み、
           Generator が作成したテスト設計をレビューしてください。
           NG の場合は docs/sprint/sprint_<name>_feedback.md を作成してください。"

# Evaluator 起動（テスト実行）
Agent ツール（subagent_type: "general-purpose"）
  prompt: "pytest / Vitest / Playwright を実行し、
           Sprint Contract の受け入れ基準に照らして結果を報告してください。"
```

### Task ツールによる進捗管理

- スプリント開始時に `TaskCreate` でタスクを作成する
- エージェント起動のたびに `TaskUpdate` でステータスを更新する（`in_progress` → `completed`）
- セッションをまたいだ場合は `TaskList` で現在の進捗を確認してから再開する

---

## 全体フロー

```
Main Claude（オーケストレーター）
  │
  ├─ [Planner]
  │    └─ 課題 PDF + frontend_plan.md を読み込み
  │    └─ sprint_<name>_contract.md を作成
  │
  ├─ [Generator]
  │    └─ Sprint Contract をもとに機能実装
  │    └─ テスト設計作成（pytest + Vitest + Playwright）
  │         │
  │    ┌────▼────────────────────────────────┐
  │    │  設計 → レビュー → フィードバック      │
  │    │  この一連を最大3回繰り返す             │
  │    │                                     │
  │    │  Generator：テスト設計               │
  │    │      ↓                              │
  │    │  Evaluator：レビュー                 │
  │    │      ↓ NG                           │
  │    │  sprint_<name>_feedback.md 作成      │
  │    └────────────────┬────────────────────┘
  │                     │ OK（または3回到達）
  ├─ [Evaluator]
  │    └─ pytest 実行
  │    └─ Vitest 実行
  │    └─ Playwright 実行
  │    └─ Pass → 完了 / Fail → Generator へフィードバック（実装修正）
  │
  └─ スプリント完了時の同期（必須）
       ├─ frontend_plan.md の該当ステップを [x] にする
       ├─ sprint_<name>_contract.md のステータス・完了記録を記入する
       └─ handoff.md を更新する
```

---

## テスト種別

| テスト種別 | ツール | 対象 |
|-----------|-------|------|
| バックエンド UT / IT | pytest | API・Service・Repository |
| フロントエンド UT | Vitest | React コンポーネント・hooks・ユーティリティ |
| フロントエンド E2E | Playwright | 画面操作・表示・バックエンドとの実際の連携 |

---

## ファイル構成

```
docs/
└── harness/
    ├── sprint_<name>_contract.md   # Planner が作成・Generator が完了記録
    ├── sprint_<name>_feedback.md   # Evaluator が NG 時に作成
    └── handoff.md                  # Generator がスプリント完了時に更新
```

---

## Sprint Contract フォーマット

```markdown
# Sprint Contract: <スプリント名>

## 参照元
- docs/design/frontend_plan.md（Step X）

## ステータス
- [ ] 未着手 / [ ] 実装中 / [ ] テスト設計中 / [ ] 完了

## 受け入れ基準
- [ ] ...

## テスト合格基準
- pytest: ...
- Vitest: ...
- Playwright: ...

## 完了記録（Generator が記入）
- 完了日:
- テスト結果: pytest □件 / Vitest □件 / Playwright □件
- 特記事項:
```

---

## Feedback ファイルフォーマット

```markdown
# Feedback: <スプリント名>（X回目）

## NG 理由
- ...

## 不足しているテストケース
- ...

## 修正指示
- ...
```

---

## Handoff 文書フォーマット

```markdown
# Handoff

## 完了済みスプリント
- Sprint X: <スプリント名>（完了日: YYYY-MM-DD）

## 現在のスプリント
- Sprint Y: <スプリント名>（ステータス: ...）

## 次のスプリント
- Sprint Z: <スプリント名>

## 実装上の決定事項
- ...

## 既知の問題・注意点
- ...
```

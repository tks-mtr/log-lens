# プロジェクトルール: Logs Dashboard

## プロジェクト全体フェーズ

| # | フェーズ | ブランチ | 主な成果物 | 状態 |
|---|---------|---------|-----------|------|
| 1 | 要求・要件定義 | `feature/requirements-docs` | business_requirements.md / personas_usecases.md / requirements_specification.md | 完了 |
| 2 | システム設計 | `feature/system-design` | tech_selection.md / screen_flow.md / er_diagram.md / sequence.md | 完了 |
| 3 | Backend 実装（TDD） | `feature/backend` | FastAPI + PostgreSQL + pytest | 完了 |
| 3.5 | ハーネス設計見直し | `feature/harness-review` | .claude/rules/rules_harness.md | 完了 |
| 3.6 | バックエンド見直し | `feature/backend-review` | docs/design/backend_review_plan.md | 完了 |
| 4 | Frontend 実装（TDD） | `feature/frontend` | Next.js + Vitest | 完了 |
| 4.5 | Sprint Fix | `feature/frontend` | バグ修正・UI改善・シードデータ | 完了 |
| 5 | 結合・仕上げ | `feature/integration` | Docker 動作確認・README 最終化 | 未着手 |

各フェーズの作業開始前に、そのフェーズの `_plan.md` を作成して `docs/` 配下に格納すること。計画なしに実装を開始してはならない。`_plan.md` はブランチ作成直後・実装開始前に単独でコミットすること。

---

## 作業開始前の必須手順

**いかなる作業を始める前にも、必ず以下のファイルを読み込んでから進めること。**

- `docs/issues/assignment_ja.md`: 課題の要件・制約・評価基準の確認
- `CLAUDE.md`（本ファイル）: プロジェクトルールの確認
- **前のフェーズの `_plan.md`**: 前フェーズの成果物・設計判断を把握し、実装時の変更点や引き継ぎ事項を確認する
- **現在のフェーズの `_plan.md`**: 作業ステップ・成果物・完了状況の確認。作業を通じて前フェーズの設計に修正が必要と判断した場合は、該当ドキュメントを修正する
- **次のフェーズの `_plan.md`**: 次フェーズの全体像を把握し、現フェーズの成果物が次フェーズの前提を満たしているか確認する

読み込みを省略して作業を開始してはならない。

---

## テスト実装のルール

@.claude/rules/rules_test.md

---

## コードレビューのルール

@.claude/rules/rules_review.md

---

## ドキュメントのルール

@.claude/rules/rules_docs.md

---

## Claudeの役割

@.claude/rules/rules_harness.md

---

## Git運用ルール

@.claude/rules/rules_git.md

---

## 設計に対する姿勢

設計はAI駆動開発において最重要の工程であり、特に要件定義は設計の中でも最重要である。

- 設計ドキュメントは「とりあえず書く」ではなく、**実装時に迷わない粒度**で記述すること
- 一度書いたら終わりではなく、**複数回の見直しを前提**として精度を上げること
- 曖昧な仕様・未定義の挙動・矛盾は必ず発見して解消してから次フェーズへ進むこと
- 採点官・実装者・利用者の3つの視点から常にチェックすること

---

## 設計フェーズのルール

- 設計の作業順序: **要求定義 → 要件定義 → 技術選定** の順を守ること
- 設計計画は以下を参照すること
  - `docs/requirements/requirements_plan.md`: 要求・要件定義フェーズの作業計画
  - `docs/design/system_design_plan.md`: システム設計フェーズの作業計画
- ドキュメント構成は `docs/doc_structure.md` を参照すること
- ブランチ構成:
  - `feature/requirements-docs`: 要求定義・要件定義・技術選定
  - `feature/system-design`: 画面遷移図・ER図・API仕様書・シーケンス図

---

## /summary スキル

ユーザーが `/summary` を実行したとき、以下の2ファイルを**両方**更新すること。

### `docs/summary.md`（公開用）
- 設計・実装の意思決定ログ
- git管理対象のため、gitignore対象ファイル（`docs/issues/`・`docs/local/` 等）への言及は避ける
- 新しいエントリは**先頭に追加**（降順）
- **動作確認の内容（テスト結果・確認手順・確認済みエンドポイント等）も必ず記載すること**

### `docs/local/summary_local.md`（個人作業ログ）
- 課題確認・意思決定の経緯・会話の流れなど自由に記録
- gitignore対象のためローカルのみ管理
- 新しいエントリは**先頭に追加**（降順）
- **動作確認の内容も `docs/summary.md` と同様に記載すること**

### エントリのフォーマット
```
## YYYY-MM-DD | タイトル

### セクション名
- 内容
```
# 要求・要件定義プラン

> ブランチ: `feature/requirements-docs`

---

## 作業ステップ

### Step 1 — 要求定義 [x]
- **成果物:**
  - `docs/requirements/business_requirements.md`: 目的・対象ユーザー・機能要求・非機能要求
  - `docs/requirements/personas_usecases.md`: ペルソナ・ユースケース定義・DB設計への示唆
- **ルール:** 「何を作るか・なぜ作るか」のみ。技術スタックの詳細は書かない

### Step 2 — 要件定義 [ ]
- **成果物:** `docs/requirements/requirements_specification.md`
- **内容:** アーキテクチャ・ディレクトリ構成・API設計・DB設計・エラーハンドリング方針・設定管理

---

## 各ドキュメントの役割分担

### business_requirements.md（要求定義）
- 「何を作るか・なぜ作るか」を定義する
- 技術スタックの詳細は書かない
- 経緯や比較ではなく「あるべき姿」のみを記載する

### personas_usecases.md（ペルソナ・ユースケース）
- ロール定義・ペルソナ・ユースケースを定義する
- 機能要求・DB設計・ダッシュボード設計の判断基準とする

### requirements_specification.md（要件定義）
- 「どう作るか」を定義する
- 標準セクション:
  1. 技術スタック（`docs/design/tech_selection.md` を参照）
  2. アーキテクチャ設計
  3. ディレクトリ構成
  4. DB設計
  5. API設計
  6. エラーハンドリング方針
  7. 設定管理

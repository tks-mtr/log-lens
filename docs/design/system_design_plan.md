# システム設計プラン

> ブランチ: `feature/system-design`

---

## 作業ステップ

### Step 1 — 技術選定 [x]
- **成果物:** `docs/design/tech_selection.md`
- **内容:** フレームワーク・DB・周辺ライブラリの比較と選定理由

### Step 2 — 画面遷移図 [x]
- **成果物:** `docs/system/screen_flow.md`
- **内容:** 主要画面とページ間の遷移フロー

### Step 3 — ER図 [x]
- **成果物:** `docs/system/er_diagram.md`
- **内容:** テーブル定義・リレーション

### Step 4 — API仕様（Swagger UI）[x]
- **成果物:** なし（FastAPIが自動生成）
- **URL:** `http://localhost:8000/docs`（Swagger UI）/ `http://localhost:8000/redoc`（ReDoc）
- **備考:** エンドポイント設計は `docs/requirements/requirements_specification.md` を参照。実装後はSwagger UIが正式仕様となる。

### Step 5 — シーケンス図 [x]
- **成果物:** `docs/system/sequence.md`
- **内容:** 主要ユースケース（ログ検索・ログ作成など）のフロントエンド〜API〜DB間の処理フロー

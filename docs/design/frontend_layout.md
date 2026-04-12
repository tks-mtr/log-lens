# フロントエンド レイアウト設計

> 参照画像: `docs/rayout/sidebar.png` / `docs/rayout/dashboard.png` / `docs/rayout/log_list.png`

---

## 全体方針

- **テーマ**: ライト / ダーク切り替え対応（デフォルト: ダーク、背景 `black` / `zinc-900` 系）
- **フレームワーク**: shadcn/ui + Tailwind CSS

---

## 共通レイアウト（`app/layout.tsx`）

```
┌──────────────┬───────────────────────────────┐
│   Sidebar    │        Page Content            │
│  (固定幅)    │       (flex-1)                 │
└──────────────┴───────────────────────────────┘
```

### サイドバー

| 要素 | 内容 |
|------|------|
| タイトル | **Log Monitor**（太字・大文字） |
| テーマ切り替え | タイトル直下に配置。Sun / Moon アイコンのトグルボタン。クリックでライト / ダーク切替 |
| 背景 | テーマに追従（ライト: white / ダーク: black） |
| ナビ項目 1 | BarChart2 アイコン + "Dashboard"（アクティブ時: rounded rectangle でハイライト） |
| ナビ項目 2 | List アイコン + "Log List"（非アクティブ時: アイコン・テキストともにグレー） |

```
┌──────────────────┐
│  Log Monitor     │
│  [☀ / ☾] toggle │  ← テーマ切り替え
├──────────────────┤
│  ▌ Dashboard     │  ← アクティブ
│    Log List      │
└──────────────────┘
```

**実装方針:**
- `next-themes` ライブラリを使用
- `ThemeProvider` を `app/layout.tsx` でラップ
- トグルは `components/common/ThemeToggle.tsx` として共通コンポーネント化

**使用コンポーネント:** shadcn/ui `Sidebar`, `Button`（variant: ghost）

---

## ダッシュボード（`/`）

### レイアウト構成

```
┌─────────────────────────────────────────────────────┐
│  Dashboard                                          │
├──────────────────────────────────────────────────┤
│  [Date Range]  [Severity▼]  [Source...]  [Apply] │  ← フィルタバー
├───────────┬───────────┬───────────┬──────────────┤
│   INFO    │  WARNING  │   ERROR   │   CRITICAL   │  ← サマリーカード×4
│  12,847   │   3,421   │    892    │     156      │
├───────────────────────┬─────────────────────────┤
│  Log Count Over Time  │ Severity Distribution   │  ← チャート2列
│  (LineChart)          │ by Source (BarChart)    │
│  [Hour][Day][Week]    │                         │
└───────────────────────┴─────────────────────────┘
```

### サマリーカード（×4）

| severity | 背景色 | アイコン |
|---------|--------|---------|
| INFO | blue（`bg-blue-900/50` 系） | Info アイコン |
| WARNING | yellow/olive（`bg-yellow-900/50` 系） | AlertTriangle アイコン |
| ERROR | orange/red（`bg-orange-900/50` 系） | AlertCircle アイコン |
| CRITICAL | dark red（`bg-red-950/50` 系） | Target アイコン |

- severity名は小さく上部に表示
- 件数は大きなフォント（`text-4xl` 程度）

### フィルタバー

- Date Range: DatePicker（開始〜終了）
- Severity: multi-select ドロップダウン（"All Severities" がデフォルト）
- Source: テキスト入力（"Enter source (exact match)..."）※ログ一覧の部分一致と異なり完全一致
- Apply ボタン

### チャート

| チャート | ライブラリ | 詳細 |
|---------|-----------|------|
| Log Count Over Time | Recharts `LineChart` | X軸: 時刻, Y軸: 件数, 凡例: INFO/WARNING/ERROR/CRITICAL の4線。Hour/Day/Week 切替タブ |
| Severity Distribution by Source | Recharts `BarChart`（積み上げ） | X軸: source名, Y軸: 件数, 色分け: INFO(青)/WARNING(黄)/ERROR(橙)/CRITICAL(赤) |

**使用コンポーネント:** shadcn/ui `Card`, `Badge`, `Button`, `Select`

---

## ログ一覧（`/logs`）

### レイアウト構成

```
┌────────────────────────────────────────────────────────────────┐
│  Log List                                                      │
├────────────────────────────────────────────────────────────────┤
│  🔍 Search logs...                                             │  ← 検索バー
├────────────────────────────────────────────────────────────────┤
│  [Date Range] [Severity▼] [Source(部分一致)...]  [CSV] [+ New]│  ← フィルタ + アクション
├────┬──────────┬──────────────┬──────────┬──────────┬──────────┤
│ id │timestamp↕│ severity    ↕│ source  ↕│ message  │          │  ← ↕ でソート切替
├────┼──────────┼──────────────┼──────────┼──────────┼──────────┤
│ 1  │ ...      │ [INFO]       │ API Srv  │ Request..│ [Edit]   │  ← 行クリックで詳細へ
│ 2  │ ...      │ [WARNING]    │ Auth Svc │ Rate lim.│ [Edit]   │
│ 3  │ ...      │ [ERROR]      │ Database │ Connect..│ [Edit]   │
├────────────────────────────────────────────────────────────────┤
│  ← Prev  Page 1 / 10  Next →               [50件/page▼]      │  ← ページネーション
└────────────────────────────────────────────────────────────────┘
```

### severity バッジ

| severity | 色 |
|---------|-----|
| INFO | 青（`bg-blue-500` 系） |
| WARNING | 黄（`bg-yellow-500` 系） |
| ERROR | 橙（`bg-orange-500` 系） |
| CRITICAL | 赤（`bg-red-600` 系） |

### アクション

- **+ New Log**: 右上ボタン → `/logs/new` へ遷移
- **行クリック**: `/logs/[id]`（詳細表示）へ遷移
- **Edit ボタン**: 各行右端 → `/logs/[id]`（編集フォームをアクティブな状態で表示）へ遷移
- **列ヘッダ（↕）クリック**: timestamp / severity / source のソート切替（asc / desc）
- **CSV エクスポート**: 現在のフィルタ条件で `GET /logs/export/csv` を呼び出す
- **ページネーション**: 件数選択（デフォルト50・最大200）・ページ送り

**使用コンポーネント:** shadcn/ui `Table`, `Badge`, `Button`, `Input`, `Select`, `Pagination`

---

## ログ詳細・編集（`/logs/[id]`）

```
┌─────────────────────────────────────────────────┐
│  ← Back to Log List                             │
├─────────────────────────────────────────────────┤
│  Log Detail                      [Edit] [Delete]│
├─────────────────────────────────────────────────┤
│  id: 123          created_at: 2026-04-12 ...    │
│  timestamp: [入力欄]                            │
│  severity:  [SELECT▼]                           │
│  source:    [入力欄]                            │
│  message:   [テキストエリア]                    │
├─────────────────────────────────────────────────┤
│                              [Cancel] [Save]    │
└─────────────────────────────────────────────────┘
```

- 編集モードは同一ページのインライン編集（モーダルなし）
- 削除時は確認ダイアログを表示

**使用コンポーネント:** shadcn/ui `Card`, `Button`, `Input`, `Select`, `Textarea`, `AlertDialog`

---

## ログ作成（`/logs/new`）

```
┌─────────────────────────────────────────────────┐
│  Create Log                                     │
├─────────────────────────────────────────────────┤
│  Timestamp:  [入力欄]（省略可）                 │
│  Severity:   [SELECT▼]（必須）                  │
│  Source:     [入力欄]（必須）                   │
│  Message:    [テキストエリア]（必須）            │
├─────────────────────────────────────────────────┤
│                          [Cancel] [Create Log]  │
└─────────────────────────────────────────────────┘
```

- バリデーションエラーはフィールド直下に赤文字で表示
- 作成成功後は `/logs` へリダイレクト

**使用コンポーネント:** shadcn/ui `Card`, `Button`, `Input`, `Select`, `Textarea`

---

## 使用する shadcn/ui コンポーネント一覧

| コンポーネント | 用途 |
|-------------|------|
| `Sidebar` | 共通サイドバーナビゲーション |
| `Card` | サマリーカード・フォームコンテナ |
| `Badge` | severity 表示 |
| `Button` | 各種アクション |
| `Input` | テキスト入力 |
| `Select` | severity・sort・limit 選択 |
| `Textarea` | message 入力 |
| `Table` | ログ一覧テーブル |
| `AlertDialog` | 削除確認ダイアログ |
| `Pagination` | ページネーション |

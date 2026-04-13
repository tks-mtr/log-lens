# シーケンス図

> 要件定義: [`docs/requirements/requirements_specification.md`](../requirements/requirements_specification.md)

主要ユースケースのフロントエンド〜API〜DB間の処理フローを定義する。

---

## UC-01: ログ一覧取得・フィルタ検索

```mermaid
sequenceDiagram
    participant B as Browser
    participant F as Frontend (TanStack Query)
    participant A as Backend (FastAPI)
    participant D as DB (PostgreSQL)

    B->>F: フィルタ条件を入力
    F->>A: GET /api/v1/logs?start=...&severity=ERROR&page=1&limit=50
    A->>A: Pydantic バリデーション（クエリパラメータ）
    A->>D: SELECT * FROM logs WHERE ... ORDER BY timestamp DESC LIMIT 50 OFFSET 0
    D-->>A: rows + total count
    A-->>F: 200 OK {data, total, page, pages, limit}
    F-->>B: 一覧テーブル更新
```

---

## UC-02: ログ作成

```mermaid
sequenceDiagram
    participant B as Browser
    participant F as Frontend (React Hook Form)
    participant A as Backend (FastAPI)
    participant D as DB (PostgreSQL)

    B->>F: フォーム入力・送信
    F->>F: Zod バリデーション（クライアント側）
    F->>A: POST /api/v1/logs {timestamp?(省略可), severity, source, message}
    A->>A: Pydantic バリデーション
    A->>A: Service: timestamp 省略時は NOW() を設定
    A->>D: INSERT INTO logs VALUES (...)
    D-->>A: 作成されたレコード
    A-->>F: 201 Created {id, timestamp, severity, source, message, created_at, updated_at}
    F-->>B: /logs へリダイレクト
```

---

## UC-03: ログ編集

```mermaid
sequenceDiagram
    participant B as Browser
    participant F as Frontend (React Hook Form)
    participant A as Backend (FastAPI)
    participant D as DB (PostgreSQL)

    B->>F: 編集フォーム入力・保存
    F->>F: Zod バリデーション
    F->>A: PATCH /api/v1/logs/{id} {変更フィールドのみ}
    A->>D: SELECT * FROM logs WHERE id = {id}
    D-->>A: result

    alt レコードが存在しない
        A-->>F: 404 Not Found
        F-->>B: エラーメッセージ表示
    else レコードが存在する
        A->>D: UPDATE logs SET ..., updated_at=NOW() WHERE id = {id}
        D-->>A: 更新後レコード
        A-->>F: 200 OK {id, timestamp, severity, source, message, created_at, updated_at}
        F-->>B: 詳細画面を更新
    end
```

---

## UC-04: ログ削除

```mermaid
sequenceDiagram
    participant B as Browser
    participant F as Frontend
    participant A as Backend (FastAPI)
    participant D as DB (PostgreSQL)

    B->>F: 削除ボタンクリック
    F-->>B: 確認ダイアログ表示
    B->>F: OK
    F->>A: DELETE /api/v1/logs/{id}
    A->>D: SELECT * FROM logs WHERE id = {id}
    D-->>A: result

    alt レコードが存在しない
        A-->>F: 404 Not Found
        F-->>B: エラーメッセージ表示
    else レコードが存在する
        A->>D: DELETE FROM logs WHERE id = {id}
        D-->>A: 削除完了
        A-->>F: 204 No Content
        F-->>B: /logs へリダイレクト
    end
```

---

## UC-05: ログ詳細取得

```mermaid
sequenceDiagram
    participant B as Browser
    participant F as Frontend (TanStack Query)
    participant A as Backend (FastAPI)
    participant D as DB (PostgreSQL)

    B->>F: /logs/[id] にアクセス
    F->>A: GET /api/v1/logs/{id}
    A->>D: SELECT * FROM logs WHERE id = {id}
    D-->>A: result

    alt レコードが存在しない
        A-->>F: 404 Not Found
        F-->>B: エラーメッセージ表示（一覧へ戻るリンク）
    else レコードが存在する
        A-->>F: 200 OK {id, timestamp, severity, source, message, created_at, updated_at}
        F-->>B: 詳細画面を描画
    end
```

---

## UC-06: ダッシュボード表示

```mermaid
sequenceDiagram
    participant B as Browser
    participant F as Frontend (TanStack Query)
    participant A as Backend (FastAPI)
    participant D as DB (PostgreSQL)

    B->>F: / にアクセス

    par 並列リクエスト
        F->>A: GET /api/v1/logs/analytics/summary?start=...
        A->>D: SELECT severity, source, COUNT(*) GROUP BY ...
        D-->>A: 集計結果
        A-->>F: {summary, histogram}
    and
        F->>A: GET /api/v1/logs/analytics/timeseries?interval=day
        A->>D: SELECT DATE_TRUNC('day', timestamp), severity, COUNT(*) GROUP BY ...
        D-->>A: 時系列集計結果
        A-->>F: {interval, data}
    end

    F-->>B: ダッシュボード描画
```

---

## UC-07: CSV エクスポート

```mermaid
sequenceDiagram
    participant B as Browser
    participant F as Frontend
    participant A as Backend (FastAPI)
    participant D as DB (PostgreSQL)

    B->>F: CSV エクスポートボタンクリック
    F->>A: GET /api/v1/logs/export/csv?start=...&severity=...&source=...
    A->>D: SELECT * FROM logs WHERE ... ORDER BY timestamp DESC
    D-->>A: rows
    A->>A: CSV 生成（UTF-8 BOM付き、カラム順: id, timestamp, severity, source, message）
    A-->>F: 200 OK Content-Disposition: attachment; filename="logs_YYYYMMDD.csv"
    F-->>B: ファイルダウンロード
```

# プロジェクトルール詳細

## テスト実装のルール

テストコードを書く際は、以下をすべて満たすこと。

### 必須カバレッジ

各テスト対象に対して **正常系・異常系・境界値** を必ず含める。正常系のみのテストクラスは書いてはならない。

### 境界値チェックリスト

以下の観点を見落とさないこと。

| 観点 | 確認ポイント |
|-----|------------|
| ページネーション | `limit=1`（最小）/ `page` がデータ範囲外（空リストが返るか） |
| 日付範囲 | `start == end`（境界値・含まれるか）/ `start > end`（逆転） |
| フィルター空値 | `severities=[]`（空リスト → 全件？0件？）/ `source=""`（空文字） |
| 文字列 | 空文字 / 最大長ちょうど / 最大長+1 |
| 削除 | 存在しないIDへの削除（2重削除含む） |

### アサーション

- `assert result is not None` のような弱いアサーションを書かない
- 戻り値の各フィールドを具体的に検証すること

```python
# 悪い例
assert result is not None

# 良い例
assert result.message == data.message
assert result.severity == data.severity
```

### モック方針

- 内部メソッド（`_build_query` 等）はモックしない
- モックするのは層の境界（Repository 全体など）のみ

```python
# 悪い例：内部実装に依存
repo._build_query = mock_stmt

# 良い例：振る舞いを検証
logs, total = await LogRepository.list(session, ...)
assert len(logs) == 3
```

### テスト名

`test_<対象>_<条件>_<期待結果>` の形式で書く。

```python
# 悪い例
def test_list_1():

# 良い例
def test_list_logs_filtered_by_severity_returns_only_matched():
```

---

## コードレビューのテスト確認項目

テストコードのレビュー時は以下も確認すること。

- 正常系・異常系・境界値がすべて含まれているか
- Repository 層は異常系（空結果・存在しないID等）が含まれているか
- アサーションが具体的か（`is not None` だけで終わっていないか）
- テスト名が `test_<対象>_<条件>_<期待結果>` 形式になっているか

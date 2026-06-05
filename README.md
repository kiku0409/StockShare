# うちストック

家族で使う冷蔵庫の在庫管理・買い出しリストアプリです。

## 起動方法

```bash
# 1. ブランチに切り替え（クローン済みの場合）
git checkout claude/uchistock-inventory-app-YWqKM

# 2. uchistock ディレクトリに移動
cd uchistock

# 3. 仮想環境を作成・有効化
python3 -m venv venv
source venv/bin/activate

# 4. Flask をインストール
pip install flask

# 5. アプリを起動
python app.py
```

ブラウザで `http://localhost:5000` を開いてください。

> データベース（`uchistock.db`）は初回起動時に自動作成されます。
> 次回以降は `source venv/bin/activate` → `python app.py` だけでOKです。

## 機能

- **在庫管理**: 冷蔵庫・冷凍庫・常温・その他の場所ごとに在庫を管理
- **買い物リスト**: 未購入／購入済みを分けて管理。誰が買ったか記録できます
- **在庫追加連携**: 購入済みアイテムをワンタップで在庫に追加

## ファイル構成

```
uchistock/
├── app.py              # Flask アプリ本体
├── uchistock.db        # SQLite データベース（自動生成）
├── templates/
│   ├── base.html       # 共通レイアウト
│   ├── index.html      # 在庫一覧（トップ）
│   ├── inventory_form.html  # 在庫追加フォーム
│   ├── shopping.html   # 買い物リスト
│   └── shopping_form.html   # 買い物アイテム追加フォーム
└── static/
    └── style.css       # スタイルシート
```

## 技術構成

- Python 3.x
- Flask
- SQLite3
- HTML / CSS（バニラ）

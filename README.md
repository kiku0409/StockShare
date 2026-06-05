# うちストック

家族で使う冷蔵庫の在庫管理・買い出しリストアプリです。

## 機能

- **在庫管理**: 冷蔵庫・冷凍庫・常温・その他の場所ごとに在庫を管理
- **買い物リスト**: 未購入／購入済みを分けて管理。誰が買ったか記録できます
- **在庫追加連携**: 購入済みアイテムをワンタップで在庫に追加

## 起動方法

### 1. 依存パッケージのインストール

```bash
pip install flask
```

### 2. アプリの起動

```bash
cd uchistock
python app.py
```

### 3. ブラウザで開く

```
http://localhost:5000
```

> データベース（`uchistock.db`）は初回起動時に自動作成されます。

## ファイル構成

```
uchistock/
├── app.py              # Flask アプリ本体
├── uchistock.db        # SQLite データベース（自動生成）
├── README.md
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

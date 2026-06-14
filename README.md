# うちストック

家族で使う冷蔵庫の在庫管理・買い出しリストアプリです。

## 起動方法

### Mac / Linux

```bash
# 1. ブランチに切り替え
git checkout claude/uchistock-inventory-app-YWqKM

# 2. uchistock ディレクトリに移動
cd uchistock

# 3. 仮想環境を作成・有効化
python3 -m venv venv
source venv/bin/activate

# 4. 依存パッケージをインストール
pip install -r requirements.txt

# 5. アプリを起動
python app.py
```

### Windows（コマンドプロンプト / PowerShell）

```bat
git checkout claude/uchistock-inventory-app-YWqKM
cd uchistock

python -m venv venv
venv\Scripts\activate

pip install -r requirements.txt
python app.py
```

### ブラウザで開く

```
http://localhost:5000
```

> データベース（`uchistock.db`）は初回起動時に自動作成されます。  
> 次回以降は `source venv/bin/activate`（Windowsは `venv\Scripts\activate`）→ `python app.py` だけでOKです。

## デバッグモードの有効化

開発時のみ、環境変数でデバッグモードを有効にできます。

```bash
# Mac/Linux
FLASK_DEBUG=1 python app.py

# Windows
set FLASK_DEBUG=1
python app.py
```

> **注意**: デバッグモードは開発時のみ使用してください。  
> `host=0.0.0.0`（LAN公開）と組み合わせると、同じネットワーク内の端末から任意コードが実行できるデバッガが有効になります。

## 機能

- **在庫管理**: 冷蔵庫・冷凍庫・常温・その他の場所ごとに管理。スワイプで編集・削除
- **個数の±調整**: カード上のボタンで在庫数をその場で増減
- **買い物リスト**: 未購入／購入済みを分けて管理。誰が買ったか記録できます
- **在庫追加連携**: 購入済みアイテムをワンタップで在庫に追加
- **購入履歴補完**: 買い物リスト追加時に過去の商品名をサジェスト

## ファイル構成

```
uchistock/
├── app.py              # Flask アプリ本体
├── requirements.txt    # 依存パッケージ
├── uchistock.db        # SQLite データベース（自動生成）
├── templates/
│   ├── base.html       # 共通レイアウト
│   ├── index.html      # 在庫一覧（トップ）
│   ├── inventory_form.html  # 在庫追加・編集フォーム
│   ├── shopping.html   # 買い物リスト
│   └── shopping_form.html   # 買い物アイテム追加フォーム
└── static/
    └── style.css       # スタイルシート
```

## 技術構成

- Python 3.x
- Flask 3.x
- SQLite3
- HTML / CSS（バニラ）

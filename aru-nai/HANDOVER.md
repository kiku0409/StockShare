# ある・ないアプリ 引き継ぎメモ

## コンセプト

在庫管理アプリではなく、家族間で「家にあるもの」「買う必要があるもの」の認識を共有するアプリ。
個数・賞味期限管理なし。ワンタップで状態を切り替えるシンプルさが最優先。

---

## 現在の状態

| 項目 | 状態 |
|------|------|
| MVPコード | ✅ 完成・GitHub プッシュ済み |
| Supabase | ✅ セットアップ済み・動作確認済み |
| Vercel デプロイ | ✅ 完了（aru-nai-iota.vercel.app） |
| GitHub 自動デプロイ | ⚠️ 要確認（CLIデプロイは動作済み）|

---

## 技術構成

- **フレームワーク**: Next.js 16 + TypeScript + Tailwind CSS
- **DB / Realtime**: Supabase
- **デプロイ先**: Vercel（aru-nai-iota.vercel.app）
- **認証**: なし（localStorageにmemberIdを保持、招待リンク方式）

---

## リポジトリ構成

```
StockShare/
├── uchistock/        ← 旧Flaskアプリ（無視してOK）
└── aru-nai/          ← Next.jsアプリ（本体）
    ├── src/
    │   ├── types/index.ts              # ItemStatus('home'|'buy'|'none'), Priority('urgent'|'soon'|'anytime')
    │   ├── lib/supabase.ts
    │   ├── lib/storage.ts
    │   ├── lib/itemColor.ts            # アイテム名からイニシャル円の色を決定
    │   ├── components/ItemCard.tsx     # 左イニシャル円・右チェブロン・優先度バッジ
    │   ├── components/ItemDetailModal.tsx  # タップで開く詳細モーダル
    │   ├── components/AddItemModal.tsx
    │   └── app/
    │       ├── page.tsx                    # / → 自動リダイレクト
    │       ├── home/page.tsx               # メイン画面
    │       ├── members/page.tsx            # メンバー一覧
    │       ├── settings/page.tsx           # 設定・招待URL表示
    │       ├── onboarding/family/page.tsx
    │       ├── onboarding/member/page.tsx
    │       ├── onboarding/invite/page.tsx
    │       └── join/[token]/page.tsx
    └── supabase/schema.sql
```

---

## 実装済み機能

- オンボーディング（家族名 → メンバー名 → Supabase作成 → 招待画面）
- ホーム画面（買う・家にある・家にない の3セクション）
- セクションヘッダーに背景色（買う:ピンク、家にある:グリーン、家にない:グレー）
- アイテムカード（左イニシャル円・名前・更新者時刻・右チェブロン）
- カードタップ → 詳細モーダル（家にある/買う/家にない/削除する）
- 優先度バッジ（買うゾーンのみ）：🔴至急/🟡近日中/⚪️ついでに をタップで切り替え
- 買うゾーンを優先度順にソート（至急→近日中→ついでに）
- 削除の代わりに「家にない」へアーカイブ、家にないからタップで「買う」に復元
- リアルタイム同期（Supabase Realtime）
- 設定画面（招待URLコピー）
- メンバーページ（家族メンバー一覧）
- ボトムナビ（ホーム | メンバー）
- 招待リンク参加（/join/[token]）

---

## Supabase 情報

- **URL**: `https://yjyfuyogggbeuaxesryn.supabase.co`
- **プロジェクト名**: aru-nai
- **スキーマ**: 適用済み

### テーブル構成

```sql
-- items テーブルの主要カラム
status   text  CHECK (status IN ('home', 'buy', 'none'))     DEFAULT 'buy'
priority text  CHECK (priority IN ('urgent', 'soon', 'anytime')) DEFAULT 'anytime'
```

### .env.local の内容

```
NEXT_PUBLIC_SUPABASE_URL=https://yjyfuyogggbeuaxesryn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqeWZ1eW9nZ2diZXVheGVzcnluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzMzYwNzUsImV4cCI6MjA5NjkxMjA3NX0.SDGxAB6Qm17Myu4xYvZlY2kHIgNHymT89NyM5q1FRFs
```

---

## Vercel 情報

- **プロジェクト名**: aru-nai
- **本番URL**: https://aru-nai-iota.vercel.app
- **スコープ**: `kikus-projects-414e71be`
- **Root Directory**: `aru-nai`（Vercel Project Settings → General で設定済み）
- **GitHub連携**: kiku0409/StockShare に接続済み
- **Ignored Build Step**: `claude/uchistock-inventory-app-YWqKM` ブランチを除外設定済み

### CLIデプロイ方法（GitHub自動デプロイが動かない場合）

```bash
# リポジトリルート（StockShare/）から実行すること
cd /path/to/StockShare
npx vercel --prod --scope kikus-projects-414e71be
```

⚠️ `aru-nai/` の中から実行するとパスが二重になってエラーになる

---

## ローカル起動方法

```bash
git clone https://github.com/kiku0409/StockShare.git
cd StockShare/aru-nai
npm install
# .env.local を上記の内容で作成
npm run dev
```

→ http://localhost:3000 で起動

---

## 今後の追加候補

- 優先度機能の案④（追加時に選ぶ・左ラインで表示）との比較検討
- カテゴリ分け
- 通知機能
- よく使うセット登録

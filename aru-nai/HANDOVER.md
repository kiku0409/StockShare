# ある・ないアプリ 引き継ぎメモ

## コンセプト

在庫管理アプリではなく、家族間で「家にあるもの」「買う必要があるもの」の認識を共有するアプリ。
個数・賞味期限管理なし。ワンタップで状態を切り替えるシンプルさが最優先。

---

## 現在の状態

| 項目 | 状態 |
|------|------|
| MVPコード | ✅ 完成・GitHub プッシュ済み |
| Supabase | ✅ セットアップ済み・ローカルで動作確認済み |
| Vercel デプロイ | ❌ **未完了（ここが次のタスク）** |

---

## 技術構成

- **フレームワーク**: Next.js 16 + TypeScript + Tailwind CSS
- **DB / Realtime**: Supabase
- **デプロイ先**: Vercel
- **認証**: なし（localStorageにmemberIdを保持、招待リンク方式）

---

## リポジトリ構成

```
StockShare/
├── uchistock/        ← 旧Flaskアプリ（無視してOK）
└── aru-nai/          ← 今回作ったNext.jsアプリ（こちらが本体）
    ├── src/
    │   ├── types/index.ts
    │   ├── lib/supabase.ts
    │   ├── lib/storage.ts
    │   ├── components/ItemCard.tsx
    │   ├── components/AddItemModal.tsx
    │   └── app/
    │       ├── page.tsx                    # / → 自動リダイレクト
    │       ├── onboarding/family/page.tsx  # 家族名入力
    │       ├── onboarding/member/page.tsx  # メンバー名入力 + DB作成
    │       ├── onboarding/invite/page.tsx  # 招待リンク画面
    │       ├── home/page.tsx               # メイン画面
    │       └── join/[token]/page.tsx       # 招待リンクから参加
    └── supabase/schema.sql
```

---

## Supabase 情報

- **URL**: `https://yjyfuyogggbeuaxesryn.supabase.co`
- **プロジェクト名**: aru-nai（Supabaseダッシュボード上）
- **スキーマ**: 適用済み（families / members / items テーブル、RLS・Realtime設定済み）
- **Anon Key**: `.env.local.example` を参照（実際のキーはローカルの `.env.local` に記載）

### .env.local の内容（新デバイスでは手動で作成）

```
NEXT_PUBLIC_SUPABASE_URL=https://yjyfuyogggbeuaxesryn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqeWZ1eW9nZ2diZXVheGVzcnluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzMzYwNzUsImV4cCI6MjA5NjkxMjA3NX0.SDGxAB6Qm17Myu4xYvZlY2kHIgNHymT89NyM5q1FRFs
```

---

## Vercel 情報

- **プロジェクト名**: stock-share
- **スコープ**: `kikus-projects-414e71be`
- **ブランチ**: `claude/uchistock-inventory-app-YWqKM`

### ⚠️ 未完了：デプロイ手順

新しいデバイスでも、このデバイスでも、以下を `aru-nai/` ディレクトリで実行すればデプロイ完了：

```bash
# 1. Vercel CLIでログイン
npx vercel login

# 2. プロジェクトをリンク
npx vercel link --scope kikus-projects-414e71be --yes

# 3. 本番デプロイ
npx vercel --prod --scope kikus-projects-414e71be
```

その後、Vercelダッシュボード → **Environment Variables** に以下を追加してリデプロイ：

| キー | 値 |
|------|----|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://yjyfuyogggbeuaxesryn.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | （上記の値） |

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

## 実装済み機能

- オンボーディング（家族名 → メンバー名 → Supabaseにレコード作成 → 招待画面）
- ホーム画面（「買う」「家にある」の2セクション、Realtimeリアルタイム同期）
- アイテム追加（「🏠家にある」「🛒買う」の2択ボタンで初期状態を選択）
- ワンタップ状態切り替え
- 削除
- 招待リンク参加（/join/[token]）
- 最終更新者・更新時間の表示

## 将来の追加候補（MVPには含まない）

- カテゴリ分け
- 通知機能
- よく使うセット登録

# ある・ないアプリ

家族間で「家にあるもの」「買う必要があるもの」の認識を共有するアプリ。

個数・賞味期限管理なし。**ワンタップで状態を切り替える**シンプルさが最優先。

**本番URL**: https://aru-nai-iota.vercel.app

---

## 機能

- **3ゾーン管理** — 買う / 家にある / 家にない
- **ワンタップ切り替え** — カードタップで買う↔家にある を即切り替え
- **優先度**（買うゾーン） — 左バーの色で識別。バータップで 🔴至急 / 🟡近日中 / ⚪️ついでに を切り替え
- **在庫レベル**（家にあるゾーン） — バータップで 豊富（薄緑）/ 残り少ない（アンバー）を切り替え
- **フィルター** — 優先度で複数選択フィルタリング
- **スワイプ削除** — カードを左スワイプで削除
- **リアルタイム同期** — Supabase Realtime で家族全員に即反映
- **招待リンク** — URLを共有するだけで家族が参加できる
- **メンバー管理** — 設定画面からメンバーの追加・削除

---

## 技術構成

| 項目 | 内容 |
|------|------|
| フレームワーク | Next.js 16 + TypeScript |
| スタイリング | Tailwind CSS |
| DB / Realtime | Supabase |
| デプロイ | Vercel |
| 認証 | なし（localStorage + 招待リンク方式） |

---

## ローカル起動

```bash
git clone https://github.com/kiku0409/StockShare.git
cd StockShare/aru-nai
npm install
```

`.env.local` を作成：

```
NEXT_PUBLIC_SUPABASE_URL=https://yjyfuyogggbeuaxesryn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```

```bash
npm run dev
# → http://localhost:3000
```

---

## デプロイ

GitHub の `main` ブランチへの push で Vercel が自動デプロイ。

手動デプロイ（CLIから）：

```bash
# リポジトリルート（StockShare/）から実行
npx vercel --prod --scope kikus-projects-414e71be
```

---

## DB スキーマ

```
families   id, name, invite_token, created_at
members    id, family_id, display_name, created_at
items      id, family_id, name, status, priority, updated_by_member_id, updated_at

status:   'home' | 'buy' | 'none'
priority: 'urgent' | 'soon' | 'anytime'  ← 買うゾーンは優先度、家にあるゾーンは在庫レベルとして使用
```

Supabase プロジェクト: `yjyfuyogggbeuaxesryn`

---

## ディレクトリ構成

```
src/
├── app/
│   ├── home/           # メイン画面
│   ├── settings/       # 設定・招待URL・メンバー管理
│   ├── members/        # メンバー一覧
│   ├── join/[token]/   # 招待リンク参加
│   └── onboarding/     # 初回セットアップ
├── components/
│   ├── ItemCard.tsx        # アイテムカード（スワイプ削除・優先度バー）
│   ├── ItemDetailModal.tsx # 詳細・ステータス変更モーダル
│   └── AddItemModal.tsx    # アイテム追加モーダル
└── lib/
    ├── supabase.ts   # Supabase クライアント
    ├── storage.ts    # localStorage ラッパー
    ├── time.ts       # 相対時間フォーマット
    └── itemColor.ts  # アイテム名からイニシャル円の色を決定
```

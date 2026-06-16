# ある・ないアプリ

家族間で「家にあるもの」「買う必要があるもの」の認識を共有するアプリ。

個数・賞味期限管理なし。**ワンタップで状態を切り替える**シンプルさが最優先。

**→ https://aru-nai-iota.vercel.app**

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
cd aru-nai
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

`main` ブランチへの push で Vercel が自動デプロイ。

手動デプロイ（CLIから、リポジトリルートで実行）：

```bash
npx vercel --prod --scope kikus-projects-414e71be
```

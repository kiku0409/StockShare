-- #2: invite_token のエントロピー強化（md5(random()) → gen_random_bytes(16)）
-- 既存レコードのトークンも更新する
ALTER TABLE families
  ALTER COLUMN invite_token SET DEFAULT encode(gen_random_bytes(16), 'hex');

UPDATE families
  SET invite_token = encode(gen_random_bytes(16), 'hex');

-- #1: RLS ポリシー改善メモ
-- 現状: using(true) で全データが anon キーで読み書き可能
-- 認証なし構成のため完全な制限は困難だが、最低限のトークン強化を実施済み
-- 将来的に Supabase Auth (anonymous sign-in) を導入することで
-- JWT ベースの family_id RLS が実現できる

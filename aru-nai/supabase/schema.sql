-- families
create table if not exists families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_token text not null unique default substr(md5(random()::text), 1, 10),
  created_at timestamptz not null default now()
);

-- members
create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

-- items
create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  name text not null,
  status text not null check (status in ('home', 'buy')) default 'buy',
  updated_by_member_id uuid references members(id) on delete set null,
  updated_at timestamptz not null default now()
);

-- インデックス
create index if not exists items_family_id_idx on items(family_id);
create index if not exists members_family_id_idx on members(family_id);

-- RLS (Row Level Security)
alter table families enable row level security;
alter table members enable row level security;
alter table items enable row level security;

-- anon キーで全操作を許可（招待リンク方式のため）
create policy "allow all for families" on families for all using (true) with check (true);
create policy "allow all for members" on members for all using (true) with check (true);
create policy "allow all for items" on items for all using (true) with check (true);

-- Realtime
alter publication supabase_realtime add table items;

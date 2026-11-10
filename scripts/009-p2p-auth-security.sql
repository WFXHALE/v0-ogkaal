-- P2P Auth hardening
-- Applied to Supabase project viwxzprfhqeabjddouda on 2026-11-10.
-- Keep this file in source control so fresh environments can reproduce the schema.

create table if not exists public.p2p_user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text not null default '',
  level text not null default 'Beginner',
  avatar text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint p2p_user_profiles_level_check
    check (level in ('Beginner','Trader','Pro Trader','Master Trader'))
);

alter table public.p2p_user_profiles enable row level security;
alter table public.p2p_user_profiles force row level security;
revoke all on public.p2p_user_profiles from anon, authenticated;
grant select, insert, update on public.p2p_user_profiles to authenticated;

drop policy if exists p2p_profile_select_own on public.p2p_user_profiles;
drop policy if exists p2p_profile_insert_own on public.p2p_user_profiles;
drop policy if exists p2p_profile_update_own on public.p2p_user_profiles;
create policy p2p_profile_select_own on public.p2p_user_profiles
  for select to authenticated using ((select auth.uid()) = user_id);
create policy p2p_profile_insert_own on public.p2p_user_profiles
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy p2p_profile_update_own on public.p2p_user_profiles
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter table public.usdt_buy_requests add column if not exists rate_inr numeric(12,2);
alter table public.usdt_sell_requests add column if not exists rate_inr numeric(12,2);
alter table public.usdt_sell_requests add column if not exists inr_equivalent text;

-- Customer trade APIs now authenticate with Supabase Auth and write through the
-- server's PostgreSQL pool. The anon/authenticated Data API must not expose
-- customer payment, wallet, or transaction records.
drop policy if exists anon_select_usdt_buy on public.usdt_buy_requests;
drop policy if exists anon_insert_usdt_buy on public.usdt_buy_requests;
drop policy if exists anon_update_usdt_buy on public.usdt_buy_requests;
drop policy if exists anon_delete_usdt_buy on public.usdt_buy_requests;
drop policy if exists anon_select_usdt_sell on public.usdt_sell_requests;
drop policy if exists anon_insert_usdt_sell on public.usdt_sell_requests;
drop policy if exists anon_update_usdt_sell on public.usdt_sell_requests;
drop policy if exists anon_delete_usdt_sell on public.usdt_sell_requests;
revoke all on public.usdt_buy_requests from anon, authenticated;
revoke all on public.usdt_sell_requests from anon, authenticated;

-- ── VIP Signals ──────────────────────────────────────────────────────────────
create table if not exists public.vip_signals (
  id          uuid primary key default gen_random_uuid(),
  pair        text not null,
  entry       text not null,
  stop_loss   text not null,
  take_profit text not null,
  direction   text not null check (direction in ('BUY','SELL')),
  status      text not null default 'active' check (status in ('active','closed','cancelled')),
  result      text check (result in ('win','loss','breakeven')),
  pips        numeric,
  notes       text,
  source      text not null default 'manual' check (source in ('manual','telegram')),
  created_at  timestamptz not null default now()
);

alter table public.vip_signals enable row level security;
create policy "anon_select_signals" on public.vip_signals for select using (true);
create policy "anon_insert_signals" on public.vip_signals for insert with check (true);
create policy "anon_update_signals" on public.vip_signals for update using (true);
create policy "anon_delete_signals" on public.vip_signals for delete using (true);

-- ── Memberships ───────────────────────────────────────────────────────────────
create table if not exists public.memberships (
  id           uuid primary key default gen_random_uuid(),
  user_id      text not null,
  name         text not null,
  email        text not null,
  phone        text,
  telegram     text,
  plan         text not null check (plan in ('vip','mentorship_1','mentorship_2','vip_group')),
  status       text not null default 'pending' check (status in ('pending','active','expired','cancelled')),
  joined_at    timestamptz not null default now(),
  expires_at   timestamptz,
  payment_ref  text,
  amount       text,
  notes        text,
  created_at   timestamptz not null default now()
);

alter table public.memberships enable row level security;
create policy "anon_select_memberships" on public.memberships for select using (true);
create policy "anon_insert_memberships" on public.memberships for insert with check (true);
create policy "anon_update_memberships" on public.memberships for update using (true);

-- ── Performance Stats ─────────────────────────────────────────────────────────
create table if not exists public.performance_stats (
  id          uuid primary key default gen_random_uuid(),
  month       text not null,        -- e.g. "January 2025"
  year        integer not null,
  profit_pct  numeric not null,     -- e.g. 18.5
  win_rate    numeric not null,     -- e.g. 72.0
  total_trades integer not null default 0,
  wins        integer not null default 0,
  losses      integer not null default 0,
  notes       text,
  created_at  timestamptz not null default now(),
  unique (month, year)
);

alter table public.performance_stats enable row level security;
create policy "anon_select_performance" on public.performance_stats for select using (true);
create policy "anon_insert_performance" on public.performance_stats for insert with check (true);
create policy "anon_update_performance" on public.performance_stats for update using (true);
create policy "anon_delete_performance" on public.performance_stats for delete using (true);

-- ── Seed performance data ─────────────────────────────────────────────────────
insert into public.performance_stats (month, year, profit_pct, win_rate, total_trades, wins, losses, notes)
values
  ('October',  2024, 14.0, 68.0, 22, 15, 7, 'Solid month'),
  ('November', 2024, 18.5, 72.0, 25, 18, 7, 'Gold & Forex'),
  ('December', 2024, 22.0, 75.0, 28, 21, 7, 'Year-end rally'),
  ('January',  2025, 18.0, 70.0, 20, 14, 6, null),
  ('February', 2025, 22.0, 74.0, 27, 20, 7, null),
  ('March',    2025, 16.0, 69.0, 23, 16, 7, null)
on conflict (month, year) do nothing;

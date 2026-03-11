-- Trading Accounts
create table if not exists public.trading_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  user_email text not null,
  broker_name text not null,
  account_type text not null default 'Broker',
  account_balance numeric default 0,
  initial_deposit numeric default 0,
  profit_target numeric default 0,
  current_profit numeric default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.trading_accounts enable row level security;
drop policy if exists "anon_all_trading_accounts" on public.trading_accounts;
create policy "anon_all_trading_accounts" on public.trading_accounts for all to anon using (true) with check (true);

-- Trading Journal
create table if not exists public.trading_journal (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  user_email text not null,
  pair text not null,
  entry_price numeric,
  exit_price numeric,
  profit_loss numeric default 0,
  trade_notes text,
  screenshot_url text,
  trade_date date default current_date,
  created_at timestamptz default now()
);
alter table public.trading_journal enable row level security;
drop policy if exists "anon_all_trading_journal" on public.trading_journal;
create policy "anon_all_trading_journal" on public.trading_journal for all to anon using (true) with check (true);

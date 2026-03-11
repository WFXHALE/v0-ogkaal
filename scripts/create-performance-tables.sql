-- user_performance_overrides: per-user editable stats
create table if not exists user_performance_overrides (
  id uuid primary key default gen_random_uuid(),
  user_email text not null unique,
  total_return numeric default 0,
  avg_win_rate numeric default 0,
  total_trades integer default 0,
  funded_passed integer default 0,
  funded_breached integer default 0,
  total_payouts integer default 0,
  updated_at timestamptz default now()
);

alter table user_performance_overrides enable row level security;
create policy "anon full access overrides" on user_performance_overrides
  for all using (true) with check (true);

-- certificates: achievement uploads
create table if not exists certificates (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  title text not null,
  description text,
  image_url text,
  created_at timestamptz default now()
);

alter table certificates enable row level security;
create policy "anon full access certs" on certificates
  for all using (true) with check (true);

-- Calendar alerts table
create table if not exists public.calendar_alerts (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null,
  event_id    text not null,          -- e.g. "2025-03-15_USD_NFP"
  event_title text not null,
  event_date  text not null,          -- ISO date string e.g. "2025-03-15"
  event_time  text not null,          -- e.g. "13:30"
  currency    text not null,
  impact      text not null,
  minutes_before integer not null,    -- 5 | 10 | 30
  notified    boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Unique constraint: one alert per user per event per timing
create unique index if not exists calendar_alerts_unique
  on public.calendar_alerts (user_id, event_id, minutes_before);

-- RLS
alter table public.calendar_alerts enable row level security;

create policy "users_select_own_alerts"
  on public.calendar_alerts for select
  using (true);

create policy "users_insert_own_alerts"
  on public.calendar_alerts for insert
  with check (true);

create policy "users_delete_own_alerts"
  on public.calendar_alerts for delete
  using (true);

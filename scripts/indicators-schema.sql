-- Create indicators table
create table if not exists public.indicators (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  creator         text not null,
  category        text not null check (category in ('SMC','ICT','Liquidity','Sessions','Tools')),
  description     text not null,
  tradingview_link text,
  thumbnail_url   text,
  is_published    boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- RLS
alter table public.indicators enable row level security;

-- Anyone can read published indicators
create policy "anon_select_indicators" on public.indicators
  for select using (true);

-- Anon (admin) can insert/update/delete
create policy "anon_insert_indicators" on public.indicators
  for insert with check (true);

create policy "anon_update_indicators" on public.indicators
  for update using (true);

create policy "anon_delete_indicators" on public.indicators
  for delete using (true);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists indicators_updated_at on public.indicators;
create trigger indicators_updated_at
  before update on public.indicators
  for each row execute procedure public.set_updated_at();

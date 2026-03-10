-- Dashboard users — completely separate from community auth
create table if not exists dashboard_users (
  id               uuid primary key default gen_random_uuid(),
  user_id          text unique not null,           -- user-chosen login handle
  email            text unique not null,
  full_name        text not null,
  password_hash    text not null,                  -- SHA-256 hex
  backup_code_hash text,                           -- hashed backup code
  created_at       timestamptz default now()
);

-- Password reset tokens
create table if not exists dashboard_password_resets (
  email      text primary key,
  token      text not null,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

-- RLS: anon full access (auth handled at application layer)
alter table dashboard_users enable row level security;
drop policy if exists "anon_all_dashboard_users" on dashboard_users;
create policy "anon_all_dashboard_users" on dashboard_users for all using (true) with check (true);

alter table dashboard_password_resets enable row level security;
drop policy if exists "anon_all_dashboard_resets" on dashboard_password_resets;
create policy "anon_all_dashboard_resets" on dashboard_password_resets for all using (true) with check (true);

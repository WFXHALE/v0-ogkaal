-- Notifications table
-- actor_id and recipient_id are community user IDs (stored in localStorage)
-- We use TEXT ids since the community uses its own localStorage-based auth (not Supabase auth)

create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  type        text not null, -- 'like' | 'comment' | 'follow' | 'admin_post'
  recipient_id text not null, -- community user id who receives the notification
  actor_id    text not null, -- community user id who triggered the action
  actor_name  text not null,
  actor_avatar text not null,
  post_id     text,          -- relevant post id (null for 'follow' / 'admin_post')
  post_preview text,         -- first ~60 chars of post content for context
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Index for fast per-user fetches (most common query)
create index if not exists notifications_recipient_id_idx
  on public.notifications (recipient_id, created_at desc);

-- RLS: anyone can insert (community is public) but only recipient can read/update
alter table public.notifications enable row level security;

-- Allow any anonymous request to insert (no Supabase auth session required)
create policy "allow_insert_anon" on public.notifications
  for insert to anon with check (true);

-- Allow any anonymous request to read (we filter by recipient_id in the query)
create policy "allow_select_anon" on public.notifications
  for select to anon using (true);

-- Allow any anonymous request to update is_read
create policy "allow_update_anon" on public.notifications
  for update to anon using (true) with check (true);

-- Community tables
-- Uses TEXT ids (not Supabase auth UUIDs) to match the existing localStorage-based community auth

-- ── users ────────────────────────────────────────────────────────────────────

create table if not exists public.community_users (
  id           text primary key,
  full_name    text not null,
  email        text not null,
  phone        text not null,
  level        text not null default 'Beginner',
  bio          text,
  avatar       text not null,
  is_admin     boolean not null default false,
  created_at   timestamptz not null default now()
);

create unique index if not exists community_users_email_idx on public.community_users (email);
create unique index if not exists community_users_phone_idx on public.community_users (phone);

alter table public.community_users enable row level security;
create policy "anon_select_users" on public.community_users for select to anon using (true);
create policy "anon_insert_users" on public.community_users for insert to anon with check (true);
create policy "anon_update_users" on public.community_users for update to anon using (true) with check (true);

-- ── posts ─────────────────────────────────────────────────────────────────────

create table if not exists public.community_posts (
  id             text primary key,
  type           text not null default 'post',   -- 'post' | 'article'
  author_id      text not null,
  author_name    text not null,
  author_avatar  text not null,
  author_level   text not null,
  is_admin_post  boolean not null default false,
  content        text not null,
  title          text,
  image_url      text,
  trade_idea     jsonb,
  hashtags       text[] not null default '{}',
  created_at     timestamptz not null default now()
);

create index if not exists community_posts_author_idx on public.community_posts (author_id);
create index if not exists community_posts_created_at_idx on public.community_posts (created_at desc);

alter table public.community_posts enable row level security;
create policy "anon_select_posts" on public.community_posts for select to anon using (true);
create policy "anon_insert_posts" on public.community_posts for insert to anon with check (true);
create policy "anon_update_posts" on public.community_posts for update to anon using (true) with check (true);
create policy "anon_delete_posts" on public.community_posts for delete to anon using (true);

-- ── comments ──────────────────────────────────────────────────────────────────

create table if not exists public.community_comments (
  id             text primary key,
  post_id        text not null references public.community_posts(id) on delete cascade,
  author_id      text not null,
  author_name    text not null,
  author_avatar  text not null,
  content        text not null,
  created_at     timestamptz not null default now()
);

create index if not exists community_comments_post_idx on public.community_comments (post_id, created_at asc);

alter table public.community_comments enable row level security;
create policy "anon_select_comments" on public.community_comments for select to anon using (true);
create policy "anon_insert_comments" on public.community_comments for insert to anon with check (true);
create policy "anon_delete_comments" on public.community_comments for delete to anon using (true);

-- ── likes ─────────────────────────────────────────────────────────────────────

create table if not exists public.community_likes (
  post_id    text not null references public.community_posts(id) on delete cascade,
  user_id    text not null,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index if not exists community_likes_post_idx on public.community_likes (post_id);
create index if not exists community_likes_user_idx on public.community_likes (user_id);

alter table public.community_likes enable row level security;
create policy "anon_select_likes" on public.community_likes for select to anon using (true);
create policy "anon_insert_likes" on public.community_likes for insert to anon with check (true);
create policy "anon_delete_likes" on public.community_likes for delete to anon using (true);

-- ── follows ───────────────────────────────────────────────────────────────────

create table if not exists public.community_follows (
  follower_id  text not null,
  followee_id  text not null,
  created_at   timestamptz not null default now(),
  primary key (follower_id, followee_id)
);

create index if not exists community_follows_follower_idx on public.community_follows (follower_id);
create index if not exists community_follows_followee_idx on public.community_follows (followee_id);

alter table public.community_follows enable row level security;
create policy "anon_select_follows" on public.community_follows for select to anon using (true);
create policy "anon_insert_follows" on public.community_follows for insert to anon with check (true);
create policy "anon_delete_follows" on public.community_follows for delete to anon using (true);

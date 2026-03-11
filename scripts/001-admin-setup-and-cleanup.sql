-- ============================================================
-- OG KAAL TRADER — Admin Setup & Data Cleanup
-- Run once to: delete all test/fake data, create admin account,
-- seed a single Welcome Post in the community.
-- ============================================================

-- ── 1. Clean up all fake/test data ───────────────────────────────────────────

-- Community: remove all posts, likes, comments, follows (except the seed we add below)
DELETE FROM community_comments;
DELETE FROM community_likes;
DELETE FROM community_follows;
DELETE FROM community_posts;

-- Community users: remove all test/fake accounts
DELETE FROM community_users;

-- Dashboard users: remove all test/fake accounts
DELETE FROM dashboard_users;

-- Admin submissions: remove test submissions
DELETE FROM admin_submissions;

-- Memberships: remove test memberships
DELETE FROM memberships;

-- ── 2. Create the admin community user (OG Kaal Trader) ──────────────────────

INSERT INTO community_users (id, full_name, email, phone, level, bio, avatar, is_admin, created_at)
VALUES (
  'admin_shahid',
  'Shahid Bashir',
  'sheikhahmed2724@gmail.com',
  '+919541281829',
  'Master Trader',
  'Founder of OG KAAL TRADER | FX KAAL TRADER. Master Trader & Mentor. Teaching Smart Money Concepts (SMC) and ICT trading models.',
  'https://ui-avatars.com/api/?name=Shahid+Bashir&background=FCD535&color=000&bold=true&size=128',
  true,
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  full_name  = EXCLUDED.full_name,
  email      = EXCLUDED.email,
  phone      = EXCLUDED.phone,
  level      = EXCLUDED.level,
  bio        = EXCLUDED.bio,
  is_admin   = true;

-- ── 3. Seed the single Welcome Post ──────────────────────────────────────────

INSERT INTO community_posts (id, type, author_id, author_name, author_avatar, author_level, is_admin_post, title, content, hashtags, created_at)
VALUES (
  'welcome_post_v1',
  'article',
  'admin_shahid',
  'Shahid Bashir',
  'https://ui-avatars.com/api/?name=Shahid+Bashir&background=FCD535&color=000&bold=true&size=128',
  'Master Trader',
  true,
  'Welcome to OG KAAL TRADER Community',
  E'Assalamu Alaikum and welcome!\n\nI am Shahid Bashir — also known as OG KAAL TRADER and FX KAAL TRADER. I have been trading the financial markets for years, specialising in Smart Money Concepts (SMC) and ICT (Inner Circle Trader) trading models across Forex, Gold, Indices, and Crypto.\n\nThis platform — OG KAAL TRADER — was built to give serious traders access to:\n\n• Professional-grade trading education (SMC & ICT)\n• Live VIP signals and market analysis\n• A dedicated mentorship program\n• A community where traders grow together\n\nThis Community section is your space to share ideas, post trade setups, ask questions, and connect with fellow traders on the same journey. I will personally post market insights, trade ideas, and educational content here regularly.\n\nA few community guidelines:\n• Be respectful and constructive\n• Share real trade ideas with proper analysis\n• No spam, no promotions, no copy-paste content\n• Learn, grow, and help others grow\n\nWhether you are a beginner taking your first steps into trading or an intermediate trader looking to sharpen your edge — you are in the right place.\n\nLet us build something great together. Welcome to the family.',
  ARRAY['Welcome', 'SMC', 'ICT', 'Trading', 'Community'],
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title   = EXCLUDED.title,
  content = EXCLUDED.content;

-- Test insert into community_posts to confirm Supabase connection
-- This inserts a visible test post then immediately cleans it up

INSERT INTO community_posts (
  id,
  author_id,
  author_name,
  author_avatar,
  author_level,
  type,
  content,
  is_admin_post,
  hashtags
) VALUES (
  'test_post_connection_check',
  'test_user',
  'Connection Test',
  'https://ui-avatars.com/api/?name=Test&background=FCD535&color=000',
  'intermediate',
  'post',
  'Supabase connection verified successfully from v0 project.',
  false,
  '{"test","supabase"}'
);

-- Confirm it exists
SELECT id, author_name, content, created_at
FROM community_posts
WHERE id = 'test_post_connection_check';

-- Clean up
DELETE FROM community_posts WHERE id = 'test_post_connection_check';

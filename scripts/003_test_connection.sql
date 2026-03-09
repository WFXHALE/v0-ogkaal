-- Connection test: insert a test row into community_users and immediately fetch it back

insert into public.community_users (id, full_name, email, phone, level, avatar, is_admin)
values (
  'test_connection_row',
  'Connection Test',
  'test@ogkaaltrader.internal',
  '0000000001',
  'Beginner',
  'https://ui-avatars.com/api/?name=CT&background=6366f1&color=fff',
  false
)
on conflict (id) do nothing;

select id, full_name, email, level, created_at
from public.community_users
where id = 'test_connection_row';

-- Clean up
delete from public.community_users where id = 'test_connection_row';

-- Assign admin role by email without handling password in SQL.
-- Run in Supabase SQL editor after the user account exists.

insert into public.user_roles (user_id, role)
select u.id, 'admin'
from auth.users u
where lower(u.email) = lower('pravotobot@gmail.com')
on conflict (user_id, role) do nothing;

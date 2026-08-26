-- Allow portal admin to look up a user by email without service role
-- Uses security definer to access auth.users

create or replace function find_user_id_by_email(p_email text)
returns uuid
language sql
security definer
stable
as $$
  select id from auth.users where email = p_email limit 1;
$$;

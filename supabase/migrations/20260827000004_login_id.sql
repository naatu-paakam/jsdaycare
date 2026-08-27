-- Add login_id (username) to profiles — optional, used for login without email
alter table profiles add column if not exists login_id text unique;
alter table profiles add column if not exists phone text;

-- Allow anyone to look up a login_id to map to internal email for login
create or replace function get_email_by_login_id(p_login_id text)
returns text
language sql
security definer
stable
as $$
  select email from auth.users u
  join profiles p on p.id = u.id
  where p.login_id = p_login_id
  limit 1;
$$;

grant execute on function get_email_by_login_id(text) to anon, authenticated;

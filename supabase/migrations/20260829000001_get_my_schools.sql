-- Fix multi-school sidebar: RLS on schools table blocks reading schools
-- you're a member of but isn't your active school_id.
-- This security definer function bypasses RLS to return all schools for the current user.

create or replace function get_my_schools()
returns table(id uuid, name text, timezone text, created_at timestamptz)
language sql
security definer
stable
as $$
  select s.id, s.name, s.timezone, s.created_at
  from schools s
  join school_memberships sm on sm.school_id = s.id
  where sm.profile_id = auth.uid()
  order by s.name;
$$;

grant execute on function get_my_schools() to authenticated;

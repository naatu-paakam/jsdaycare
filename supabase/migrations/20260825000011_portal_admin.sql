-- Portal Admin — platform-level super admin
-- Can create schools and assign school admins. Not scoped to any single school.

-- 1. Add portal_admin to role enum
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check
  check (role in ('admin','staff','parent','portal_admin'));

-- 2. Portal admin policies

-- Schools: portal_admin can read/create/update all schools
create policy "portal_admin_schools" on schools
  for all using (get_my_role() = 'portal_admin')
  with check (get_my_role() = 'portal_admin');

-- Profiles: portal_admin can read all profiles and update role/school_id
create policy "portal_admin_profiles" on profiles
  for all using (get_my_role() = 'portal_admin')
  with check (get_my_role() = 'portal_admin');

-- School memberships: portal_admin can manage all
create policy "portal_admin_memberships" on school_memberships
  for all using (get_my_role() = 'portal_admin')
  with check (get_my_role() = 'portal_admin');

-- 3. Helper function: get all schools (for portal admin dashboard)
create or replace function get_all_schools()
returns table (
  id          uuid,
  name        text,
  timezone    text,
  created_at  timestamptz,
  admin_count bigint,
  staff_count bigint
)
language sql
security definer
stable
as $$
  select
    s.id, s.name, s.timezone, s.created_at,
    count(p.id) filter (where p.role = 'admin') as admin_count,
    count(p.id) filter (where p.role = 'staff') as staff_count
  from schools s
  left join profiles p on p.school_id = s.id
  group by s.id, s.name, s.timezone, s.created_at
  order by s.name;
$$;

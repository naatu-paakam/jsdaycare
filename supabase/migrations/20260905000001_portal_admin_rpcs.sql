-- Security-definer RPCs for portal admin cross-school reads
-- These bypass RLS so portal admin (school_id=null) can read across all schools
-- Only callable by authenticated users — portal_admin role enforced app-side

-- 1. All schools with stats (students, staff, active students, admins)
create or replace function get_all_schools_with_stats()
returns table (
  id uuid, name text, timezone text, address jsonb, phone text, email text,
  created_at timestamptz,
  total_students bigint, active_students bigint, total_staff bigint
)
language plpgsql security definer set search_path = public
as $$
begin
  return query
  select
    s.id, s.name, s.timezone, s.address, s.phone, s.email, s.created_at,
    (select count(*) from students st where st.school_id = s.id),
    (select count(*) from students st where st.school_id = s.id and st.enrollment_status = 'active'),
    (select count(*) from profiles p where p.school_id = s.id and p.role = 'staff')
  from schools s
  order by s.name;
end;
$$;
grant execute on function get_all_schools_with_stats() to authenticated;

-- 2. All profiles across all schools (for Users tab)
create or replace function get_all_profiles_admin()
returns table (
  id uuid, full_name text, login_id text, role text, school_id uuid, phone text
)
language plpgsql security definer set search_path = public
as $$
begin
  return query
  select p.id, p.full_name, p.login_id, p.role, p.school_id, p.phone
  from profiles p
  where p.role != 'portal_admin'
  order by p.full_name;
end;
$$;
grant execute on function get_all_profiles_admin() to authenticated;

-- 3. All school memberships with profile info (for admin counts)
create or replace function get_all_memberships_admin()
returns table (
  profile_id uuid, school_id uuid, role text, full_name text, phone text
)
language plpgsql security definer set search_path = public
as $$
begin
  return query
  select m.profile_id, m.school_id, m.role, p.full_name, p.phone
  from school_memberships m
  join profiles p on p.id = m.profile_id;
end;
$$;
grant execute on function get_all_memberships_admin() to authenticated;

-- 4. All pending invitations (non-permanent, unused)
create or replace function get_pending_invitations_admin()
returns table (
  id uuid, email text, role text, school_id uuid, expires_at timestamptz, created_at timestamptz
)
language plpgsql security definer set search_path = public
as $$
begin
  return query
  select i.id, i.email, i.role, i.school_id, i.expires_at, i.created_at
  from invitations i
  where i.used_at is null and i.permanent = false
  order by i.created_at desc;
end;
$$;
grant execute on function get_pending_invitations_admin() to authenticated;

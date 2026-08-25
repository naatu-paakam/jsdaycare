-- Multi-school admin support
-- Admins can manage more than one school.
-- profiles.school_id = currently active school (for RLS + UI context)
-- school_memberships = all schools an admin/staff has access to

create table if not exists school_memberships (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  school_id  uuid not null references schools(id)  on delete cascade,
  role       text not null check (role in ('admin','staff')),
  created_at timestamptz default now(),
  unique(profile_id, school_id)
);

alter table school_memberships enable row level security;

-- Anyone can read their own memberships
create policy "memberships_own" on school_memberships
  for select using (profile_id = auth.uid());

-- Admins can manage memberships within their current school
create policy "memberships_admin" on school_memberships
  for all using (
    school_id = get_my_school_id() and get_my_role() = 'admin'
  );

-- Backfill existing profiles into school_memberships
insert into school_memberships (profile_id, school_id, role)
select id, school_id, role
from profiles
where school_id is not null and role in ('admin', 'staff')
on conflict (profile_id, school_id) do nothing;

-- Function: switch active school for current user
-- Updates profiles.school_id — affects all subsequent RLS checks
create or replace function switch_active_school(p_school_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  -- Verify caller has membership in the target school
  if not exists (
    select 1 from school_memberships
    where profile_id = auth.uid() and school_id = p_school_id
  ) then
    raise exception 'Access denied: not a member of this school';
  end if;

  update profiles set school_id = p_school_id where id = auth.uid();
end;
$$;

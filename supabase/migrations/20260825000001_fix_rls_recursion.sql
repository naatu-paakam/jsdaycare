-- Fix infinite recursion in profiles RLS
-- The policies on `profiles` were referencing `profiles` themselves → recursion.
-- Solution: use a SECURITY DEFINER helper function that bypasses RLS.

-- Helper: returns the calling user's school_id (bypasses RLS via security definer)
create or replace function get_my_school_id()
returns uuid
language sql
security definer
stable
as $$
  select school_id from profiles where id = auth.uid() limit 1;
$$;

-- Helper: returns the calling user's role (bypasses RLS via security definer)
create or replace function get_my_role()
returns text
language sql
security definer
stable
as $$
  select role from profiles where id = auth.uid() limit 1;
$$;

-- ── Drop old recursive policies ──────────────────────────────────────────────

drop policy if exists "admin_all_schools"    on schools;
drop policy if exists "admin_all_profiles"   on profiles;
drop policy if exists "own_profile_read"     on profiles;
drop policy if exists "own_profile_update"   on profiles;
drop policy if exists "admin_rooms"          on rooms;
drop policy if exists "admin_room_staff"     on room_staff;
drop policy if exists "admin_students"       on students;
drop policy if exists "admin_contacts"       on student_contacts;
drop policy if exists "admin_emergency"      on student_emergency_contacts;
drop policy if exists "admin_documents"      on student_documents;
drop policy if exists "admin_enrollment"     on student_enrollment_details;
drop policy if exists "admin_immunizations"  on student_immunizations;
drop policy if exists "admin_attendance"     on attendance;
drop policy if exists "admin_staff_profiles" on staff_profiles;
drop policy if exists "own_staff_profile"    on staff_profiles;
drop policy if exists "admin_staff_checkins" on staff_checkins;
drop policy if exists "admin_activities"     on activities;
drop policy if exists "admin_nap_checks"     on nap_sleep_checks;
drop policy if exists "admin_media"          on activity_media;

-- ── schools ──────────────────────────────────────────────────────────────────

create policy "schools_admin" on schools
  for all using (id = get_my_school_id());

-- ── profiles ─────────────────────────────────────────────────────────────────
-- Use auth.uid() directly — no self-reference

create policy "profiles_own_read" on profiles
  for select using (id = auth.uid());

create policy "profiles_own_update" on profiles
  for update using (id = auth.uid());

-- Admin can see all profiles in their school — use helper, not subquery on profiles
create policy "profiles_admin_all" on profiles
  for all using (school_id = get_my_school_id() and get_my_role() = 'admin');

-- ── rooms ─────────────────────────────────────────────────────────────────────

create policy "rooms_admin" on rooms
  for all using (school_id = get_my_school_id() and get_my_role() = 'admin');

create policy "rooms_staff_read" on rooms
  for select using (school_id = get_my_school_id() and get_my_role() in ('admin','staff'));

-- ── room_staff ────────────────────────────────────────────────────────────────

create policy "room_staff_admin" on room_staff
  for all using (get_my_role() = 'admin');

create policy "room_staff_read" on room_staff
  for select using (get_my_role() in ('admin','staff'));

-- ── students ──────────────────────────────────────────────────────────────────

create policy "students_admin" on students
  for all using (school_id = get_my_school_id() and get_my_role() = 'admin');

create policy "students_staff_read" on students
  for select using (school_id = get_my_school_id() and get_my_role() = 'staff');

-- Parents see their children via student_contacts email match
create policy "students_parent_read" on students
  for select using (
    id in (
      select student_id from student_contacts
      where email = (select email from auth.users where id = auth.uid())
    )
  );

-- ── student_contacts ──────────────────────────────────────────────────────────

create policy "contacts_admin" on student_contacts
  for all using (
    student_id in (select id from students where school_id = get_my_school_id())
    and get_my_role() = 'admin'
  );

create policy "contacts_staff_read" on student_contacts
  for select using (
    student_id in (select id from students where school_id = get_my_school_id())
    and get_my_role() = 'staff'
  );

create policy "contacts_parent_read" on student_contacts
  for select using (
    email = (select email from auth.users where id = auth.uid())
  );

-- ── student_emergency_contacts ────────────────────────────────────────────────

create policy "emergency_admin" on student_emergency_contacts
  for all using (
    student_id in (select id from students where school_id = get_my_school_id())
    and get_my_role() = 'admin'
  );

create policy "emergency_staff_read" on student_emergency_contacts
  for select using (
    student_id in (select id from students where school_id = get_my_school_id())
    and get_my_role() in ('admin','staff')
  );

-- ── student_documents ─────────────────────────────────────────────────────────

create policy "documents_admin" on student_documents
  for all using (
    student_id in (select id from students where school_id = get_my_school_id())
    and get_my_role() = 'admin'
  );

-- ── student_enrollment_details ────────────────────────────────────────────────

create policy "enrollment_admin" on student_enrollment_details
  for all using (
    student_id in (select id from students where school_id = get_my_school_id())
    and get_my_role() = 'admin'
  );

-- ── student_immunizations ─────────────────────────────────────────────────────

create policy "immunizations_admin" on student_immunizations
  for all using (
    student_id in (select id from students where school_id = get_my_school_id())
    and get_my_role() = 'admin'
  );

create policy "immunizations_staff_read" on student_immunizations
  for select using (
    student_id in (select id from students where school_id = get_my_school_id())
    and get_my_role() in ('admin','staff')
  );

-- ── attendance ────────────────────────────────────────────────────────────────

create policy "attendance_admin" on attendance
  for all using (
    room_id in (select id from rooms where school_id = get_my_school_id())
    and get_my_role() = 'admin'
  );

create policy "attendance_staff" on attendance
  for all using (
    room_id in (select id from rooms where school_id = get_my_school_id())
    and get_my_role() = 'staff'
  );

create policy "attendance_parent_read" on attendance
  for select using (
    student_id in (
      select student_id from student_contacts
      where email = (select email from auth.users where id = auth.uid())
    )
  );

-- ── staff_profiles ────────────────────────────────────────────────────────────

create policy "staff_profiles_admin" on staff_profiles
  for all using (school_id = get_my_school_id() and get_my_role() = 'admin');

create policy "staff_profiles_own" on staff_profiles
  for select using (id = auth.uid());

-- ── staff_checkins ────────────────────────────────────────────────────────────

create policy "staff_checkins_admin" on staff_checkins
  for all using (
    staff_id in (select id from staff_profiles where school_id = get_my_school_id())
    and get_my_role() = 'admin'
  );

create policy "staff_checkins_own" on staff_checkins
  for all using (staff_id = auth.uid());

-- ── activities ────────────────────────────────────────────────────────────────

create policy "activities_admin" on activities
  for all using (school_id = get_my_school_id() and get_my_role() = 'admin');

create policy "activities_staff" on activities
  for all using (school_id = get_my_school_id() and get_my_role() = 'staff');

create policy "activities_parent_read" on activities
  for select using (
    student_id in (
      select student_id from student_contacts
      where email = (select email from auth.users where id = auth.uid())
    )
    and staff_only = false
  );

-- ── nap_sleep_checks ─────────────────────────────────────────────────────────

create policy "nap_checks_admin_staff" on nap_sleep_checks
  for all using (get_my_role() in ('admin','staff'));

-- ── activity_media ────────────────────────────────────────────────────────────

create policy "media_admin_staff" on activity_media
  for all using (get_my_role() in ('admin','staff'));

create policy "media_parent_read" on activity_media
  for select using (
    activity_id in (
      select id from activities
      where student_id in (
        select student_id from student_contacts
        where email = (select email from auth.users where id = auth.uid())
      )
      and staff_only = false
    )
  );

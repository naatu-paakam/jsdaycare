-- ============================================================
-- Isolation fixes + 6-digit PIN codes
-- 1. Parent can only see their own children (not other students)
-- 2. Admin scoped strictly to their own school
-- 3. PIN codes upgraded to 6 digits, unique per school
-- ============================================================

-- ── 1. Fix student isolation by role ─────────────────────────────────────────

-- Drop the single permissive policy that lets all school members see all students
drop policy if exists "students_rw" on students;

-- Admin + Staff: see all students in their school
create policy "students_admin_staff" on students for all
  using (school_id = get_my_school_id() and get_my_role() in ('admin', 'staff'));

-- Parent: only see students they are linked to via student_contacts
create policy "students_parent" on students for select
  using (
    id in (
      select student_id from student_contacts
      where email = auth.email()
    )
  );

-- ── Fix contacts isolation: parent can only see contacts for their children ──
drop policy if exists "contacts_rw"     on student_contacts;
drop policy if exists "contacts_parent" on student_contacts;
drop policy if exists "contacts_parent" on student_contacts; -- migration 4 version

-- Admin + Staff: all contacts in their school
create policy "contacts_admin_staff" on student_contacts for all
  using (school_id = get_my_school_id() and get_my_role() in ('admin', 'staff'));

-- Parent: only contacts linked to their own children
create policy "contacts_parent" on student_contacts for select
  using (
    student_id in (
      select student_id from student_contacts sc2
      where sc2.email = auth.email()
    )
  );

-- Parent can insert/update pickup contacts for their children only
create policy "contacts_parent_write" on student_contacts for insert
  with check (
    student_id in (
      select student_id from student_contacts sc2
      where sc2.email = auth.email()
    )
    and get_my_role() = 'parent'
  );

create policy "contacts_parent_update" on student_contacts for update
  using (
    student_id in (
      select student_id from student_contacts sc2
      where sc2.email = auth.email()
    )
    and get_my_role() = 'parent'
  );

-- ── Fix emergency contacts isolation ─────────────────────────────────────────
drop policy if exists "emergency_rw" on student_emergency_contacts;

create policy "emergency_admin_staff" on student_emergency_contacts for all
  using (
    student_id in (select id from students where school_id = get_my_school_id())
    and get_my_role() in ('admin', 'staff')
  );

create policy "emergency_parent" on student_emergency_contacts for all
  using (
    student_id in (
      select student_id from student_contacts where email = auth.email()
    )
    and get_my_role() = 'parent'
  );

-- ── Fix activities isolation: parents see only their child's non-staff entries
drop policy if exists "activities_rw" on activities;

create policy "activities_admin_staff" on activities for all
  using (school_id = get_my_school_id() and get_my_role() in ('admin', 'staff'));

create policy "activities_parent" on activities for select
  using (
    student_id in (
      select student_id from student_contacts where email = auth.email()
    )
    and staff_only = false
    and get_my_role() = 'parent'
  );

-- ── Fix immunizations isolation ───────────────────────────────────────────────
drop policy if exists "immunizations_rw" on student_immunizations;

create policy "immunizations_admin_staff" on student_immunizations for all
  using (
    student_id in (select id from students where school_id = get_my_school_id())
    and get_my_role() in ('admin', 'staff')
  );

create policy "immunizations_parent" on student_immunizations for all
  using (
    student_id in (
      select student_id from student_contacts where email = auth.email()
    )
    and get_my_role() = 'parent'
  );

-- ── Fix attendance isolation ─────────────────────────────────────────────────
drop policy if exists "attendance_rw" on attendance;

create policy "attendance_admin_staff" on attendance for all
  using (
    room_id in (select id from rooms where school_id = get_my_school_id())
    and get_my_role() in ('admin', 'staff')
  );

create policy "attendance_parent" on attendance for select
  using (
    student_id in (
      select student_id from student_contacts where email = auth.email()
    )
    and get_my_role() = 'parent'
  );

-- ── 2. School isolation: ensure schools policy is tight ───────────────────────
-- Already correct: schools_admin uses get_my_school_id()
-- Schools are already fully isolated by school_id on all tables

-- ── 3. PIN codes: upgrade to 6 digits, unique per school ─────────────────────

-- Widen the column from varchar(4) to varchar(6)
alter table student_contacts
  alter column pin_code type varchar(6);

-- Reassign all existing PINs to unique 6-digit values before adding constraint
do $$
declare
  rec record;
  v_pin varchar(6);
  v_attempt int;
begin
  for rec in select id, school_id from student_contacts where pin_code is not null loop
    v_attempt := 0;
    loop
      v_pin := lpad((floor(random() * 900000) + 100000)::int::text, 6, '0');
      if not exists (
        select 1 from student_contacts
        where school_id = rec.school_id and pin_code = v_pin and id <> rec.id
      ) then
        update student_contacts set pin_code = v_pin where id = rec.id;
        exit;
      end if;
      v_attempt := v_attempt + 1;
      if v_attempt > 200 then raise exception 'PIN generation failed'; end if;
    end loop;
  end loop;
end;
$$;

-- Now safe to add unique constraint
create unique index if not exists uniq_pin_per_school
  on student_contacts (school_id, pin_code)
  where pin_code is not null;

-- Helper function: generate a new 6-digit PIN not yet used in a school
create or replace function generate_unique_pin(p_school_id uuid)
returns varchar(6)
language plpgsql
security definer
as $$
declare
  v_pin varchar(6);
  v_attempts int := 0;
begin
  loop
    -- Random 6-digit number, zero-padded
    v_pin := lpad((floor(random() * 900000) + 100000)::text, 6, '0');
    -- Check uniqueness within school
    if not exists (
      select 1 from student_contacts
      where school_id = p_school_id and pin_code = v_pin
    ) then
      return v_pin;
    end if;
    v_attempts := v_attempts + 1;
    if v_attempts > 100 then
      raise exception 'Could not generate unique PIN after 100 attempts';
    end if;
  end loop;
end;
$$;

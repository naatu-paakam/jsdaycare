-- Fix: contacts_parent policy self-references student_contacts → recursion
-- Solution: security definer function to get parent's student IDs without triggering RLS

create or replace function get_my_student_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select student_id from student_contacts
  where email = auth.email()
$$;

-- Drop recursive policies
drop policy if exists "contacts_parent"        on student_contacts;
drop policy if exists "contacts_parent_write"  on student_contacts;
drop policy if exists "contacts_parent_update" on student_contacts;
drop policy if exists "students_parent"        on students;
drop policy if exists "emergency_parent"       on student_emergency_contacts;
drop policy if exists "immunizations_parent"   on student_immunizations;
drop policy if exists "activities_parent"      on activities;
drop policy if exists "attendance_parent"      on attendance;

-- Recreate using the security definer function (no self-reference)
create policy "contacts_parent" on student_contacts
  for select using (student_id in (select get_my_student_ids()));

create policy "contacts_parent_write" on student_contacts
  for insert with check (
    student_id in (select get_my_student_ids()) and get_my_role() = 'parent'
  );

create policy "contacts_parent_update" on student_contacts
  for update using (
    student_id in (select get_my_student_ids()) and get_my_role() = 'parent'
  );

create policy "students_parent" on students
  for select using (id in (select get_my_student_ids()));

create policy "emergency_parent" on student_emergency_contacts
  for all using (
    student_id in (select get_my_student_ids()) and get_my_role() = 'parent'
  );

create policy "immunizations_parent" on student_immunizations
  for all using (
    student_id in (select get_my_student_ids()) and get_my_role() = 'parent'
  );

create policy "activities_parent" on activities
  for select using (
    student_id in (select get_my_student_ids())
    and staff_only = false
    and get_my_role() = 'parent'
  );

create policy "attendance_parent" on attendance
  for select using (
    student_id in (select get_my_student_ids()) and get_my_role() = 'parent'
  );

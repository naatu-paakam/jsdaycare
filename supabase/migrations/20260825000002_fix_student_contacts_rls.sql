-- Add school_id to student_contacts to break cross-table RLS recursion
alter table student_contacts add column if not exists school_id uuid references schools(id);

-- Backfill from students table
update student_contacts sc
set school_id = s.school_id
from students s
where sc.student_id = s.id;

-- Drop the circular policies
drop policy if exists "contacts_admin"       on student_contacts;
drop policy if exists "contacts_staff_read"  on student_contacts;
drop policy if exists "contacts_parent_read" on student_contacts;
drop policy if exists "students_parent_read" on students;

-- Recreate without cross-referencing students ↔ student_contacts
create policy "contacts_admin" on student_contacts
  for all using (school_id = get_my_school_id() and get_my_role() = 'admin');

create policy "contacts_staff_read" on student_contacts
  for select using (school_id = get_my_school_id() and get_my_role() = 'staff');

create policy "contacts_parent_read" on student_contacts
  for select using (
    email = (select email from auth.users where id = auth.uid())
  );

-- Parent can read their own children via student_contacts (no students→contacts loop)
create policy "students_parent_read" on students
  for select using (
    id in (
      select student_id from student_contacts
      where email = (select email from auth.users where id = auth.uid())
        and school_id = get_my_school_id()
    )
  );

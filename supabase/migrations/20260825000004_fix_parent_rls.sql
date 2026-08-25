-- Fix parent RLS: auth.users is not accessible; use auth.email() built-in instead

drop policy if exists "contacts_parent" on student_contacts;

create policy "contacts_parent" on student_contacts
  for select using (email = auth.email());

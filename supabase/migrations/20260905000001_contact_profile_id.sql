-- Add profile_id to student_contacts for direct parent-to-contact linking
-- More reliable than email matching (works for User-ID-only registrations)
alter table student_contacts
  add column if not exists profile_id uuid references profiles(id) on delete set null;

create index if not exists idx_student_contacts_profile_id on student_contacts(profile_id);

-- Update get_my_student_ids to use profile_id (UUID) as primary match
-- Fallback to email for contacts created before profile_id was added
create or replace function get_my_student_ids()
returns setof uuid language sql security definer stable
as $$
  select student_id from student_contacts where profile_id = auth.uid()
  union
  select student_id from student_contacts where email = auth.email() and email is not null
$$;

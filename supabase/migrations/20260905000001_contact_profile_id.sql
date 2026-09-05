-- Add profile_id to student_contacts for direct parent-to-contact linking
-- More reliable than email matching (works for User-ID-only registrations)
alter table student_contacts
  add column if not exists profile_id uuid references profiles(id) on delete set null;

create index if not exists idx_student_contacts_profile_id on student_contacts(profile_id);

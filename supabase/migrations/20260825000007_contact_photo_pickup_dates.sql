-- Add photo_url and pickup date range to student_contacts
alter table student_contacts
  add column if not exists photo_url        text,
  add column if not exists pickup_valid_from date,
  add column if not exists pickup_valid_to   date;

-- Storage bucket for contact photos (public read, auth write)
insert into storage.buckets (id, name, public)
values ('contact-photos', 'contact-photos', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload to contact-photos
create policy "contact_photos_upload" on storage.objects
  for insert with check (bucket_id = 'contact-photos' and auth.role() = 'authenticated');

create policy "contact_photos_update" on storage.objects
  for update using (bucket_id = 'contact-photos' and auth.role() = 'authenticated');

create policy "contact_photos_public_read" on storage.objects
  for select using (bucket_id = 'contact-photos');

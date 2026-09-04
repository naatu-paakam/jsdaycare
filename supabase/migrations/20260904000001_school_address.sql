-- Add address, phone, email to schools for school website and contact display
alter table schools
  add column if not exists address jsonb,   -- { street, city, state, zip }
  add column if not exists phone  text,
  add column if not exists email  text;

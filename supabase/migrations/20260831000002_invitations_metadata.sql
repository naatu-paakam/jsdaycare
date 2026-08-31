-- Add metadata column to invitations for pre-filling staff profile info
-- Used by AddStaffDialog to store { full_name, phone, avatar_url }
-- so the registration page can pre-fill the form.
alter table invitations add column if not exists metadata jsonb;

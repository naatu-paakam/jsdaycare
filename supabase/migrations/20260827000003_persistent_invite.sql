-- Add permanent flag to invitations (permanent invites don't expire and can be reused)
alter table invitations add column if not exists permanent bool not null default false;
-- Unique index: one permanent invite per school+role
create unique index if not exists uniq_permanent_invite on invitations(school_id, role) where permanent = true;

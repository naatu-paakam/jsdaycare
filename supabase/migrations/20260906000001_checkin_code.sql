-- Add checkin_code column to profiles for staff/parent self-service PIN
-- The code is scoped unique per school so two people at the same school can't share a code.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS checkin_code varchar(6);

-- Partial unique index: only enforce uniqueness when checkin_code is not null
-- (nullable rows are excluded from unique constraints automatically in Postgres)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_school_checkin_code_unique
  ON profiles (school_id, checkin_code)
  WHERE checkin_code IS NOT NULL;

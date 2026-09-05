-- Move check-in code ownership from student_contacts.pin_code to profiles.checkin_code
-- Uniqueness is now global (across all schools), not school-scoped.

-- 1. Drop the school-scoped unique index on profiles.checkin_code (from previous migration)
DROP INDEX IF EXISTS profiles_school_checkin_code_unique;

-- 2. Add a global unique index on profiles.checkin_code (partial — only when not null)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_checkin_code_global_unique
  ON profiles(checkin_code)
  WHERE checkin_code IS NOT NULL;

-- 3. Migrate existing pin_code values from student_contacts → profiles.checkin_code
--    Only for contacts that already have a linked profile (profile_id is set)
--    and whose profile does not yet have a checkin_code.
UPDATE profiles p
SET checkin_code = sc.pin_code
FROM student_contacts sc
WHERE sc.profile_id = p.id
  AND sc.pin_code IS NOT NULL
  AND p.checkin_code IS NULL;

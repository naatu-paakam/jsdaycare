-- Nuclear option: drop ALL policies on affected tables, recreate clean.

do $$ declare r record; begin
  for r in select policyname, tablename from pg_policies
    where tablename in ('students','student_contacts','attendance','activities',
                        'student_emergency_contacts','student_documents',
                        'student_enrollment_details','student_immunizations',
                        'staff_profiles','staff_checkins','nap_sleep_checks','activity_media')
  loop
    execute format('drop policy if exists %I on %I', r.policyname, r.tablename);
  end loop;
end $$;

-- ── students (no cross-reference to student_contacts) ────────────────────────
create policy "students_rw" on students for all
  using (school_id = get_my_school_id());

-- ── student_contacts (no cross-reference to students) ────────────────────────
create policy "contacts_rw" on student_contacts for all
  using (school_id = get_my_school_id());

-- Parent can read contacts where their email matches (own records)
create policy "contacts_parent" on student_contacts for select
  using (email = (select email from auth.users where id = auth.uid()));

-- ── student_emergency_contacts ────────────────────────────────────────────────
create policy "emergency_rw" on student_emergency_contacts for all
  using (student_id in (select id from students where school_id = get_my_school_id()));

-- ── student_documents ────────────────────────────────────────────────────────
create policy "docs_rw" on student_documents for all
  using (student_id in (select id from students where school_id = get_my_school_id()));

-- ── student_enrollment_details ───────────────────────────────────────────────
create policy "enrollment_rw" on student_enrollment_details for all
  using (student_id in (select id from students where school_id = get_my_school_id()));

-- ── student_immunizations ────────────────────────────────────────────────────
create policy "immunizations_rw" on student_immunizations for all
  using (student_id in (select id from students where school_id = get_my_school_id()));

-- ── attendance ───────────────────────────────────────────────────────────────
create policy "attendance_rw" on attendance for all
  using (room_id in (select id from rooms where school_id = get_my_school_id()));

-- ── activities ───────────────────────────────────────────────────────────────
create policy "activities_rw" on activities for all
  using (school_id = get_my_school_id());

-- ── staff_profiles ───────────────────────────────────────────────────────────
create policy "staff_profiles_rw" on staff_profiles for all
  using (school_id = get_my_school_id());

-- ── staff_checkins ───────────────────────────────────────────────────────────
create policy "staff_checkins_rw" on staff_checkins for all
  using (staff_id in (select id from staff_profiles where school_id = get_my_school_id()));

-- ── nap_sleep_checks ─────────────────────────────────────────────────────────
create policy "nap_checks_rw" on nap_sleep_checks for all
  using (get_my_role() in ('admin','staff'));

-- ── activity_media ───────────────────────────────────────────────────────────
create policy "media_rw" on activity_media for all
  using (get_my_role() in ('admin','staff'));

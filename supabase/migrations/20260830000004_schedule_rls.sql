-- Fix: student_schedules and staff_schedules have RLS enabled but no policies
-- Admins and staff can manage schedules within their school

-- student_schedules
create policy "student_schedules_rw" on student_schedules for all
  using (
    student_id in (select id from students where school_id = get_my_school_id())
  );

-- staff_schedules (no school_id column — go via staff_id → profiles)
create policy "staff_schedules_rw" on staff_schedules for all
  using (
    staff_id in (select id from profiles where school_id = get_my_school_id())
  );

-- staff_time_off
create policy "staff_time_off_rw" on staff_time_off for all
  using (
    staff_id in (select id from staff_profiles where school_id = get_my_school_id())
  );

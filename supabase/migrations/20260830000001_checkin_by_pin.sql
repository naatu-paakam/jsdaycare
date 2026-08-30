-- Allow QR check-in page to look up students by PIN without auth
create or replace function get_students_by_pin(p_pin text, p_school_id uuid)
returns table(
  contact_id uuid, contact_name text,
  student_id uuid, first_name text, last_name text,
  homeroom_id uuid, room_name text
)
language sql
security definer
stable
as $$
  select
    sc.id as contact_id,
    sc.full_name as contact_name,
    s.id as student_id,
    s.first_name,
    s.last_name,
    s.homeroom_id,
    r.name as room_name
  from student_contacts sc
  join students s on s.id = sc.student_id
  left join rooms r on r.id = s.homeroom_id
  where sc.pin_code = p_pin
    and sc.school_id = p_school_id
    and s.enrollment_status = 'active';
$$;
grant execute on function get_students_by_pin(text, uuid) to anon, authenticated;

-- Allow anon to read/write attendance for check-in (scoped to the specific operation)
create or replace function checkin_student(
  p_student_id uuid, p_room_id uuid, p_contact_id uuid, p_date date
) returns text
language plpgsql
security definer
as $$
declare
  v_existing uuid;
  v_status text;
begin
  select id, status into v_existing, v_status
  from attendance
  where student_id = p_student_id and date = p_date;

  if v_existing is null then
    insert into attendance(student_id, room_id, date, status, checkin_time, checkin_contact_id)
    values(p_student_id, p_room_id, p_date, 'checked_in', now(), p_contact_id);
    return 'checked_in';
  elsif v_status = 'checked_in' then
    update attendance set status='checked_out', checkout_time=now(), checkout_contact_id=p_contact_id
    where student_id=p_student_id and date=p_date;
    return 'checked_out';
  else
    update attendance set status='checked_in', checkin_time=now(), checkin_contact_id=p_contact_id
    where student_id=p_student_id and date=p_date;
    return 'checked_in';
  end if;
end;
$$;
grant execute on function checkin_student(uuid, uuid, uuid, date) to anon, authenticated;

-- Allow anon to read today's attendance for check-in page
create or replace function get_student_attendance_today(p_student_id uuid, p_date date)
returns text
language sql
security definer
stable
as $$
  select status from attendance
  where student_id = p_student_id and date = p_date
  limit 1;
$$;
grant execute on function get_student_attendance_today(uuid, date) to anon, authenticated;

-- Allow anon to look up school name for the check-in page
create or replace function get_school_name(p_school_id uuid)
returns text
language sql
security definer
stable
as $$
  select name from schools where id = p_school_id limit 1;
$$;
grant execute on function get_school_name(uuid) to anon, authenticated;

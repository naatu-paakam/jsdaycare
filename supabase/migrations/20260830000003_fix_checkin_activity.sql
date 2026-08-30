-- Fix: activities.created_by must reference profiles(id)
-- For QR check-in (done by parent contact), use NULL for created_by

create or replace function checkin_student(
  p_student_id uuid, p_room_id uuid, p_contact_id uuid, p_date date
) returns text
language plpgsql
security definer
as $$
declare
  v_existing_id uuid;
  v_existing_status text;
  v_result text;
  v_school_id uuid;
begin
  select school_id into v_school_id from students where id = p_student_id;

  select id, status into v_existing_id, v_existing_status
  from attendance where student_id = p_student_id and date = p_date;

  if v_existing_id is null then
    insert into attendance(student_id, room_id, date, status, checkin_time, checkin_contact_id)
    values(p_student_id, p_room_id, p_date, 'checked_in', now(), p_contact_id);
    v_result := 'checked_in';
  elsif v_existing_status = 'checked_in' then
    update attendance set status='checked_out', checkout_time=now(), checkout_contact_id=p_contact_id
    where id = v_existing_id;
    v_result := 'checked_out';
  else
    update attendance set status='checked_in', checkin_time=now(), checkin_contact_id=p_contact_id
    where id = v_existing_id;
    v_result := 'checked_in';
  end if;

  -- Log activity — created_by is NULL (parent/contact, not a staff profile)
  insert into activities(
    school_id, room_id, student_id, created_by,
    activity_type, activity_date, activity_time, staff_only, notes, data
  ) values (
    v_school_id, p_room_id, p_student_id, null,
    'name_to_face',
    p_date,
    current_time,
    false,
    case when v_result = 'checked_in' then 'Checked in via QR code' else 'Checked out via QR code' end,
    jsonb_build_object('action', v_result, 'contact_id', p_contact_id)
  );

  return v_result;
end;
$$;

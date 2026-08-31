-- RPC: move a student from one school to another
-- Only allowed if the calling user is an admin of BOTH schools.
-- Clears homeroom_id since rooms are school-specific.
create or replace function move_student_to_school(
  p_student_id   uuid,
  p_target_school_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_id uuid := auth.uid();
begin
  -- Verify caller is admin of the target school
  if not exists (
    select 1 from school_memberships
    where profile_id = v_caller_id
      and school_id  = p_target_school_id
      and role       = 'admin'
  ) then
    raise exception 'You are not an admin of the target school';
  end if;

  -- Verify caller has access to the student's current school
  if not exists (
    select 1 from students s
    join school_memberships m on m.school_id = s.school_id
    where s.id         = p_student_id
      and m.profile_id = v_caller_id
      and m.role       = 'admin'
  ) then
    raise exception 'You do not have access to this student';
  end if;

  -- Perform the move: update school + clear room assignment
  update students
  set school_id   = p_target_school_id,
      homeroom_id = null
  where id = p_student_id;
end;
$$;

-- Grant execute to authenticated users (RLS check is inside the function)
grant execute on function move_student_to_school(uuid, uuid) to authenticated;

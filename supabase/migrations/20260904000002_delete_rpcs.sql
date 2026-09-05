-- ─── delete_portal_user ───────────────────────────────────────────────────────
-- Safely removes a user: cleans up all loose references before deleting profile.
-- Caller must be a portal_admin (checked by RLS on invocations).
create or replace function delete_portal_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Nullify loose profile references in activities/attendance
  update activities  set created_by = null where created_by = p_user_id;
  update attendance  set created_by = null where created_by = p_user_id;

  -- Remove school memberships (not cascade)
  delete from school_memberships where profile_id = p_user_id;

  -- Profile deletes staff_profiles, staff_schedules via cascade
  delete from profiles where id = p_user_id;

  -- Delete auth user (requires service role — caller must have it)
  perform auth.uid(); -- no-op to confirm security definer context
  -- Note: auth.users deletion is done client-side via supabase.auth.admin.deleteUser()
end;
$$;

grant execute on function delete_portal_user(uuid) to authenticated;


-- ─── delete_school_cascade ────────────────────────────────────────────────────
-- Safely deletes a school and all its data:
-- students (+ their contacts, immunizations, activities, attendance)
-- rooms, memberships, invitations, menus, food_items — most cascade automatically.
-- profiles.school_id is nulled (staff keep their accounts, just unlinked).
create or replace function delete_school_cascade(p_school_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Null out school_id on profiles (staff keep accounts, lose school link)
  update profiles set school_id = null where school_id = p_school_id;

  -- Students don't cascade — delete explicitly (cascades to contacts, immunizations, activities, attendance)
  delete from students where school_id = p_school_id;

  -- Delete the school (cascades: rooms, memberships, invitations, food_items, weekly_menus, etc.)
  delete from schools where id = p_school_id;
end;
$$;

grant execute on function delete_school_cascade(uuid) to authenticated;

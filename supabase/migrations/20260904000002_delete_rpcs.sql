-- ─── delete_portal_user ───────────────────────────────────────────────────────
-- Safely removes a user and all loose FK references.
-- Security definer — can be called by any authenticated user.
create or replace function delete_portal_user(p_user_id uuid)
returns void language plpgsql security definer set search_path = public
as $$
begin
  -- Nullify all loose FK references to profiles (non-cascade)
  update activities       set created_by = null where created_by = p_user_id;
  update attendance       set created_by = null where created_by = p_user_id;
  update nap_sleep_checks set checked_by = null where checked_by = p_user_id;
  update invitations      set invited_by = null where invited_by = p_user_id;
  update forms            set created_by = null where created_by = p_user_id;
  -- Remove school memberships (no cascade)
  delete from school_memberships where profile_id = p_user_id;
  -- Delete profile — cascades: staff_profiles, staff_schedules, room_staff
  delete from profiles where id = p_user_id;
  -- Note: auth.users deletion must be done separately via supabase.auth.admin.deleteUser()
end;
$$;
grant execute on function delete_portal_user(uuid) to authenticated;


-- ─── delete_school_cascade ────────────────────────────────────────────────────
-- Safely deletes a school and all its data.
create or replace function delete_school_cascade(p_school_id uuid)
returns void language plpgsql security definer set search_path = public
as $$
begin
  update profiles set school_id = null where school_id = p_school_id;
  delete from students where school_id = p_school_id;
  delete from schools  where id        = p_school_id;
end;
$$;
grant execute on function delete_school_cascade(uuid) to authenticated;

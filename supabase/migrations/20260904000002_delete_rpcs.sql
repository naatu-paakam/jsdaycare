-- Comprehensive safe-delete RPCs for portal admin and school admin operations.
-- All RPCs are security-definer — they bypass RLS to handle cross-table cleanup.
-- They nullify loose FK references (NO ACTION) before deleting the main record.

-- ─── delete_portal_user ────────────────────────────────────────────────────────
create or replace function delete_portal_user(p_user_id uuid)
returns void language plpgsql security definer set search_path = public
as $$
begin
  update activities       set created_by   = null where created_by   = p_user_id;
  update attendance       set created_by   = null where created_by   = p_user_id;
  update nap_sleep_checks set checked_by   = null where checked_by   = p_user_id;
  update invitations      set invited_by   = null where invited_by   = p_user_id;
  update forms            set created_by   = null where created_by   = p_user_id;
  update shared_files     set created_by   = null where created_by   = p_user_id;
  update audit_log        set performed_by = null where performed_by = p_user_id;
  update form_submissions set submitted_by = null where submitted_by = p_user_id;
  update form_submissions set reviewed_by  = null where reviewed_by  = p_user_id;
  delete from school_memberships where profile_id = p_user_id;
  delete from profiles where id = p_user_id;
  -- auth.users deletion must be done separately via supabase.auth.admin.deleteUser()
end;
$$;
grant execute on function delete_portal_user(uuid) to authenticated;

-- ─── delete_school_cascade ─────────────────────────────────────────────────────
create or replace function delete_school_cascade(p_school_id uuid)
returns void language plpgsql security definer set search_path = public
as $$
begin
  update profiles  set school_id = null where school_id = p_school_id;
  update audit_log set school_id = null where school_id = p_school_id;
  delete from students where school_id = p_school_id;
  delete from schools  where id        = p_school_id;
end;
$$;
grant execute on function delete_school_cascade(uuid) to authenticated;

-- ─── delete_room_safe ──────────────────────────────────────────────────────────
create or replace function delete_room_safe(p_room_id uuid)
returns void language plpgsql security definer set search_path = public
as $$
begin
  update students        set homeroom_id = null where homeroom_id = p_room_id;
  update activities      set room_id     = null where room_id     = p_room_id;
  update attendance      set room_id     = null where room_id     = p_room_id;
  update shared_files    set room_id     = null where room_id     = p_room_id;
  update staff_schedules set room_id     = null where room_id     = p_room_id;
  delete from rooms where id = p_room_id;
end;
$$;
grant execute on function delete_room_safe(uuid) to authenticated;

-- ─── delete_student_safe ───────────────────────────────────────────────────────
create or replace function delete_student_safe(p_student_id uuid)
returns void language plpgsql security definer set search_path = public
as $$
begin
  update form_submissions  set student_id = null where student_id = p_student_id;
  update shared_files      set student_id = null where student_id = p_student_id;
  update sign_up_responses set student_id = null where student_id = p_student_id;
  delete from students where id = p_student_id;
end;
$$;
grant execute on function delete_student_safe(uuid) to authenticated;

-- ─── delete_contact_safe ───────────────────────────────────────────────────────
create or replace function delete_contact_safe(p_contact_id uuid)
returns void language plpgsql security definer set search_path = public
as $$
begin
  update attendance        set checkin_contact_id  = null where checkin_contact_id  = p_contact_id;
  update attendance        set checkout_contact_id = null where checkout_contact_id = p_contact_id;
  update sign_up_responses set contact_id          = null where contact_id          = p_contact_id;
  delete from student_contacts where id = p_contact_id;
end;
$$;
grant execute on function delete_contact_safe(uuid) to authenticated;

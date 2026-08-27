-- Portal admin can create invitations for any school (not scoped to get_my_school_id)
create policy "invitations_portal_admin" on invitations
  for all using (get_my_role() = 'portal_admin')
  with check (get_my_role() = 'portal_admin');

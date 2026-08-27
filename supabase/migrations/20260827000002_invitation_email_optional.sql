-- Make email optional on invitations — invitee enters their own email at registration
alter table invitations alter column email drop not null;
alter table invitations alter column email set default null;

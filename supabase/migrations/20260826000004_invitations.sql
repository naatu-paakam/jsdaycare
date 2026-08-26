create table if not exists invitations (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid references schools(id) on delete cascade,
  email       text not null,
  role        text not null check (role in ('admin','staff','parent')),
  token       uuid not null default gen_random_uuid() unique,
  invited_by  uuid references profiles(id),
  created_at  timestamptz default now(),
  expires_at  timestamptz default (now() + interval '7 days'),
  used_at     timestamptz
);

alter table invitations enable row level security;

-- Admin/portal_admin can create invitations for their schools
create policy "invitations_admin" on invitations
  for all using (
    school_id = get_my_school_id() and get_my_role() in ('admin','portal_admin')
  );

-- Anyone can read an invitation by token (for registration page)
create policy "invitations_public_read" on invitations
  for select using (token = token); -- allows reading by token

-- Helper: get invitation by token (bypasses RLS for public registration)
create or replace function get_invitation_by_token(p_token uuid)
returns table(id uuid, school_id uuid, email text, role text, expires_at timestamptz, used_at timestamptz, school_name text)
language sql
security definer
stable
as $$
  select i.id, i.school_id, i.email, i.role, i.expires_at, i.used_at, s.name as school_name
  from invitations i
  join schools s on s.id = i.school_id
  where i.token = p_token
  limit 1;
$$;

grant execute on function get_invitation_by_token(uuid) to anon, authenticated;

-- Mark invitation as used
create or replace function use_invitation(p_token uuid)
returns void
language sql
security definer
as $$
  update invitations set used_at = now() where token = p_token and used_at is null;
$$;

grant execute on function use_invitation(uuid) to anon, authenticated;

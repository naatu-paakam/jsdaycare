-- Role-based permissions table
-- Allows admins to configure what each role can do without code changes.

create table if not exists role_permissions (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid references schools(id) on delete cascade,
  role        text not null check (role in ('admin','staff','parent')),
  resource    text not null,   -- e.g. 'student_profile', 'immunizations', 'daily_report'
  action      text not null,   -- e.g. 'view', 'edit', 'create', 'delete'
  allowed     bool not null default true,
  created_at  timestamptz default now()
);

-- RLS: only admins can manage permissions; all roles can read their own school's permissions
alter table role_permissions enable row level security;

create policy "permissions_admin" on role_permissions
  for all using (school_id = get_my_school_id() and get_my_role() = 'admin');

create policy "permissions_read" on role_permissions
  for select using (school_id = get_my_school_id());

-- Seed default permissions for JS Joy Family Daycare
insert into role_permissions (school_id, role, resource, action, allowed) values
  -- Admin — full access (default, always true in code; DB record for reference)
  ('08f7413b-1aa9-4679-b80b-d59ffc1fd749', 'admin', 'student_profile',    'view',   true),
  ('08f7413b-1aa9-4679-b80b-d59ffc1fd749', 'admin', 'student_profile',    'edit',   true),
  ('08f7413b-1aa9-4679-b80b-d59ffc1fd749', 'admin', 'immunizations',      'view',   true),
  ('08f7413b-1aa9-4679-b80b-d59ffc1fd749', 'admin', 'immunizations',      'edit',   true),
  ('08f7413b-1aa9-4679-b80b-d59ffc1fd749', 'admin', 'contacts',           'view',   true),
  ('08f7413b-1aa9-4679-b80b-d59ffc1fd749', 'admin', 'contacts',           'edit',   true),
  ('08f7413b-1aa9-4679-b80b-d59ffc1fd749', 'admin', 'daily_report',       'view',   true),
  ('08f7413b-1aa9-4679-b80b-d59ffc1fd749', 'admin', 'enrollment_details', 'view',   true),
  ('08f7413b-1aa9-4679-b80b-d59ffc1fd749', 'admin', 'enrollment_details', 'edit',   true),
  ('08f7413b-1aa9-4679-b80b-d59ffc1fd749', 'admin', 'financial_details',  'view',   true),
  ('08f7413b-1aa9-4679-b80b-d59ffc1fd749', 'admin', 'financial_details',  'edit',   true),
  ('08f7413b-1aa9-4679-b80b-d59ffc1fd749', 'admin', 'attendance',         'view',   true),
  ('08f7413b-1aa9-4679-b80b-d59ffc1fd749', 'admin', 'attendance',         'edit',   true),
  ('08f7413b-1aa9-4679-b80b-d59ffc1fd749', 'admin', 'activities',         'view',   true),
  ('08f7413b-1aa9-4679-b80b-d59ffc1fd749', 'admin', 'activities',         'create', true),
  ('08f7413b-1aa9-4679-b80b-d59ffc1fd749', 'admin', 'forms',              'view',   true),
  ('08f7413b-1aa9-4679-b80b-d59ffc1fd749', 'admin', 'forms',              'edit',   true),
  ('08f7413b-1aa9-4679-b80b-d59ffc1fd749', 'admin', 'staff_profiles',     'view',   true),
  ('08f7413b-1aa9-4679-b80b-d59ffc1fd749', 'admin', 'staff_profiles',     'edit',   true),

  -- Staff — operational access
  ('08f7413b-1aa9-4679-b80b-d59ffc1fd749', 'staff', 'student_profile',    'view',   true),
  ('08f7413b-1aa9-4679-b80b-d59ffc1fd749', 'staff', 'student_profile',    'edit',   false),
  ('08f7413b-1aa9-4679-b80b-d59ffc1fd749', 'staff', 'immunizations',      'view',   true),
  ('08f7413b-1aa9-4679-b80b-d59ffc1fd749', 'staff', 'immunizations',      'edit',   false),
  ('08f7413b-1aa9-4679-b80b-d59ffc1fd749', 'staff', 'contacts',           'view',   true),
  ('08f7413b-1aa9-4679-b80b-d59ffc1fd749', 'staff', 'contacts',           'edit',   false),
  ('08f7413b-1aa9-4679-b80b-d59ffc1fd749', 'staff', 'daily_report',       'view',   true),
  ('08f7413b-1aa9-4679-b80b-d59ffc1fd749', 'staff', 'enrollment_details', 'view',   false),
  ('08f7413b-1aa9-4679-b80b-d59ffc1fd749', 'staff', 'financial_details',  'view',   false),
  ('08f7413b-1aa9-4679-b80b-d59ffc1fd749', 'staff', 'attendance',         'view',   true),
  ('08f7413b-1aa9-4679-b80b-d59ffc1fd749', 'staff', 'attendance',         'edit',   true),
  ('08f7413b-1aa9-4679-b80b-d59ffc1fd749', 'staff', 'activities',         'view',   true),
  ('08f7413b-1aa9-4679-b80b-d59ffc1fd749', 'staff', 'activities',         'create', true),
  ('08f7413b-1aa9-4679-b80b-d59ffc1fd749', 'staff', 'forms',              'view',   true),
  ('08f7413b-1aa9-4679-b80b-d59ffc1fd749', 'staff', 'forms',              'edit',   false),

  -- Parent — own child only
  ('08f7413b-1aa9-4679-b80b-d59ffc1fd749', 'parent', 'student_profile',    'view',   true),
  ('08f7413b-1aa9-4679-b80b-d59ffc1fd749', 'parent', 'student_profile',    'edit',   true),   -- personal info + address
  ('08f7413b-1aa9-4679-b80b-d59ffc1fd749', 'parent', 'immunizations',      'view',   true),
  ('08f7413b-1aa9-4679-b80b-d59ffc1fd749', 'parent', 'immunizations',      'edit',   true),
  ('08f7413b-1aa9-4679-b80b-d59ffc1fd749', 'parent', 'contacts',           'view',   true),
  ('08f7413b-1aa9-4679-b80b-d59ffc1fd749', 'parent', 'contacts',           'edit',   false),
  ('08f7413b-1aa9-4679-b80b-d59ffc1fd749', 'parent', 'daily_report',       'view',   true),
  ('08f7413b-1aa9-4679-b80b-d59ffc1fd749', 'parent', 'enrollment_details', 'view',   false),
  ('08f7413b-1aa9-4679-b80b-d59ffc1fd749', 'parent', 'financial_details',  'view',   false),
  ('08f7413b-1aa9-4679-b80b-d59ffc1fd749', 'parent', 'attendance',         'view',   true),
  ('08f7413b-1aa9-4679-b80b-d59ffc1fd749', 'parent', 'attendance',         'edit',   false),
  ('08f7413b-1aa9-4679-b80b-d59ffc1fd749', 'parent', 'activities',         'view',   true),
  ('08f7413b-1aa9-4679-b80b-d59ffc1fd749', 'parent', 'activities',         'create', false),
  ('08f7413b-1aa9-4679-b80b-d59ffc1fd749', 'parent', 'forms',              'view',   true),
  ('08f7413b-1aa9-4679-b80b-d59ffc1fd749', 'parent', 'forms',              'edit',   false);

-- Helper function: check if current user's role has a given permission
create or replace function has_permission(p_resource text, p_action text)
returns bool
language sql
security definer
stable
as $$
  select coalesce(
    (select allowed from role_permissions
     where school_id = get_my_school_id()
       and role = get_my_role()
       and resource = p_resource
       and action = p_action
     limit 1),
    false
  );
$$;

-- JSDaycare Supabase Schema
-- Run this in your Supabase SQL editor

-- ============================================================
-- SCHOOLS
-- ============================================================
create table if not exists schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  timezone text not null default 'America/New_York',
  operating_hours jsonb,
  ratio_rules jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  school_id uuid references schools(id),
  role text not null check (role in ('admin','staff','parent')),
  full_name text,
  avatar_url text,
  phone text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- ROOMS
-- ============================================================
create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  name text not null,
  age_range_min_months int,
  age_range_max_months int,
  capacity int,
  ratio_staff int,
  ratio_children int,
  created_at timestamptz not null default now()
);

create table if not exists room_staff (
  room_id uuid not null references rooms(id) on delete cascade,
  staff_id uuid not null references profiles(id) on delete cascade,
  is_lead bool not null default false,
  created_at timestamptz not null default now(),
  primary key (room_id, staff_id)
);

-- ============================================================
-- STUDENTS
-- ============================================================
create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  preferred_name text,
  photo_url text,
  dob date,
  gender text,
  race text,
  ethnicity text,
  allergies text,
  medications text,
  notes text,
  doctor_name text,
  doctor_phone text,
  address jsonb,
  enrollment_status text not null default 'active' check (enrollment_status in ('active','waitlist','withdrawn','graduated')),
  start_date date,
  end_date date,
  homeroom_id uuid references rooms(id),
  meal_type text,
  student_id_internal text,
  schedule_days text[],
  created_at timestamptz not null default now()
);

create table if not exists student_contacts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  type text not null check (type in ('parent','guardian')),
  full_name text not null,
  email text,
  phone text,
  is_primary bool not null default false,
  can_pickup bool not null default true,
  photo_url text,
  pin_code varchar(4),
  portal_status text not null default 'not_signed_up' check (portal_status in ('signed_up','invited','not_signed_up')),
  created_at timestamptz not null default now()
);

create table if not exists student_emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  full_name text not null,
  relationship text,
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists student_documents (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  doc_type text,
  file_url text,
  uploaded_at timestamptz not null default now()
);

create table if not exists student_enrollment_details (
  student_id uuid primary key references students(id) on delete cascade,
  first_contact_date date,
  toured_date date,
  paperwork_date date,
  desired_start_date date,
  graduation_date date,
  expected_birth_date date,
  sibling_name text,
  programs text,
  additional_details text,
  family_income numeric,
  subsidy bool,
  subsidy_details text
);

create table if not exists student_immunizations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  vaccine_name text not null,
  dose_number int,
  administered_date date,
  exempt bool not null default false,
  notes text
);

-- ============================================================
-- ATTENDANCE
-- ============================================================
create table if not exists attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  room_id uuid references rooms(id),
  date date not null,
  status text not null check (status in ('checked_in','checked_out','absent','expected')),
  checkin_time timestamptz,
  checkin_contact_id uuid references student_contacts(id),
  checkout_time timestamptz,
  checkout_contact_id uuid references student_contacts(id),
  absence_reason text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- ============================================================
-- STAFF
-- ============================================================
create table if not exists staff_profiles (
  id uuid primary key references profiles(id) on delete cascade,
  school_id uuid not null references schools(id) on delete cascade,
  hire_date date,
  birthday date,
  address text,
  notes text,
  emergency_contact_name text,
  emergency_contact_relationship text,
  emergency_contact_phone text,
  allergies text,
  medications text,
  doctor text,
  doctor_phone text,
  degree text,
  certification text,
  ece_credits int,
  infant_toddler_credits int,
  cert_notes text,
  created_at timestamptz not null default now()
);

create table if not exists staff_checkins (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references profiles(id) on delete cascade,
  date date not null,
  checkin_time timestamptz,
  checkout_time timestamptz
);

-- ============================================================
-- ACTIVITIES (daily reports)
-- ============================================================
create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  room_id uuid references rooms(id),
  student_id uuid references students(id) on delete cascade,
  created_by uuid references profiles(id),
  activity_type text not null check (activity_type in ('photo','video','food','nap','potty','note','kudos','meds','name_to_face','incident','health_check','observation')),
  activity_date date not null,
  activity_time time,
  staff_only bool not null default false,
  notes text,
  data jsonb,
  created_at timestamptz not null default now()
);

create table if not exists nap_sleep_checks (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references activities(id) on delete cascade,
  checked_at timestamptz not null,
  position text check (position in ('back','side','stomach')),
  checked_by uuid references profiles(id)
);

create table if not exists activity_media (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references activities(id) on delete cascade,
  media_type text check (media_type in ('photo','video')),
  file_url text not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- SCHEDULES
-- ============================================================
create table if not exists staff_schedules (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references profiles(id) on delete cascade,
  room_id uuid references rooms(id),
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  effective_from date,
  effective_to date
);

create table if not exists student_schedules (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  schedule_type text check (schedule_type in ('full','half','am','pm')),
  effective_from date,
  effective_to date
);

create table if not exists staff_time_off (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references profiles(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  type text check (type in ('vacation','sick','personal','other')),
  notes text,
  approved bool not null default false
);

create table if not exists school_calendar (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  event_date date not null,
  event_type text check (event_type in ('holiday','closure','event')),
  title text not null,
  notes text
);

-- ============================================================
-- MENUS
-- ============================================================
create table if not exists food_items (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  name text not null,
  category text check (category in ('grain','protein','fruit','vegetable','dairy','other')),
  allergens text[],
  created_at timestamptz not null default now()
);

create table if not exists menu_templates (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists menu_template_slots (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references menu_templates(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  meal_type text check (meal_type in ('breakfast','lunch','am_snack','pm_snack')),
  food_item_ids uuid[]
);

create table if not exists weekly_menus (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  week_start date not null,
  template_id uuid references menu_templates(id),
  overrides jsonb
);

-- ============================================================
-- FORMS & COMPLIANCE
-- ============================================================
create table if not exists forms (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  name text not null,
  form_type text check (form_type in ('form','request','sign_up')),
  description text,
  status text not null default 'unshared' check (status in ('unshared','shared','closed')),
  due_date date,
  requires_review bool not null default false,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists form_fields (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references forms(id) on delete cascade,
  field_type text check (field_type in ('text','long_text','date','number','checkbox','dropdown','file','signature')),
  label text not null,
  required bool not null default false,
  options jsonb,
  order_index int not null default 0,
  show_if jsonb
);

create table if not exists form_submissions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references forms(id) on delete cascade,
  student_id uuid references students(id),
  submitted_by uuid references profiles(id),
  submitted_at timestamptz not null default now(),
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  status text not null default 'submitted' check (status in ('submitted','reviewed','approved'))
);

create table if not exists form_field_responses (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references form_submissions(id) on delete cascade,
  field_id uuid not null references form_fields(id) on delete cascade,
  value text,
  file_url text
);

create table if not exists sign_up_slots (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references forms(id) on delete cascade,
  slot_type text check (slot_type in ('item','time','recurring','time_series')),
  label text,
  date date,
  start_time time,
  end_time time,
  capacity int,
  created_at timestamptz not null default now()
);

create table if not exists sign_up_responses (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references sign_up_slots(id) on delete cascade,
  student_id uuid references students(id),
  contact_id uuid references student_contacts(id),
  signed_up_at timestamptz not null default now()
);

create table if not exists shared_files (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  name text not null,
  file_url text not null,
  shared_with text check (shared_with in ('all','room','student')),
  room_id uuid references rooms(id),
  student_id uuid references students(id),
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists compliance_rules (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  rule_type text not null,
  enabled bool not null default true,
  config jsonb
);

create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references schools(id),
  entity_type text,
  entity_id uuid,
  action text not null,
  performed_by uuid references profiles(id),
  performed_at timestamptz not null default now(),
  details jsonb
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table schools enable row level security;
alter table profiles enable row level security;
alter table rooms enable row level security;
alter table room_staff enable row level security;
alter table students enable row level security;
alter table student_contacts enable row level security;
alter table student_emergency_contacts enable row level security;
alter table student_documents enable row level security;
alter table student_enrollment_details enable row level security;
alter table student_immunizations enable row level security;
alter table attendance enable row level security;
alter table staff_profiles enable row level security;
alter table staff_checkins enable row level security;
alter table activities enable row level security;
alter table nap_sleep_checks enable row level security;
alter table activity_media enable row level security;
alter table staff_schedules enable row level security;
alter table student_schedules enable row level security;
alter table staff_time_off enable row level security;
alter table school_calendar enable row level security;
alter table food_items enable row level security;
alter table menu_templates enable row level security;
alter table menu_template_slots enable row level security;
alter table weekly_menus enable row level security;
alter table forms enable row level security;
alter table form_fields enable row level security;
alter table form_submissions enable row level security;
alter table form_field_responses enable row level security;
alter table sign_up_slots enable row level security;
alter table sign_up_responses enable row level security;
alter table shared_files enable row level security;
alter table compliance_rules enable row level security;
alter table audit_log enable row level security;

-- Helper function: get calling user's school_id and role
create or replace function auth_profile()
returns table(school_id uuid, role text)
language sql stable security definer
as $$
  select p.school_id, p.role from profiles p where p.id = auth.uid();
$$;

-- Admin policies: full access within their school
create policy "admin_all_schools" on schools
  for all using (id in (select school_id from profiles where id = auth.uid() and role = 'admin'));

create policy "admin_all_profiles" on profiles
  for all using (school_id in (select school_id from profiles where id = auth.uid() and role = 'admin'))
  with check (school_id in (select school_id from profiles where id = auth.uid() and role = 'admin'));

-- Allow users to read/update their own profile
create policy "own_profile_read" on profiles
  for select using (id = auth.uid());

create policy "own_profile_update" on profiles
  for update using (id = auth.uid());

-- Rooms: admin full, staff read
create policy "admin_rooms" on rooms
  for all using (school_id in (select school_id from profiles where id = auth.uid() and role = 'admin'));

create policy "staff_rooms_read" on rooms
  for select using (
    id in (select room_id from room_staff where staff_id = auth.uid())
    and school_id in (select school_id from profiles where id = auth.uid())
  );

-- Students: admin full, staff read for their rooms
create policy "admin_students" on students
  for all using (school_id in (select school_id from profiles where id = auth.uid() and role = 'admin'));

create policy "staff_students_read" on students
  for select using (
    homeroom_id in (select room_id from room_staff where staff_id = auth.uid())
  );

-- Activities: admin full, staff insert/read
create policy "admin_activities" on activities
  for all using (school_id in (select school_id from profiles where id = auth.uid() and role = 'admin'));

create policy "staff_activities_read" on activities
  for select using (
    room_id in (select room_id from room_staff where staff_id = auth.uid())
  );

create policy "staff_activities_insert" on activities
  for insert with check (
    created_by = auth.uid()
    and room_id in (select room_id from room_staff where staff_id = auth.uid())
  );

-- Attendance: admin full, staff manage their rooms
create policy "admin_attendance" on attendance
  for all using (
    room_id in (select id from rooms where school_id in (select school_id from profiles where id = auth.uid() and role = 'admin'))
  );

create policy "staff_attendance" on attendance
  for all using (
    room_id in (select room_id from room_staff where staff_id = auth.uid())
  );

-- Student contacts: parents can see their own child's data (matched by email)
create policy "parent_student_contacts" on student_contacts
  for select using (
    email = (select email from auth.users where id = auth.uid())
    or student_id in (select id from students where school_id in (select school_id from profiles where id = auth.uid() and role = 'admin'))
  );

-- Generic admin policies for remaining tables (school-scoped)
create policy "admin_staff_profiles" on staff_profiles
  for all using (school_id in (select school_id from profiles where id = auth.uid() and role = 'admin'));

create policy "own_staff_profile" on staff_profiles
  for select using (id = auth.uid());

create policy "admin_forms" on forms
  for all using (school_id in (select school_id from profiles where id = auth.uid() and role = 'admin'));

create policy "admin_food_items" on food_items
  for all using (school_id in (select school_id from profiles where id = auth.uid() and role = 'admin'));

create policy "admin_menu_templates" on menu_templates
  for all using (school_id in (select school_id from profiles where id = auth.uid() and role = 'admin'));

create policy "admin_weekly_menus" on weekly_menus
  for all using (school_id in (select school_id from profiles where id = auth.uid() and role = 'admin'));

create policy "admin_school_calendar" on school_calendar
  for all using (school_id in (select school_id from profiles where id = auth.uid() and role = 'admin'));

create policy "admin_compliance_rules" on compliance_rules
  for all using (school_id in (select school_id from profiles where id = auth.uid() and role = 'admin'));

create policy "admin_audit_log" on audit_log
  for all using (school_id in (select school_id from profiles where id = auth.uid() and role = 'admin'));

create policy "admin_shared_files" on shared_files
  for all using (school_id in (select school_id from profiles where id = auth.uid() and role = 'admin'));

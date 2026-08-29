# DayCarePortal — Entity Relationship Diagram

Generated from `/supabase/migrations/`. Renders in GitHub as a Mermaid diagram.

---

```mermaid
erDiagram

  %% ─── Platform ────────────────────────────────────────────────
  auth_users {
    uuid id PK
    string email
    string encrypted_password
  }

  schools {
    uuid id PK
    string name
    string timezone
    jsonb operating_hours
    jsonb policies
    jsonb ratio_rules
    timestamptz created_at
  }

  profiles {
    uuid id PK
    uuid school_id FK
    string role
    string full_name
    string login_id
    string phone
    string avatar_url
    timestamptz created_at
  }

  school_memberships {
    uuid id PK
    uuid profile_id FK
    uuid school_id FK
    string role
    timestamptz created_at
  }

  role_permissions {
    uuid id PK
    uuid school_id FK
    string role
    string resource
    string action
    bool allowed
  }

  invitations {
    uuid id PK
    uuid school_id FK
    string email
    string role
    uuid token
    uuid invited_by FK
    bool permanent
    timestamptz expires_at
    timestamptz used_at
    timestamptz created_at
  }

  %% ─── Rooms ───────────────────────────────────────────────────
  rooms {
    uuid id PK
    uuid school_id FK
    string name
    int age_range_min_months
    int age_range_max_months
    int capacity
    int ratio_staff
    int ratio_children
    timestamptz created_at
  }

  room_staff {
    uuid room_id FK
    uuid staff_id FK
    bool is_lead
    timestamptz created_at
  }

  %% ─── Students ────────────────────────────────────────────────
  students {
    uuid id PK
    uuid school_id FK
    uuid homeroom_id FK
    string first_name
    string last_name
    string preferred_name
    date dob
    string gender
    string race
    string ethnicity
    string allergies
    string medications
    string notes
    string doctor_name
    string doctor_phone
    jsonb address
    string enrollment_status
    date start_date
    date end_date
    string meal_type
    string student_id_internal
    string[] schedule_days
    jsonb immunization_settings
    timestamptz created_at
  }

  student_contacts {
    uuid id PK
    uuid student_id FK
    uuid school_id FK
    string type
    string full_name
    string email
    string phone
    bool is_primary
    bool can_pickup
    string photo_url
    string pin_code
    string portal_status
    date pickup_valid_from
    date pickup_valid_to
    timestamptz created_at
  }

  student_emergency_contacts {
    uuid id PK
    uuid student_id FK
    string full_name
    string relationship
    string phone
    timestamptz created_at
  }

  student_documents {
    uuid id PK
    uuid student_id FK
    string doc_type
    string file_url
    timestamptz uploaded_at
  }

  student_enrollment_details {
    uuid student_id PK_FK
    date first_contact_date
    date toured_date
    date paperwork_date
    date desired_start_date
    date graduation_date
    date expected_birth_date
    string sibling_name
    string programs
    string additional_details
    decimal family_income
    bool subsidy
    string subsidy_details
  }

  student_immunizations {
    uuid id PK
    uuid student_id FK
    string vaccine_name
    int dose_number
    date administered_date
    bool exempt
    bool skipped
    string notes
  }

  %% ─── Attendance ─────────────────────────────────────────────
  attendance {
    uuid id PK
    uuid student_id FK
    uuid room_id FK
    date date
    string status
    time checkin_time
    uuid checkin_contact_id FK
    time checkout_time
    uuid checkout_contact_id FK
    string absence_reason
    uuid created_by FK
    timestamptz created_at
  }

  %% ─── Staff ──────────────────────────────────────────────────
  staff_profiles {
    uuid id PK_FK
    uuid school_id FK
    date hire_date
    date birthday
    string address
    string emergency_contact_name
    string emergency_contact_relationship
    string emergency_contact_phone
    string allergies
    string medications
    string doctor
    string doctor_phone
    string degree
    string certification
    int ece_credits
    int infant_toddler_credits
    string cert_notes
    timestamptz created_at
  }

  staff_checkins {
    uuid id PK
    uuid staff_id FK
    date date
    time checkin_time
    time checkout_time
  }

  %% ─── Activities ─────────────────────────────────────────────
  activities {
    uuid id PK
    uuid school_id FK
    uuid room_id FK
    uuid student_id FK
    uuid created_by FK
    string activity_type
    date activity_date
    time activity_time
    bool staff_only
    string notes
    jsonb data
    timestamptz created_at
  }

  nap_sleep_checks {
    uuid id PK
    uuid activity_id FK
    timestamptz checked_at
    string position
    uuid checked_by FK
  }

  activity_media {
    uuid id PK
    uuid activity_id FK
    string media_type
    string file_url
    timestamptz created_at
  }

  %% ─── Schedules ──────────────────────────────────────────────
  staff_schedules {
    uuid id PK
    uuid staff_id FK
    uuid room_id FK
    int day_of_week
    time start_time
    time end_time
    date effective_from
    date effective_to
  }

  student_schedules {
    uuid id PK
    uuid student_id FK
    int day_of_week
    string schedule_type
    date effective_from
    date effective_to
  }

  staff_time_off {
    uuid id PK
    uuid staff_id FK
    date start_date
    date end_date
    string type
    string notes
    bool approved
  }

  school_calendar {
    uuid id PK
    uuid school_id FK
    date event_date
    string event_type
    string title
    string notes
  }

  %% ─── Menus ──────────────────────────────────────────────────
  food_items {
    uuid id PK
    uuid school_id FK
    string name
    string category
    string[] allergens
    timestamptz created_at
  }

  menu_templates {
    uuid id PK
    uuid school_id FK
    string name
    timestamptz created_at
  }

  menu_template_slots {
    uuid id PK
    uuid template_id FK
    int day_of_week
    string meal_type
    uuid[] food_item_ids
  }

  weekly_menus {
    uuid id PK
    uuid school_id FK
    date week_start
    uuid template_id FK
    jsonb overrides
  }

  %% ─── Forms & Compliance ─────────────────────────────────────
  forms {
    uuid id PK
    uuid school_id FK
    string name
    string form_type
    string description
    string status
    date due_date
    bool requires_review
    uuid created_by FK
    timestamptz created_at
  }

  form_fields {
    uuid id PK
    uuid form_id FK
    string field_type
    string label
    bool required
    jsonb options
    int order_index
    jsonb show_if
  }

  form_submissions {
    uuid id PK
    uuid form_id FK
    uuid student_id FK
    uuid submitted_by FK
    timestamptz submitted_at
    uuid reviewed_by FK
    timestamptz reviewed_at
    string status
  }

  form_field_responses {
    uuid id PK
    uuid submission_id FK
    uuid field_id FK
    string value
    string file_url
  }

  sign_up_slots {
    uuid id PK
    uuid form_id FK
    string slot_type
    string label
    date date
    time start_time
    time end_time
    int capacity
    timestamptz created_at
  }

  sign_up_responses {
    uuid id PK
    uuid slot_id FK
    uuid student_id FK
    uuid contact_id FK
    timestamptz signed_up_at
  }

  shared_files {
    uuid id PK
    uuid school_id FK
    string name
    string file_url
    string shared_with
    uuid room_id FK
    uuid student_id FK
    uuid created_by FK
    timestamptz created_at
  }

  compliance_rules {
    uuid id PK
    uuid school_id FK
    string rule_type
    bool enabled
    jsonb config
  }

  audit_log {
    uuid id PK
    uuid school_id FK
    string entity_type
    uuid entity_id
    string action
    uuid performed_by FK
    timestamptz performed_at
    jsonb details
  }

  %% ─── Relationships ───────────────────────────────────────────

  auth_users ||--o| profiles : "extends"

  schools ||--o{ profiles : "active school"
  schools ||--o{ school_memberships : "belongs to"
  schools ||--o{ rooms : "has"
  schools ||--o{ students : "enrolls"
  schools ||--o{ staff_profiles : "employs"
  schools ||--o{ activities : "logs"
  schools ||--o{ school_calendar : "schedules"
  schools ||--o{ food_items : "maintains"
  schools ||--o{ menu_templates : "has"
  schools ||--o{ weekly_menus : "publishes"
  schools ||--o{ forms : "creates"
  schools ||--o{ shared_files : "stores"
  schools ||--o{ compliance_rules : "configures"
  schools ||--o{ role_permissions : "configures"
  schools ||--o{ invitations : "issues"

  profiles ||--o{ school_memberships : "member of"
  profiles ||--o| staff_profiles : "staff details"
  profiles ||--o{ staff_checkins : "clocks"
  profiles ||--o{ staff_schedules : "scheduled"
  profiles ||--o{ staff_time_off : "takes"
  profiles ||--o{ room_staff : "assigned to"
  profiles ||--o{ activities : "created by"
  profiles ||--o{ invitations : "invited by"

  rooms ||--o{ room_staff : "staffed by"
  rooms ||--o{ students : "homeroom"
  rooms ||--o{ attendance : "in room"
  rooms ||--o{ activities : "logged in"
  rooms ||--o{ staff_schedules : "for room"

  students ||--o{ student_contacts : "has"
  students ||--o{ student_emergency_contacts : "has"
  students ||--o{ student_documents : "has"
  students ||--o| student_enrollment_details : "enrollment"
  students ||--o{ student_immunizations : "vaccinated"
  students ||--o{ attendance : "recorded"
  students ||--o{ activities : "subject of"
  students ||--o{ student_schedules : "scheduled"
  students ||--o{ form_submissions : "submitted"
  students ||--o{ sign_up_responses : "signed up"
  students ||--o{ shared_files : "shared with"

  student_contacts ||--o{ attendance : "dropped off/picked up"
  student_contacts ||--o{ sign_up_responses : "signed up"

  activities ||--o{ nap_sleep_checks : "sleep checks"
  activities ||--o{ activity_media : "media"

  forms ||--o{ form_fields : "has"
  forms ||--o{ form_submissions : "submitted via"
  forms ||--o{ sign_up_slots : "has slots"

  form_submissions ||--o{ form_field_responses : "responses"

  sign_up_slots ||--o{ sign_up_responses : "booked"

  menu_templates ||--o{ menu_template_slots : "has slots"
  menu_templates ||--o{ weekly_menus : "used by"
```

---

## Table Groups

| Group | Tables |
|---|---|
| **Platform** | `schools`, `profiles`, `auth.users`, `school_memberships`, `role_permissions`, `invitations` |
| **Rooms** | `rooms`, `room_staff` |
| **Students** | `students`, `student_contacts`, `student_emergency_contacts`, `student_documents`, `student_enrollment_details`, `student_immunizations` |
| **Attendance** | `attendance` |
| **Staff** | `staff_profiles`, `staff_checkins` |
| **Activities** | `activities`, `nap_sleep_checks`, `activity_media` |
| **Schedules** | `staff_schedules`, `student_schedules`, `staff_time_off`, `school_calendar` |
| **Menus** | `food_items`, `menu_templates`, `menu_template_slots`, `weekly_menus` |
| **Forms & Compliance** | `forms`, `form_fields`, `form_submissions`, `form_field_responses`, `sign_up_slots`, `sign_up_responses`, `shared_files`, `compliance_rules`, `audit_log` |

**Total: 37 tables**

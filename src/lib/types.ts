// ============================================================
// Core Types for DayCarePortal
// ============================================================

export type Role = "admin" | "staff" | "parent" | "portal_admin";
export type EnrollmentStatus = "active" | "waitlist" | "withdrawn" | "graduated";
export type AttendanceStatus = "checked_in" | "checked_out" | "absent" | "expected";
export type ActivityType =
  | "photo" | "video" | "food" | "nap" | "potty" | "note"
  | "kudos" | "meds" | "name_to_face" | "incident" | "health_check" | "observation";
export type PortalStatus = "signed_up" | "invited" | "not_signed_up";
export type FormStatus = "unshared" | "shared" | "closed";
export type FormType = "form" | "request" | "sign_up";
export type SubmissionStatus = "submitted" | "reviewed" | "approved";
export type NapPosition = "back" | "side" | "stomach";
export type ScheduleType = "full" | "half" | "am" | "pm";
export type TimeOffType = "vacation" | "sick" | "personal" | "other";
export type CalendarEventType = "holiday" | "closure" | "event";
export type MediaType = "photo" | "video";
export type MealType = "breakfast" | "lunch" | "am_snack" | "pm_snack";
export type FoodCategory = "grain" | "protein" | "fruit" | "vegetable" | "dairy" | "other";
export type FieldType = "text" | "long_text" | "date" | "number" | "checkbox" | "dropdown" | "file" | "signature";
export type SharedWith = "all" | "room" | "student";
export type SlotType = "item" | "time" | "recurring" | "time_series";
export type ContactType = "parent" | "guardian" | "grandparent" | "aunt_uncle" | "babysitter" | "nanny" | "family_friend" | "other";

export interface School {
  id: string;
  name: string;
  timezone: string;
  operating_hours?: Record<string, unknown>;
  ratio_rules?: Record<string, unknown>;
  created_at: string;
}

export interface Profile {
  id: string;
  school_id: string | null;
  role: Role;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
}

export interface Room {
  id: string;
  school_id: string;
  name: string;
  age_range_min_months: number | null;
  age_range_max_months: number | null;
  capacity: number | null;
  ratio_staff: number | null;
  ratio_children: number | null;
  created_at: string;
}

export interface RoomStaff {
  room_id: string;
  staff_id: string;
  is_lead: boolean;
  created_at: string;
}

export interface Student {
  id: string;
  school_id: string;
  first_name: string;
  last_name: string;
  preferred_name: string | null;
  photo_url: string | null;
  dob: string | null;
  gender: string | null;
  race: string | null;
  ethnicity: string | null;
  allergies: string | null;
  medications: string | null;
  notes: string | null;
  doctor_name: string | null;
  doctor_phone: string | null;
  address: Record<string, string> | null;
  enrollment_status: EnrollmentStatus;
  start_date: string | null;
  end_date: string | null;
  homeroom_id: string | null;
  meal_type: string | null;
  student_id_internal: string | null;
  schedule_days: string[] | null;
  created_at: string;
}

export interface StudentContact {
  id: string;
  student_id: string;
  type: ContactType;
  full_name: string;
  email: string | null;
  phone: string | null;
  is_primary: boolean;
  can_pickup: boolean;
  photo_url: string | null;
  pin_code: string | null;
  portal_status: PortalStatus;
  pickup_valid_from: string | null;
  pickup_valid_to: string | null;
  created_at: string;
}

export interface StudentEmergencyContact {
  id: string;
  student_id: string;
  full_name: string;
  relationship: string | null;
  phone: string | null;
  created_at: string;
}

export interface StudentDocument {
  id: string;
  student_id: string;
  doc_type: string | null;
  file_url: string | null;
  uploaded_at: string;
}

export interface StudentEnrollmentDetails {
  student_id: string;
  first_contact_date: string | null;
  toured_date: string | null;
  paperwork_date: string | null;
  desired_start_date: string | null;
  graduation_date: string | null;
  expected_birth_date: string | null;
  sibling_name: string | null;
  programs: string | null;
  additional_details: string | null;
  family_income: number | null;
  subsidy: boolean | null;
  subsidy_details: string | null;
}

export interface StudentImmunization {
  id: string;
  student_id: string;
  vaccine_name: string;
  dose_number: number | null;
  administered_date: string | null;
  exempt: boolean;
  skipped: boolean;
  notes: string | null;
}

export interface Attendance {
  id: string;
  student_id: string;
  room_id: string | null;
  date: string;
  status: AttendanceStatus;
  checkin_time: string | null;
  checkin_contact_id: string | null;
  checkout_time: string | null;
  checkout_contact_id: string | null;
  absence_reason: string | null;
  created_by: string | null;
  created_at: string;
}

export interface StaffProfile {
  id: string;
  school_id: string;
  hire_date: string | null;
  birthday: string | null;
  address: string | null;
  notes: string | null;
  emergency_contact_name: string | null;
  emergency_contact_relationship: string | null;
  emergency_contact_phone: string | null;
  allergies: string | null;
  medications: string | null;
  doctor: string | null;
  doctor_phone: string | null;
  degree: string | null;
  certification: string | null;
  ece_credits: number | null;
  infant_toddler_credits: number | null;
  cert_notes: string | null;
  created_at: string;
}

export interface StaffCheckin {
  id: string;
  staff_id: string;
  date: string;
  checkin_time: string | null;
  checkout_time: string | null;
}

export interface Activity {
  id: string;
  school_id: string;
  room_id: string | null;
  student_id: string | null;
  created_by: string | null;
  activity_type: ActivityType;
  activity_date: string;
  activity_time: string | null;
  staff_only: boolean;
  notes: string | null;
  data: Record<string, unknown> | null;
  created_at: string;
}

export interface NapSleepCheck {
  id: string;
  activity_id: string;
  checked_at: string;
  position: NapPosition | null;
  checked_by: string | null;
}

export interface ActivityMedia {
  id: string;
  activity_id: string;
  media_type: MediaType | null;
  file_url: string;
  created_at: string;
}

export interface StaffSchedule {
  id: string;
  staff_id: string;
  room_id: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  effective_from: string | null;
  effective_to: string | null;
}

export interface StudentSchedule {
  id: string;
  student_id: string;
  day_of_week: number;
  schedule_type: ScheduleType | null;
  effective_from: string | null;
  effective_to: string | null;
}

export interface StaffTimeOff {
  id: string;
  staff_id: string;
  start_date: string;
  end_date: string;
  type: TimeOffType | null;
  notes: string | null;
  approved: boolean;
}

export interface SchoolCalendar {
  id: string;
  school_id: string;
  event_date: string;
  event_type: CalendarEventType | null;
  title: string;
  notes: string | null;
}

export interface FoodItem {
  id: string;
  school_id: string;
  name: string;
  category: FoodCategory | null;
  allergens: string[] | null;
  created_at: string;
}

export interface MenuTemplate {
  id: string;
  school_id: string;
  name: string;
  created_at: string;
}

export interface MenuTemplateSlot {
  id: string;
  template_id: string;
  day_of_week: number;
  meal_type: MealType | null;
  food_item_ids: string[] | null;
}

export interface WeeklyMenu {
  id: string;
  school_id: string;
  week_start: string;
  template_id: string | null;
  overrides: Record<string, unknown> | null;
}

export interface Form {
  id: string;
  school_id: string;
  name: string;
  form_type: FormType | null;
  description: string | null;
  status: FormStatus;
  due_date: string | null;
  requires_review: boolean;
  created_by: string | null;
  created_at: string;
}

export interface FormField {
  id: string;
  form_id: string;
  field_type: FieldType | null;
  label: string;
  required: boolean;
  options: Record<string, unknown> | null;
  order_index: number;
  show_if: Record<string, unknown> | null;
}

export interface FormSubmission {
  id: string;
  form_id: string;
  student_id: string | null;
  submitted_by: string | null;
  submitted_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  status: SubmissionStatus;
}

export interface FormFieldResponse {
  id: string;
  submission_id: string;
  field_id: string;
  value: string | null;
  file_url: string | null;
}

export interface SignUpSlot {
  id: string;
  form_id: string;
  slot_type: SlotType | null;
  label: string | null;
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  capacity: number | null;
  created_at: string;
}

export interface SignUpResponse {
  id: string;
  slot_id: string;
  student_id: string | null;
  contact_id: string | null;
  signed_up_at: string;
}

export interface SharedFile {
  id: string;
  school_id: string;
  name: string;
  file_url: string;
  shared_with: SharedWith | null;
  room_id: string | null;
  student_id: string | null;
  created_by: string | null;
  created_at: string;
}

export interface ComplianceRule {
  id: string;
  school_id: string;
  rule_type: string;
  enabled: boolean;
  config: Record<string, unknown> | null;
}

export interface AuditLog {
  id: string;
  school_id: string | null;
  entity_type: string | null;
  entity_id: string | null;
  action: string;
  performed_by: string | null;
  performed_at: string;
  details: Record<string, unknown> | null;
}

// Extended / joined types used in UI
export interface StudentWithRoom extends Student {
  room?: Room;
}

export interface AttendanceWithStudent extends Attendance {
  student?: Student;
}

export interface ActivityWithProfile extends Activity {
  profile?: Profile;
}

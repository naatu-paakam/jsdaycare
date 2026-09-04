/**
 * JsDayCare — Test Data Seed Script
 *
 * Creates 3 personas with realistic, fully testable data:
 *   1. Admin   — school admin account (credentials in .notes, gitignored)
 *   2. Teacher — staff account (credentials in .notes, gitignored)
 *   3. Parent  — parent account (credentials in .notes, gitignored)
 *
 * Usage:
 *   node scripts/seed.js           # seed all data
 *   node scripts/seed.js --reset   # wipe school data and re-seed
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({ path: new URL("../.env", import.meta.url).pathname });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY  = process.env.VITE_SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_KEY in .env");
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const SCHOOL_ID  = "08f7413b-1aa9-4679-b80b-d59ffc1fd749"; // JS Joy Family Daycare

// Fixed UUIDs so IDs never change between resets — tests can hardcode these
const ADRITH_ID  = "1cd2d725-70ce-429b-9070-7dbc59a157f2";
const ATIF_ID    = "2201e840-e260-4abc-b68e-f0b45fa52486";
const VIHAAN_ID  = "0008189e-2d99-4af6-8e93-fe864a6ad780";
const AANYA_ID   = "6d628c58-06cc-4ce0-809a-fb2d29ef90d6";
const LEO_ID     = "aa4f084a-a380-4c85-9b1f-41acfde27c64";
const TODAY = new Date().toISOString().split("T")[0];
const log = (msg) => console.log(`  ✓ ${msg}`);
const err = (msg, e) => console.error(`  ✗ ${msg}:`, e?.message || e);

// ─── Auth helpers ────────────────────────────────────────────────────────────

async function upsertAuthUser(email, password, fullName) {
  // Check if exists
  const { data: list } = await sb.auth.admin.listUsers();
  const existing = list?.users?.find((u) => u.email === email);
  if (existing) return existing.id;

  const { data, error } = await sb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error) throw error;
  return data.user.id;
}

async function upsertProfile(id, role, fullName, phone) {
  const { error } = await sb.from("profiles").upsert(
    { id, school_id: SCHOOL_ID, role, full_name: fullName, phone },
    { onConflict: "id" }
  );
  if (error) throw error;
}

// ─── Reset ───────────────────────────────────────────────────────────────────

async function resetSchoolData() {
  console.log("\n⚠️  Resetting school data...");
  const tables = [
    "audit_log", "sign_up_responses", "sign_up_slots", "form_field_responses",
    "form_submissions", "form_fields", "forms", "shared_files", "compliance_rules",
    "weekly_menus", "menu_template_slots", "menu_templates", "food_items",
    "staff_time_off", "student_schedules", "staff_schedules", "school_calendar",
    "nap_sleep_checks", "activity_media", "activities",
    "staff_checkins", "staff_profiles", "attendance",
    "student_immunizations", "student_enrollment_details", "student_documents",
    "student_emergency_contacts", "student_contacts", "students",
    "room_staff", "rooms",
  ];
  for (const t of tables) {
    const { error } = await sb.from(t).delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error && !error.message.includes("does not exist")) err(`reset ${t}`, error);
  }
  log("School data cleared");
}

// ─── Main seed ───────────────────────────────────────────────────────────────

async function seed() {
  const reset = process.argv.includes("--reset");
  if (reset) await resetSchoolData();

  console.log("\n👥 Creating users & profiles...");

  // Admin — already exists, just ensure profile
  const ADMIN_ID = "433b4135-4921-492d-8ded-378110b0409c";
  await upsertProfile(ADMIN_ID, "admin", "Jaya Bijjala", "+1 (650) 555-0100");
  log("Admin: Jaya Bijjala (admin@jsdaycare.com)");

  // Teacher
  const TEACHER_ID = await upsertAuthUser("teacher@jsdaycare.com", "JsDaycare@2026", "Nidhi Patel");
  await upsertProfile(TEACHER_ID, "staff", "Nidhi Patel", "+1 (650) 555-0101");
  log("Teacher: Nidhi Patel (teacher@jsdaycare.com)");

  // Parent
  const PARENT_ID = await upsertAuthUser("parent@jsdaycare.com", "JsDaycare@2026", "Arudeepa Kumar");
  await upsertProfile(PARENT_ID, "parent", "Arudeepa Kumar", "+1 (332) 555-0200");
  log("Parent: Arudeepa Kumar (parent@jsdaycare.com)");

  // Portal Admin — platform-level super-admin, no school_id
  const PORTAL_ADMIN_ID = await upsertAuthUser("portal@daycareportal.com", "DayCarePortal@2026", "Portal Administrator");
  await sb.from("profiles").upsert(
    { id: PORTAL_ADMIN_ID, school_id: null, role: "portal_admin", full_name: "Portal Administrator", phone: null },
    { onConflict: "id" }
  );
  log("Portal Admin: Portal Administrator (portal@daycareportal.com)");

  // ── Rooms ────────────────────────────────────────────────────────────────

  console.log("\n🏫 Creating rooms...");
  const { data: rooms, error: roomErr } = await sb.from("rooms").insert([
    { school_id: SCHOOL_ID, name: "Infants",  age_range_min_months: 0,  age_range_max_months: 12, capacity: 8,  ratio_staff: 1, ratio_children: 4 },
    { school_id: SCHOOL_ID, name: "Toddlers", age_range_min_months: 12, age_range_max_months: 36, capacity: 12, ratio_staff: 1, ratio_children: 6 },
    { school_id: SCHOOL_ID, name: "Pre-K",    age_range_min_months: 36, age_range_max_months: 60, capacity: 16, ratio_staff: 1, ratio_children: 10 },
  ]).select();
  if (roomErr) { err("rooms", roomErr); process.exit(1); }
  const [infantRoom, toddlerRoom, preKRoom] = rooms;
  log(`Infants room    (cap 8, ratio 1:4) → ${infantRoom.id}`);
  log(`Toddlers room   (cap 12, ratio 1:6) → ${toddlerRoom.id}`);
  log(`Pre-K room      (cap 16, ratio 1:10) → ${preKRoom.id}`);

  // ── Staff profiles ───────────────────────────────────────────────────────

  console.log("\n👩‍🏫 Creating staff profiles...");
  await sb.from("staff_profiles").upsert([
    {
      id: ADMIN_ID, school_id: SCHOOL_ID,
      hire_date: "2024-01-15", birthday: "1985-06-22",
      address: "864 Sellby Ln, Sanjose CA 95127",
      emergency_contact_name: "Pavan Bijjala",
      emergency_contact_relationship: "Spouse",
      emergency_contact_phone: "+1 (650) 314-1526",
      degree: "Bachelor of Early Childhood Education",
      certification: "CDA, CPR/First Aid",
      ece_credits: 60, infant_toddler_credits: 12,
    },
    {
      id: TEACHER_ID, school_id: SCHOOL_ID,
      hire_date: "2024-03-01", birthday: "1992-11-08",
      address: "220 Oak Ave, Sunnyvale CA 94086",
      emergency_contact_name: "Raj Patel",
      emergency_contact_relationship: "Spouse",
      emergency_contact_phone: "+1 (408) 555-0199",
      degree: "Associate in Child Development",
      certification: "CPR/First Aid",
      ece_credits: 24, infant_toddler_credits: 6,
    },
  ], { onConflict: "id" });
  log("Staff profiles created");

  // Assign staff to rooms
  await sb.from("room_staff").insert([
    { room_id: infantRoom.id,  staff_id: ADMIN_ID,   is_lead: true },
    { room_id: toddlerRoom.id, staff_id: ADMIN_ID,   is_lead: true },
    { room_id: toddlerRoom.id, staff_id: TEACHER_ID, is_lead: false },
    { room_id: preKRoom.id,    staff_id: TEACHER_ID, is_lead: true },
  ]);
  log("Room assignments done");

  // Staff check-ins (today)
  await sb.from("staff_checkins").insert([
    { staff_id: ADMIN_ID,   date: TODAY, checkin_time: "07:30:00" },
    { staff_id: TEACHER_ID, date: TODAY, checkin_time: "08:00:00" },
  ]);
  log("Staff checked in for today");

  // ── Students ─────────────────────────────────────────────────────────────

  console.log("\n👶 Creating students...");
  const { data: students, error: stuErr } = await sb.from("students").insert([
    // Toddlers room
    {
      id: ADRITH_ID, school_id: SCHOOL_ID, homeroom_id: toddlerRoom.id,
      first_name: "Adrith Ram", last_name: "Mukthineni",
      dob: "2025-03-22", gender: "Male",
      allergies: "None", medications: "None",
      doctor_name: "Kathryn Wheeler", doctor_phone: "408-730-4251",
      address: { street: "864 Sellby Ln", city: "San Jose", state: "CA", zip: "95127" },
      enrollment_status: "active", start_date: "2026-02-24",
      meal_type: "provided", student_id_internal: "STU-001",
      schedule_days: ["monday","tuesday","wednesday","thursday","friday"],
    },
    {
      id: ATIF_ID, school_id: SCHOOL_ID, homeroom_id: toddlerRoom.id,
      first_name: "Atif Hifzur", last_name: "Rehman",
      dob: "2024-11-05", gender: "Male",
      allergies: "Peanuts — carry EpiPen", medications: "EpiPen (in bag)",
      notes: "Severe peanut allergy — no peanut products in classroom",
      doctor_name: "Dr. Priya Mehta", doctor_phone: "408-555-0122",
      address: { street: "1205 Elm St", city: "Sunnyvale", state: "CA", zip: "94086" },
      enrollment_status: "active", start_date: "2026-01-06",
      meal_type: "brings_own", student_id_internal: "STU-002",
      schedule_days: ["monday","tuesday","wednesday","thursday","friday"],
    },
    {
      id: VIHAAN_ID, school_id: SCHOOL_ID, homeroom_id: toddlerRoom.id,
      first_name: "Vihaan", last_name: "Bopardikar",
      dob: "2024-08-14", gender: "Male",
      allergies: "None",
      doctor_name: "Dr. James Park", doctor_phone: "408-555-0133",
      address: { street: "550 Cedar Blvd", city: "Santa Clara", state: "CA", zip: "95050" },
      enrollment_status: "active", start_date: "2026-03-10",
      meal_type: "provided", student_id_internal: "STU-003",
      schedule_days: ["monday","wednesday","friday"],
    },
    // Pre-K room
    {
      id: AANYA_ID, school_id: SCHOOL_ID, homeroom_id: preKRoom.id,
      first_name: "Aanya", last_name: "Sharma",
      dob: "2022-05-18", gender: "Female",
      allergies: "Dairy — mild intolerance", medications: "None",
      doctor_name: "Dr. Susan Lee", doctor_phone: "408-555-0144",
      address: { street: "789 Maple Dr", city: "Cupertino", state: "CA", zip: "95014" },
      enrollment_status: "active", start_date: "2025-08-25",
      meal_type: "provided", student_id_internal: "STU-004",
      schedule_days: ["monday","tuesday","wednesday","thursday","friday"],
    },
    // Waitlist — Infants
    {
      id: LEO_ID, school_id: SCHOOL_ID, homeroom_id: infantRoom.id,
      first_name: "Leo", last_name: "Chen",
      dob: "2026-04-01", gender: "Male",
      allergies: "Unknown (infant)",
      doctor_name: "Dr. Amy Nguyen", doctor_phone: "408-555-0155",
      address: { street: "300 Pine Ave", city: "San Jose", state: "CA", zip: "95112" },
      enrollment_status: "waitlist", start_date: "2026-09-01",
      meal_type: "formula", student_id_internal: "STU-005",
      schedule_days: ["monday","tuesday","wednesday","thursday","friday"],
    },
  ]).select();
  if (stuErr) { err("students", stuErr); process.exit(1); }
  const [adrith, atif, vihaan, aanya, leo] = students;
  log(`Adrith Ram Mukthineni  (Toddlers, active)   → ${adrith.id}`);
  log(`Atif Hifzur Rehman     (Toddlers, active, peanut allergy) → ${atif.id}`);
  log(`Vihaan Bopardikar      (Toddlers, active, M/W/F only) → ${vihaan.id}`);
  log(`Aanya Sharma           (Pre-K, active)       → ${aanya.id}`);
  log(`Leo Chen               (Infants, waitlist)   → ${leo.id}`);

  // ── Student Contacts ──────────────────────────────────────────────────────

  console.log("\n📞 Creating student contacts...");
  await sb.from("student_contacts").insert([
    // Adrith — parent portal user
    {
      student_id: adrith.id, school_id: SCHOOL_ID, type: "parent", full_name: "Arudeepa Kumar",
      email: "parent@jsdaycare.com", phone: "+1 (332) 201-5176",
      is_primary: true, can_pickup: true, pin_code: "100001",
      portal_status: "signed_up",
    },
    {
      student_id: adrith.id, school_id: SCHOOL_ID, type: "parent", full_name: "Sai Satish Mukthineni",
      email: "sai.mukthineni@gmail.com", phone: "+1 (650) 314-1526",
      is_primary: false, can_pickup: true, pin_code: "100002",
      portal_status: "invited",
    },
    // Atif
    {
      student_id: atif.id, school_id: SCHOOL_ID, type: "parent", full_name: "Hifzur Rehman",
      email: "hifzur.rehman@gmail.com", phone: "+1 (408) 555-0210",
      is_primary: true, can_pickup: true, pin_code: "200001",
      portal_status: "signed_up",
    },
    {
      student_id: atif.id, school_id: SCHOOL_ID, type: "parent", full_name: "Sara Rehman",
      email: "sara.rehman@gmail.com", phone: "+1 (408) 555-0211",
      is_primary: false, can_pickup: true, pin_code: "200002",
      portal_status: "not_signed_up",
    },
    // Vihaan
    {
      student_id: vihaan.id, school_id: SCHOOL_ID, type: "parent", full_name: "Riya Bopardikar",
      email: "riya.bopardikar@gmail.com", phone: "+1 (408) 555-0220",
      is_primary: true, can_pickup: true, pin_code: "300001",
      portal_status: "invited",
    },
    // Aanya
    {
      student_id: aanya.id, school_id: SCHOOL_ID, type: "parent", full_name: "Priya Sharma",
      email: "priya.sharma@gmail.com", phone: "+1 (408) 555-0230",
      is_primary: true, can_pickup: true, pin_code: "400001",
      portal_status: "signed_up",
    },
    {
      student_id: aanya.id, school_id: SCHOOL_ID, type: "guardian", full_name: "Ramesh Sharma",
      email: null, phone: "+1 (408) 555-0231",
      is_primary: false, can_pickup: true, pin_code: "400002",
      portal_status: "not_signed_up",
    },
    // Leo
    {
      student_id: leo.id, school_id: SCHOOL_ID, type: "parent", full_name: "David Chen",
      email: "david.chen@gmail.com", phone: "+1 (408) 555-0240",
      is_primary: true, can_pickup: true, pin_code: "500001",
      portal_status: "not_signed_up",
    },
  ]);
  log("Contacts created (mix of signed_up / invited / not_signed_up)");

  // Emergency contacts
  await sb.from("student_emergency_contacts").insert([
    { student_id: adrith.id, full_name: "Pavan Bijjala",   relationship: "Uncle", phone: "+1 (650) 314-1526" },
    { student_id: adrith.id, full_name: "Latha Kumar",     relationship: "Grandmother", phone: "+1 (332) 555-0300" },
    { student_id: atif.id,   full_name: "Ahmed Rehman",    relationship: "Grandfather", phone: "+1 (408) 555-0310" },
    { student_id: atif.id,   full_name: "Fatima Rehman",   relationship: "Grandmother", phone: "+1 (408) 555-0311" },
    { student_id: vihaan.id, full_name: "Suresh Bopardikar", relationship: "Grandfather", phone: "+1 (408) 555-0320" },
    { student_id: aanya.id,  full_name: "Kavitha Sharma",  relationship: "Aunt", phone: "+1 (408) 555-0330" },
  ]);
  log("Emergency contacts created");

  // Enrollment details
  await sb.from("student_enrollment_details").insert([
    {
      student_id: adrith.id,
      first_contact_date: "2026-01-10", toured_date: "2026-01-20",
      paperwork_date: "2026-02-01", desired_start_date: "2026-02-24",
      start_date: "2026-02-24", programs: "None",
      additional_details: "Family prefers Kannada spoken occasionally",
    },
    {
      student_id: atif.id,
      first_contact_date: "2025-11-15", toured_date: "2025-11-25",
      paperwork_date: "2025-12-10", desired_start_date: "2026-01-06",
      start_date: "2026-01-06",
      additional_details: "Peanut allergy action plan on file",
    },
    {
      student_id: aanya.id,
      first_contact_date: "2025-07-01", toured_date: "2025-07-15",
      paperwork_date: "2025-08-01", desired_start_date: "2025-08-25",
      start_date: "2025-08-25", programs: "State Pre-K",
      graduation_date: "2026-06-15",
    },
    {
      student_id: leo.id,
      first_contact_date: "2026-06-01", toured_date: "2026-06-20",
      desired_start_date: "2026-09-01",
      additional_details: "Waitlist — contact when infant spot opens",
    },
  ]);
  log("Enrollment details created");

  // Immunizations for Adrith (mix of overdue/due/done to test dashboard alerts)
  await sb.from("student_immunizations").insert([
    { student_id: adrith.id, vaccine_name: "Hep B",  dose_number: 1, administered_date: "2025-03-25", exempt: false, skipped: false },
    { student_id: adrith.id, vaccine_name: "Hep B",  dose_number: 2, administered_date: "2025-05-10", exempt: false, skipped: false },
    // Hep B dose 3 missing → overdue alert
    { student_id: adrith.id, vaccine_name: "DTaP",   dose_number: 1, administered_date: "2025-05-22", exempt: false, skipped: false },
    { student_id: adrith.id, vaccine_name: "DTaP",   dose_number: 2, administered_date: "2025-07-22", exempt: false, skipped: false },
    // DTaP dose 3 missing → overdue
    { student_id: adrith.id, vaccine_name: "Polio",  dose_number: 1, administered_date: "2025-05-22", exempt: false, skipped: false },
    { student_id: adrith.id, vaccine_name: "Polio",  dose_number: 2, administered_date: "2025-07-22", exempt: false, skipped: false },
    { student_id: adrith.id, vaccine_name: "MMR",    dose_number: 1, administered_date: null, exempt: false, skipped: false },
  ]);
  log("Immunizations seeded (Adrith has overdue doses → triggers compliance alert)");

  // ── Attendance (today) ────────────────────────────────────────────────────

  console.log("\n✅ Creating today's attendance...");
  const { data: contacts } = await sb.from("student_contacts").select("id, student_id, full_name").in("student_id", [adrith.id, atif.id, vihaan.id, aanya.id]);
  const contactMap = {};
  contacts.forEach((c) => { if (!contactMap[c.student_id]) contactMap[c.student_id] = c.id; });

  await sb.from("attendance").insert([
    // Adrith — checked in and out
    {
      student_id: adrith.id, room_id: toddlerRoom.id, date: TODAY,
      status: "checked_out",
      checkin_time: "08:15:00",  checkin_contact_id: contactMap[adrith.id],
      checkout_time: "17:40:00", checkout_contact_id: contactMap[adrith.id],
      created_by: ADMIN_ID,
    },
    // Atif — checked in, still present
    {
      student_id: atif.id, room_id: toddlerRoom.id, date: TODAY,
      status: "checked_in",
      checkin_time: "08:30:00", checkin_contact_id: contactMap[atif.id],
      created_by: ADMIN_ID,
    },
    // Vihaan — absent today (only M/W/F; today may be Tue — mark absent)
    {
      student_id: vihaan.id, room_id: toddlerRoom.id, date: TODAY,
      status: "absent", absence_reason: "Family appointment",
      created_by: TEACHER_ID,
    },
    // Aanya — checked in, Pre-K
    {
      student_id: aanya.id, room_id: preKRoom.id, date: TODAY,
      status: "checked_in",
      checkin_time: "07:45:00", checkin_contact_id: contactMap[aanya.id],
      created_by: ADMIN_ID,
    },
  ]);
  log("Attendance: Adrith checked-out, Atif checked-in, Vihaan absent, Aanya checked-in");

  // ── Activities (today's feed) ─────────────────────────────────────────────

  console.log("\n📋 Creating today's activities...");
  const baseActivity = { school_id: SCHOOL_ID, activity_date: TODAY, created_by: TEACHER_ID };

  const { data: acts } = await sb.from("activities").insert([
    // Adrith
    { ...baseActivity, student_id: adrith.id, room_id: toddlerRoom.id, activity_type: "food",    activity_time: "08:45:00", data: { food_type: "food", food_quantity: "all",  meal_type: "breakfast", meal_items: ["Oatmeal", "Banana"] }, staff_only: false },
    { ...baseActivity, student_id: adrith.id, room_id: toddlerRoom.id, activity_type: "potty",   activity_time: "10:00:00", data: { potty_type: "wet" }, staff_only: false },
    { ...baseActivity, student_id: adrith.id, room_id: toddlerRoom.id, activity_type: "nap",     activity_time: "12:30:00", data: { nap_status: "started" }, staff_only: false, notes: "Settled quickly" },
    { ...baseActivity, student_id: adrith.id, room_id: toddlerRoom.id, activity_type: "nap",     activity_time: "14:30:00", data: { nap_status: "ended" }, staff_only: false },
    { ...baseActivity, student_id: adrith.id, room_id: toddlerRoom.id, activity_type: "food",    activity_time: "15:00:00", data: { food_type: "food", food_quantity: "most", meal_type: "am_snack", meal_items: ["Crackers", "Apple slices"] }, staff_only: false },
    { ...baseActivity, student_id: adrith.id, room_id: toddlerRoom.id, activity_type: "kudos",   activity_time: "16:00:00", notes: "Shared his blocks with friends today — great teamwork!", staff_only: false },
    { ...baseActivity, student_id: adrith.id, room_id: toddlerRoom.id, activity_type: "note",    activity_time: "17:00:00", notes: "Slight runny nose — monitor tomorrow", staff_only: true },

    // Atif
    { ...baseActivity, student_id: atif.id, room_id: toddlerRoom.id, activity_type: "food",    activity_time: "08:50:00", data: { food_type: "food", food_quantity: "some",  meal_type: "breakfast", meal_items: ["Toast", "Grapes"] }, staff_only: false, notes: "Brought from home" },
    { ...baseActivity, student_id: atif.id, room_id: toddlerRoom.id, activity_type: "health_check", activity_time: "09:00:00", data: { health_temp: "98.6" }, notes: "Routine morning check — no concerns", staff_only: false },
    { ...baseActivity, student_id: atif.id, room_id: toddlerRoom.id, activity_type: "potty",   activity_time: "10:30:00", data: { potty_type: "bm" }, staff_only: false },
    { ...baseActivity, student_id: atif.id, room_id: toddlerRoom.id, activity_type: "nap",     activity_time: "12:35:00", data: { nap_status: "started" }, staff_only: false },
    { ...baseActivity, student_id: atif.id, room_id: toddlerRoom.id, activity_type: "nap",     activity_time: "14:20:00", data: { nap_status: "ended" }, staff_only: false, notes: "Woke up a little early, was happy" },

    // Aanya — Pre-K
    { ...baseActivity, student_id: aanya.id, room_id: preKRoom.id, activity_type: "food",    activity_time: "08:30:00", data: { food_type: "food", food_quantity: "all",  meal_type: "breakfast", meal_items: ["Whole grain cereal", "Dairy-free milk", "Strawberries"] }, staff_only: false },
    { ...baseActivity, student_id: aanya.id, room_id: preKRoom.id, activity_type: "observation", activity_time: "10:00:00", data: { observation_area: "Language" }, notes: "Named all letters in her name independently — great milestone!", staff_only: false },
    { ...baseActivity, student_id: aanya.id, room_id: preKRoom.id, activity_type: "food",    activity_time: "12:00:00", data: { food_type: "food", food_quantity: "most", meal_type: "lunch",     meal_items: ["Rice", "Dal", "Cucumber"] }, staff_only: false },
    { ...baseActivity, student_id: aanya.id, room_id: preKRoom.id, activity_type: "nap",     activity_time: "13:00:00", data: { nap_status: "started" }, staff_only: false },
    { ...baseActivity, student_id: aanya.id, room_id: preKRoom.id, activity_type: "nap",     activity_time: "14:30:00", data: { nap_status: "ended" }, staff_only: false },
  ]).select();
  log(`${acts?.length || 0} activity entries created`);

  // Sleep checks for Adrith's nap
  const adrithNap = acts?.find((a) => a.student_id === adrith.id && a.activity_type === "nap" && a.data?.nap_status === "started");
  if (adrithNap) {
    await sb.from("nap_sleep_checks").insert([
      { activity_id: adrithNap.id, checked_at: `${TODAY}T13:00:00`, position: "side",  checked_by: TEACHER_ID },
      { activity_id: adrithNap.id, checked_at: `${TODAY}T13:30:00`, position: "side",  checked_by: TEACHER_ID },
      { activity_id: adrithNap.id, checked_at: `${TODAY}T14:00:00`, position: "back",  checked_by: TEACHER_ID },
    ]);
    log("Sleep checks logged for Adrith's nap (3 checks)");
  }

  // ── Schedules ─────────────────────────────────────────────────────────────

  console.log("\n📅 Creating schedules...");
  const days = [1, 2, 3, 4, 5]; // Mon–Fri
  await sb.from("staff_schedules").insert([
    ...days.map((d) => ({ staff_id: ADMIN_ID,   room_id: toddlerRoom.id, day_of_week: d, start_time: "07:30:00", end_time: "16:30:00", effective_from: "2026-01-01" })),
    ...days.map((d) => ({ staff_id: TEACHER_ID, room_id: toddlerRoom.id, day_of_week: d, start_time: "08:00:00", end_time: "17:00:00", effective_from: "2026-01-01" })),
  ]);

  await sb.from("student_schedules").insert([
    ...days.map((d) => ({ student_id: adrith.id, day_of_week: d, schedule_type: "full", effective_from: "2026-02-24" })),
    ...days.map((d) => ({ student_id: atif.id,   day_of_week: d, schedule_type: "full", effective_from: "2026-01-06" })),
    ...[1, 3, 5].map((d) => ({ student_id: vihaan.id, day_of_week: d, schedule_type: "full", effective_from: "2026-03-10" })),
    ...days.map((d) => ({ student_id: aanya.id,  day_of_week: d, schedule_type: "full", effective_from: "2025-08-25" })),
  ]);
  log("Staff and student schedules created");

  // School calendar — upcoming events
  await sb.from("school_calendar").insert([
    { school_id: SCHOOL_ID, event_date: "2026-09-07", event_type: "holiday", title: "Labor Day — Closed", notes: "School closed" },
    { school_id: SCHOOL_ID, event_date: "2026-10-14", event_type: "holiday", title: "Columbus Day — Closed" },
    { school_id: SCHOOL_ID, event_date: "2026-09-15", event_type: "event",   title: "Parent-Teacher Conference Day", notes: "Sign-ups sent via Paperwork" },
    { school_id: SCHOOL_ID, event_date: "2026-10-31", event_type: "event",   title: "Halloween Dress-Up Day" },
  ]);
  log("School calendar events created (holidays + events)");

  // ── Menus ─────────────────────────────────────────────────────────────────

  console.log("\n🍎 Creating food items and menu...");
  const { data: foodItems } = await sb.from("food_items").insert([
    { school_id: SCHOOL_ID, name: "Oatmeal",           category: "grain",     allergens: ["gluten"] },
    { school_id: SCHOOL_ID, name: "Whole grain cereal", category: "grain",    allergens: ["gluten"] },
    { school_id: SCHOOL_ID, name: "Brown rice",         category: "grain",    allergens: [] },
    { school_id: SCHOOL_ID, name: "Toast",              category: "grain",    allergens: ["gluten"] },
    { school_id: SCHOOL_ID, name: "Scrambled eggs",     category: "protein",  allergens: ["eggs"] },
    { school_id: SCHOOL_ID, name: "Dal (lentils)",      category: "protein",  allergens: [] },
    { school_id: SCHOOL_ID, name: "Grilled chicken",    category: "protein",  allergens: [] },
    { school_id: SCHOOL_ID, name: "Banana",             category: "fruit",    allergens: [] },
    { school_id: SCHOOL_ID, name: "Apple slices",       category: "fruit",    allergens: [] },
    { school_id: SCHOOL_ID, name: "Grapes",             category: "fruit",    allergens: [] },
    { school_id: SCHOOL_ID, name: "Strawberries",       category: "fruit",    allergens: [] },
    { school_id: SCHOOL_ID, name: "Cucumber slices",    category: "vegetable",allergens: [] },
    { school_id: SCHOOL_ID, name: "Steamed broccoli",   category: "vegetable",allergens: [] },
    { school_id: SCHOOL_ID, name: "Whole milk",         category: "dairy",    allergens: ["dairy"] },
    { school_id: SCHOOL_ID, name: "Dairy-free milk",    category: "dairy",    allergens: [] },
    { school_id: SCHOOL_ID, name: "Crackers",           category: "grain",    allergens: ["gluten"] },
    { school_id: SCHOOL_ID, name: "Cheese cubes",       category: "dairy",    allergens: ["dairy"] },
  ]).select();
  log(`${foodItems?.length || 0} food items in library`);

  // ── Forms ─────────────────────────────────────────────────────────────────

  console.log("\n📄 Creating forms...");
  await sb.from("forms").insert([
    {
      school_id: SCHOOL_ID, name: "Enrollment Agreement", form_type: "form",
      description: "Terms, tuition acknowledgment, and facility policies.",
      status: "shared", requires_review: true, created_by: ADMIN_ID,
      due_date: "2026-09-01",
    },
    {
      school_id: SCHOOL_ID, name: "Health History", form_type: "form",
      description: "Child health history, allergies, medications, and doctor contact.",
      status: "shared", requires_review: true, created_by: ADMIN_ID,
    },
    {
      school_id: SCHOOL_ID, name: "Media Release", form_type: "form",
      description: "Permission to photograph and video your child for classroom use.",
      status: "shared", requires_review: false, created_by: ADMIN_ID,
    },
    {
      school_id: SCHOOL_ID, name: "Emergency Authorization", form_type: "form",
      description: "Emergency medical authorization and alternate pickup authorization.",
      status: "shared", requires_review: true, created_by: ADMIN_ID,
    },
    {
      school_id: SCHOOL_ID, name: "Field Trip — Happy Hollow Park", form_type: "form",
      description: "Permission slip for the September 20 field trip to Happy Hollow Park.",
      status: "shared", requires_review: false, created_by: ADMIN_ID,
      due_date: "2026-09-17",
    },
    {
      school_id: SCHOOL_ID, name: "Parent-Teacher Conference Signup", form_type: "sign_up",
      description: "Book your 20-minute slot for the Sept 15 parent-teacher conference.",
      status: "shared", requires_review: false, created_by: ADMIN_ID,
      due_date: "2026-09-12",
    },
    {
      school_id: SCHOOL_ID, name: "Classroom Supplies Request", form_type: "sign_up",
      description: "Sign up to bring one classroom supply item this month.",
      status: "shared", requires_review: false, created_by: ADMIN_ID,
    },
    {
      school_id: SCHOOL_ID, name: "Student & Guardian Information Update", form_type: "request",
      description: "Please verify and update your contact information for the new year.",
      status: "shared", requires_review: true, created_by: ADMIN_ID,
      due_date: "2026-09-05",
    },
  ]);
  log("8 forms/requests/sign-ups created");

  // ── Compliance rules ──────────────────────────────────────────────────────

  await sb.from("compliance_rules").insert([
    { school_id: SCHOOL_ID, rule_type: "missing_required_form",      enabled: true,  config: { forms: ["Enrollment Agreement","Health History","Emergency Authorization"] } },
    { school_id: SCHOOL_ID, rule_type: "immunization_overdue",       enabled: true,  config: {} },
    { school_id: SCHOOL_ID, rule_type: "staff_cert_expiry",          enabled: true,  config: { warning_days: 30 } },
    { school_id: SCHOOL_ID, rule_type: "ratio_violation",            enabled: true,  config: {} },
    { school_id: SCHOOL_ID, rule_type: "missing_emergency_contacts", enabled: true,  config: { minimum: 2 } },
  ]);
  log("Compliance rules configured");

  // ── Done ──────────────────────────────────────────────────────────────────

  console.log(`
╔══════════════════════════════════════════════════════════════╗
║           JsDayCare — Test Data Seeded Successfully          ║
╠══════════════════════════════════════════════════════════════╣
║  PERSONAS                                                    ║
║  ─────────────────────────────────────────────────          ║
║  Admin    admin@jsdaycare.com     / JsDaycare@2026           ║
║           Jaya Bijjala · sees all data, all rooms            ║
║                                                              ║
║  Teacher  teacher@jsdaycare.com   / JsDaycare@2026           ║
║           Nidhi Patel · Toddlers + Pre-K rooms               ║
║                                                              ║
║  Parent   parent@jsdaycare.com    / JsDaycare@2026           ║
║           Arudeepa Kumar · sees Adrith Ram only              ║
║                                                              ║
║  STUDENTS                                                    ║
║  Adrith Ram Mukthineni  — Toddlers, checked-out today        ║
║  Atif Hifzur Rehman     — Toddlers, checked-in (peanut ⚠)   ║
║  Vihaan Bopardikar      — Toddlers, absent today (M/W/F)     ║
║  Aanya Sharma           — Pre-K, checked-in, dairy allergy   ║
║  Leo Chen               — Infants, waitlist                  ║
║                                                              ║
║  ALERTS TRIGGERED (test dashboard)                           ║
║  • Adrith: Hep B dose 3 overdue, DTaP dose 3 overdue         ║
║  • Atif: peanut allergy flagged                              ║
║  • Leo: waitlist (not active — excluded from counts)         ║
╚══════════════════════════════════════════════════════════════╝
`);
}

seed().catch((e) => { console.error("Seed failed:", e); process.exit(1); });

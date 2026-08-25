# MVP Release Scope — JsDayCare

**Status: In active development — Student feature area complete**
**Stack:** React 18 + Vite + TypeScript + Tailwind + Supabase + Express
**Dev:** http://localhost:5174 (`npm run dev`)
**GitHub:** https://github.com/naatu-paakam/jsdaycare

---

## Feature Progress

| # | Feature Area | Status |
|---|---|---|
| 1 | Child & Family Management | ✅ Built |
| 2 | Attendance Tracking | 🔲 UI wired, data loads, check-in buttons present |
| 3 | Daily Activity Reports | 🔲 Inline feed on student profile; room feed working |
| 4 | Staff Management | 🔲 List + profile pages built; clock-in not yet wired |
| 5 | Classroom / Room Management | ✅ Built |
| 6 | Scheduling + Menus | 🔲 Pages built; schedule entry not yet wired to DB |
| 7 | Admin Dashboard | 🔲 Page built; live data queries in progress |
| 8 | Forms & Compliance | 🔲 Page built; form signing not yet implemented |

---

## Feature 1 — Child & Family Management ✅

### Child Profile
- [x] Full name, preferred name, DOB + auto-calculated age
- [x] Gender, race, ethnicity
- [x] Allergies (flagged prominently in red with ⚠)
- [x] Notes, medications, doctor name + phone
- [x] Profile photo (avatar initials fallback)
- [x] Enrollment status: Active / Waitlist / Withdrawn / Graduated
- [x] Start date, schedule days
- [x] Student ID (internal)
- [x] Meal type

### Profile Tabs
- [x] Profile tab — two-column layout (personal info, address, financial details, enrollment details — admin only)
- [x] Contacts tab — unified contacts table
- [x] Immunizations tab — CDC vaccine grid
- [x] Daily Report tab — inline activity feed
- [x] Documents tab — placeholder with link to Paperwork

### Editing
- [x] Personal information — editable by admin + parent
- [x] Date of birth — included in edit form
- [x] Address — editable by admin + parent
- [x] Room assignment — admin only (dropdown of all rooms)
- [x] School details (status, meal type, student ID) — admin only
- [x] Enrollment details (all pipeline dates, sibling, programs) — admin only
- [x] Financial details (subsidy) — admin only

### Contacts
- [x] Unified table: parent/guardian + approved pickup in one view
- [x] Pickup contacts highlighted with green tint + status badge (Permanent / Active / Expired)
- [x] Photo upload per contact (⚠ badge if missing on pickup contact)
- [x] Check-in code Reveal/Hide — admin only, on every contact
- [x] Send Invite link — admin, for contacts with email but no portal
- [x] Add contact (admin) / Add pickup (admin + parent)
- [x] Edit any contact (modal with all fields)
- [x] Pickup valid from/to date range (temporary pickup authorization)
- [x] PIN code (4-digit, per contact)
- [x] Portal status: signed_up / invited / not_signed_up

### Emergency Contacts
- [x] View (all roles)
- [x] Add inline form — admin + parent
- [x] Edit inline — admin + parent
- [x] Delete — admin + parent

### Immunizations
- [x] 11 CDC vaccines with dose-by-dose tracking
- [x] Status per dose: Overdue (red) / Completed with date (green) / Skipped (gray)
- [x] Exempt toggle per vaccine (amber header when set)
- [x] Date picker per dose — editable by admin + parent
- [x] Skip checkbox per dose (clears date)
- [x] Delete dose record
- [x] Custom / Additional vaccines — add (vaccine name, dose, date, notes) + delete

---

## Feature 5 — Rooms ✅

- [x] Room list with student avatar cluster
- [x] New Room modal
- [x] Room detail — 3 tabs: Students, Parents, Feed
- [x] Students tab: Check In / Mark Absent inline buttons
- [x] Feed tab: consolidated activity feed with date filter, action type filter, Approve, Staff Only toggle
- [x] Room name dropdown to switch rooms without going back

---

## Remaining MVP Features

### Feature 2 — Attendance
- [x] Staff-triggered Check In / Check Out (button present in room Students tab)
- [ ] PIN-based check-in on shared tablet
- [ ] Record guardian who dropped off / picked up
- [ ] Daily attendance CSV export
- [ ] Absence reason on mark absent

### Feature 3 — Daily Activity Reports
- [x] 12 activity types logged from room feed
- [x] Activity timeline on student profile (inline, date-filterable)
- [x] Staff Only flag hides entries from parents
- [ ] "Mark report Done" → parent portal notification
- [ ] Photo/video attachments stored in Supabase Storage

### Feature 4 — Staff Management
- [x] Staff list with filters (room, role, status)
- [x] Staff profile (personal info, emergency contact, medical, certifications)
- [x] Check-in code reveal
- [ ] Staff clock in/out
- [ ] Staff-to-child ratio monitor (live per room)

### Feature 6 — Scheduling + Menus
- [x] Schedules page (weekly grid — staff + students)
- [x] Menus page — food item library + weekly menu grid
- [ ] Add staff/student schedule entries (wired to DB)
- [ ] Menu templates + rotating meals
- [ ] Menus feed into Food activity dropdown

### Feature 7 — Admin Dashboard
- [x] Today's stats (checked in, absent, expected, staff on duty)
- [x] Current room ratios
- [x] Today's activity coverage
- [x] Compliance alerts section
- [ ] Live data fully wired (currently some static placeholders)
- [ ] Upcoming birthdays widget

### Feature 8 — Forms & Compliance
- [x] Forms list (Shared / Unshared / Closed filter, reviews needed)
- [ ] Form builder (create custom forms)
- [ ] Parent signing flow (typed signature + timestamp)
- [ ] Incident report form
- [ ] Sign-ups (Item / Time / Recurring / Time series)
- [ ] Audit log

---

## Definition of Done
- [ ] All 8 feature areas functional end-to-end
- [x] 60 Playwright tests passing (see [MVP-testing.md](MVP-testing.md))
- [ ] Deployed to Netlify
- [ ] At least 1 real child enrolled and 1 full day of reports logged

---

## Permissions reference
See [../personas.md](../personas.md) for who can view/edit each section.

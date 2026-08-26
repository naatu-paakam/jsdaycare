# MVP Release — DayCarePortal

**Status: Feature-complete, in testing**
**Stack:** React 18 + Vite + TypeScript + Tailwind + Supabase (ap-south-1)
**Dev:** http://localhost:5174 (`npm run dev`)
**GitHub:** https://github.com/naatu-paakam/jsdaycare

---

## Build Status

| # | Feature Area | Status |
|---|---|---|
| 1 | Child & Family Management | ✅ Complete |
| 2 | Attendance Tracking | ✅ Check In/Out wired, mark absent |
| 3 | Daily Activity Reports | ✅ 12 activity types, room-level bulk logging |
| 4 | Staff Management | ✅ List, profile, room assignment |
| 5 | Classroom / Room Management | ✅ Settings modal, add activity, add student |
| 6 | Scheduling + Menus | ✅ Interactive grid, dialogs, weekly menu CRUD |
| 7 | Admin Dashboard | ✅ Live stats, ratios, activity coverage, alerts |
| 8 | Forms & Compliance | ✅ Forms list, paperwork page |

---

## Platform Features (beyond MVP scope, built)

| Feature | Status |
|---|---|
| Portal Admin persona | ✅ /portal dashboard, create/manage schools |
| Multi-school admin | ✅ School switcher in sidebar, memberships table |
| Invitation + Registration | ✅ Token-based invite links, /register page |
| Calendar redesign | ✅ Holiday calendar, special events, operating hours, policies |
| Immunization settings | ✅ Per-student vaccine visibility config |
| Role permissions table | ✅ school-configurable permission rules |
| 6-digit unique PINs | ✅ Auto-generated, unique per school |
| Parent/admin isolation | ✅ RLS with security definer functions |
| Custom contact types | ✅ 8 types (grandparent, babysitter, nanny, etc.) |

---

## Feature 1 — Child & Family Management ✅

### Profile (5 tabs)
- **Profile:** Personal info, DOB, gender, race, ethnicity, allergies (flagged), medications, doctor — editable by admin + parent. Address editable by admin + parent. Room assignment dropdown (admin). School/enrollment/financial details (admin-only).
- **Contacts:** Unified table (parents + pickup people). Auto-generated 6-digit PIN per contact. Check-in code Reveal/Hide (admin). Send Invite link. Photo upload. Pickup valid from/to dates. 8 contact types.
- **Immunizations:** 11 CDC vaccines, dose-by-dose (Overdue/Completed/Skipped/Exempt). Editable dates + Skip checkbox + Exempt toggle + Delete per dose. Custom/additional vaccines. Immunization settings (admin/parent choose which vaccines show).
- **Daily Report:** Inline activity feed, date-filterable.
- **Documents:** Links to Paperwork.

### Emergency Contacts
- Add/Edit/Delete inline — admin + parent.

### Enrollment
- Enrollment pipeline dates, sibling, programs, subsidy — admin only.

---

## Feature 5 — Rooms ✅
- Students/Feed tabs (no Parents tab)
- Room settings: name, age range, capacity, ratio, delete
- **+ Add Activity:** 12-type selector → type-specific form (food/nap/potty/note/kudos/meds/health check/observation/photo/video/incident/name-to-face) with student selector, date/time, Staff Only flag
- **+ Add Student:** searchable modal to assign students
- Room-level bulk activity (logged to all checked-in students)

---

## Feature 6 — Scheduling + Menus ✅

### Schedules
- Weekly grid (staff rows + student rows × 7 days)
- Clickable cells open **Add Staff/Student Schedule** dialog
- Staff dialog: multi-staff tags, room, repeat weekly, date range, time range, day pills
- Student dialog: student selector, type (full/half/AM/PM), date range

### Menus
- **Weekly Menu tab** — browse any week, create/edit via grid dialog (4 meals × 5 days, food library autocomplete)
- **Food Item Library tab** — admin only; manage items with categories + allergens
- Parents see Weekly Menu tab only (library hidden)

---

## Feature 7 — Admin Dashboard ✅
- Today snapshot: Expected / Checked In / Absent / Staff on duty
- Current Room Ratios (live) with traffic-light status
- Today's activity coverage per room
- Compliance alerts + upcoming birthdays

---

## Calendar ✅
Two-column redesign:
- Left: Holiday Calendar (month-grouped, admin can add/delete), Special Events (table with type badges)
- Right: Operating Schedule (per-day hours, admin edits inline), Holiday Policy (editable bullets), Birthday Policy (editable bullets)

---

## Invitation + Registration ✅
- `invitations` table with 7-day token expiry
- **InviteDialog** component — generates link, copy-to-clipboard
- **Portal Admin** → Invite School Admin (in Manage School panel)
- **School Admin** → Invite Staff (Staff List), Invite Parent (Parents page)
- **/register?token=xxx** — validates token, pre-fills email/school/role, creates account
- Login page → "Have an invitation? Register here →" link

---

## Portal Admin ✅
- **/portal** — standalone dashboard (no sidebar)
- Schools table: name, timezone, admin count, created date, Manage →
- Create School modal
- Manage School panel: rename, view/remove admins, assign existing user, generate invite link
- Blocked from school-level data

---

## Multi-School Admin ✅
- `school_memberships` table tracks all schools per admin
- `profiles.school_id` = currently active school
- Sidebar school switcher (dropdown) when admin belongs to multiple schools
- `switch_active_school(school_id)` DB function — validates membership before switching

---

## Roles & Permissions
See [../personas.md](../personas.md) for full permission matrix.

| Role | Access |
|---|---|
| Portal Admin | All schools; create/manage schools; invite school admins |
| School Admin | All data in their school(s); invite staff and parents |
| Staff | Students in assigned rooms; log activities; view schedule |
| Parent | Own children only; edit personal info + immunizations; view daily reports |

---

## Definition of Done
- [x] All 8 MVP feature areas functional end-to-end
- [x] 114 Playwright tests (see [MVP-testing.md](MVP-testing.md))
- [x] Pre-push hook enforces tests on every commit
- [ ] Netlify deployment
- [ ] At least 1 real child enrolled with 1 full day of reports

# MVP Release — DayCarePortal

**Status: Feature-complete, testing in progress**  
**Stack:** React 18 + Vite + TypeScript + Tailwind + Supabase (ap-south-1)  
**Dev:** http://localhost:5174 (`npm run dev`)  
**GitHub:** https://github.com/naatu-paakam/jsdaycare  
**Tests:** 150 Playwright tests, pre-push hook enforced

---

## Feature Build Status

| # | Feature | Status | Notes |
|---|---|---|---|
| 1 | Child & Family Management | ✅ Complete | Full profile, contacts, immunizations, emergency contacts |
| 2 | Attendance Tracking | ✅ Complete | Check In/Out wired to DB, Present badge with pulse, QR check-in |
| 3 | Daily Activity Reports | ✅ Complete | 12 activity types, edit/delete per entry, activity in daily report |
| 4 | Staff Management | ✅ Complete | List, profile, invite, room assignment |
| 5 | Classroom / Room Management | ✅ Complete | Settings modal, add activity, add student, check-in status |
| 6 | Scheduling + Menus | ✅ Complete | Interactive grid, upsert (no overlaps), delete button, weekly menu |
| 7 | Admin Dashboard | ✅ Complete | Live stats, ratios, closing-time alerts, 30s auto-refresh |
| 8 | Forms & Compliance | 🔲 Partial | Forms list page built; form builder/signing in R1 |

---

## Platform Features (beyond original MVP scope — built)

| Feature | Status |
|---|---|
| Portal Admin persona + /portal dashboard | ✅ |
| Users tab in Portal Admin (all users, search, invite, remove) | ✅ |
| Multi-school admin (sidebar switcher, school_memberships) | ✅ |
| Invitation + Registration system (token-based, 7-day expiry) | ✅ |
| User ID login (username, no email required) | ✅ |
| No email verification (admin API, instant account) | ✅ |
| Calendar redesign (holiday calendar, operating hours, policies) | ✅ |
| Immunization settings per student (show/hide vaccines) | ✅ |
| Role permissions table (school-configurable) | ✅ |
| 6-digit unique PINs (auto-generated, unique per school) | ✅ |
| Parent/admin data isolation (RLS with security definer) | ✅ |
| QR code check-in/out (public page, PIN pad, activity logged) | ✅ |
| QR printable card (school name, date, welcome message) | ✅ |
| Room list: green dot on checked-in student avatars | ✅ |
| Compliance alert: students not checked out after closing | ✅ |
| Home dashboard 30s auto-refresh + manual refresh button | ✅ |
| Daily report activity edit/delete (inline confirm + modal) | ✅ |
| Schedule upsert (no overlaps), delete schedule button | ✅ |
| Stories page stub (R1 feature, nav item present) | 🔲 R1 |
| School public website (`/s/<slug>` from settings template) | 🔲 R1 |
| Students: Admissions summary bar (stats + filter by status + edit/delete per row) | ✅ |
| Staff: Add Staff dialog (name/email/phone/photo/invite link) | ✅ |
| Staff: Edit + Remove from list, self-delete protected | ✅ |
| Staff profile: all fields inline-editable on hover (admin) | ✅ |

---

## Feature 1 — Child & Family Management ✅

**5 profile tabs:** Profile · Contacts · Immunizations · Daily Activities · Documents

**Profile:** Personal info (DOB, gender, race, allergies, medications, doctor) + Address + Room assignment + School/enrollment/financial details (admin-only).

**Contacts:** Unified table (parents + pickup people). Auto-generated 6-digit PIN. Check-in code Reveal/Hide. Send Invite link. Photo upload. Pickup valid from/to dates. 8 contact types. Non-parent contacts cannot get portal access.

**Immunizations:** 11 CDC vaccines. Dose-by-dose tracking (Overdue/Completed/Skipped/Exempt). Editable dates + Skip + Exempt + Delete per dose. Custom vaccines (add + delete). Immunization Settings (show/hide per student).

**Emergency Contacts:** Add/Edit/Delete inline — admin + parent.

---

## Feature 2 — Attendance Tracking ✅

- Staff Check In / Check Out per student in Room detail
- Mark Absent with reason
- QR code check-in (public `/checkin?school=id` page)
- PIN pad → student list with current status → Check In / Check Out toggle
- Multi-kid checkboxes for parents with multiple children
- Each check-in/out logs a `name_to_face` activity → visible in Daily Activities
- Green dot on room list avatars when student is present

---

## Feature 3 — Daily Activity Reports ✅

- 12 activity types logged via room feed or room-level bulk
- Staff Only flag hides entries from parent view
- **Edit** (pencil) + **Delete** (trash, inline confirm) on each activity row
- Edit modal adapts to activity type (food, nap, potty, meds, etc.)
- Parents: read-only view, no edit/delete buttons

---

## Feature 5 — Rooms ✅

- Students tab: Check In / Check Out / Mark Absent inline
- Feed tab: consolidated activity feed
- Room Settings: edit name, age range, capacity, ratio, delete
- + Add Activity: 12-type selector → type-specific form
- + Add Student: searchable assignment modal
- Room list: green dot on checked-in student avatars

---

## Feature 6 — Scheduling + Menus ✅

**Schedules:** Weekly grid, clickable cells, staff/student dialogs. Default Mon–Fri, 8:30 AM–6:00 PM. Upsert (delete existing for same staff+day before inserting). Delete Schedule button on filled cells.

**Menus:** Weekly menu grid (5-day × 4-meal, food library autocomplete). Food Item Library (admin only). Parents see Weekly Menu tab only.

---

## Feature 7 — Admin Dashboard ✅

- Today snapshot: Expected / Checked In / Absent / Rooms
- Current Room Ratios (sorted alphabetically, live)
- Today's activity coverage
- Compliance Alerts:
  - Ratio violations (red)
  - Students not checked out after school closing time (amber)
- Upcoming birthdays
- 30-second auto-refresh + manual ↻ Refresh button

---

## Calendar ✅

Two-column redesign: Holiday Calendar (month-grouped, admin add/delete) + Special Events. Operating Schedule (per-day hours, admin edits inline) + Holiday/Birthday Policy (editable bullets).

---

## QR Check-In/Out System ✅

**Settings → Front Desk QR Code:** Generates branded printable card (school name, date, welcome message, orange banner). Download as PNG.

**Public page `/checkin?school=id`:**
- PIN pad (6 digits, masked)
- Student list with current status + Check In/Out toggle
- Multi-kid checkboxes + bulk action
- Activity logged on every check-in/out
- Auto-resets after 2.5 seconds for next family

---

## Invitation + Registration ✅

- **Invitations table** — 7-day expiry, one-time use. Permanent links for school admin registration (never expire).
- **InviteDialog** — generates `/register?token=xxx` link. Copy-to-clipboard. Available in: Portal Admin (Manage School), Staff List, Parents page, Student Contact modal.
- **Registration page** — school + role pre-filled. User enters: User ID, First/Last name, Email (optional), Phone, Password. Account active immediately.
- **Login** — accepts User ID OR email.

---

## Deployment
- [ ] Netlify deploy pending
- [ ] Custom domain pending
- Note: QR code URL uses `window.location.origin` — automatically correct on Netlify

---

## Definition of Done
- [x] All 8 MVP feature areas functional end-to-end
- [x] 150 Playwright tests (see [MVP-testing.md](MVP-testing.md))
- [x] Pre-push hook enforces tests on every commit
- [ ] Netlify deployment
- [ ] At least 1 real child enrolled with 1 full day of reports

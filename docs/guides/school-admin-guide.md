# School Admin — User Guide

**Login:** admin@jsdaycare.com / JsDaycare@2026  
**Redirects to:** /home (dashboard)

---

## Dashboard (Home)
Your command center. Shows at a glance:
- **Checked In Today / Expected / Absent / Rooms** stat cards
- **Current Room Ratios** table (sorted A→Z) — green = compliant, red = under-staffed
- **Compliance Alerts** — ratio violations + students not checked out after closing time
- **Upcoming Birthdays** (next 30 days)
- **↻ Refresh** button — also auto-refreshes every 30 seconds

---

## Students
Full student registry under **My School → Students**.

**Student Profile tabs:**
- **Profile** — personal info (DOB, allergies, medications, doctor), address, enrollment details, financial details, room assignment (admin editable)
- **Contacts** — unified table of parents/guardians + pickup contacts. Check-in code shown (from parent's profile — globally unique across all schools). Reveal button to show masked code. Send Invite link. Photo upload. Pickup valid from/to dates.
- **Immunizations** — 11 CDC vaccines with dose tracking (Overdue/Completed/Skipped/Exempt). Immunization Settings gear to show/hide per student.
- **Daily Activities** — inline activity feed filtered by date
- **Documents** — link to Paperwork

**Key actions:**
- Add Contact / Add Pickup — generates invite link for portal registration
- Edit sections inline — all admin-editable
- Emergency contacts — add/edit/delete inline

---

## Rooms
**My School → Rooms** — 3 cards (Infants, Toddlers, Pre-K).

**Green dot** on student avatar = currently checked in.

Room detail has 2 tabs:
- **Students** — Check In / Check Out / Mark Absent per student
- **Feed** — consolidated activity log for the room

**Room actions (admin only):**
- **+ New Room** — create a new room (from the Rooms list page)
- ⚙ **Room Settings** — edit name, capacity, age range, ratio, or delete room
- **+ Add Student** — assign a student to this room

**Room actions (admin + staff):**
- **+ Add Activity** — 12-type selector (food, nap, potty, note, kudos, meds, health check, observation, photo, video, incident, name-to-face)
- Check In / Check Out / Mark Absent per student

---

## Schedules
**My School → Schedules** — weekly grid (staff rows + student rows × 7 days). **Admin only — staff can view but not edit.**

**Adding a staff schedule:**
1. Click **+ Staff schedule** (or click any staff cell in the grid)
2. Select staff member, room, repeat weekly, time range (default 8:30–18:00), days (default Mon–Fri)
3. Save → overwrites any existing schedule for that staff+day (no duplicates)
4. Click a filled cell → dialog pre-fills + shows **🗑 Delete Schedule** button

**Adding a student schedule:** Click **+ Student schedule** → select student, type (Full/AM/PM/Half), days, date range

> Staff members can view the schedule grid and print it, but only admins can add, edit, or delete schedules.

---

## Calendar
**My School → Calendar** — two-column layout.

**Left column (admin editable):**
- Holiday Calendar — add holidays/closures by month
- Special Events — Mother's Day, Halloween, etc. with type badges

**Right column (admin editable):**
- Operating Schedule — per-day hours (edit inline with pencil icon)
- Holiday Policy — editable bullet list
- Birthday Policy — editable bullet list (vegetarian facility, no homemade treats, etc.)

---

## Menus
**My School → Menus**

- **Weekly Menu tab** — browse by week. Click **+ Create Menu** to fill in the 5-day × 4-meal grid using the food library autocomplete.
- **Food Item Library tab** — manage reusable food items (categories, allergens). Parents cannot see this tab.

---

## Settings
**My School → Settings**

- School name, timezone (changing name preserves all data — UUID unchanged)
- Ratio rules display
- **Front Desk QR Code** — generates a branded printable card. Download as PNG for printing. Link auto-uses current domain (works on Netlify after deployment).

---

## Staff & Payroll
View and manage staff profiles. Each staff member has: personal info, emergency contact, certifications, room assignments, check-in code.

**+ Invite Staff** — generates a 7-day `/register?token=xxx` link. Send to new staff member. They register with their own User ID, name, password.

---

## Students — Admissions Summary
Pipeline view: Waitlist / Active / Withdrawn / Graduated counts + filterable table.

---

## Paperwork
Forms & compliance management (in progress, R1 full implementation).

---

## QR Check-In (for parents/staff at front desk)
URL: `/checkin?school=<school-id>`  
Available via **Settings → Front Desk QR Code**.

- Parent/staff scans QR → enters their personal check-in code (4–6 digits, set by the user on their own Home page; globally unique across all schools)
- Sees linked student(s) with current status (Present / Checked out / Not recorded)
- Taps Check In or Check Out
- Multi-kid: checkboxes to select one or all children
- Activity logged automatically → appears in student's Daily Activities

---

## School Website (Coming in R1)
Each school gets a public website auto-generated from settings, hosted at `daycareportal.com/s/<school-slug>`.

In Settings → **School Website** you'll be able to set:
- **Tagline** — hero headline ("Where Little Hearts Find Joy")
- **About description** — 2-3 sentences shown in the About section
- **Address, Phone, Email** — shown in footer and contact section
- **Logo + hero image** — upload via settings
- **Accent color** — brand color (default orange)
- **URL slug** — auto-generated from school name, editable
- **Testimonials** — add/edit/delete parent quotes
- **Contact form link** + social links (Facebook, Instagram)

The website auto-populates programs (from rooms), operating hours, and staff count from your existing DayCarePortal data — no duplication needed.

Preview your site: `daycareportal.com/s/<your-slug>`

---

## Students — Admissions Summary

**Students → Add Student (removed Admissions page — summary now at top of Students)** navigates to a full form: First/Last Name (required), DOB, Gender, Enrollment Status (Active/Waitlist/Withdrawn), Meal Type, Doctor, Allergies, Medications, Notes.

**In the student list:**
- ✏ **Edit** (pencil) — opens a modal to update Enrollment Status, Start Date, End/Exit Date, and Notes
- 🗑 **Delete** (trash) — shows inline "Delete? Yes / No" confirm; permanently removes the student

Filter tabs: **Waitlist Only** (default) · **All Students**

Stats bar shows live counts: Waitlist / Active / Withdrawn / Graduated

---

## Staff Management

**Staff & Payroll → Add Staff** opens a dialog to capture:
- Full Name*, Email* (required for invite), Phone, Role (Staff/Admin)
- Photo upload (avatar circle)
- Clicking **Generate Invite Link** creates a 7-day invite token and shows a copyable link to send the staff member

**In the staff list:**
- ✏ **Edit** — opens modal to update name, phone, role
- 🗑 **Remove** — inline confirm; removes staff from this school (you cannot remove yourself)

**Staff profile page** — click any staff name to open their full profile. All fields are inline-editable on hover for admins (pencil icon appears):
- Header: Full Name, Role, Phone
- Staff Details: Hire Date, Birthday, Degree, Certification, ECE Credits, Infant/Toddler Credits, Address, Emergency Contact, Doctor, Notes

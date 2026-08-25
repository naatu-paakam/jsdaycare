# MVP Release Scope — jsdaycare

**Goal:** Fully operational daycare management app that JS Joy Family can use daily without paper.  
**Target:** Internal staff + 1 pilot family before expanding enrollment

---

## In Scope

### 1. Child & Family Management
- [ ] Add / edit / view child profiles (name, DOB, photo, allergies, medical notes)
- [ ] Add up to 4 guardians per child with contact details
- [ ] Authorized pickup list per child
- [ ] Emergency contacts (min 2)
- [ ] Document uploads: immunization records, enrollment agreement
- [ ] Enrollment status: Active | Waitlist | Withdrawn

### 2. Attendance Tracking
- [ ] Staff-triggered check-in / check-out per child
- [ ] PIN-based check-in on shared tablet
- [ ] Record who dropped off / picked up (from authorized list)
- [ ] Per-room attendance view (color-coded status)
- [ ] Mark child absent with reason
- [ ] Daily attendance CSV export

### 3. Daily Activity Reports
- [ ] Meal log (breakfast, lunch, snack — what offered, how much eaten)
- [ ] Nap log (start, end, quality)
- [ ] Diaper / bathroom log
- [ ] Mood & behavior note
- [ ] Activities checklist
- [ ] Photo attachments (up to 5 per child per day, via Supabase Storage)
- [ ] Parent view: read daily report from parent portal

### 4. Staff Management
- [ ] Staff profiles (name, photo, role, certifications)
- [ ] Room assignment per staff member
- [ ] Staff check-in / check-out (clock in/out)
- [ ] Staff-to-child ratio indicator per room (color-coded)
- [ ] Configurable ratio rules by age group

### 5. Classroom / Room Management
- [ ] Create rooms with name, age range, capacity
- [ ] Assign children and staff to rooms
- [ ] Room dashboard: today's attendance + ratio status
- [ ] Multi-room grid view for admin

### 6. Scheduling
- [ ] Daycare operating calendar (hours, holidays, closures)
- [ ] Per-child weekly attendance schedule (which days they attend)
- [ ] Staff weekly schedule
- [ ] Expected attendance pre-populated from child schedule

### 7. Admin Dashboard
- [ ] Today's snapshot: enrolled, checked in, absent, staff on duty
- [ ] Enrollment summary by room
- [ ] Compliance alerts: missing docs, expiring certifications, ratio warnings
- [ ] Quick actions: add child, record incident, export attendance

### 8. Forms & Compliance
- [ ] Digital enrollment agreement with typed-name signature + timestamp
- [ ] Health history form
- [ ] Media release form
- [ ] Incident / injury report (with PDF export)
- [ ] Permission slips (create, assign to children, track signature)
- [ ] Audit log for all form actions
- [ ] Monthly attendance summary report

---

## Out of Scope for MVP
- Parent messaging / in-app chat → R1
- Push / email notifications → R1
- Billing and invoicing → R1
- Online payments → R1
- QR code check-in (phase 2 of attendance) → R1

---

## Roles Supported
| Role | Access |
|---|---|
| Admin / Director | Full access |
| Lead Teacher | Room view, attendance, daily reports |
| Assistant / Aide | Daily report entry only |
| Parent | View child profile + daily reports (read-only) |

---

## Definition of Done
- All 8 feature areas functional end-to-end
- All MVP test scenarios passing (see [MVP-testing.md](MVP-testing.md))
- Deployed to Netlify (staff URL + parent URL)
- At least 1 real child enrolled and 1 full day of reports logged

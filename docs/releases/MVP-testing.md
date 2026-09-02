# MVP Testing — DayCarePortal

**Total: ~155 Playwright tests across 11 spec files**  
Run: `node_modules/.bin/playwright test`  
Personas: portal admin / school admin / teacher / parent — credentials in `.notes`

| File | Tests | Coverage area |
|---|---|---|
| auth.spec.ts | 2 | Login + wrong password |
| dashboard.spec.ts | 4 | Home page stats / ratios / alerts |
| navigation.spec.ts | 28 | All nav links, 3 personas, school name, settings |
| rooms.spec.ts | ~6 | Room list, detail, check-in full flow |
| students.spec.ts | ~55 | Full student profile — all tabs, contacts, immunizations, rooms, daily activities edit/delete |
| schedules.spec.ts | ~15 | Grid, dialogs, week nav, bug regressions |
| calendar.spec.ts | 10 | Holiday calendar, operating hours, policies |
| menus.spec.ts | 11 | Weekly menu, food library, role-based tabs |
| portal.spec.ts | ~15 | Portal admin dashboard, schools, users tab, invite |
| registration.spec.ts | ~12 | Register page, invite link, multi-school admin |
| checkin.spec.ts | 15 | QR check-in page, PIN pad, valid/invalid PIN, activity log, QR in settings, home refresh |

---

## Key scenarios covered

### Auth & Login
- TC-admin-login / TC-wrong-password
- Login with User ID (not just email)

### Dashboard
- TC-home-loads / TC-room-ratios / TC-compliance-alerts
- TC-home-refresh-button / TC-home-refresh-updates-counts

### Navigation — all 4 personas
- All 14 admin nav links verified
- Teacher: restricted access
- Parent: redirected to /parent, blocked from /home and /students
- Portal admin: redirected to /portal, blocked from /home and /students

### Student Profile
- All 5 tabs (Profile, Contacts, Immunizations, Daily Activities, Documents)
- Profile editing (personal info, address, room assignment)
- Contacts: PIN reveal, Add contact/pickup, photo upload, invite URL
- Contact type expanded (8 types), non-parent = no portal invite
- Immunizations: CDC grid, dates, skip, exempt, delete, custom vaccines, settings modal
- Daily Activities: inline feed, edit/delete per activity, parent read-only
- Emergency contacts: add/edit/delete

### Rooms
- TC-room-list / TC-room-detail / TC-checkin-buttons
- TC-checkin-full-flow: Check In → Present badge → Check Out → Checked out state
- TC-room-settings-modal / TC-room-add-activity-picker / TC-room-add-activity-food-form
- TC-room-add-student-modal / TC-room-no-parents-tab

### Schedules (bug regression tests included)
- TC-schedules-student-save-no-rls-error: RLS policy fix verified
- TC-schedules-staff-upsert-no-overlap: No duplicate entries
- TC-schedules-delete-button-exists: Delete Schedule button present when appropriate

### Calendar
- Holiday calendar sections, operating hours, policies, Edit Policy link, Add event buttons

### Menus
- Admin sees both tabs, parent sees only Weekly Menu
- Create Menu dialog (5-day × 4-meal grid)
- TC-menus-empty-state / TC-menus-food-library

### Portal Admin
- Login, schools table, stats, create school, manage school
- Admin Registration Link generated/displayed
- Assign existing user section visible
- Users tab: search, role filter, multi-school display
- Invite User button opens school+role dialog
- Blocked from /home and /students

### QR Check-In/Out
- TC-checkin-page-loads: Public page, no login needed
- TC-checkin-invalid-pin: Error stays on PIN step
- TC-checkin-valid-pin: Correct PIN shows student list
- TC-checkin-toggle: Check In → success → auto-reset
- TC-checkin-activity-logged: Activity appears in Daily Activities
- TC-checkin-qr-in-settings: QR code, Download, Copy Link
- TC-checkin-qr-encodes-school: Link contains /checkin?school=
- TC-home-refresh-button / TC-home-refresh-updates-counts

### Registration
- Token required, invalid token handled
- Multi-school switcher visible for admin
- Multi-school dropdown shows all schools

---

## Bug regression TCs
Each bug found during testing has a dedicated TC:

| TC | Bug fixed |
|---|---|
| TC-schedules-student-save-no-rls-error | student_schedules RLS was blocking all inserts |
| TC-schedules-staff-upsert-no-overlap | Staff schedule save created duplicates instead of overwriting |
| TC-schedules-delete-button-exists | No delete button on schedule dialog |
| TC-checkin-toggle | checkin_student FK violation (created_by referenced wrong table) |
| TC-daily-activities-delete-no-cancel | Delete inline confirm cancel worked |
| TC-contacts-nonparent-no-invite | Non-parent contact type showed invite URL incorrectly |

---

## Running tests
```bash
# Full suite
node_modules/.bin/playwright test

# Single file
node_modules/.bin/playwright test e2e/checkin.spec.ts

# With UI
node_modules/.bin/playwright test --ui

# Re-seed data if tests fail due to stale DB state
node scripts/seed.js --reset
```

---

## Persona access control (added)

### Staff persona — `e2e/staff-persona.spec.ts` (20 TCs)
- Nav hidden: Settings, Staff & Payroll, Paperwork, Reporting
- School dropdown: no switcher (single school only)
- Student profile: only Profile + Daily Activities tabs
- Student list: no Add/Edit/Delete buttons

### Staff rooms & schedules — `e2e/staff-rooms-schedules.spec.ts` (16 TCs)
- Rooms: no New Room, no Room Settings, no Add Student; Add Activity ✅
- Schedules: view-only; no + Staff schedule / + Student schedule buttons; cells non-clickable
- Admin regression: all admin buttons confirmed still visible

### Parent persona — `e2e/parent-persona.spec.ts` (25 TCs)
- Home (`/parent`): student cards, check-in/out toggle, activity feed, profile link
- Sidebar: Home, Students (own kids), Stories, Calendar, Menus only
- Students list: own child only (RLS), no Add/Edit/Delete
- Student profile: all 5 tabs, "Back to My Portal" link
- Quick pages: Menus (read-only), Calendar (read-only), Stories

### School-move — `e2e/student-school-move.spec.ts` (8 TCs)
- School dropdown visible for multi-school admin
- Amber warning on school change
- Move succeeds via security-definer RPC
- Admin isolation verified

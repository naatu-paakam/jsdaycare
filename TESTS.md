# E2E Tests — jsdaycare

## Running Tests

```bash
# Run all tests (headless)
npm run test:e2e

# Run with Playwright UI (interactive)
npm run test:e2e:ui

# Run headed (visible browser)
npm run test:e2e:headed
```

The dev server must be running (`npm run dev`) on port 5174 before running tests.
The `playwright.config.ts` is configured to reuse an existing server automatically.

## Test Coverage

| TC Code | Description | File |
|---|---|---|
| TC-admin-login | Navigate to /, redirect to /login, log in, verify /home and dashboard | auth.spec.ts |
| TC-wrong-password | Submit wrong password, verify error message, stay on /login | auth.spec.ts |
| TC-student-list | /students loads with "Students" heading and table | students.spec.ts |
| TC-add-student-form | "+ Add Student" navigates to form with Name/DOB fields | students.spec.ts |
| TC-student-profile | Click student name, verify profile page with Profile/Contacts tabs | students.spec.ts |
| TC-room-list | /rooms loads with "Rooms" heading and "+ New Room" button | rooms.spec.ts |
| TC-room-detail | Click room, verify Students/Parents/Feed tabs (skips if no rooms) | rooms.spec.ts |
| TC-checkin-buttons | Room Students tab has "Check in" and "Mark absent" buttons | rooms.spec.ts |
| TC-sidebar-home | Sidebar shows "Home" link after login | navigation.spec.ts |
| TC-sidebar-myschool | "My School" is expandable with Students, Rooms, Schedules links | navigation.spec.ts |
| TC-sidebar-staff | "Staff & Payroll" link visible in sidebar | navigation.spec.ts |
| TC-sidebar-paperwork | "Paperwork" link visible in sidebar | navigation.spec.ts |
| TC-nav-to-students | Click Students in sidebar, URL becomes /students | navigation.spec.ts |
| TC-nav-to-rooms | Click Rooms in sidebar, URL becomes /rooms | navigation.spec.ts |
| TC-home-loads | /home shows today's stats (Checked In Today, Expected, Absent) | dashboard.spec.ts |
| TC-room-ratios | "Current Room Ratios" section visible on home page | dashboard.spec.ts |
| TC-compliance-alerts | "Compliance Alerts" section visible on home page | dashboard.spec.ts |

## Pre-push Hook

A git pre-push hook is installed at `.git/hooks/pre-push` that:

1. Checks if the dev server is running on port 5174 via `curl`
2. If not running, prints a helpful message and exits with code 1 (blocking the push)
3. If running, executes `npx playwright test`
4. If any tests fail, the push is blocked
5. If all tests pass, the push proceeds

To bypass the hook in an emergency: `git push --no-verify`

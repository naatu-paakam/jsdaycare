# JsDayCare — Personas & Permissions

This file defines who can view and edit each feature area.
Edit this file and ask Claude to roll out the changes.

---

## Personas

| Persona | Login | Password | Description |
|---|---|---|---|
| **Portal Admin** | portal@daycareportal.com | DayCarePortal@2026 | Platform super-admin — creates schools, assigns admins; sees all schools |
| **Admin** | admin@jsdaycare.com | JsDaycare@2026 | Multi-school admin — manages JS Joy Family Daycare + Sunshine; sidebar shows school switcher |
| **Staff** | teacher@jsdaycare.com | JsDaycare@2026 | Teacher/aide — operational access to assigned rooms |
| **Parent** | parent@jsdaycare.com | JsDaycare@2026 | Parent/guardian — access to their own child's data only |

---

## Student Profile Permissions

| Section | Admin | Staff | Parent |
|---|---|---|---|
| Personal info (name, DOB, gender, race, allergies, meds, doctor) | View + Edit | View | View + Edit |
| Address | View + Edit | View | View + Edit |
| Room assignment | View + Edit | View | — |
| School details (status, meal type, student ID) | View + Edit | View | — |
| Enrollment details (pipeline dates) | View + Edit | — | — |
| Financial details (income, subsidy) | View + Edit | — | — |
| Custom fields | View + Edit | View | — |

---

## Contacts Permissions

| Section | Admin | Staff | Parent |
|---|---|---|---|
| View all contacts | ✅ | ✅ | Own child only |
| Add parent/guardian contact | ✅ | — | — |
| Add approved pickup person | ✅ | — | ✅ |
| Edit any contact | ✅ | — | ✅ (pickup contacts only) |
| Check-in code Reveal | ✅ | — | — |
| Send portal invite | ✅ | — | — |
| Upload contact photo | ✅ | — | ✅ |
| Set pickup valid from/to dates | ✅ | — | ✅ |

---

## Emergency Contacts Permissions

| Action | Admin | Staff | Parent |
|---|---|---|---|
| View | ✅ | ✅ | ✅ |
| Add | ✅ | — | ✅ |
| Edit | ✅ | — | ✅ |
| Delete | ✅ | — | ✅ |

---

## Immunizations Permissions

| Action | Admin | Staff | Parent |
|---|---|---|---|
| View CDC vaccine grid | ✅ | ✅ | ✅ |
| Enter/edit dose dates | ✅ | — | ✅ |
| Mark dose as Skip | ✅ | — | ✅ |
| Mark vaccine as Exempt | ✅ | — | ✅ |
| Delete dose record | ✅ | — | ✅ |
| Add custom vaccine record | ✅ | — | ✅ |
| Delete custom vaccine record | ✅ | — | ✅ |

---

## Daily Report Permissions

| Action | Admin | Staff | Parent |
|---|---|---|---|
| View daily report | ✅ | ✅ | ✅ (non-staff-only entries) |
| Log activities | ✅ | ✅ | — |
| Mark entry Staff Only | ✅ | ✅ | — |
| Delete activity entry | ✅ | ✅ (own entries) | — |

---

## Attendance Permissions

| Action | Admin | Staff | Parent |
|---|---|---|---|
| View attendance | ✅ | ✅ (assigned rooms) | ✅ (own child) |
| Check in / Check out | ✅ | ✅ | — |
| Mark absent | ✅ | ✅ | — |
| Export attendance CSV | ✅ | — | — |

---

## Room Management Permissions

| Action | Admin | Staff | Parent |
|---|---|---|---|
| View rooms | ✅ | ✅ (assigned) | — |
| Create / Edit room | ✅ | — | — |
| Add activity to room (bulk) | ✅ | ✅ | — |
| View room feed | ✅ | ✅ | — |

---

## Staff Management Permissions

| Action | Admin | Staff | Parent |
|---|---|---|---|
| View all staff | ✅ | — | — |
| Add / Edit staff | ✅ | — | — |
| View own profile | ✅ | ✅ | — |

---

## Scheduling Permissions

| Action | Admin | Staff | Parent |
|---|---|---|---|
| View schedules | ✅ | ✅ | — |
| Add staff schedule | ✅ | — | — |
| Add student schedule | ✅ | — | — |
| Add time off | ✅ | — | — |
| View menus | ✅ | ✅ | — |
| Manage menus / food library | ✅ | — | — |

---

## Forms & Compliance Permissions

| Action | Admin | Staff | Parent |
|---|---|---|---|
| View forms | ✅ | ✅ | ✅ (forms assigned to them) |
| Create / Edit forms | ✅ | — | — |
| Sign forms | ✅ | — | ✅ |
| View sign-ups | ✅ | ✅ | ✅ |
| Create sign-ups | ✅ | — | — |
| Sign up for a slot | ✅ | — | ✅ |
| View audit log | ✅ | — | — |

---

## Settings Permissions

| Action | Admin | Staff | Parent |
|---|---|---|---|
| School name / timezone | ✅ | — | — |
| Compliance rules | ✅ | — | — |
| Role permissions (this file) | ✅ | — | — |

---

## How to update permissions

1. Edit the tables above
2. Tell Claude: *"Roll out permissions from docs/personas.md"*
3. Claude will update:
   - The React UI (show/hide sections, enable/disable edit buttons)
   - The `role_permissions` table in Supabase
   - The Playwright tests to verify the new access rules

> Note: Supabase RLS policies enforce data-layer security. UI permissions above control what's visible/editable in the app interface. Both must be consistent.

---

## Staff Navigation Permissions

| Nav Item | Admin | Staff | Parent |
|---|---|---|---|
| Home | ✅ | ✅ | — |
| Students | ✅ | ✅ (view + daily activities only) | — |
| Stories | ✅ | ✅ | ✅ |
| Rooms | ✅ | ✅ | — |
| Calendar | ✅ | ✅ | ✅ |
| Schedules | ✅ | ✅ | ✅ (own child) |
| Menus | ✅ | ✅ | ✅ (read-only) |
| Settings | ✅ | — | — |
| Staff & Payroll | ✅ | — | — |
| Paperwork | ✅ | — | — |
| Reporting | ✅ | — | — |

## Student Profile Tab Permissions

| Tab | Admin | Staff | Parent |
|---|---|---|---|
| Profile | ✅ | ✅ (read-only) | ✅ (limited) |
| Contacts | ✅ | — | ✅ (own child) |
| Immunizations | ✅ | — | ✅ (own child) |
| Daily Activities | ✅ | ✅ | ✅ (read-only) |
| Documents | ✅ | — | — |

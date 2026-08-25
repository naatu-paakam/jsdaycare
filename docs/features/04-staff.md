# Feature 4 — Staff Management

**Release:** MVP (core profile + check-in); R1 (time tracking, time off, payroll)  
**Priority:** P1

---

## Overview
Manage who works at JS Joy Family, their roles, room assignments, certifications, and daily clock-in/out.

---

## Left Nav — App Structure (from Brightwheel)
Top-level nav items for jsdaycare:

| Nav Item | Notes |
|---|---|
| **Home** | Dashboard / today's snapshot |
| **My School** | Expandable — Students, Parents, Rooms, Calendar, Schedules, Menus, Settings |
| **Messaging** | R1 |
| **Billing** | R1 |
| **Expenses** | R1 |
| **Staff & Payroll** | Staff list + profile tabs |
| **Learning** | R2 |
| **Admissions** | Enrollment pipeline |
| **Paperwork** | Forms & compliance |
| **Reporting** | Reports + exports |

> This nav will drive the jsdaycare sidebar layout.

---

## Staff List Page

### Filters
- Search by name
- Filter by Room (dropdown)
- Filter by Role (dropdown)
- Filter by Status: Active / Inactive

### Columns
| Column | Notes |
|---|---|
| Staff | Avatar initials + name (link to profile) + room assignment |
| Email | |
| Role | Admin / Staff |
| Status | Signed up / Invited / Not signed up |
| Auto-reminders | Configuration for automated nudges |
| Check-in code | Hidden by default — **Reveal** button to show 4-digit PIN |
| Actions | Edit, Deactivate, Delete |

### Actions (top right)
- **Invite** — send email invite to an existing staff member to join the portal
- **Add staff** — create a new staff profile

---

## Staff Profile

### Profile Tabs
| Tab | MVP / R1 |
|---|---|
| Profile | MVP |
| Attachments | MVP |
| Training | R1 |
| Time tracking | R1 |
| Time off | R1 |
| Payroll | R1 |

> "Staff profiles can only be viewed and edited by admins."

---

### Personal Information
| Field | Notes |
|---|---|
| Name | Full name |
| Email | Used for staff login |
| Phone | |
| Birthday | |
| Address | |
| Notes | Free text |

### Emergency Contact
| Field | Notes |
|---|---|
| Contact name | |
| Relationship to staff | |
| Contact phone | |

### Medical Information
| Field | Notes |
|---|---|
| Allergies | |
| Medication | |
| Doctor | |
| Doctor phone | |

---

### Role & Status (admin-only panel)
| Field | Notes |
|---|---|
| Role | Admin / Staff |
| Hire date | |
| Assigned rooms | One or more rooms, or "All rooms" |
| Signup status | Signed up / Invited / Not signed up |
| Check-in code | 4-digit PIN — hidden, Reveal to view |
| Schedule | Link → staff schedules view |
| Timecards | Link → time tracking view (R1) |

### Certification
| Field | Notes |
|---|---|
| Degree | e.g. Associate's, Bachelor's in Early Childhood Ed |
| Certification | e.g. CDA, State teaching license |
| ECE credits | Early Childhood Education credit hours |
| Infant toddler credits | Specific infant/toddler training credits |
| Notes | Free text |

### Professional Development Hours
- List of completed trainings
- Add training: name, date, hours, provider
- Total hours tracked for licensing compliance

---

## Staff Check-In / Check-Out (MVP)
- Staff clock in/out using their 4-digit check-in code on a shared tablet
- Timestamp recorded per day
- Used for ratio monitoring and licensing (staff present during operating hours)

## Staff-to-Child Ratio Monitor
- Per room: staff checked in vs children checked in
- Ratio rule configurable per room (e.g. Infants 1:4, Toddlers 1:6, Pre-K 1:10)
- Color indicator: Green (compliant) | Yellow (approaching) | Red (over ratio)
- Admin dashboard shows rooms with ratio warnings

---

## R1 — Deferred
- **Time tracking** — detailed timecards, hours worked, overtime
- **Time off** — PTO requests and approval
- **Payroll** — pay rates, pay period summaries
- **Training tab** — structured training records with completion tracking
- **Auto-reminders** — automated nudges to staff for certifications, training

---

## Screenshots
> [x] Staff list page — added  
> [x] Staff profile (personal info, emergency contact, medical, role & status, certification) — added  
> [ ] Add staff form  
> [ ] Check-in code reveal  

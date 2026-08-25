# Feature 5 — Classroom / Room Management

**Release:** MVP  
**Priority:** P1

---

## Overview
Rooms are virtual classrooms. Each room has a student roster, a consolidated activity feed, and a parent list. Staff operate primarily from the room view — checking in students and logging activities.

---

## Room List Page
- Simple list: room name + avatar thumbnails of assigned students and staff
- Total room count shown
- **+ New Room** button (admin only)
- Click any room → room detail

---

## Room Detail — 3 Tabs

### Tab 1: Students
| Element | Notes |
|---|---|
| Student filter | Dropdown — filter by specific student |
| Student status filter | Active / Inactive / Waitlist — defaults to Active |
| Sort | First name / Last name |
| Student count | "3 students" shown at bottom |

**Student row columns:**
| Column | Notes |
|---|---|
| Checkbox | Bulk select for bulk actions |
| Photo + Name | Link to child profile |
| Room name | Shown below student name |
| Daily attendance | Two inline actions per row |

**Daily attendance inline actions (per student):**
- **Mark absent** — marks child absent for today
- **Check in** — checks child in; button changes to Check out once checked in

### Tab 2: Parents
- List of parent/guardian contacts linked to students in this room
- Shows contact name, email, phone, signup status

### Tab 3: Feed
- **Consolidated activity feed for all students in the room** — all activity types, all children, in one chronological list
- Date range filter + Action type filter
- **All / Staff Only toggle** — show all entries or only staff-only entries
- **Approve button** — bulk approve selected entries (admin review workflow)
- Each feed entry shows:
  - Checkbox (for bulk select)
  - Activity icon
  - "Student Name [action]" (e.g. "Atif Hifzur checked out")
  - Time + staff name ("5:45 PM by Jaya Bijjala")
  - Room name
  - Student photo thumbnail (right side)
  - Edit link

---

## Room-Level Activity Logging
> **Key rule:** Any activity logged at the room level applies to **all active & checked-in students in the room simultaneously.**

- Staff tap **+ Add Activity** from the room header
- Same 12 activity types as individual child logging (Photo, Video, Food, Nap, Potty, Note, Kudos, Meds, Name to Face, Incident, Health Check, Observation)
- Entry is broadcast to every checked-in student's individual feed and daily report
- Useful for: group snack time, outdoor play, story time, nap start/end for the whole room

---

## Room Settings (gear icon)
- Room name
- Age range
- Capacity
- Ratio rule (staff:children) — configurable per room
- Assigned staff

---

## Room Header Actions
| Action | Notes |
|---|---|
| Room name dropdown (▼) | Switch to another room without going back to list |
| Room settings (⚙) | Admin only — edit room config |
| + Add Activity | Log activity for all checked-in students in room |
| + Add Student | Enroll a new student into this room |

---

## User Roles & Access
| Role | Access |
|---|---|
| Admin | Full access — all rooms, settings, approve feed entries |
| Lead Teacher | View and operate their assigned room(s) |
| Assistant | Log activities; cannot edit room settings |
| Parent | No room view — sees child's individual feed only |

---

## Screenshots
> [x] Room list — added  
> [x] Room detail — Students tab with check-in / mark absent — added  
> [x] Room detail — Feed tab (consolidated, approve, staff-only toggle) — added  
> [ ] Room settings  
> [ ] + Add Activity from room level (bulk to all checked-in students)  

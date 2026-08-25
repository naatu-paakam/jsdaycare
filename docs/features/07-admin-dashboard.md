# Feature 7 — Admin Dashboard (Home)

**Release:** MVP  
**Priority:** P1

---

## Overview
The Home page is the owner/admin's operational command center. It answers three questions at a glance:
1. **Is today running smoothly?** (attendance + ratios)
2. **Are all children being cared for?** (activity coverage)
3. **What needs my attention?** (alerts + upcoming events)

> Brightwheel's home shows promotional content and curriculum upsells — jsdaycare Home is purely operational.

---

## Layout — 4 Sections

---

### Section 1: Today at a Glance (top bar)
Quick stats across the top — always visible.

| Stat | Notes |
|---|---|
| Expected today | From student schedules |
| Checked in | Live count |
| Absent | Marked absent today |
| Not yet arrived | Expected but not checked in yet |
| Staff on duty | Checked-in staff count |
| Open alerts | Count of items needing attention |

---

### Section 2: Room Ratios (live)
Per-room ratio card — refreshes in real time.

| Column | Notes |
|---|---|
| Room name | Clickable → room detail |
| Students in | Checked-in student count |
| Staff in | Checked-in staff count |
| Ratio | e.g. "1:6" |
| Status | 🟢 Compliant / 🟡 Approaching / 🔴 Over ratio |

- **All Rooms** summary row at top (aggregate)
- **Launch Quick Scan** button → opens QR/PIN check-in screen for the room
- Timestamp: "as of HH:MM" — shows when data was last updated

---

### Section 3: Today's Activity Coverage
Answers: "Have all checked-in children had activities logged today?"

| Element | Notes |
|---|---|
| Total activities logged | Count across all rooms |
| Breakdown by type | e.g. "8 Nap, 6 Food, 3 Note" |
| Per-room row | Room name + count + coverage status |
| Coverage badge | ✅ "All students have activities logged" or ⚠️ "3 students with no activity yet" |
| View details link | → Room feed filtered to today |

---

### Section 4: Alerts & Upcoming (right column)
Prioritized list of items needing admin attention.

**Compliance Alerts** (red / amber badges):
- Children missing immunization records
- Enrollment forms awaiting signature
- Staff certifications expiring within 30 days
- Rooms currently over ratio
- Students checked in but no pickup logged past closing time

**Upcoming This Week:**
- Birthdays in the next 7 days (child name + date + age turning)
- Schedule changes pending approval
- Permission slips with pending signatures
- Staff time off (who is out and when)

**Quick Actions** (floating or in sidebar):
- + Add Student
- + Add Activity (room-level)
- Record Incident
- Export Attendance (CSV)

---

## What is NOT on the Home page
- Promotional content or upsells
- Curriculum recommendations
- Revenue / billing widgets (R1)
- Messaging inbox (R1 — has its own nav item)

---

## Screenshots
> [ ] jsdaycare Home — to be designed  
> [x] Brightwheel Home reference (Current Room Ratios + Today's logged activities widgets) — added  
> [x] Brightwheel Menus — rotating meals, menu templates, food item library — added  

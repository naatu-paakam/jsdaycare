# Feature 2 — Attendance Tracking

**Release:** MVP  
**Priority:** P0 — daily operational need

---

## Overview
Track who is present each day, when they arrived and departed, and who handed them off.

---

## Check-In
- Staff-triggered: teacher marks child as checked in from room view
- Code-based: parent or staff enters their personal check-in code (4–6 digits, stored on their profile) on a shared tablet at the door
- QR code: parent scans a unique family QR code (future: use phone camera)
- Records: timestamp, guardian who dropped off (selected from authorized list)

## Check-Out
- Same mechanisms as check-in
- Records: timestamp, guardian who picked up
- Alert if person attempting pickup is NOT on authorized list

## Attendance View
- Per-room list: shows each child as Checked In | Checked Out | Absent | Not Yet Arrived
- Color-coded status badges
- Filter by room or show all

## Daily Attendance Report
- End-of-day summary: present, absent, late arrivals
- Exportable (CSV) for licensing compliance

## Absence Logging
- Parent or staff can mark a child absent for the day
- Optional reason: sick, vacation, other

---

## Compliance Notes
- Many states require sign-in/sign-out logs with timestamps to be retained
- Export must preserve timestamps and guardian names

---

## Screenshots to add
> [ ] Check-in screen (tablet view)  
> [ ] Daily attendance list (room view)  
> [ ] Attendance report export  

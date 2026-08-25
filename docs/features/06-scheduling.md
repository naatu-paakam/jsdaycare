# Feature 6 — Scheduling

**Release:** MVP  
**Priority:** P1

---

## Overview
A single weekly/daily calendar showing staff schedules, student schedules, and time-off in one view. Filterable by room. Exportable and subscribable via external calendar.

---

## Schedules Page

### View Controls
| Control | Notes |
|---|---|
| Week / Day toggle | Switch between week grid and single-day view |
| Date navigation | ← / → arrows + date picker |
| Room filter | Dropdown — filter grid to one room or All rooms |
| Print | Print-friendly schedule view |

### Calendar Subscribe
- "Subscribe to your calendars" — sync school schedules to Google Calendar, Apple Calendar, or Outlook
- Shows school events and staff/student schedules in external calendar

### Quick Actions (top right)
| Button | Notes |
|---|---|
| + Staff schedule | Add a staff member's working hours for a date range |
| + Student schedule | Add a student's attendance days |
| + Staff time off | Record planned time off for a staff member |

---

## Schedule Grid
Two sections in the weekly grid:

### Active Staff (rows)
- One row per active staff member (avatar initials + name)
- Columns = days of week (Sun – Sat)
- Each cell shows the staff member's scheduled hours for that day
- Empty cell = not scheduled that day

### Active Students (rows)
- One row per active student (photo + name)
- Columns = days of week
- Each cell shows the student's scheduled attendance for that day (e.g. Full day / Half day / AM only)
- Empty cell = not expected that day
- Used to pre-populate **expected attendance** in room view each morning

---

## Staff Schedule Entry
| Field | Notes |
|---|---|
| Staff member | Select from active staff |
| Room | Which room they're scheduled in |
| Days | Checkboxes: Sun / Mon / Tue / Wed / Thu / Fri / Sat |
| Start time / End time | Working hours |
| Repeat | Weekly (recurring) or specific date range |

## Student Schedule Entry
| Field | Notes |
|---|---|
| Student | Select from enrolled students |
| Days | Which days they attend |
| Schedule type | Full day / Half day / AM / PM |
| Effective date | Start of this schedule |
| End date | Optional — leave blank for ongoing |

## Staff Time Off Entry
| Field | Notes |
|---|---|
| Staff member | Select |
| Date range | Start – end date |
| Type | Vacation / Sick / Personal / Other |
| Notes | Optional |

---

## Menus (under My School nav)
School meal menus are managed here and tie into the Food activity type in daily reports.

| Field | Notes |
|---|---|
| Week | Which week the menu applies to |
| Meal type | Breakfast / Lunch / Snack |
| Day | Mon – Fri |
| Items | What is being served (free text or configurable list) |

- When staff log a Food activity, Meal items dropdown pulls from today's menu
- Admin sets the weekly menu in advance

---

## Screenshots
> [x] Schedules page — weekly grid with active staff + active students — added  
> [ ] Add staff schedule form  
> [ ] Add student schedule form  
> [ ] Menus page  

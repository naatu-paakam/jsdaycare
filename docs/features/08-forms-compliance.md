# Feature 8 — Forms & Compliance (Paperwork)

**Release:** MVP  
**Priority:** P2 (needed before first real enrollment)

---

## Overview
The Paperwork section has 3 tabs: **Forms & Requests**, **Shared Files**, and **Sign-ups**. Together they replace paper packets, permission slips, and sign-up sheets.

---

## Tab 1: Forms & Requests

### Forms List
| Column | Notes |
|---|---|
| Form name | Clickable link — opens form detail |
| Type | Form / Request |
| Reviews needed | Count of submissions awaiting admin review |
| Due | Due date for submission (optional) |
| Status | Shared / Unshared / Closed |
| Actions | Edit, Share, Close, Delete |

**Filters:**
- Search by form name
- Status filter: Shared / Unshared / Closed (multi-select)
- **"Show only forms that need review"** toggle — quick filter for pending work

**Create new** → dropdown to choose form type

---

### Form Types

#### Standard Forms (admin creates, parent signs)
Pre-built templates for common daycare forms:

| Form | Notes |
|---|---|
| Student and guardian information | Enrollment basics — name, DOB, contacts, address |
| Health history | Allergies, medications, medical conditions, doctor |
| Media release | Permission to photograph/video the child |
| Emergency authorization | Who can pick up, emergency medical consent |
| Enrollment agreement | Terms, tuition acknowledgment, policies |

- Parent signs with typed name + timestamp (legally valid in most US states)
- Admin reviews submissions and marks as Reviewed / Approved
- Status lifecycle: Unshared → Shared (sent to parent) → Submitted → Reviewed → Closed

#### Custom Forms
- Admin can build custom forms using field types: text, date, checkbox, dropdown, signature
- Assign to: all families / specific room / specific child
- Set due date

#### Requests
- Admin sends a request to parents to provide specific information or take an action
- Examples: "Please update your emergency contact", "Confirm your child's schedule for next month"
- Parent responds in-app; admin marks complete

---

### Incident / Injury Reports
Created from the daily activity feed (Incident activity type) or directly in Paperwork.

| Field | Notes |
|---|---|
| Date + time | Required |
| Child | Required |
| Location in facility | e.g. Playground, classroom, bathroom |
| Description | What happened |
| Injury type | None / Bruise / Cut / Bite / Fall / Other |
| Action taken | First aid given, ice applied, etc. |
| Parent notified | Yes / No — timestamp of notification |
| Staff witness | Name + signature |

- PDF export for filing
- Appears in admin incident log

---

## Tab 2: Shared Files
- Admin uploads and shares files with families (all or specific rooms/children)
- Examples: parent handbook, holiday schedule, lunch menu PDF, field trip info sheet
- Parent downloads from their portal
- File types: PDF, image, document

---

## Tab 3: Sign-Ups

### Sign-Up List
- List of all sign-ups: name, type, spots filled / total spots, status
- **+ Create new** button

### Sign-Up Types (4)

| Type | Use case | Examples |
|---|---|---|
| **Item** | Requesting things from parents | Classroom supplies (crayons, markers, tape), snacks |
| **Time** | One-off specific date & time slot | Field trips, school events, parties |
| **Recurring** | Repeated commitment | Admission tours (weekly), volunteering |
| **Time series** | Block of appointments (multiple time slots, limited spots) | Parent-teacher conferences, orientation sessions |

### Create Sign-Up Flow
**Step 1 — Add description:**
- Sign-up name (required)
- Description (event details, requirements, instructions)
- Visible to all staff toggle

**Step 2 — Add slots** (depends on type):
- Item: item name + number of spots
- Time: date, start time, end time, number of spots
- Recurring: days of week + time, number of spots per slot
- Time series: multiple time slots on same/different days, spots per slot (e.g. "1 spot" for conferences)

**How parents interact:**
- Sign-up shared with families via Paperwork tab in parent portal
- Parent clicks "Sign up" on available slot (greyed out if "Filled")
- Admin sees who signed up for each slot

---

## Audit Trail
- All form actions logged: created, shared, viewed, submitted, reviewed, signed, closed
- Log includes: form name, action, user, timestamp
- Exportable for licensing inspections
- Document retention configurable (default 3 years)

---

## Licensing Reports (Reporting nav item)
| Report | Notes |
|---|---|
| Monthly attendance summary | Total days present per child per month |
| Staff-to-child ratio log | Daily record of ratios per room |
| Incident report log | All incidents in date range |
| Immunization status report | Children with missing / overdue vaccines |

---

## Screenshots
> [x] Forms & requests list (Shared/Unshared/Closed filter, reviews needed, show needs review toggle) — added  
> [x] Sign-ups tab (list view with examples) — added  
> [x] Create sign-up flow (4 slot types: Item, Time, Recurring, Time series) — added  
> [ ] Form detail / parent signing view  
> [ ] Incident report form  

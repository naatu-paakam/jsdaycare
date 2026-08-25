# Feature 8 — Forms & Compliance (Paperwork)

**Release:** MVP  
**Priority:** P2 (needed before first real enrollment)

---

## Overview
The Paperwork section has 3 tabs: **Forms & Requests**, **Shared Files**, and **Sign-ups**. Together they replace paper packets, permission slips, and sign-up sheets.

All forms, compliance checklists, and required documents are **school-specific and fully configurable by the admin**. Nothing is hardcoded — JS Joy Family Daycare sets up exactly what they need.

---

## School Settings — Forms & Compliance Configuration

Accessible via **My School → Settings → Forms & Compliance**.

### Enrollment Checklist (per school)
Admin defines which forms/documents are required before a child's enrollment is considered complete.

| Setting | Notes |
|---|---|
| Required forms | Toggle each form on/off as required for enrollment |
| Required documents | e.g. Immunization records — required / optional / not applicable |
| Grace period | How many days after start date before flagging incomplete items |
| Enforcement | Warning only / Block enrollment activation |

Example — JS Joy Family Daycare enrollment checklist:
- [ ] Student & guardian information form — **Required**
- [ ] Health history form — **Required**
- [ ] Emergency authorization form — **Required**
- [ ] Media release — **Required**
- [ ] Enrollment agreement — **Required**
- [ ] Immunization records — **Required**
- [ ] Copy of birth certificate — **Optional**

> Admin can add, remove, or rename any item in this list. The compliance dashboard tracks completion against this school-specific checklist — not a generic one.

### Compliance Rules (per school)
Admin configures what triggers a compliance alert on the dashboard.

| Rule | Configurable? | Notes |
|---|---|---|
| Missing required form | Yes — choose which forms | Alert if a required form is unsigned/unsubmitted |
| Immunization overdue | Yes — toggle on/off | Alert per vaccine dose based on CDC schedule |
| Staff certification expiry | Yes — warning window (e.g. 30 / 60 / 90 days) | CPR, first aid, ECE credits |
| Ratio violation | Yes — ratio rules per room | Alert when staff:child ratio is exceeded |
| Document expiry | Yes — per doc type | e.g. immunization records older than X years |

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

#### School Forms (admin-owned templates, parent signs)
Admin creates and manages their own form templates — no pre-loaded generic forms.
System provides **starter templates** the admin can adopt, edit, or delete:

| Starter Template | Notes |
|---|---|
| Student and guardian information | Enrollment basics — name, DOB, contacts, address |
| Health history | Allergies, medications, medical conditions, doctor |
| Media release | Permission to photograph/video the child |
| Emergency authorization | Who can pick up, emergency medical consent |
| Enrollment agreement | Terms, tuition acknowledgment, policies (admin fills in school-specific text) |

- Admin can rename, edit fields, or delete any starter template
- Admin can create entirely new forms from scratch
- Parent signs with typed name + timestamp
- Admin reviews submissions → marks Reviewed / Approved
- Status lifecycle: Unshared → Shared → Submitted → Reviewed → Closed

#### Custom Forms (form builder)
- Field types: short text, long text, date, number, checkbox, dropdown (admin defines options), file upload, signature
- Each field: label, required/optional, help text
- Logic: show/hide a field based on another field's answer (e.g. "If allergies = Yes, show allergy detail field")
- Assign to: all families / specific room / specific child
- Set due date; admin notified when submitted

#### Requests
- Admin sends a targeted request to one or more parents for a specific action
- Examples: "Please update your emergency contact", "Confirm attendance for next week"
- Parent acknowledges / responds in their portal; admin marks complete

---

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

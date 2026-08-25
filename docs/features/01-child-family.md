# Feature 1 — Child & Family Management

**Release:** MVP  
**Priority:** P0 — everything else depends on this

---

## Overview
Central registry of every enrolled child and their family. Single source of truth for staff and parents.

---

## Profile Tabs (top navigation)
| Tab | Visible To Parents? |
|---|---|
| Feed | Yes |
| Learning | Yes |
| Profile | Yes (limited fields) |
| Attachments | Yes |
| Daily Report | Yes |
| Forms & Requests | Yes |

---

## Personal Info
| Field | Notes | Parent Visible? |
|---|---|---|
| Name | Full legal name | Yes |
| Birthday | Date of birth | Yes |
| Age | Auto-calculated from DOB | Yes |
| Gender | Optional | Yes |
| Race | Optional | No |
| Ethnicity | Optional | No |
| Allergies | Free text, flagged prominently | Yes |
| Notes | General notes about the child | Yes |
| Medications | Current medications | Yes |
| Doctor | Pediatrician name + phone | Yes |

## Address
- Street, City, State, ZIP, Country
- One address per child (family home)

## School Details *(not visible to parents)*
| Field | Notes |
|---|---|
| Status | Active / Waitlist / Withdrawn / Graduated |
| Schedule | Link to student schedules view |
| Meal Type | e.g. Brings lunch / Hot lunch / Not specified |
| Student ID | Internal ID (auto-generated or manual) |

## Rooms *(not visible to parents)*
| Field | Notes |
|---|---|
| Homeroom | Primary room assignment |
| Others | Additional rooms (e.g. before/after school care) |

## Enrollment Details *(not visible to parents)*
| Field | Notes |
|---|---|
| First Contact Date | When family first inquired |
| Toured Date | When family visited the facility |
| Paperwork Date | When enrollment paperwork was received |
| Desired Start Date | Requested by parent |
| Start Date | Confirmed start date |
| Auto-activate on Start Date | Checkbox — sets status Active automatically |
| Graduation Date | Expected exit date |
| Expected Birth Date | For waitlist/infant enrollments |
| Sibling Attending | Name of sibling if enrolled at same facility |
| Programs | e.g. State Pre-K, Head Start |
| Additional Details | Free text |

## Financial Details *(not visible to parents)*
| Field | Notes |
|---|---|
| Parent/Guardian 1 Employer | |
| Parent/Guardian 2 Employer | |
| Family Income | Annual income (for subsidy qualification) |
| Subsidy | Yes / No |
| Subsidy Details | Program name, amount, notes |

## Custom Fields
- Admin can add custom fields (text, date, boolean) as needed
- Shown on profile; not visible to parents by default

---

## Contacts (up to 4)
Each child has up to 4 contacts. Contact type replaces "Guardian."

| Field | Notes |
|---|---|
| Name | Full name — required |
| Type | **Parent** or **Guardian** |
| Email | Required for primary contact (used for parent login) |
| Phone | Required |
| Can Pickup | Yes / No — drives authorized pickup list |
| PIN Code | 4-digit family PIN for check-in; hidden by default (Reveal button) |
| Signed Up | Whether the contact has created a parent portal account |
| Billing Info | Whether this contact is the billing contact (R1) |

> **Note:** "Can Pickup" on a Contact replaces a separate Authorized Pickup List. If a person can pick up but is not a contact (e.g. babysitter), they appear as a contact with type "Guardian" and Can Pickup = Yes.

> **Photo required** for every contact where Can Pickup = Yes.

---

## Immunizations *(not visible to parents)*
Tracks vaccination dates against CDC schedule recommendations. Shows Overdue / Due / Completed per dose.

### Vaccines tracked (CDC schedule):
- Hep B — Hepatitis B (Doses 1–3)
- DTaP — Diphtheria, Tetanus, acellular Pertussis (Doses 1–5)
- Hib — Haemophilus Influenzae Type B (Doses 1–4)
- PCV — Pneumococcal Conjugate Vaccine (Doses 1–4)
- Polio (Doses 1–4)
- Rotavirus (Doses 1–3)
- Covid — Coronavirus (Doses 1–2)
- Flu — Seasonal Influenza (Yearly)
- MMR — Measles, Mumps, Rubella (Doses 1–2)
- VAR — Varicella (Doses 1–2)
- Hep A — Hepatitis A (Doses 1–2)

### Per vaccine:
- Student record: date of each dose (enter manually or via uploaded document)
- Status per dose: Overdue (red) | Due (green) | Completed | Blank
- CDC recommended age/interval shown alongside

### Settings per child:
- Catch-up schedule: Yes / No
- Student exempt: Yes / No (with reason)
- Notes

---

## User Roles & Access
| Role | Access |
|---|---|
| Admin | Full CRUD on all fields including financial, enrollment, immunizations |
| Teacher | View profile (personal info, contacts, rooms); add daily notes |
| Parent / Contact | View own child's visible fields; cannot see financial, enrollment details, immunizations |

---

## Screenshots
> [x] Brightwheel child profile — added (see attached screenshot)  
> [ ] Add child form (step-by-step)  
> [ ] Immunization entry screen  

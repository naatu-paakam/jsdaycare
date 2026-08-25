# Feature 1 — Child & Family Management

**Release:** MVP  
**Priority:** P0 — everything else depends on this

---

## Overview
Central registry of every enrolled child and their family. Single source of truth for staff and parents.

---

## Child Profile
- Full name, preferred name/nickname
- Date of birth + age (auto-calculated)
- Profile photo
- Room / classroom assignment
- Enrollment status: Active | Waitlist | Withdrawn
- Start date, end date (if applicable)
- Allergies (food, environmental, medication) — flagged prominently
- Medical conditions and special needs notes
- Pediatrician name + contact

## Family / Guardian Profiles
- Up to 4 guardians per child
- Relationship to child (Mother, Father, Grandparent, Guardian, etc.)
- Primary contact designation
- Phone, email
- Home address

## Authorized Pickup List
- Named individuals allowed to pick up the child
- Photo of each authorized person (optional but recommended)
- Notes (e.g. "call parent before releasing to this person")

## Emergency Contacts
- Name, relationship, phone (at least 2 required)
- Separate from authorized pickup list

## Documents
- Immunization records (upload PDF/image)
- Signed enrollment agreement
- Any IEP or medical action plans

---

## User Roles & Access
| Role | Access |
|---|---|
| Admin | Full CRUD on all children |
| Teacher | View assigned room's children; add daily notes |
| Parent | View own child's profile; update emergency contacts |

---

## Screenshots to add
> [ ] Brightwheel child profile screen  
> [ ] Brightwheel add child form  
> [ ] Authorized pickup list view  

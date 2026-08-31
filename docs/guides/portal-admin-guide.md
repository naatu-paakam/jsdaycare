# Portal Admin — User Guide

> See the detailed flow guide: [portal-admin-flow.md](portal-admin-flow.md)

**Login:** portal@daycareportal.com / DayCarePortal@2026  
**Redirects to:** /portal (platform dashboard)

---

## What is the Portal Admin?
Platform-level super administrator who manages the DayCarePortal SaaS. Cannot see individual student or staff data — only school-level management.

---

## Dashboard (/portal)

**Stats bar:** Total schools / Total students / Total staff (read-only aggregate counts)

**Two tabs:**

### 🏫 Schools tab
Table of all schools with: name, timezone, admin count, created date, Manage →.

**+ Create school:**
1. Enter school name + timezone
2. Optionally assign an existing user as admin immediately
3. Click Create → school is created + **permanent admin registration link auto-generated**
4. Copy the link and send to the new school admin

**Manage school panel (click Manage →):**
- **School Name** — editable (pencil icon). Changing name does NOT affect data — UUID is permanent.
- **Admin Registration Link** — permanent link for school admin registration. Click **+ Generate Admin Link** (one-time, then it persists forever). Copy and share. Anyone with the link can register as admin of this school.
- **Admins list** — who's currently admin, with remove button
- **Assign Existing Admin** — search by name from the dropdown to assign an existing DayCarePortal user as admin without a new registration link

### 👥 Users tab
All users across the platform (excluding Portal Admins).

**Columns:** Name/Login ID, Role badge, Schools (all they belong to), Status, Actions

**Filters:** Search by name/login ID, school dropdown, role dropdown

**Actions per user:**
- 🔗 Invite — opens invite dialog for their school+role
- 🗑 Remove — confirm dialog → removes from school memberships

**+ Invite User** (top right):
1. Select school from dropdown
2. Select role (Admin / Staff / Parent)
3. Click **Next: Generate Link** → opens InviteDialog with copy button

---

## Multi-school admins
A single admin can manage multiple schools. When you assign them to a second school:
- They're added to `school_memberships` for the new school
- Their existing schools are NOT affected
- Next time they log in (or switch schools in their sidebar), the new school appears in the dropdown

---

## Key links
- **Platform:** http://localhost:5174/portal
- **School check-in:** http://localhost:5174/checkin?school=`<school-id>`
- **Registration:** http://localhost:5174/register?token=`<invite-token>`

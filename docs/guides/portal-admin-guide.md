# Portal Admin — User Guide

**Login:** portal@daycareportal.com / DayCarePortal@2026  
**Redirects to:** /portal (platform dashboard)

---

## What is the Portal Admin?
Platform-level super administrator who manages the DayCarePortal SaaS. Manages schools and all users across the platform.

---

## Dashboard (/portal)

**Stats bar:** Total schools / Total students / Total staff (live counts across all schools)

**Two tabs: Schools · Users**

---

## 🏫 Schools tab

**Columns:** Name | Timezone | Address | Phone | Students | Admins | Created | Actions

**Search bar** — filter schools by name in real time.

**Students column:**
- 🟢 Green badge (e.g. "3 active") — school has enrolled students
- Gray "0" — no active students

**Actions per school:**
- ✏ **Edit (pencil)** — opens the Manage School panel (see below)
- 🗑 **Delete (trash)** — color indicates safety:
  - 🟢 Green = no active students, safe to delete
  - 🟡 Amber = school has active students — confirm dialog warns with count

**Delete confirmation:** Shows student count warning. Deleting removes the school and all associated students, contacts, immunizations, activities, and history. This is irreversible.

---

### + Create school
1. Enter school name + timezone
2. Enter phone, email, and address (street, city, state, ZIP)
3. Optionally assign an existing DayCarePortal user as admin immediately
4. Click **Create** → school is created + **permanent admin registration link auto-generated**
5. Copy the link and send to the new school admin

---

### Manage School panel (click ✏ on a school row)

**School Name** — click the pencil to rename. Changing name does NOT affect data — UUID is permanent.

**Contact & Address section:**
- Phone, Email
- Street address, City, State, ZIP
- Click **Save Contact Info** to persist

**Admin Registration Link** — permanent link for school admin registration. Click **+ Generate Admin Link** (one-time, persists forever). Anyone with the link can register as admin of this school.

**Admins list** — all admins currently assigned, with remove (🗑) per admin.

**Assign Existing Admin** — search by name to assign an existing DayCarePortal user as admin without a new invite link.

---

## 👥 Users tab

**Columns:** User (name/login ID) | Role badge | Schools | Status | Actions

**Search bar** — filter by name or login ID.  
**Filters** — by school and by role.

**Active users:**
- ✏ **Edit (pencil)** — opens Manage User dialog
- 🗑 **Delete (trash)** — confirm dialog → permanently removes user from DB and auth

**Pending invites (Invited badge):**
- Shows email, role, school, expiry date
- 🗑 **Delete** — revokes the unused invite immediately

---

### Manage User dialog (click ✏)

- **Full Name** — editable
- **Phone** — editable
- **Role** — Admin / Staff / Parent (dropdown)
- **Schools section** (Admin and Staff only — hidden for Parent role):
  - Lists all schools the user belongs to, with **Remove** button per school
  - **Assign to school** dropdown — add user to an additional school
- **Save Changes** — updates name, phone, role in DB

> Parent users do not have a school section — parents are linked to students via contacts, not schools directly.

---

### + Invite User (top right)
1. Select school from dropdown
2. Select role (Admin / Staff / Parent)
3. Click **Next: Generate Link** → opens invite dialog with copyable link

---

## Multi-school admins
A single admin can manage multiple schools:
- When assigned to a second school, they're added to `school_memberships`
- Their existing schools are NOT affected
- They see a school dropdown in the sidebar to switch between their schools

---

## Key links
- **Platform:** http://localhost:5174/portal
- **School check-in:** http://localhost:5174/checkin?school=`<school-id>`
- **Registration:** http://localhost:5174/register?token=`<invite-token>`

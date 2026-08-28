# Portal Admin — User Guide

## Who is the Portal Admin?
Platform super-admin who manages all schools on DayCarePortal. Cannot see student or staff data.
Login: portal@daycareportal.com

## Creating a school (step by step)
1. Log in as Portal Admin → lands on /portal
2. Click "+ Create school"
3. Enter school name + timezone
4. Optionally assign an existing DayCarePortal user as admin
5. Click Create → school appears in the table

## Inviting a new school admin
The fastest way to onboard a new school admin who doesn't have a DayCarePortal account yet:
1. Click Manage → next to the school
2. Under "Admin Registration Link" → click "+ Generate Admin Link" (first time only)
3. Copy the link — it never expires and can be reused
4. Send the link to the new admin (email, WhatsApp, etc.)

## What the invited admin sees
1. Opens the link → /register?token=xxx
2. Sees: school name badge + "School Admin" role badge (pre-filled, cannot be changed)
3. Fills in:
   - **User ID** (required) — their login username, e.g. `jaya.bijjala`
   - **First name** + **Last name** (required)
   - **Email** (optional) — if not provided, they log in with User ID only
   - **Phone** (optional)
   - **Password** + **Confirm password** (min 8 chars)
4. Clicks **Create Account** → account is created and active immediately (no email verification needed)
5. Redirected to /home → their school appears in the sidebar under the school switcher

## Assigning an existing user as school admin
For users who already have a DayCarePortal account (e.g. an admin of another school):
1. Click Manage → next to the school
2. Under "Assign existing admin" → select their name from the dropdown
3. Click Assign → they now have admin access to this school
4. Their existing schools are NOT removed — this school is added to their access
5. Next time they log in (or switch schools in the sidebar), the new school appears

## Managing multiple schools as an admin
When an admin is assigned to multiple schools:
- The sidebar shows their active school with a dropdown arrow
- Click the school name → dropdown shows all their schools
- Select a school → switches the active context (all data reloads for that school)
- This works for both Portal Admin and regular School Admins

## School admin responsibilities (after onboarding)
- Add students, rooms, staff
- Invite parents/guardians (from student profile → Contacts tab → Add Contact or Edit Contact → Generate Invite URL)
- Invite staff (Staff & Payroll → + Invite Staff)
- Manage schedules, menus, calendar

## Inviting a parent/guardian to the portal (school admin)
1. Go to a student's profile → Contacts tab
2. Click **+ Add contact** or the **✏ Edit** button on an existing contact
3. Fill in the contact details (name, type, phone, etc.)
4. Scroll to **Portal Invite Link** section → click **🔗 Generate Invite URL**
5. A `/register?token=xxx` link appears — click **Copy** to copy it
6. Send the link directly to the parent/guardian (SMS, WhatsApp, email, etc.)
7. The link expires in 7 days
8. The parent visits the link → fills in User ID, name, password → instantly accesses their child's portal
9. The Contacts table shows their portal status: **Not signed up → Invited → Signed Up**

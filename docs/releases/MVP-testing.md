# MVP Testing Scenarios — jsdaycare

Format: **Given** / **When** / **Then**  
All scenarios should pass before MVP is considered shippable.

---

## 1. Child & Family Management

### TC-01 Add a new child
**Given** I am logged in as Admin  
**When** I fill in child profile (name, DOB, room, allergy) and submit  
**Then** child appears in the room's roster with correct details and allergy flag visible

### TC-02 Add guardians and authorized pickup
**Given** a child profile exists  
**When** I add 2 guardians and 1 authorized pickup person  
**Then** all appear on the child's profile; authorized pickup person is listed separately from guardians

### TC-03 Upload immunization record
**Given** a child profile exists  
**When** I upload a PDF immunization record  
**Then** document is stored and downloadable; compliance alert clears for that child

### TC-04 Change enrollment status to Withdrawn
**Given** an active child profile  
**When** Admin sets status to Withdrawn  
**Then** child no longer appears in room roster or expected attendance; still visible in admin search

---

## 2. Attendance Tracking

### TC-05 Staff check-in a child
**Given** today's room view is open  
**When** staff marks a child as checked in  
**Then** child status shows "Checked In" with current timestamp and staff name

### TC-06 PIN-based check-in
**Given** a family has a 4-digit PIN  
**When** guardian enters PIN on the check-in tablet  
**Then** all children linked to that family are shown; staff selects which child; check-in recorded with guardian's name

### TC-07 Unauthorized pickup attempt
**Given** a person NOT on authorized pickup list is attempting pickup  
**When** staff looks up the child  
**Then** the person's name does not appear in the pickup dropdown; system shows "Not authorized" warning

### TC-08 Mark child absent
**Given** a child is expected today per their schedule  
**When** staff marks them absent with reason "Sick"  
**Then** child shows "Absent" in attendance view; not counted in present tally

### TC-09 Export daily attendance CSV
**Given** it is end of day and attendance is recorded  
**When** Admin clicks Export Attendance  
**Then** CSV downloads with columns: child name, room, check-in time, check-out time, guardian (in/out), status

---

## 3. Daily Activity Reports

### TC-10 Log a meal entry
**Given** staff is in the daily report view for a child  
**When** staff logs Lunch: offered "pasta and fruit", ate "Most"  
**Then** entry appears in the child's daily report under Meals with correct data

### TC-11 Log a nap entry
**Given** staff is in the daily report view  
**When** staff logs nap: start 12:30, end 14:00, quality "Good"  
**Then** nap entry shows with duration calculated (1h 30m)

### TC-12 Upload a photo
**Given** staff is in the daily report view  
**When** staff uploads a photo  
**Then** photo is stored in Supabase Storage; thumbnail visible in the report; parent can view it in their portal

### TC-13 Parent views daily report
**Given** staff has completed a daily report for a child  
**When** parent logs into their portal and navigates to their child  
**Then** today's report is visible with all entries: meals, nap, diapers, mood, activities, photos

---

## 4. Staff Management

### TC-14 Add a staff member
**Given** I am logged in as Admin  
**When** I add a new staff member with role "Lead Teacher" and assign to "Toddlers" room  
**Then** staff appears in the Toddlers room roster with correct role

### TC-15 Staff check-in / check-out
**Given** a staff member exists  
**When** they clock in at 7:45 AM  
**Then** staff shows as "On duty" in the room; clock-in timestamp is recorded

### TC-16 Ratio warning triggered
**Given** Toddlers room has ratio rule 1:6 and 1 staff is checked in  
**When** a 7th child checks in  
**Then** ratio indicator turns Red; admin dashboard compliance alert fires

### TC-17 Staff certification expiry alert
**Given** a staff member's CPR certification expires in 20 days  
**When** Admin views the dashboard  
**Then** compliance alert shows "CPR expiring in 20 days — [Staff Name]"

---

## 5. Classroom / Room Management

### TC-18 Create a new room
**Given** I am Admin  
**When** I create room "Infants", age 0–12 months, capacity 8, ratio 1:4  
**Then** room appears in the room grid; no children or staff assigned yet

### TC-19 Assign child to room
**Given** a child and a room both exist  
**When** Admin assigns the child to the room  
**Then** child appears in that room's roster

### TC-20 Room at capacity
**Given** a room has capacity 8 and 8 active children are enrolled  
**When** Admin tries to enroll a 9th child into that room  
**Then** system shows a capacity warning and offers to add to waitlist instead

---

## 6. Scheduling

### TC-21 Set child's weekly schedule
**Given** a child is enrolled  
**When** Admin sets their schedule to Mon, Tue, Wed, Thu  
**Then** on those days child appears in Expected Attendance; Fri they do not

### TC-22 Mark a closure day
**Given** Admin marks Dec 25 as closed  
**When** any user views the calendar on Dec 25  
**Then** the day is marked "Closed — Holiday"; no expected attendance is generated

### TC-23 Staff schedule entry
**Given** a staff member exists  
**When** Admin sets their schedule to Mon–Fri 7:30–4:00  
**Then** schedule is visible on the staff weekly view

---

## 7. Admin Dashboard

### TC-24 Today's snapshot accuracy
**Given** 12 children are enrolled; 10 checked in; 1 absent; 1 not yet arrived  
**When** Admin views the dashboard  
**Then** snapshot shows: Present 10, Absent 1, Expected 11, Not arrived 1

### TC-25 Compliance alert — missing immunization
**Given** a child has no immunization record uploaded  
**When** Admin views the dashboard  
**Then** compliance alert shows that child's name under "Missing immunization records"

---

## 8. Forms & Compliance

### TC-26 Parent signs enrollment agreement
**Given** a parent account is linked to a child  
**When** parent types their name and clicks Sign  
**Then** signature is recorded with timestamp; form status changes to "Signed"; audit log entry created

### TC-27 Record an incident report
**Given** an incident occurred (child fell on playground)  
**When** staff fills in incident report and submits  
**Then** report is saved; PDF export is available; admin sees it in the incident log

### TC-28 Permission slip — track who signed
**Given** Admin creates a permission slip for a field trip and sends it to all Toddler room families  
**When** 3 of 5 families have signed  
**Then** Admin sees "3 / 5 signed" with names of who signed and who hasn't

### TC-29 Audit log entry on form action
**Given** a parent signs a form  
**When** Admin views the audit log  
**Then** log shows: form name, action "Signed", user (parent name), timestamp

---

## Role Access Tests

### TC-30 Teacher cannot access admin dashboard
**Given** I am logged in as Lead Teacher  
**When** I navigate to /admin/dashboard  
**Then** I am redirected with "Access denied" message

### TC-31 Parent cannot see another family's child
**Given** I am logged in as a Parent  
**When** I attempt to access another child's profile URL directly  
**Then** I receive a 403 / not found response

---

## Total: 31 test scenarios

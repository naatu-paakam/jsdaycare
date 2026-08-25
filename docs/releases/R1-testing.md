# R1 Testing Scenarios — jsdaycare

Format: **Given** / **When** / **Then**  
Prerequisite: All 31 MVP test scenarios passing before R1 testing begins.

---

## 9. Parent Communication

### TC-32 Staff sends message to parent
**Given** a staff member is in a child's profile  
**When** staff sends message "Liam had a great day!"  
**Then** message appears in the parent's message thread; parent sees unread badge in their portal

### TC-33 Parent replies to message
**Given** a parent has received a message  
**When** parent types a reply and sends  
**Then** reply appears in the staff's message thread; staff sees unread badge

### TC-34 Admin sends broadcast to all families
**Given** Admin composes announcement "School closed Friday due to weather"  
**When** Admin sends to "All Families"  
**Then** announcement appears in every family's notification feed; read receipts show 0 / N read

### TC-35 Broadcast read receipt updates
**Given** a broadcast has been sent to 10 families  
**When** 4 parents open the announcement  
**Then** admin read receipt shows "4 / 10 read" with names of who read it

### TC-36 Daily report notification delivered
**Given** staff marks a daily report as complete  
**When** report is published  
**Then** parent receives email notification with link to view the report

### TC-37 Parent reacts to daily report
**Given** parent is viewing their child's daily report  
**When** parent taps ❤️ and adds note "Thank you for the photos!"  
**Then** reaction and note appear in the report; staff sees it in their view

### TC-38 Parent turns off email notifications
**Given** parent is in notification preferences  
**When** parent toggles email notifications OFF  
**Then** subsequent broadcasts and report completions do not send email to this parent; in-app notifications still appear

### TC-39 In-app notification bell clears on read
**Given** parent has 3 unread notifications  
**When** parent opens the notification panel and reads all  
**Then** unread badge count drops to 0

---

## 10. Billing & Payments

### TC-40 Create a tuition plan
**Given** Admin is in Billing settings  
**When** Admin creates plan "Toddlers Full-Time — $1,200/month"  
**Then** plan appears in the plan list and can be assigned to children

### TC-41 Assign tuition plan to a child
**Given** a tuition plan exists  
**When** Admin assigns the plan to a child with effective date 1st of next month  
**Then** child's billing tab shows the plan; first invoice will generate on the configured date

### TC-42 Auto-generate monthly invoice
**Given** a child has an active tuition plan set to bill on the 1st  
**When** the 1st of the month arrives (or Admin triggers manually for testing)  
**Then** invoice is created with correct amount and due date; parent sees it in their portal

### TC-43 Parent pays invoice online (Stripe)
**Given** a parent has an unpaid invoice  
**When** parent clicks Pay, enters card details (Stripe test card 4242 4242 4242 4242), and confirms  
**Then** payment is processed; invoice status changes to Paid; parent receives email receipt; admin sees payment in revenue view

### TC-44 ACH payment option
**Given** a parent is on the payment screen  
**When** parent selects "Pay by bank transfer (ACH)" and enters bank details  
**Then** ACH payment is initiated; invoice shows "Payment pending — ACH" until cleared

### TC-45 Late fee auto-applied
**Given** a plan has "Apply $25 late fee after 5 days past due"  
**When** invoice is 6 days past due and still unpaid  
**Then** a $25 late fee line item is added to the invoice automatically; parent sees updated total

### TC-46 Admin views overdue invoices
**Given** 3 families have invoices past due date  
**When** Admin opens the Billing dashboard  
**Then** all 3 invoices are flagged in red under "Overdue"; total outstanding amount is shown

### TC-47 Subsidy adjustment on invoice
**Given** a child is marked as receiving $400/month government subsidy  
**When** monthly invoice is generated ($1,200 tuition)  
**Then** invoice shows: Tuition $1,200 — Subsidy ($400) — Balance Due $800

### TC-48 Download payment receipt (PDF)
**Given** a payment has been made  
**When** parent clicks Download Receipt  
**Then** PDF downloads with: child name, payment date, amount, invoice period, payment method

### TC-49 Monthly revenue report export
**Given** Admin is in the Billing reports section  
**When** Admin selects month and clicks Export CSV  
**Then** CSV downloads with: family name, child name, invoice amount, amount paid, payment date, balance

### TC-50 End-of-year family summary
**Given** a family has made payments throughout the year  
**When** Admin generates end-of-year summary for that family  
**Then** PDF shows total tuition paid for the year, broken down by month (usable for tax purposes)

---

## R1 Enhancements to MVP Features

### TC-51 QR code check-in
**Given** a family has a unique QR code (downloadable from their portal)  
**When** guardian scans the QR on the check-in tablet's camera  
**Then** their family's children are shown; staff selects which child; check-in recorded

### TC-52 Schedule change request — parent submits
**Given** a parent wants to change their child's schedule from M-F to M-W-F  
**When** parent submits schedule change request with effective date  
**Then** request appears in Admin's pending approvals; child's current schedule is unchanged

### TC-53 Schedule change request — admin approves
**Given** a schedule change request is pending  
**When** Admin approves it  
**Then** child's schedule updates effective the requested date; parent receives confirmation notification

### TC-54 Permission slip reminder
**Given** a permission slip was sent 3 days ago; 2 families have not signed  
**When** the configured reminder day arrives (e.g. day 3 after send)  
**Then** those 2 families receive an email reminder with a link to sign

---

## Stripe Live Mode Validation (pre-launch gate)

### TC-55 Switch from test to live Stripe keys
**Given** all Stripe tests pass in test mode  
**When** Admin switches to live Stripe keys in settings  
**Then** a real $1.00 test charge succeeds and is immediately refunded; no test card numbers are accepted in live mode

---

## Total: 55 test scenarios (31 MVP + 24 R1)

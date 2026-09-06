# TC- Test Case Index

Auto-generated from e2e/\*.spec.ts — 2026-09-06 — 364 test cases

## admissions
- TC-admissions-add-button: Add Student button navigates to /students/add
- TC-admissions-add-required: Add Student form requires First and Last Name
- TC-admissions-add-student: Admin can add a new waitlist student and it appears in the list
- TC-admissions-delete-cancel: Clicking No cancels delete and restores action buttons
- TC-admissions-delete-confirm: Delete button shows inline Yes/No confirm
- TC-admissions-delete-student: Clicking Yes deletes student and removes from list
- TC-admissions-edit-button: Edit button opens modal with student name in title
- TC-admissions-edit-start-date: Edit modal has Start Date and End Date fields
- TC-admissions-edit-status: Admin can change enrollment status via Edit modal
- TC-admissions-filter-all: All Students tab shows all enrollment statuses
- TC-admissions-filter-waitlist: Waitlist Only tab shows only waitlisted students
- TC-admissions-name-link: Student name links to their profile page
- TC-admissions-stats: Stats bar shows Waitlist, Active, Withdrawn, Graduated counts

## auth
- TC-admin-login: navigates to /login and logs in successfully
- TC-wrong-password: shows error for bad credentials

## calendar
- TC-calendar-add-holiday: Admin sees Add Holiday button
- TC-calendar-birthday-policy: Birthday Policy section visible
- TC-calendar-edit-hours: Admin can click edit on an operating hours row
- TC-calendar-edit-policy: Edit Policy link visible on Holiday Policy
- TC-calendar-holiday-policy: Holiday Policy section with bullet points
- TC-calendar-operating-hours: Operating Schedule shows Mon-Fri hours and Closed days
- TC-calendar-special-events: Special Events section and + Add Special Event button visible
- TC-calendar-two-columns: Calendar has Holiday Calendar and Operating Schedule sections

## checkin-code
- TC-admin-sees-no-checkin-code-card: admin home does NOT show My Check-in Code card
- TC-checkin-code-card-visible-parent: parent sees My Check-in Code card with current value
- TC-checkin-code-global-unique: cannot set a code already used by another user
- TC-checkin-code-on-profile: parent code set via portal matches code shown in admin contact list
- TC-checkin-code-show-hide-toggle: code masked by default, reveal on toggle click
- TC-checkin-code-validation-non-numeric: non-numeric characters are stripped from input
- TC-checkin-code-validation-too-short: Save disabled when fewer than 4 digits entered
- TC-contact-profile-linked-on-create: new contact created by admin has profile_id set

## checkin
- TC-checkin-action-button: Check In or Check Out button visible after PIN
- TC-checkin-activity-logged: After check-in, activity appears in student daily activities
- TC-checkin-checkout-toggle: After check-in, same PIN shows Check Out button
- TC-checkin-invalid-pin: Invalid PIN shows error, stays on PIN step
- TC-checkin-page-loads: /checkin page loads without login and shows PIN pad
- TC-checkin-pin-pad-masked: PIN dots fill as digits are entered
- TC-checkin-qr-encodes-school: QR copy link contains /checkin?school= URL
- TC-checkin-qr-in-settings: Settings page shows QR code with download + copy buttons
- TC-checkin-short-pin: Submitting fewer than 6 digits shows validation message
- TC-checkin-shows-status: Student list shows current attendance status
- TC-checkin-stays-on-pin: Entering fewer than 6 digits keeps page on PIN step
- TC-checkin-toggle: Check In → shows success → resets to PIN entry
- TC-checkin-valid-pin: Valid PIN shows contact name and student list
- TC-home-refresh-button: Dashboard has manual refresh button
- TC-home-refresh-updates-counts: Manual refresh reruns stats queries

## dashboard
- TC-compliance-alerts: Compliance Alerts section visible on home
- TC-home-loads: /home shows today's stats section
- TC-room-ratios: Current Room Ratios section visible on home

## delete-scenarios
- TC-delete-activity-cancel: Clicking No cancels activity deletion
- TC-delete-activity-daily: Activity added from student profile can be deleted
- TC-delete-activity-parent-read-only: Parent sees no delete button on activities
- TC-delete-activity-room-feed: Activity added then deleted from room Feed disappears
- TC-delete-contact-add-visible: Admin sees Add Contact and Add Pickup buttons
- TC-delete-contact-parent-sees-tab: Parent can open Contacts tab on their own child
- TC-delete-emergency-contact: Admin can delete emergency contact
- TC-delete-food-item-no-orphan: Deleting food item doesn't affect existing menus
- TC-delete-food-item-succeeds: Added food item can be deleted from library
- TC-delete-food-parent-no-library: Parent cannot access Food Item Library
- TC-delete-menu-parent-read-only: Parent sees Weekly Menu but no Create/Edit button
- TC-delete-room-rpc-safe: delete_room_safe nullifies homeroom_id and activity/attendance room_id
- TC-delete-student-confirm-dialog: Delete shows inline confirm before acting
- TC-delete-student-rpc-no-fk-error: delete_student_safe handles form_submissions and shared_files FK
- TC-menu-week-nav-no-errors: Navigating between menu weeks loads without errors

## menus
- TC-menus-add-food-item: Admin can add a food item to the library with allergen
- TC-menus-allergen-badge: Food items with allergens show allergen badge
- TC-menus-chip-add-and-save: Admin can add a chip to a menu week and save
- TC-menus-chip-remove: Admin can remove a chip in the edit dialog
- TC-menus-create-button: Admin sees + Create Menu button
- TC-menus-create-dialog: Create Menu opens 5-day × 4-meal grid dialog
- TC-menus-delete-food-item: Admin can delete a food item from the library
- TC-menus-empty-state: Empty future week shows Create Menu (no menu set)
- TC-menus-food-library: Food Item Library tab shows food items
- TC-menus-parent-no-create: Parent cannot see Create Menu button
- TC-menus-parent-one-tab: Parent sees ONLY Weekly Menu tab (no library)
- TC-menus-parent-views-menu: Parent can view the weekly menu chips
- TC-menus-two-tabs: Admin sees both Weekly Menu and Food Item Library tabs
- TC-menus-week-nav-future: Navigating to empty future week shows Create Menu button
- TC-menus-week-nav: Week navigation arrows and date range visible

## navigation
- TC-nav-admissions: navigates to /admissions
- TC-nav-calendar: navigates to /calendar
- TC-nav-menus: navigates to /menus
- TC-nav-paperwork: navigates to /paperwork
- TC-nav-parents: Parents link removed (contacts managed per-student)
- TC-nav-reporting: navigates to /reporting
- TC-nav-rooms: navigates to /rooms
- TC-nav-schedules: navigates to /schedule
- TC-nav-settings: navigates to /settings
- TC-nav-staff: navigates to /staff
- TC-nav-students: navigates to /students
- TC-parent-no-admin: parent cannot access /home directly
- TC-parent-redirected: parent redirected to /parent portal
- TC-parent-sees-child: parent portal shows child name
- TC-parent-students-own-child-only: parent can access /students but sees only their own child
- TC-settings-school-name-change: renaming school preserves students and rooms
- TC-sidebar-home: Home link visible and navigates
- TC-sidebar-myschool: My School expands
- TC-sidebar-school-name: sidebar shows actual school name (not generic 'My School')
- TC-teacher-home: teacher lands on /home
- TC-teacher-sees-rooms: can navigate to /rooms
- TC-teacher-sees-students: can navigate to /students

## parent-persona
- TC-parent-checkin-code-card-visible: Parent sees check-in code card on portal home
- TC-parent-checkin-code-set: Parent can set or update a check-in code
- TC-parent-checkin-code-validation: Save button disabled for short code
- TC-parent-home-activities-toggle: Clicking Today's Activities expands/collapses feed
- TC-parent-home-checkin-button: Student card shows Check In or Check Out button
- TC-parent-home-checkin-toggles: Clicking Check In changes button to Check Out
- TC-parent-home-loads: Parent home shows greeting and student card
- TC-parent-home-profile-link: Chevron navigates to student profile
- TC-parent-home-student-card: Student card shows name and enrollment status
- TC-parent-nav-calendar-visible: Calendar link visible in sidebar
- TC-parent-nav-calendar-works: Parent can navigate to Calendar (read-only)
- TC-parent-nav-home-visible: Home link visible and goes to /parent
- TC-parent-nav-menus-visible: Menus link visible in sidebar
- TC-parent-nav-menus-works: Parent can navigate to Menus and sees Weekly Menu only
- TC-parent-nav-no-rooms: Rooms NOT visible for parent
- TC-parent-nav-no-schedules: Schedules NOT visible for parent
- TC-parent-nav-no-settings: Settings NOT visible for parent
- TC-parent-nav-no-staff: Staff & Payroll NOT visible for parent
- TC-parent-nav-stories-visible: Stories link visible in sidebar
- TC-parent-nav-stories-works: Parent can navigate to Stories page
- TC-parent-nav-students-visible: Students link visible in sidebar
- TC-parent-profile-all-tabs: Parent sees Profile, Contacts, Immunizations, Daily Activities, Documents
- TC-parent-profile-back-link: Back to My Portal link is visible
- TC-parent-profile-back-navigates: Clicking Back to My Portal returns to /parent
- TC-parent-profile-sidebar-clean: Sidebar shows only Home, Stories, Calendar, Menus, Students
- TC-parent-students-can-click-profile: Parent can open their child's profile from list
- TC-parent-students-no-add-button: Parent does NOT see Add Student button
- TC-parent-students-no-edit-delete: Parent does NOT see Edit/Delete buttons on student rows
- TC-parent-students-sees-own-child: Parent sees their child in the list

## portal-admin-manage
- TC-portal-school-rename-preserves-uuid: Renaming school keeps UUID and all linked data intact
- TC-portal-schools-active-students-badge: School with active students shows amber badge
- TC-portal-schools-address-column: Schools table shows Address column
- TC-portal-schools-create-and-verify: Creating a school persists it in the schools list
- TC-portal-schools-create-has-address: Create School form has address/phone/email fields
- TC-portal-schools-delete-confirm: Delete icon shows confirm dialog
- TC-portal-schools-delete-icon: Each school row has delete (trash) icon
- TC-portal-schools-delete-warn-active-students: Delete confirm shows student count warning when school has active students
- TC-portal-schools-edit-icon: Each school row has edit (pencil) icon
- TC-portal-schools-edit-opens-panel: Edit icon opens Manage School panel
- TC-portal-schools-phone-column: Schools table shows Phone column
- TC-portal-schools-search-bar: Schools tab has a search bar
- TC-portal-schools-search-filters: Search bar filters school list
- TC-portal-schools-students-column: Schools table shows Students (active) column
- TC-portal-users-admin-has-school-section: Admin/staff user shows Schools section in dialog
- TC-portal-users-delete-confirm: Delete icon shows confirm dialog with warning
- TC-portal-users-delete-icon: Each active user row has a delete (trash) icon
- TC-portal-users-delete-rpc-no-column-errors: delete_portal_user RPC handles all FK tables correctly
- TC-portal-users-delete-succeeds: Deleting a user removes them from the list and DB
- TC-portal-users-edit-has-fields: Manage User dialog has Name, Phone, Role fields
- TC-portal-users-edit-icon: Each active user row has a pencil icon
- TC-portal-users-edit-opens-dialog: Pencil opens Manage User dialog
- TC-portal-users-invite-delete-button: Pending invite rows have delete button
- TC-portal-users-parent-no-school-section: Parent user does NOT see Schools section in dialog
- TC-settings-address-fields: Settings shows street/city/state/zip fields
- TC-settings-address-saves: Admin can enter and save address info
- TC-settings-email-field: Settings shows Email field
- TC-settings-phone-field: Settings shows Phone field

## portal
- TC-portal-assign-existing: Assign existing user shows error for unknown search
- TC-portal-blocked-from-home: portal admin cannot access /home
- TC-portal-blocked-from-students: portal admin cannot access /students
- TC-portal-create-school: + Create school button opens modal
- TC-portal-invite-dialog-opens: Admin Registration Link section loads in manage panel
- TC-portal-invite-generates-link: Generate Admin Link shows copy button
- TC-portal-login: portal admin logs in and lands on /portal
- TC-portal-manage-invite: Manage panel has Admin Registration Link and Assign sections
- TC-portal-manage-school: Manage link opens school detail panel
- TC-portal-no-sidebar: portal admin page has no sidebar nav
- TC-portal-schools-table: portal admin sees schools table with at least 1 school
- TC-portal-stats: portal admin dashboard shows stats (schools count)
- TC-portal-users-invite-button: + Invite User button in top right opens school+role dialog
- TC-portal-users-multischool-shown: Multi-school user shows both school names
- TC-portal-users-role-filter: Role filter narrows to matching users
- TC-portal-users-search: Search filter narrows user list
- TC-portal-users-shows-all-users: Users table shows multiple users with roles
- TC-portal-users-tab: Users tab visible and shows user table

## registration-flows
- TC-add-student: Admin creates student via form → verified in list and DB
- TC-register-invalid-token: Invalid token shows error, Back to Login link visible
- TC-register-no-token: Missing token shows invitation required message
- TC-register-parent: Parent registers via invite → redirects to /parent portal
- TC-register-school-admin: School admin registers via invite link → redirects to /home
- TC-register-staff: Staff registers via invite → redirects to /home with restricted nav
- TC-register-validation: Empty User ID shows error; short password shows error

## registration
- TC-invite-generates-link: Invite dialog generates a /register link on submit
- TC-invite-parent-button: Parents page has + Invite Parent button (admin)
- TC-invite-staff-button: Staff list has + Invite Staff button (admin)
- TC-invite-staff-dialog: Invite Staff button opens invite dialog with role=staff
- TC-login-register-link: Login page has 'Have an invitation? Register here' link
- TC-multischool-dropdown: Clicking school switcher reveals all schools for the admin
- TC-multischool-switcher: Multi-school admin sees school switcher button in sidebar
- TC-register-invalid-token: /register with bad token shows invalid invitation error
- TC-register-no-token: /register without token shows invitation required message
- TC-register-page-loads: /register page has DayCarePortal branding

## regression-lessons
- TC-lesson1-portal-admin-student-counts: Portal admin sees correct cross-school student counts via RPCs
- TC-lesson3-register-endpoint-reachable: /api/register-user endpoint returns non-404 on localhost
- TC-lesson4-delete-portal-user-no-fk-error: delete_portal_user RPC handles all FK tables without column errors
- TC-lesson4-delete-room-safe-rpc: Deleting a room via delete_room_safe nullifies homeroom_id on students
- TC-lesson5-add-student-no-focus-loss: Typing in Add Student form fields retains focus
- TC-lesson6-menus-no-406-empty-week: Menus page loads without 406 when no menu exists for this week
- TC-lesson6-portal-students-no-406: Portal admin loads school data without 406 errors
- TC-lesson9-no-service-key-in-bundle: Service key is NOT bundled into client-side JavaScript

## room-activities
- TC-room-activity-all-students: Student select defaults to All students
- TC-room-activity-picker-shows-all: Picker shows all 12 activity types
- TC-room-food-form-fields: Food form shows meal type and quantity options
- TC-room-food-saves-to-feed: Food activity saves and appears in Feed
- TC-room-health-check-form-fields: Health Check form shows temperature field
- TC-room-health-check-saves-to-feed: Health Check saves and appears in Feed
- TC-room-incident-saves-to-feed: Incident saves and appears in Feed
- TC-room-kudos-saves-to-feed: Kudos with text saves and appears in Feed
- TC-room-meds-form-fields: Meds form shows medication and dose inputs
- TC-room-meds-saves-to-feed: Meds activity saves and appears in Feed
- TC-room-nap-ended-in-feed: Nap Ended saves data.nap_status=ended in Feed
- TC-room-nap-started-in-daily-activities: Nap started shows 'Nap started' not 'Nap ended' in student Daily Activities
- TC-room-nap-started-in-feed: Nap Started saves data.nap_status=started in Feed
- TC-room-nap-status-radio-visible: Nap form shows Start / End radio buttons
- TC-room-note-saves-to-feed: Note with text saves and appears in Feed
- TC-room-observation-saves-to-feed: Observation saves and appears in Feed
- TC-room-potty-saves-to-feed: Potty activity saves and appears in Feed
- TC-room-potty-type-options: Potty form shows Wet/BM/Dry/Used radios
- TC-room-staff-only-flag: Staff-only checkbox present in Note form
- TC-student-daily-activities-add-button: Admin sees + Add Activity button in Daily Activities tab
- TC-student-daily-activities-nap-saves: Nap logged from student profile shows correct status in Daily Activities
- TC-student-daily-activities-note-saves: Note logged from student profile appears in Daily Activities
- TC-student-daily-activities-parent-readonly: Parent cannot see Add Activity button
- TC-student-daily-activities-picker-opens: Add Activity opens type picker for specific student

## rooms
- TC-checkin-buttons: room Students tab has Check in and Mark absent buttons
- TC-checkin-full-flow: Check In → Present badge → Check Out → Checked out state
- TC-room-detail: room detail shows Students and Feed tabs (no Parents)
- TC-room-list: /rooms loads with heading and New Room button

## schedules
- TC-schedules-delete-button-exists: Staff schedule dialog has Delete button concept (code verified)
- TC-schedules-loads: Schedules page loads with staff and student grids
- TC-schedules-room-filter: Room filter is visible
- TC-schedules-staff-day-pills: day-of-week pill toggles visible
- TC-schedules-staff-dialog-cancel: Cancel closes the dialog
- TC-schedules-staff-dialog-fields: dialog has required fields
- TC-schedules-staff-dialog: + Staff schedule button opens dialog
- TC-schedules-staff-rows: staff members appear as grid rows
- TC-schedules-staff-upsert-no-overlap: Adding schedule to existing day overwrites (no duplicate)
- TC-schedules-student-dialog-cancel: Cancel closes student dialog
- TC-schedules-student-dialog: + Student schedule button opens dialog
- TC-schedules-student-rows: active students appear as grid rows
- TC-schedules-student-save-no-rls-error: Student schedule saves without RLS error
- TC-schedules-today-link: Today link is visible
- TC-schedules-week-nav: Today link and week header visible

## staff-persona
- TC-staff-checkin-code-card-visible: Staff sees check-in code card on home page
- TC-staff-checkin-code-set: Staff can set a check-in code
- TC-staff-checkin-code-validation: Staff sees error for short code
- TC-staff-nav-calendar: Staff can navigate to Calendar
- TC-staff-nav-home: Staff sees Home link
- TC-staff-nav-menus: Staff can navigate to Menus
- TC-staff-nav-no-paperwork: Staff does NOT see Paperwork in nav
- TC-staff-nav-no-reporting: Staff does NOT see Reporting in nav
- TC-staff-nav-no-settings: Staff does NOT see Settings in nav
- TC-staff-nav-no-staff-payroll: Staff does NOT see Staff & Payroll in nav
- TC-staff-nav-rooms: Staff can navigate to Rooms
- TC-staff-nav-students: Staff can navigate to Students
- TC-staff-no-settings-direct: Staff navigating to /settings sees restricted content or redirect
- TC-staff-no-staff-direct: Staff navigating to /staff sees restricted content
- TC-staff-school-no-switcher: Staff school display has no dropdown arrow (single school)
- TC-staff-school-shows-own-school: Staff sees only their own school name
- TC-staff-student-daily-activities-tab: Staff sees Daily Activities tab
- TC-staff-student-daily-activities-works: Staff can view and add activities in Daily Activities tab
- TC-staff-student-no-contacts-tab: Staff does NOT see Contacts tab
- TC-staff-student-no-documents-tab: Staff does NOT see Documents tab
- TC-staff-student-no-immunizations-tab: Staff does NOT see Immunizations tab
- TC-staff-student-profile-tab: Staff sees Profile tab
- TC-staff-students-can-view: Staff can see the student list and click into a profile
- TC-staff-students-no-add-button: Staff does NOT see Add Student button
- TC-staff-students-no-edit-delete: Staff does NOT see Edit/Delete action buttons on student rows

## staff-rooms-schedules
- TC-admin-room-detail-add-student-visible: Admin sees Add Student button
- TC-admin-room-detail-settings-visible: Admin sees Room settings button in room detail
- TC-admin-rooms-new-room-visible: Admin sees New Room button
- TC-staff-room-detail-can-add-activity: Staff CAN see and use Add Activity button
- TC-staff-room-detail-can-view-feed: Staff can view the Feed tab
- TC-staff-room-detail-no-add-student: Staff does NOT see Add Student button
- TC-staff-room-detail-no-settings: Staff does NOT see Room settings button
- TC-staff-rooms-can-view: Staff can see room cards and click into a room
- TC-staff-rooms-no-new-room: Staff does NOT see New Room button
- TC-staff-schedules-cells-not-clickable: Clicking a staff schedule cell does NOT open a dialog
- TC-staff-schedules-no-add-staff-button: Staff does NOT see + Staff schedule button
- TC-staff-schedules-no-add-student-button: Staff does NOT see + Student schedule button
- TC-staff-schedules-page-loads: Staff can view the schedules page
- TC-staff-schedules-print-visible: Staff sees Print button (read-only action)
- TC-staff-schedules-sees-own-row: Staff sees their own row in Staff Schedules grid
- TC-staff-schedules-week-nav: Staff can navigate between weeks

## staff
- TC-staff-add-button: Add Staff button opens the dialog
- TC-staff-add-dialog-fields: Add Staff dialog has Name, Email, Phone, Role, photo, Generate button
- TC-staff-add-generates-link: Valid name + email generates an invite link
- TC-staff-add-invite-persists-in-users-tab: Generating invite creates a pending entry in portal admin users tab
- TC-staff-add-requires-email: Generate invite fails without email
- TC-staff-add-requires-name: Generate invite fails without name
- TC-staff-delete-cancel: No button cancels delete confirm
- TC-staff-delete-confirm: Delete button shows Remove? Yes/No inline
- TC-staff-edit-modal-opens: Edit button opens modal pre-filled with staff data
- TC-staff-edit-saves-name: Admin can change a staff member's name
- TC-staff-list-edit-button: Edit (pencil) button visible on each row
- TC-staff-list-loads: Staff list shows team members with role badges
- TC-staff-list-no-self-delete: Logged-in admin cannot delete themselves
- TC-staff-list-role-badge: Role badges show Admin or Staff for each member
- TC-staff-name-link: Clicking staff name navigates to their profile
- TC-staff-profile-back-link: Back to Staff link navigates to /staff
- TC-staff-profile-ece-credits-editable: ECE Credits numeric field editable
- TC-staff-profile-edit-cancel: Escape key cancels inline edit
- TC-staff-profile-edit-name: Admin can edit Full Name inline with Enter to save
- TC-staff-profile-hire-date-editable: Hire Date field is editable
- TC-staff-profile-hover-pencil: Hovering Full Name reveals pencil edit icon
- TC-staff-profile-loads: Profile page shows Full Name, Role, Phone, Staff Details section

## student-school-move
- TC-student-school-move-both-options: School dropdown lists all schools admin manages
- TC-student-school-move-current-selected: School dropdown defaults to student's current school
- TC-student-school-move-dropdown-visible: Edit dialog shows School dropdown for multi-school admin
- TC-student-school-move-no-warning-same-school: No warning when same school selected
- TC-student-school-move-rls-blocked-direct: Direct update with different school_id is blocked by RLS (only RPC allowed)
- TC-student-school-move-succeeds: Admin can move student to another school — student disappears from current list
- TC-student-school-move-warning: Selecting different school shows amber warning

## students
- TC-add-student-form: clicking Add Student shows form with Name and DOB fields
- TC-contact-expanded-types: Type dropdown has expanded options
- TC-contact-no-pin-field: Add contact modal does NOT show a PIN input field
- TC-contacts-add-contact-cancel: Cancel closes the contact modal
- TC-contacts-add-contact-modal: Add contact button opens modal
- TC-contacts-add-contact-validation: Add Contact requires name
- TC-contacts-add-pickup-modal: Add pickup button opens modal with pickup date fields
- TC-contacts-checkin-code-all: Check-in code Reveal shown for all contacts (admin)
- TC-contacts-invite-url-in-modal: Parent contact shows Generate Invite URL option
- TC-contacts-nonparent-no-invite: Non-parent contact type hides invite URL section
- TC-contacts-photo-upload: Add contact modal has photo upload section
- TC-contacts-pin-reveal: admin can reveal PIN code
- TC-contacts-portal-status: Contacts table shows portal status badge (Signed Up / Not Signed Up)
- TC-contacts-tab: Contacts tab shows unified table with all contacts
- TC-daily-activities-delete-inline-confirm: Delete button shows inline Yes/No confirm
- TC-daily-activities-delete-no-cancel: Clicking No cancels delete confirm
- TC-daily-activities-edit-button: Admin sees edit button on each activity row
- TC-daily-activities-edit-modal-cancel: Cancel closes edit modal without saving
- TC-daily-activities-edit-modal-opens: Clicking edit opens edit activity modal
- TC-daily-activities-inline: daily activities tab shows inline feed (not navigate away)
- TC-daily-activities-parent-no-edit: Parent cannot see edit/delete buttons
- TC-documents-tab: Documents tab renders without navigating away
- TC-emergency-contacts-add: Add emergency contact inline form works
- TC-emergency-contacts-editable: Contacts tab shows Emergency Contacts with Edit/Delete
- TC-imm-settings-button: Immunization settings gear button visible
- TC-imm-settings-cancel: Cancel closes the settings modal
- TC-imm-settings-modal: Clicking opens modal with checkboxes
- TC-immunizations-custom-add: Add record button opens inline form
- TC-immunizations-custom-section: Custom Vaccines section heading is visible
- TC-immunizations-custom-validation: Add Record requires vaccine name
- TC-immunizations-delete: admin sees delete button on existing dose records
- TC-immunizations-edit-dates: admin sees editable date inputs on immunizations
- TC-immunizations-exempt: admin can toggle Exempt checkbox on vaccine
- TC-immunizations-skip: admin sees Skip checkbox per dose
- TC-immunizations-tab: Immunizations tab shows CDC vaccine grid
- TC-parent-immunizations-edit: parent can edit immunization dates
- TC-parent-no-financial: parent cannot see Financial details section
- TC-parent-profile-edit: parent can see Edit on personal info
- TC-profile-edit-cancel: Cancel restores read-only view
- TC-profile-edit-personal: clicking Edit on Personal info shows input fields
- TC-profile-tab-edit-button: admin sees Edit buttons on profile sections
- TC-profile-tab-personal-info: Profile tab shows personal information section
- TC-room-add-activity-food-form: Selecting Food opens food-specific form
- TC-room-add-activity-picker: Add Activity button opens 12-type selector
- TC-room-add-student-modal: Add Student button opens assignment modal
- TC-room-no-parents-tab: Parents tab is NOT present in room detail
- TC-room-settings-modal: Room settings gear opens modal with fields
- TC-rooms-section-edit: admin can edit room assignment via dropdown
- TC-student-list: /students page loads with heading and table
- TC-student-profile: profile page loads with all 5 tabs


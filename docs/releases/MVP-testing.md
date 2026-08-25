# MVP Testing — JsDayCare

**Total: 60 automated Playwright tests (all passing)**
Run: `npm run test:e2e`
Personas: admin / teacher / parent — credentials in `.notes`

---

## Auth (2 tests)
| TC | Description |
|---|---|
| TC-admin-login | Navigates to /login, logs in, lands on /home dashboard |
| TC-wrong-password | Wrong password shows error, stays on /login |

---

## Dashboard / Home (3 tests)
| TC | Description |
|---|---|
| TC-home-loads | /home shows today's stats section (Checked In Today etc.) |
| TC-room-ratios | Current Room Ratios section visible |
| TC-compliance-alerts | Compliance Alerts section visible |

---

## Navigation — Admin (13 tests)
| TC | Description |
|---|---|
| TC-sidebar-home | Home link navigates to /home |
| TC-sidebar-myschool | My School section expands with all sub-links |
| TC-nav-students | Students link → /students |
| TC-nav-parents | Parents link → /parents |
| TC-nav-rooms | Rooms link → /rooms |
| TC-nav-calendar | Calendar link → /calendar |
| TC-nav-schedules | Schedules link → /schedule |
| TC-nav-menus | Menus link → /menus |
| TC-nav-settings | Settings link → /settings |
| TC-nav-staff | Staff & Payroll link → /staff |
| TC-nav-admissions | Admissions link → /admissions |
| TC-nav-paperwork | Paperwork link → /paperwork |
| TC-nav-reporting | Reporting link → /reporting |

---

## Navigation — Teacher persona (3 tests)
| TC | Description |
|---|---|
| TC-teacher-home | Teacher lands on /home after login |
| TC-teacher-sees-students | Teacher can navigate to /students |
| TC-teacher-sees-rooms | Teacher can navigate to /rooms |

---

## Navigation — Parent persona (4 tests)
| TC | Description |
|---|---|
| TC-parent-redirected | Parent is redirected to /parent portal after login |
| TC-parent-sees-child | Parent portal shows their child's name (Adrith) |
| TC-parent-no-admin | Parent cannot access /home (redirected away) |
| TC-parent-no-students | Parent cannot access /students (redirected away) |

---

## Rooms (3 tests)
| TC | Description |
|---|---|
| TC-room-list | /rooms loads with heading and New Room button |
| TC-room-detail | Room detail shows Students, Parents, Feed tabs |
| TC-checkin-buttons | Room Students tab has Check In and Mark Absent buttons |

---

## Students — List & Form (2 tests)
| TC | Description |
|---|---|
| TC-student-list | /students loads with heading and table |
| TC-add-student-form | Add Student form shows Name and DOB fields |

---

## Student Profile — Tabs & Navigation (3 tests)
| TC | Description |
|---|---|
| TC-student-profile | Profile page loads with all 5 tabs (Profile, Contacts, Immunizations, Daily Report, Documents) |
| TC-profile-tab-personal-info | Profile tab shows Personal information, Address, Enrollment details sections |
| TC-rooms-section-edit | Admin can edit room assignment via dropdown; Cancel restores read-only |

---

## Student Profile — Editing (3 tests)
| TC | Description |
|---|---|
| TC-profile-tab-edit-button | Admin sees Edit buttons on profile sections |
| TC-profile-edit-personal | Clicking Edit on Personal info reveals input fields + Save/Cancel |
| TC-profile-edit-cancel | Cancel restores read-only view without saving |

---

## Student Profile — Contacts Tab (9 tests)
| TC | Description |
|---|---|
| TC-contacts-tab | Contacts tab shows unified table with all contacts |
| TC-contacts-checkin-code-all | Check-in code Reveal/Hide button visible for all contacts (admin) |
| TC-contacts-pin-reveal | Clicking Reveal shows PIN digits; button changes to Hide |
| TC-contacts-add-contact-modal | Add contact button opens ContactModal |
| TC-contacts-add-contact-cancel | Cancel closes the modal |
| TC-contacts-add-contact-validation | Add Contact requires name (validation error shown) |
| TC-contacts-add-pickup-modal | Add pickup button opens modal with pickup authorization dates |
| TC-contacts-photo-upload | Contact modal has Profile photo upload section |
| TC-contacts-send-invite | Send invite → link shown for contacts without portal access |

---

## Student Profile — Emergency Contacts (2 tests)
| TC | Description |
|---|---|
| TC-emergency-contacts-editable | Emergency Contacts section shows Edit and Delete buttons (admin) |
| TC-emergency-contacts-add | Add emergency contact inline form appears and Cancel works |

---

## Student Profile — Immunizations (7 tests)
| TC | Description |
|---|---|
| TC-immunizations-tab | Immunizations tab shows CDC vaccine grid with Hep B, DTaP, CDC schedule row |
| TC-immunizations-edit-dates | Admin/parent sees date input fields per dose |
| TC-immunizations-skip | Skip checkbox visible per dose |
| TC-immunizations-exempt | Exempt checkbox visible on vaccine header |
| TC-immunizations-delete | Delete button visible on existing dose records |
| TC-immunizations-custom-section | Custom / Additional Vaccines section heading visible |
| TC-immunizations-custom-add | Add record button opens inline form with vaccine name field |
| TC-immunizations-custom-validation | Add Record without name shows validation error |

---

## Student Profile — Daily Report & Documents (2 tests)
| TC | Description |
|---|---|
| TC-daily-report-inline | Daily Report tab renders inline (date picker appears, URL unchanged) |
| TC-documents-tab | Documents tab renders without navigating away; shows link to Paperwork |

---

## Student Profile — Parent Persona Access (3 tests)
| TC | Description |
|---|---|
| TC-parent-profile-edit | Parent can see Edit buttons on Personal info and Address |
| TC-parent-no-financial | Parent cannot see Financial details section |
| TC-parent-immunizations-edit | Parent sees editable date inputs on immunizations |

---

## Coverage notes
- All 60 tests run against live Supabase data (seeded via `npm run seed`)
- 3 personas tested: admin, teacher, parent
- Flaky auth tests retry up to 2× automatically (configured in playwright.config.ts)
- Pre-push hook runs all 60 before every `git push`

# MVP Testing — DayCarePortal

**Total: 147 Playwright tests across 10 spec files**
Run: `npm run test:e2e`
Personas: portal admin / admin / teacher / parent — credentials in `.notes`

| File | Tests | Area |
|---|---|---|
| auth.spec.ts | 2 | Login + wrong password |
| dashboard.spec.ts | 4 | Home page stats/ratios/alerts |
| navigation.spec.ts | 28 | All nav links, 3 personas, school name, settings |
| rooms.spec.ts | 4 | Room list, detail, check-in |
| students.spec.ts | 51 | Full student profile — all tabs, contacts, immunizations, rooms |
| schedules.spec.ts | 14 | Grid, dialogs, week nav |
| calendar.spec.ts | 10 | Holiday calendar, operating hours, policies |
| menus.spec.ts | 11 | Weekly menu, food library, role-based tabs |
| portal.spec.ts | 11 | Portal admin dashboard, schools, invite |
| registration.spec.ts | 12 | Register page, invite link, multi-school admin |

---

## Auth (2)
| TC | Description |
|---|---|
| TC-admin-login | Login as admin, lands on /home dashboard |
| TC-wrong-password | Wrong password shows error, stays on /login |

---

## Dashboard (3)
| TC | Description |
|---|---|
| TC-home-loads | /home shows today's stats (Checked In Today etc.) |
| TC-room-ratios | Current Room Ratios section visible |
| TC-compliance-alerts | Compliance Alerts section visible |

---

## Navigation — Admin (14)
| TC | Description |
|---|---|
| TC-sidebar-home | Home link navigates to /home |
| TC-sidebar-myschool | My School section expands showing all sub-links |
| TC-sidebar-school-name | Sidebar shows actual school name (not "My School") |
| TC-nav-students | → /students |
| TC-nav-parents | Parents link removed (contacts managed per-student) |
| TC-nav-rooms | → /rooms |
| TC-nav-calendar | → /calendar |
| TC-nav-schedules | → /schedule |
| TC-nav-menus | → /menus |
| TC-nav-settings | → /settings |
| TC-nav-staff | → /staff |
| TC-nav-admissions | → /admissions |
| TC-nav-paperwork | → /paperwork |
| TC-nav-reporting | → /reporting |

---

## Settings (1)
| TC | Description |
|---|---|
| TC-settings-school-name-change | Rename school → students still accessible (UUID preserved), name restored |

---

## Navigation — Teacher persona (3)
| TC | Description |
|---|---|
| TC-teacher-home | Teacher lands on /home after login |
| TC-teacher-sees-students | Teacher can navigate to /students |
| TC-teacher-sees-rooms | Teacher can navigate to /rooms |

---

## Navigation — Parent persona (4)
| TC | Description |
|---|---|
| TC-parent-redirected | Parent redirected to /parent portal after login |
| TC-parent-sees-child | Parent portal shows their child's name (Adrith) |
| TC-parent-no-admin | Parent cannot access /home |
| TC-parent-no-students | Parent cannot access /students |

---

## Rooms (6)
| TC | Description |
|---|---|
| TC-room-list | /rooms loads with heading and New Room button |
| TC-room-detail | Room detail shows Students and Feed tabs (no Parents tab) |
| TC-checkin-buttons | Room Students tab has Check In and Mark Absent buttons |
| TC-room-settings-modal | Room settings gear opens modal with name/capacity/ratio/delete |
| TC-room-add-activity-picker | + Add Activity opens 12-type selector grid |
| TC-room-add-activity-food-form | Selecting Food opens food-specific form (type, quantity, meal) |
| TC-room-add-student-modal | + Add Student opens assignment modal |
| TC-room-no-parents-tab | Parents tab is NOT present in room detail |

---

## Students — List & Form (2)
| TC | Description |
|---|---|
| TC-student-list | /students loads with heading and table |
| TC-add-student-form | Add Student form shows Name and DOB fields |

---

## Student Profile — Tabs (3)
| TC | Description |
|---|---|
| TC-student-profile | Profile page loads with all 5 tabs |
| TC-profile-tab-personal-info | Profile tab shows Personal info, Address, Enrollment details |
| TC-rooms-section-edit | Admin can edit room assignment via dropdown |

---

## Student Profile — Editing (3)
| TC | Description |
|---|---|
| TC-profile-tab-edit-button | Admin sees Edit buttons on profile sections |
| TC-profile-edit-personal | Clicking Edit reveals input fields + Save/Cancel |
| TC-profile-edit-cancel | Cancel restores read-only view |

---

## Student Profile — Contacts (9)
| TC | Description |
|---|---|
| TC-contacts-tab | Contacts tab shows unified table |
| TC-contacts-checkin-code-all | Check-in code Reveal/Hide visible for all contacts (admin) |
| TC-contacts-pin-reveal | Clicking Reveal shows PIN, button changes to Hide |
| TC-contacts-add-contact-modal | Add contact button opens ContactModal |
| TC-contacts-add-contact-cancel | Cancel closes the modal |
| TC-contacts-add-contact-validation | Add Contact requires name (validation error) |
| TC-contacts-add-pickup-modal | Add pickup opens modal with pickup date fields |
| TC-contacts-send-invite | Send invite link shown for contacts without portal |
| TC-contacts-photo-upload | Contact modal has photo upload section |
| TC-contact-no-pin-field | Add contact modal does NOT have a PIN field (auto-generated) |
| TC-contact-expanded-types | Type dropdown has 8 options incl. Grandparent, Babysitter, Nanny |

---

## Student Profile — Emergency Contacts (2)
| TC | Description |
|---|---|
| TC-emergency-contacts-editable | Emergency Contacts section has Edit/Delete buttons |
| TC-emergency-contacts-add | Add emergency contact inline form + Cancel works |

---

## Student Profile — Immunizations (8)
| TC | Description |
|---|---|
| TC-immunizations-tab | CDC vaccine grid visible (Hep B, DTaP, CDC schedule row) |
| TC-immunizations-edit-dates | Admin/parent sees date inputs per dose |
| TC-immunizations-skip | Skip checkbox per dose visible |
| TC-immunizations-exempt | Exempt checkbox on vaccine header |
| TC-immunizations-delete | Delete button on existing dose records |
| TC-immunizations-custom-section | Custom / Additional Vaccines section heading visible |
| TC-immunizations-custom-add | Add record button opens inline form |
| TC-immunizations-custom-validation | Add Record without name shows validation error |
| TC-imm-settings-button | Immunization Settings gear button visible |
| TC-imm-settings-modal | Clicking opens modal with 11 CDC vaccine checkboxes |
| TC-imm-settings-cancel | Cancel closes the settings modal |

---

## Student Profile — Daily Report & Documents (2)
| TC | Description |
|---|---|
| TC-daily-report-inline | Daily Report tab renders inline (URL unchanged, date picker visible) |
| TC-documents-tab | Documents tab renders without navigating away |

---

## Student Profile — Parent Persona (3)
| TC | Description |
|---|---|
| TC-parent-profile-edit | Parent sees Edit on personal info |
| TC-parent-no-financial | Parent cannot see Financial details |
| TC-parent-immunizations-edit | Parent sees editable date inputs on immunizations |

---

## Schedules (11)
| TC | Description |
|---|---|
| TC-schedules-loads | Page loads with Staff Schedules and Student Schedules grids |
| TC-schedules-staff-rows | Staff members appear as rows (Jaya Bijjala, Nidhi Patel) |
| TC-schedules-student-rows | Active students appear as rows |
| TC-schedules-week-nav | Today link and week header visible |
| TC-schedules-today-link | Today link visible |
| TC-schedules-room-filter | Room filter dropdown visible |
| TC-schedules-staff-dialog | + Staff schedule opens dialog |
| TC-schedules-staff-dialog-fields | Dialog has Room, Repeats every week, Days of week fields |
| TC-schedules-staff-day-pills | Day-of-week pill toggles (Su Mo Tu We Th Fr Sa) visible |
| TC-schedules-staff-dialog-cancel | Cancel closes the dialog |
| TC-schedules-student-dialog | + Student schedule opens dialog |
| TC-schedules-student-dialog-cancel | Cancel closes student dialog |

---

## Portal Admin (10)
| TC | Description |
|---|---|
| TC-portal-login | portal@daycareportal.com logs in → /portal |
| TC-portal-no-sidebar | Portal admin page has no school sidebar |
| TC-portal-schools-table | Schools table shows at least 1 school |
| TC-portal-stats | Dashboard shows Total schools stat |
| TC-portal-create-school | + Create school button opens modal |
| TC-portal-manage-school | Manage link opens school detail panel |
| TC-portal-assign-panel | Manage panel has assign input + Assign button |
| TC-portal-assign-known-email | Assigning known email (admin@jsdaycare.com) succeeds |
| TC-portal-blocked-from-home | Portal admin cannot access /home |
| TC-portal-blocked-from-students | Portal admin cannot access /students |

---

## Coverage notes
- Tests run against live Supabase data (seeded via `npm run seed`)
- 4 personas: portal admin, school admin, teacher, parent
- Student IDs are stable across resets (fixed UUIDs in seed)
- Retries: 2× on flaky auth tests
- Pre-push hook runs all tests before every `git push`

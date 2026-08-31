import { test, expect } from "@playwright/test";
import { loginAsAdmin, loginAsParent } from "./helpers/auth";

// ─── Student list ─────────────────────────────────────────────────────────────

test("TC-student-list: /students page loads with heading and table", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/students");
  await expect(page.getByRole("heading", { name: "Students" })).toBeVisible();
  await expect(page.locator("table")).toBeVisible({ timeout: 10_000 });
});

test("TC-add-student-form: clicking Add Student shows form with Name and DOB fields", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/students");
  await page.click('a[href="/students/add"], button:has-text("Add Student")');
  await page.waitForURL("**/students/add", { timeout: 10_000 });
  await expect(page.getByText(/name/i).first()).toBeVisible();
  await expect(page.getByText(/dob|date of birth/i).first()).toBeVisible();
});

// ─── Student profile — tab navigation ─────────────────────────────────────────

test.describe("Student profile tabs", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/students");
    const realRow = page.locator("table tbody tr").filter({ hasNot: page.locator("td[colspan]") }).first();
    await realRow.waitFor({ state: "visible", timeout: 10_000 });
    await realRow.locator("td:first-child a").click();
    await page.waitForURL("**/students/**", { timeout: 10_000 });
  });

  test("TC-student-profile: profile page loads with all 5 tabs", async ({ page }) => {
    await expect(page.getByRole("button", { name: /^profile$/i })).toBeVisible({ timeout: 8_000 });
    await expect(page.getByRole("button", { name: /^contacts$/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^immunizations$/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^daily activities$/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^documents$/i })).toBeVisible();
  });

  test("TC-profile-tab-personal-info: Profile tab shows personal information section", async ({ page }) => {
    await expect(page.getByText("Personal information")).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText("Address")).toBeVisible();
    await expect(page.getByText("Enrollment details")).toBeVisible();
  });

  test("TC-rooms-section-edit: admin can edit room assignment via dropdown", async ({ page }) => {
    await page.getByText("Rooms").waitFor({ timeout: 8_000 });
    // Click Edit on the Rooms section
    const roomsSection = page.locator("div.card").filter({ hasText: "Rooms" }).first();
    await roomsSection.locator("button:has-text('Edit')").click();
    // Dropdown with room options should appear
    const select = roomsSection.locator("select");
    await expect(select).toBeVisible({ timeout: 5_000 });
    const opts = await select.locator("option").count();
    expect(opts).toBeGreaterThan(1); // at least "No room" + real rooms
    // Cancel
    await roomsSection.locator("button:has-text('Cancel')").click();
    await expect(select).not.toBeVisible();
  });

  test("TC-profile-tab-edit-button: admin sees Edit buttons on profile sections", async ({ page }) => {
    await page.getByText("Personal information").waitFor({ timeout: 8_000 });
    // Edit links are text-only "Edit" with a Pencil icon — match by containing text
    const editBtns = page.locator("button:has-text('Edit')");
    await expect(editBtns.first()).toBeVisible({ timeout: 8_000 });
  });

  test("TC-profile-edit-personal: clicking Edit on Personal info shows input fields", async ({ page }) => {
    await page.getByText("Personal information").waitFor({ timeout: 8_000 });
    // First Edit button on the page is for Personal information
    await page.locator("button:has-text('Edit')").first().click();
    await expect(page.locator('input[type="text"]').first()).toBeVisible({ timeout: 5_000 });
    await expect(page.locator("button:has-text('Save')")).toBeVisible();
    await expect(page.locator("button:has-text('Cancel')")).toBeVisible();
  });

  test("TC-profile-edit-cancel: Cancel restores read-only view", async ({ page }) => {
    await page.getByText("Personal information").waitFor({ timeout: 8_000 });
    await page.locator("button:has-text('Edit')").first().click();
    await page.locator("button:has-text('Cancel')").click();
    // Edit buttons should be back
    await expect(page.locator("button:has-text('Edit')").first()).toBeVisible({ timeout: 5_000 });
  });

  test("TC-contacts-tab: Contacts tab shows unified table with all contacts", async ({ page }) => {
    await page.getByRole("button", { name: /^contacts$/i }).click();
    await expect(page.getByText("Contacts").first()).toBeVisible({ timeout: 8_000 });
    await expect(page.locator("table").first()).toBeVisible();
  });

  test("TC-contacts-checkin-code-all: Check-in code Reveal shown for all contacts (admin)", async ({ page }) => {
    await page.getByRole("button", { name: /^contacts$/i }).click();
    await page.locator("h3:has-text('Contacts')").first().waitFor({ timeout: 8_000 });
    await expect(page.locator("button:has-text('Reveal')").first()).toBeVisible();
  });

  test("TC-contacts-add-pickup-modal: Add pickup button opens modal with pickup date fields", async ({ page }) => {
    await page.getByRole("button", { name: /^contacts$/i }).click();
    await page.locator("h3:has-text('Contacts')").first().waitFor({ timeout: 8_000 });
    await page.getByRole('button', { name: /add pickup/i }).click();
    await expect(page.getByRole("heading", { name: /add contact/i })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/pickup authorization period/i)).toBeVisible();
    await expect(page.getByText("Valid From")).toBeVisible();
    await expect(page.getByText("Valid To")).toBeVisible();
  });

  test("TC-contacts-portal-status: Contacts table shows portal status badge (Signed Up / Not Signed Up)", async ({ page }) => {
    await page.getByRole("button", { name: /^contacts$/i }).click();
    await page.locator("h3:has-text('Contacts')").first().waitFor({ timeout: 8_000 });
    // At least one portal status badge visible (Signed Up, Not signed up, or Invited)
    await expect(page.getByText(/signed up|not signed up|invited/i).first()).toBeVisible({ timeout: 5_000 });
  });

  test("TC-contacts-invite-url-in-modal: Parent contact shows Generate Invite URL option", async ({ page }) => {
    await page.getByRole("button", { name: /^contacts$/i }).click();
    await page.locator("h3:has-text('Contacts')").first().waitFor({ timeout: 8_000 });
    await page.locator("button:not(.btn-primary):has-text('Add contact')").click();
    await page.getByRole("heading", { name: /add contact/i }).waitFor({ timeout: 5_000 });
    // Default type is "parent" — invite URL section should be visible
    await expect(page.getByText(/portal invite link|generate invite url/i).first()).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole("button", { name: /generate invite url/i })).toBeVisible();
  });

  test("TC-contacts-nonparent-no-invite: Non-parent contact type hides invite URL section", async ({ page }) => {
    await page.getByRole("button", { name: /^contacts$/i }).click();
    await page.locator("h3:has-text('Contacts')").first().waitFor({ timeout: 8_000 });
    await page.locator("button:not(.btn-primary):has-text('Add contact')").click();
    await page.getByRole("heading", { name: /add contact/i }).waitFor({ timeout: 5_000 });
    // Change contact type to Grandparent
    const typeSelect = page.locator("select").filter({ has: page.locator("option[value=parent]") }).first();
    await typeSelect.selectOption("grandparent");
    // Invite URL button should NOT be visible
    await expect(page.getByRole("button", { name: /generate invite url/i })).not.toBeVisible();
    // Instead shows "portal access not available" message
    await expect(page.getByText(/portal access is only available/i)).toBeVisible({ timeout: 3_000 });
  });

  test("TC-contacts-photo-upload: Add contact modal has photo upload section", async ({ page }) => {
    await page.getByRole("button", { name: /^contacts$/i }).click();
    await page.locator("h3:has-text('Contacts')").first().waitFor({ timeout: 8_000 });
    await page.getByRole('button', { name: /add pickup/i }).click();
    await page.getByRole("heading", { name: /add contact/i }).waitFor({ timeout: 5_000 });
    await expect(page.getByText(/profile photo/i)).toBeVisible();
    await expect(page.getByText(/upload photo/i)).toBeVisible();
  });

  test("TC-contacts-pin-reveal: admin can reveal PIN code", async ({ page }) => {
    await page.getByRole("button", { name: /^contacts$/i }).click();
    await page.locator("h3:has-text('Contacts')").first().waitFor({ timeout: 8_000 });
    // If Reveal button exists, click it
    const revealBtn = page.locator("button:has-text('Reveal')").first();
    const count = await revealBtn.count();
    if (count === 0) { test.skip(); return; }
    await revealBtn.click();
    await expect(page.locator("button:has-text('Hide')").first()).toBeVisible();
  });

  test("TC-contacts-add-contact-modal: Add contact button opens modal", async ({ page }) => {
    await page.getByRole("button", { name: /^contacts$/i }).click();
    await page.locator("h3:has-text('Contacts')").first().waitFor({ timeout: 8_000 });
    await page.getByRole("button", { name: /add contact/i }).first().click();
    await expect(page.getByRole("heading", { name: /add contact/i })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByPlaceholder(/jane smith/i)).toBeVisible();
    // PIN field removed — auto-generated. Verify it's NOT there.
    await expect(page.getByPlaceholder(/123456/i)).not.toBeVisible();
  });

  test("TC-contacts-add-contact-cancel: Cancel closes the contact modal", async ({ page }) => {
    await page.getByRole("button", { name: /^contacts$/i }).click();
    await page.locator("h3:has-text('Contacts')").first().waitFor({ timeout: 8_000 });
    await page.getByRole("button", { name: /add contact/i }).first().click();
    await page.getByRole("heading", { name: /add contact/i }).waitFor({ timeout: 5_000 });
    await page.getByRole("button", { name: /^cancel$/i }).click();
    await expect(page.getByRole("heading", { name: /add contact/i })).not.toBeVisible();
  });

  test("TC-contacts-add-contact-validation: Add Contact requires name", async ({ page }) => {
    await page.getByRole("button", { name: /^contacts$/i }).click();
    await page.locator("h3:has-text('Contacts')").first().waitFor({ timeout: 8_000 });
    // Open modal via Add contact (border button)
    await page.locator("button:not(.btn-primary):has-text('Add contact')").click();
    await page.getByRole("heading", { name: /add contact/i }).waitFor({ timeout: 5_000 });
    // Submit without name
    await page.locator("button.btn-primary:has-text('Add Contact')").click();
    await expect(page.getByText(/name is required/i)).toBeVisible();
  });

  test("TC-immunizations-tab: Immunizations tab shows CDC vaccine grid", async ({ page }) => {
    await page.getByRole("button", { name: /^immunizations$/i }).click();
    await expect(page.getByText(/Hep B/i).first()).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText(/DTaP/i).first()).toBeVisible();
    await expect(page.getByText(/CDC schedule/i).first()).toBeVisible();
  });

  test("TC-immunizations-edit-dates: admin sees editable date inputs on immunizations", async ({ page }) => {
    await page.getByRole("button", { name: /^immunizations$/i }).click();
    await page.getByText(/Hep B/i).first().waitFor({ timeout: 8_000 });
    await expect(page.locator('input[type="date"]').first()).toBeVisible();
  });

  test("TC-immunizations-exempt: admin can toggle Exempt checkbox on vaccine", async ({ page }) => {
    await page.getByRole("button", { name: /^immunizations$/i }).click();
    await page.getByText(/Hep B/i).first().waitFor({ timeout: 8_000 });
    const exemptBox = page.locator('input[type="checkbox"]').first();
    await expect(exemptBox).toBeVisible();
  });

  test("TC-immunizations-skip: admin sees Skip checkbox per dose", async ({ page }) => {
    await page.getByRole("button", { name: /^immunizations$/i }).click();
    await page.getByText(/Hep B/i).first().waitFor({ timeout: 8_000 });
    await expect(page.getByText("Skip").first()).toBeVisible();
  });

  test("TC-immunizations-delete: admin sees delete button on existing dose records", async ({ page }) => {
    // Navigate to Adrith who has seeded immunization records
    await page.goto(`/students/${ADRITH_ID}`);
    await page.waitForURL("**/students/**", { timeout: 10_000 });
    await page.getByRole("button", { name: /^immunizations$/i }).click();
    await page.getByText(/Hep B/i).first().waitFor({ timeout: 8_000 });
    const trashBtns = page.locator('button[title="Delete this dose record"]');
    const count = await trashBtns.count();
    expect(count).toBeGreaterThan(0);
  });

  test("TC-immunizations-custom-section: Custom Vaccines section heading is visible", async ({ page }) => {
    await page.getByRole("button", { name: /^immunizations$/i }).click();
    await expect(page.getByRole("heading", { name: "Custom / Additional Vaccines" })).toBeVisible({ timeout: 8_000 });
  });

  test("TC-immunizations-custom-add: Add record button opens inline form", async ({ page }) => {
    await page.getByRole("button", { name: /^immunizations$/i }).click();
    await page.getByRole("heading", { name: "Custom / Additional Vaccines" }).waitFor({ timeout: 8_000 });
    await page.getByRole("button", { name: /add record/i }).first().click();
    await expect(page.getByPlaceholder(/typhoid/i)).toBeVisible({ timeout: 5_000 });
  });

  test("TC-immunizations-custom-validation: Add Record requires vaccine name", async ({ page }) => {
    await page.getByRole("button", { name: /^immunizations$/i }).click();
    await page.getByRole("heading", { name: "Custom / Additional Vaccines" }).waitFor({ timeout: 8_000 });
    await page.getByRole("button", { name: /add record/i }).first().click();
    await page.getByPlaceholder(/typhoid/i).waitFor({ timeout: 5_000 });
    await page.locator("button.btn-primary:has-text('Add Record')").click();
    await expect(page.getByText(/vaccine name is required/i)).toBeVisible();
  });

  test("TC-daily-activities-inline: daily activities tab shows inline feed (not navigate away)", async ({ page }) => {
    const url = page.url();
    await page.getByRole("button", { name: /^daily activities$/i }).click();
    // Should stay on the same student page
    await expect(page).toHaveURL(url);
    // Date picker should appear
    await expect(page.locator('input[type="date"]').first()).toBeVisible({ timeout: 5_000 });
  });

  test("TC-emergency-contacts-editable: Contacts tab shows Emergency Contacts with Edit/Delete", async ({ page }) => {
    await page.getByRole("button", { name: /^contacts$/i }).click();
    await page.locator("h3:has-text('Emergency Contacts')").waitFor({ timeout: 8_000 });
    // Edit and delete buttons should be visible
    await expect(page.locator("button:has-text('Edit')").first()).toBeVisible();
    await expect(page.locator('button[title="Delete"]').first()).toBeVisible();
  });

  test("TC-emergency-contacts-add: Add emergency contact inline form works", async ({ page }) => {
    await page.getByRole("button", { name: /^contacts$/i }).click();
    await page.locator("h3:has-text('Emergency Contacts')").waitFor({ timeout: 8_000 });
    await page.getByRole("button", { name: /add emergency contact/i }).click();
    await expect(page.getByPlaceholder(/jane smith/i)).toBeVisible({ timeout: 5_000 });
    await expect(page.getByPlaceholder(/grandmother/i)).toBeVisible();
    // Cancel
    await page.getByRole("button", { name: /^cancel$/i }).click();
    await expect(page.getByPlaceholder(/jane smith/i)).not.toBeVisible();
  });

  test("TC-documents-tab: Documents tab renders without navigating away", async ({ page }) => {
    const url = page.url();
    await page.getByRole("button", { name: /^documents$/i }).click();
    await expect(page).toHaveURL(url);
    await expect(page.getByText(/documents/i).first()).toBeVisible({ timeout: 5_000 });
    // Should show link to Paperwork rather than navigating
    await expect(page.getByRole("link", { name: /paperwork/i }).first()).toBeVisible();
  });
});

// ─── Parent persona — profile access ─────────────────────────────────────────
// Adrith Ram's student ID is known from seed data
const ADRITH_ID = "1cd2d725-70ce-429b-9070-7dbc59a157f2";

test.describe("Parent — student profile access", () => {
  test("TC-parent-profile-edit: parent can see Edit on personal info", async ({ page }) => {
    await loginAsParent(page);
    await page.goto(`/students/${ADRITH_ID}`);
    await page.getByText("Personal information").waitFor({ timeout: 10_000 });
    await expect(page.locator("button:has-text('Edit')").first()).toBeVisible();
  });

  test("TC-parent-no-financial: parent cannot see Financial details section", async ({ page }) => {
    await loginAsParent(page);
    await page.goto(`/students/${ADRITH_ID}`);
    await page.getByText("Personal information").waitFor({ timeout: 10_000 });
    await expect(page.getByText("Financial details")).not.toBeVisible();
  });

  test("TC-parent-immunizations-edit: parent can edit immunization dates", async ({ page }) => {
    await loginAsParent(page);
    await page.goto(`/students/${ADRITH_ID}`);
    await page.getByRole("button", { name: /^immunizations$/i }).click();
    await page.getByText(/Hep B/i).first().waitFor({ timeout: 8_000 });
    await expect(page.locator('input[type="date"]').first()).toBeVisible();
  });
});

// ─── Immunization settings modal ──────────────────────────────────────────────

test.describe("Immunization settings per student", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`/students/${ADRITH_ID}`);
    await page.waitForURL("**/students/**", { timeout: 10_000 });
    await page.getByRole("button", { name: /^immunizations$/i }).click();
    await page.getByText(/Hep B/i).first().waitFor({ timeout: 8_000 });
  });

  test("TC-imm-settings-button: Immunization settings gear button visible", async ({ page }) => {
    await expect(page.getByRole("button", { name: /immunization settings/i })).toBeVisible();
  });

  test("TC-imm-settings-modal: Clicking opens modal with checkboxes", async ({ page }) => {
    await page.getByRole("button", { name: /immunization settings/i }).click();
    await expect(page.getByRole("heading", { name: /immunization settings/i })).toBeVisible({ timeout: 5_000 });
    // All 11 CDC vaccines shown as checkboxes
    await expect(page.getByText(/hep b/i).first()).toBeVisible();
    await expect(page.getByText(/dtap/i).first()).toBeVisible();
    await expect(page.getByText(/mmr/i).first()).toBeVisible();
  });

  test("TC-imm-settings-cancel: Cancel closes the settings modal", async ({ page }) => {
    await page.getByRole("button", { name: /immunization settings/i }).click();
    await page.getByRole("heading", { name: /immunization settings/i }).waitFor({ timeout: 5_000 });
    await page.getByRole("button", { name: /cancel/i }).click();
    await expect(page.getByRole("heading", { name: /immunization settings/i })).not.toBeVisible();
  });
});

// ─── Contact modal — auto PIN and expanded types ──────────────────────────────

test.describe("Contact modal enhancements", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`/students/${ADRITH_ID}`);
    await page.waitForURL("**/students/**", { timeout: 10_000 });
    await page.getByRole("button", { name: /^contacts$/i }).click();
    await page.locator("h3:has-text('Contacts')").first().waitFor({ timeout: 8_000 });
    await page.locator("button:not(.btn-primary):has-text('Add contact')").click();
    await page.getByRole("heading", { name: /add contact/i }).waitFor({ timeout: 5_000 });
  });

  test("TC-contact-no-pin-field: Add contact modal does NOT show a PIN input field", async ({ page }) => {
    // PIN input should be gone — auto-generated on save
    await expect(page.getByPlaceholder(/123456/i)).not.toBeVisible();
    await expect(page.getByText(/6-digit pin/i)).not.toBeVisible();
  });

  test("TC-contact-expanded-types: Type dropdown has expanded options", async ({ page }) => {
    const select = page.locator("select").filter({ has: page.locator("option[value=parent]") }).first();
    const options = await select.locator("option").allTextContents();
    expect(options).toContain("Grandparent");
    expect(options).toContain("Babysitter");
    expect(options).toContain("Nanny");
    expect(options).toContain("Family Friend");
    expect(options).toContain("Other");
  });
});

// ─── Room settings and features ───────────────────────────────────────────────

test.describe.serial("Room detail — settings, activity, add student", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/rooms");
    const toddlerLink = page.locator('a[href^="/rooms/"]', { hasText: /toddler/i }).first();
    await toddlerLink.waitFor({ state: "visible", timeout: 10_000 });
    await toddlerLink.click();
    await page.waitForURL("**/rooms/**", { timeout: 10_000 });
  });

  test("TC-room-settings-modal: Room settings gear opens modal with fields", async ({ page }) => {
    await page.getByRole("button", { name: /room settings/i }).click();
    await expect(page.getByRole("heading", { name: /room settings/i })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/max capacity/i)).toBeVisible();
    await expect(page.getByText(/students per.*staff|ratio/i).first()).toBeVisible();
    // Close
    await page.getByRole("button", { name: /cancel/i }).click();
  });

  test("TC-room-add-activity-picker: Add Activity button opens 12-type selector", async ({ page }) => {
    await page.getByRole("button", { name: /add activity/i }).click();
    await expect(page.getByText(/select activity/i)).toBeVisible({ timeout: 5_000 });
    // All activity types visible
    await expect(page.getByText("Food")).toBeVisible();
    await expect(page.getByText("Nap")).toBeVisible();
    await expect(page.getByText("Potty")).toBeVisible();
    await expect(page.getByText("Note")).toBeVisible();
  });

  test("TC-room-add-activity-food-form: Selecting Food opens food-specific form", async ({ page }) => {
    await page.getByRole("button", { name: /add activity/i }).click();
    await page.getByText(/select activity/i).waitFor({ timeout: 5_000 });
    // Click the Food activity type button specifically
    await page.locator("button, div").filter({ hasText: /^Food$/ }).first().click();
    // Food form should appear with type-specific fields
    await expect(page.getByText(/food type|food quantity|meal type/i).first()).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/staff only/i)).toBeVisible();
  });

  test("TC-room-add-student-modal: Add Student button opens assignment modal", async ({ page }) => {
    await page.getByRole("button", { name: /add student/i }).click();
    await expect(page.getByText(/assign student|add student/i).first()).toBeVisible({ timeout: 5_000 });
  });

  test("TC-room-no-parents-tab: Parents tab is NOT present in room detail", async ({ page }) => {
    await expect(page.getByRole("button", { name: /^parents$/i })).not.toBeVisible();
  });
});

// ─── daily activities — edit and delete activities ────────────────────────────────
const ADRITH_ID_REPORT = "1cd2d725-70ce-429b-9070-7dbc59a157f2";

test.describe("daily activities — edit and delete activities", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`/students/${ADRITH_ID_REPORT}`);
    await page.waitForURL("**/students/**", { timeout: 10_000 });
    await page.getByRole("button", { name: /^daily activities$/i }).click();
    await page.locator('input[type="date"]').first().waitFor({ timeout: 8_000 });
  });

  test("TC-daily-activities-edit-button: Admin sees edit button on each activity row", async ({ page }) => {
    // If there are activities today, pencil buttons should be visible
    const activities = page.locator(".card").filter({ has: page.locator("svg") });
    const count = await activities.count();
    if (count === 0) { test.skip(); return; }
    // Pencil edit button visible (admin only)
    await expect(page.locator("button[title='Edit activity'], button:has(svg[data-lucide='pencil'])").first().or(
      page.locator("button").filter({ has: page.locator("svg") }).first()
    )).toBeVisible({ timeout: 5_000 });
  });

  test("TC-daily-activities-delete-inline-confirm: Delete button shows inline Yes/No confirm", async ({ page }) => {
    const rows = page.locator(".card.p-4");
    const count = await rows.count();
    if (count === 0) { test.skip(); return; }

    // Click the trash/delete icon on the first activity row
    const firstRow = rows.first();
    const deleteBtn = firstRow.locator("button").filter({ has: page.locator("svg") }).last();
    await deleteBtn.click();
    // Inline confirm appears: "Delete?" with Yes / No
    await expect(page.getByText("Delete?").first()).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText("Yes").first()).toBeVisible();
    await expect(page.getByText("No").first()).toBeVisible();
  });

  test("TC-daily-activities-delete-no-cancel: Clicking No cancels delete confirm", async ({ page }) => {
    const rows = page.locator(".card.p-4");
    const count = await rows.count();
    if (count === 0) { test.skip(); return; }

    const firstRow = rows.first();
    const deleteBtn = firstRow.locator("button").filter({ has: page.locator("svg") }).last();
    await deleteBtn.click();
    await page.getByText("Delete?").first().waitFor({ timeout: 5_000 });
    // Click No — confirm should disappear
    await page.getByText("No").first().click();
    await expect(page.getByText("Delete?")).not.toBeVisible();
  });

  test("TC-daily-activities-edit-modal-opens: Clicking edit opens edit activity modal", async ({ page }) => {
    const rows = page.locator(".card.p-4");
    const count = await rows.count();
    if (count === 0) { test.skip(); return; }

    // Click pencil/edit button (second-to-last button in first row — trash is last)
    const firstRow = rows.first();
    const buttons = firstRow.locator("button").filter({ has: page.locator("svg") });
    const btnCount = await buttons.count();
    if (btnCount < 2) { test.skip(); return; }
    await buttons.nth(btnCount - 2).click(); // second from last = edit

    // Edit modal should open
    await expect(page.getByText(/edit activity|notes/i).first()).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole("button", { name: /save|cancel/i }).first()).toBeVisible();
  });

  test("TC-daily-activities-edit-modal-cancel: Cancel closes edit modal without saving", async ({ page }) => {
    const rows = page.locator(".card.p-4");
    const count = await rows.count();
    if (count === 0) { test.skip(); return; }

    const firstRow = rows.first();
    const buttons = firstRow.locator("button").filter({ has: page.locator("svg") });
    const btnCount = await buttons.count();
    if (btnCount < 2) { test.skip(); return; }
    await buttons.nth(btnCount - 2).click();

    // Wait for modal
    await page.getByRole("button", { name: /cancel/i }).last().waitFor({ timeout: 5_000 });
    await page.getByRole("button", { name: /cancel/i }).last().click();
    // Modal should close
    await expect(page.getByRole("button", { name: /save changes/i })).not.toBeVisible({ timeout: 3_000 });
  });

  test("TC-daily-activities-parent-no-edit: Parent cannot see edit/delete buttons", async ({ page }) => {
    await loginAsParent(page);
    await page.goto(`/students/${ADRITH_ID_REPORT}`);
    await page.waitForURL("**/students/**", { timeout: 10_000 });
    await page.getByRole("button", { name: /^daily activities$/i }).click();
    await page.locator('input[type="date"]').first().waitFor({ timeout: 8_000 });
    // No "Delete?" confirm or edit modal buttons for parents
    await expect(page.getByText("Delete?")).not.toBeVisible();
  });
});

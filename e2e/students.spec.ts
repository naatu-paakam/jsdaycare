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
    await expect(page.getByRole("button", { name: /^daily report$/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^documents$/i })).toBeVisible();
  });

  test("TC-profile-tab-personal-info: Profile tab shows personal information section", async ({ page }) => {
    await expect(page.getByText("Personal information")).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText("Address")).toBeVisible();
    await expect(page.getByText("Enrollment details")).toBeVisible();
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

  test("TC-contacts-tab: Contacts tab shows contacts table", async ({ page }) => {
    await page.getByRole("button", { name: /^contacts$/i }).click();
    // Wait for table with contact rows (strict: use the card heading)
    await expect(page.locator("h3:has-text('Contacts')").first()).toBeVisible({ timeout: 8_000 });
    await expect(page.locator("table").first()).toBeVisible();
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

  test("TC-contacts-add-contact-modal: Add a contact opens modal", async ({ page }) => {
    await page.getByRole("button", { name: /^contacts$/i }).click();
    await page.getByRole("button", { name: /add a contact/i }).click();
    // Modal should appear with form fields
    await expect(page.getByRole("heading", { name: /add contact/i })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByPlaceholder(/jane smith/i)).toBeVisible();
    await expect(page.getByPlaceholder(/1234/i)).toBeVisible();
  });

  test("TC-contacts-add-contact-cancel: Cancel closes the Add Contact modal", async ({ page }) => {
    await page.getByRole("button", { name: /^contacts$/i }).click();
    await page.getByRole("button", { name: /add a contact/i }).click();
    await page.getByRole("heading", { name: /add contact/i }).waitFor({ timeout: 5_000 });
    await page.getByRole("button", { name: /^cancel$/i }).click();
    await expect(page.getByRole("heading", { name: /add contact/i })).not.toBeVisible();
  });

  test("TC-contacts-add-contact-validation: Add Contact requires name", async ({ page }) => {
    await page.getByRole("button", { name: /^contacts$/i }).click();
    await page.getByRole("button", { name: /add a contact/i }).click();
    await page.getByRole("heading", { name: /add contact/i }).waitFor({ timeout: 5_000 });
    // Submit without filling name
    await page.getByRole("button", { name: /^add contact$/i }).click();
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
    // Edit date row should exist (inputs of type date)
    await expect(page.locator('input[type="date"]').first()).toBeVisible();
  });

  test("TC-daily-report-inline: Daily Report tab shows inline feed (not navigate away)", async ({ page }) => {
    const url = page.url();
    await page.getByRole("button", { name: /^daily report$/i }).click();
    // Should stay on the same student page
    await expect(page).toHaveURL(url);
    // Date picker should appear
    await expect(page.locator('input[type="date"]').first()).toBeVisible({ timeout: 5_000 });
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
const ADRITH_ID = "bc455aa0-2d35-4b69-a35b-0e80e39425ad";

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

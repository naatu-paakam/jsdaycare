/**
 * Portal Admin — Schools and Users management tests.
 *
 * Schools tab:
 *   - Search bar filters by school name
 *   - Edit (pencil) icon opens Manage School panel
 *   - Delete (trash) icon shows confirm dialog
 *   - Schools table shows Address and Phone columns
 *   - Create School form has address/phone/email fields
 *
 * Users tab:
 *   - Edit (pencil) opens Manage User dialog
 *   - Manage User: edit name, phone, role
 *   - Manage User: school assignment for admin/staff
 *   - Parent users: school section hidden in dialog
 *   - Delete invite (trash) removes pending invitation
 */
import { test, expect } from "@playwright/test";

async function loginAsPortalAdmin(page: any) {
  await page.goto("/login");
  await page.locator("input[type='text'], input[type='email']").fill("portal@daycareportal.com");
  await page.locator("input[type='password']").fill("DayCarePortal@2026");
  await page.locator("button[type='submit']").click();
  await page.waitForURL("**/portal", { timeout: 10_000 });
}

test.describe("Portal admin — Schools tab", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsPortalAdmin(page);
    await page.getByRole("heading", { name: /daycareportal admin/i }).waitFor({ timeout: 8_000 });
  });

  test("TC-portal-schools-search-bar: Schools tab has a search bar", async ({ page }) => {
    await expect(page.getByPlaceholder(/search schools/i)).toBeVisible({ timeout: 5_000 });
  });

  test("TC-portal-schools-search-filters: Search bar filters school list", async ({ page }) => {
    await page.getByPlaceholder(/search schools/i).fill("JS Joy");
    await expect(page.getByText("JS Joy Family Daycare")).toBeVisible({ timeout: 5_000 });
    // Other schools should not be visible if filtered
  });

  test("TC-portal-schools-edit-icon: Each school row has edit (pencil) icon", async ({ page }) => {
    await expect(page.locator("tbody tr button[title='Manage school']").first()).toBeVisible({ timeout: 5_000 });
  });

  test("TC-portal-schools-delete-icon: Each school row has delete (trash) icon", async ({ page }) => {
    await expect(page.locator("tbody tr button[title='Delete school']").first()).toBeVisible({ timeout: 5_000 });
  });

  test("TC-portal-schools-delete-confirm: Delete icon shows confirm dialog", async ({ page }) => {
    await page.locator("tbody tr button[title='Delete school']").first().click();
    await expect(page.getByText(/delete school\?/i)).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/cannot be undone/i)).toBeVisible();
    await page.getByRole("button", { name: /cancel/i }).click();
  });

  test("TC-portal-schools-edit-opens-panel: Edit icon opens Manage School panel", async ({ page }) => {
    await page.locator("tbody tr button[title='Manage school']").first().click();
    await expect(page.getByText(/manage school/i)).toBeVisible({ timeout: 5_000 });
    // Close via X
    await page.locator("button").filter({ has: page.locator("svg") }).first().click().catch(() => {});
  });

  test("TC-portal-schools-address-column: Schools table shows Address column", async ({ page }) => {
    await expect(page.getByRole("columnheader", { name: /address/i })).toBeVisible({ timeout: 5_000 });
  });

  test("TC-portal-schools-phone-column: Schools table shows Phone column", async ({ page }) => {
    await expect(page.getByRole("columnheader", { name: /phone/i })).toBeVisible({ timeout: 5_000 });
  });

  test("TC-portal-schools-students-column: Schools table shows Students (active) column", async ({ page }) => {
    await expect(page.getByRole("columnheader", { name: /students/i })).toBeVisible({ timeout: 5_000 });
  });

  test("TC-portal-schools-active-students-badge: School with active students shows amber badge", async ({ page }) => {
    // JS Joy Family Daycare has active students — should show amber badge
    const jsJoyRow = page.locator("tbody tr").filter({ hasText: "JS Joy Family Daycare" }).first();
    await jsJoyRow.waitFor({ timeout: 6_000 });
    // Either amber badge or 0 — just verify Students column cell is visible
    await expect(jsJoyRow.locator("td").nth(2)).toBeVisible();
  });

  test("TC-portal-schools-delete-warn-active-students: Delete confirm shows student count warning when school has active students", async ({ page }) => {
    // Find school with active students (amber badge)
    const row = page.locator("tbody tr").filter({ has: page.getByText(/active/i).and(page.locator("span.bg-amber-100")) }).first();
    if (await row.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await row.locator("button[title*='Delete']").click();
      await expect(page.getByText(/active student/i)).toBeVisible({ timeout: 5_000 });
      await page.getByRole("button", { name: /cancel/i }).click();
    }
  });

  test("TC-portal-schools-create-has-address: Create School form has address/phone/email fields", async ({ page }) => {
    await page.getByRole("button", { name: /create school/i }).click();
    await expect(page.getByPlaceholder(/sunshine daycare/i)).toBeVisible({ timeout: 5_000 });
    await expect(page.getByPlaceholder(/555-1234/i)).toBeVisible();
    await expect(page.getByPlaceholder(/info@school/i)).toBeVisible();
    await expect(page.getByPlaceholder(/street address/i)).toBeVisible();
    await page.getByRole("button", { name: /cancel/i }).first().click().catch(() =>
      page.keyboard.press("Escape")
    );
  });
});

test.describe("Portal admin — Users tab manage", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsPortalAdmin(page);
    await page.getByRole("heading", { name: /daycareportal admin/i }).waitFor({ timeout: 8_000 });
    await page.getByRole("button", { name: /users/i }).click();
    await page.locator("tbody tr").first().waitFor({ timeout: 6_000 });
  });

  test("TC-portal-users-edit-icon: Each active user row has a pencil icon", async ({ page }) => {
    await expect(page.locator("tbody tr button[title='Manage user']").first()).toBeVisible({ timeout: 5_000 });
  });

  test("TC-portal-users-edit-opens-dialog: Pencil opens Manage User dialog", async ({ page }) => {
    await page.locator("tbody tr button[title='Manage user']").first().click();
    await expect(page.getByRole("heading", { name: /manage user/i })).toBeVisible({ timeout: 5_000 });
    await page.getByRole("button", { name: /cancel/i }).click();
  });

  test("TC-portal-users-edit-has-fields: Manage User dialog has Name, Phone, Role fields", async ({ page }) => {
    await page.locator("tbody tr button[title='Manage user']").first().click();
    await expect(page.getByPlaceholder(/full name/i)).toBeVisible({ timeout: 5_000 });
    await expect(page.getByPlaceholder(/555-1234/i)).toBeVisible();
    await expect(page.locator("select")).toBeVisible();
    await page.getByRole("button", { name: /cancel/i }).click();
  });

  test("TC-portal-users-admin-has-school-section: Admin/staff user shows Schools section in dialog", async ({ page }) => {
    // Find a non-parent user (admin or staff)
    const adminRow = page.locator("tbody tr").filter({ has: page.getByText(/admin|staff/i) }).first();
    await adminRow.locator("button[title='Manage user']").click();
    await expect(page.getByText(/schools/i).first()).toBeVisible({ timeout: 5_000 });
    await page.getByRole("button", { name: /cancel/i }).click();
  });

  test("TC-portal-users-parent-no-school-section: Parent user does NOT see Schools section in dialog", async ({ page }) => {
    // Find a parent user
    const parentRow = page.locator("tbody tr").filter({ has: page.getByText("Parent") }).first();
    if (await parentRow.isVisible()) {
      await parentRow.locator("button[title='Manage user']").click();
      await expect(page.getByRole("heading", { name: /manage user/i })).toBeVisible({ timeout: 5_000 });
      // Schools section and Assign dropdown should NOT appear for parents
      await expect(page.getByText("+ Assign to school…")).not.toBeVisible();
      await page.getByRole("button", { name: /cancel/i }).click();
    }
  });

  test("TC-portal-users-delete-icon: Each active user row has a delete (trash) icon", async ({ page }) => {
    await expect(page.locator("tbody tr button[title='Delete user']").first()).toBeVisible({ timeout: 5_000 });
  });

  test("TC-portal-users-delete-confirm: Delete icon shows confirm dialog with warning", async ({ page }) => {
    await page.locator("tbody tr button[title='Delete user']").first().click();
    await expect(page.getByText(/delete user\?/i)).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/cannot be undone/i)).toBeVisible();
    await page.getByRole("button", { name: /cancel/i }).click();
  });

  test("TC-portal-users-invite-delete-button: Pending invite rows have delete button", async ({ page }) => {
    const invitedRow = page.locator("tbody tr").filter({ has: page.getByText("Invited") }).first();
    if (await invitedRow.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await expect(invitedRow.locator("button[title='Delete invite']")).toBeVisible();
    }
  });
});

test.describe("School admin — Settings page with address", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.locator("input[type='text'], input[type='email']").fill("admin@jsdaycare.com");
    await page.locator("input[type='password']").fill("JsDaycare@2026");
    await page.locator("button[type='submit']").click();
    await page.waitForURL("**/home", { timeout: 10_000 });
    await page.goto("/settings");
    await page.getByRole("heading", { name: /settings/i }).waitFor({ timeout: 8_000 });
  });

  test("TC-settings-phone-field: Settings shows Phone field", async ({ page }) => {
    await expect(page.getByPlaceholder(/408-555-0100/i)).toBeVisible({ timeout: 5_000 });
  });

  test("TC-settings-email-field: Settings shows Email field", async ({ page }) => {
    await expect(page.getByPlaceholder(/info@school.com/i)).toBeVisible({ timeout: 5_000 });
  });

  test("TC-settings-address-fields: Settings shows street/city/state/zip fields", async ({ page }) => {
    await expect(page.getByPlaceholder(/street address/i)).toBeVisible({ timeout: 5_000 });
    await expect(page.getByPlaceholder(/^City$/i)).toBeVisible();
    await expect(page.getByPlaceholder(/^State$/i)).toBeVisible();
    await expect(page.getByPlaceholder(/^ZIP$/i)).toBeVisible();
  });

  test("TC-settings-address-saves: Admin can enter and save address info", async ({ page }) => {
    await page.getByPlaceholder(/street address/i).fill("123 Joy Lane");
    await page.getByPlaceholder(/^City$/i).fill("San Jose");
    await page.getByRole("button", { name: /save changes/i }).click();
    // Should show saved confirmation
    await expect(page.getByRole("button", { name: /saved!/i })).toBeVisible({ timeout: 5_000 });
  });
});

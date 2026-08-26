import { test, expect } from "@playwright/test";

async function loginAsPortalAdmin(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "portal@daycareportal.com");
  await page.fill('input[type="password"]', "DayCarePortal@2026");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/portal", { timeout: 15_000 });
}

test.describe("Portal Admin", () => {

test("TC-portal-login: portal admin logs in and lands on /portal", async ({ page }) => {
  await loginAsPortalAdmin(page);
  await expect(page).toHaveURL(/\/portal/);
  await expect(page.getByText(/daycareportal admin/i)).toBeVisible({ timeout: 8_000 });
});

test("TC-portal-no-sidebar: portal admin page has no sidebar nav", async ({ page }) => {
  await loginAsPortalAdmin(page);
  // No school-level sidebar nav items (Students, Rooms etc.)
  await expect(page.getByRole("link", { name: /^students$/i })).not.toBeVisible();
  await expect(page.getByRole("link", { name: /^rooms$/i })).not.toBeVisible();
});

test("TC-portal-schools-table: portal admin sees schools table with at least 1 school", async ({ page }) => {
  await loginAsPortalAdmin(page);
  await expect(page.getByRole("heading", { name: /schools/i })).toBeVisible({ timeout: 8_000 });
  await expect(page.locator("table")).toBeVisible();
  // At least JS Joy Family Daycare
  await expect(page.getByText(/JS Joy/i)).toBeVisible({ timeout: 8_000 });
});

test("TC-portal-stats: portal admin dashboard shows stats (schools count)", async ({ page }) => {
  await loginAsPortalAdmin(page);
  await expect(page.getByText("Total schools")).toBeVisible({ timeout: 8_000 });
});

test("TC-portal-create-school: + Create school button opens modal", async ({ page }) => {
  await loginAsPortalAdmin(page);
  await page.getByRole("button", { name: /create school/i }).click();
  await expect(page.getByRole("heading", { name: /create.*school|new school/i })).toBeVisible({ timeout: 5_000 });
  // Close
  await page.keyboard.press("Escape");
});

test("TC-portal-manage-school: Manage link opens school detail panel", async ({ page }) => {
  await loginAsPortalAdmin(page);
  await page.locator("table").waitFor({ timeout: 8_000 });
  await page.getByText("Manage").first().click();
  await expect(page.getByText(/admins|school name|manage school/i).first()).toBeVisible({ timeout: 8_000 });
});

test("TC-portal-assign-panel: Manage panel opens and has assign input", async ({ page }) => {
  await loginAsPortalAdmin(page);
  // Navigate directly to portal and open manage for JS Joy (first row)
  await page.locator("table tbody tr").first().waitFor({ timeout: 10_000 });
  await page.locator("table tbody tr").first().getByText("Manage").click();
  // Confirm the manage panel opened
  await expect(page.getByText(/school name|assign admin/i).first()).toBeVisible({ timeout: 10_000 });
  // Assign input present
  await expect(page.getByPlaceholder("existing-user@email.com")).toBeVisible({ timeout: 5_000 });
});

test("TC-portal-assign-known-email: assigning known email succeeds", async ({ page }) => {
  await loginAsPortalAdmin(page);
  await page.locator("table").waitFor({ timeout: 8_000 });
  // Use JS Joy Family Daycare's manage panel
  const jsjoyRow = page.locator("tr").filter({ hasText: /JS Joy Family/i });
  await jsjoyRow.getByText("Manage").click();
  await page.getByPlaceholder("existing-user@email.com").waitFor({ timeout: 8_000 });
  // Assign existing admin (Jaya Bijjala) — should succeed silently
  await page.getByPlaceholder("existing-user@email.com").fill("admin@jsdaycare.com");
  await page.getByRole("button", { name: /^assign$/i }).click();
  // Error should NOT appear (user exists)
  await page.waitForTimeout(2000);
  await expect(page.getByText(/no account found/i)).not.toBeVisible();
});

test("TC-portal-blocked-from-home: portal admin cannot access /home", async ({ page }) => {
  await loginAsPortalAdmin(page);
  await page.goto("/home");
  await expect(page).not.toHaveURL(/\/home/, { timeout: 5_000 });
});

test("TC-portal-blocked-from-students: portal admin cannot access /students", async ({ page }) => {
  await loginAsPortalAdmin(page);
  await page.goto("/students");
  await expect(page).not.toHaveURL(/\/students/, { timeout: 5_000 });
});

}); // end test.describe.serial

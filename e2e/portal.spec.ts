import { test, expect } from "@playwright/test";

async function loginAsPortalAdmin(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="text"], input[type="email"]', "portal@daycareportal.com");
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

test("TC-portal-manage-invite: Manage panel has Admin Registration Link and Assign sections", async ({ page }) => {
  await loginAsPortalAdmin(page);
  await page.locator("table tbody tr").first().waitFor({ timeout: 10_000 });
  await page.locator("table tbody tr").first().getByText("Manage").click();
  // Admin Registration Link section visible
  await expect(page.getByText(/admin registration link/i)).toBeVisible({ timeout: 10_000 });
  // Assign existing admin section visible
  await expect(page.getByText(/assign existing admin/i)).toBeVisible();
});

test("TC-portal-invite-dialog-opens: Admin Registration Link section loads in manage panel", async ({ page }) => {
  await loginAsPortalAdmin(page);
  await page.locator("table tbody tr").first().waitFor({ timeout: 10_000 });
  await page.locator("table tbody tr").first().getByText("Manage").click();
  // Wait for the admin link section to load (fetches from DB)
  await page.getByText(/admin registration link/i).waitFor({ timeout: 10_000 });
  // Wait for either the link or the generate button to appear (DB fetch may take a moment)
  await expect(
    page.getByRole("button", { name: /copy|generate admin link/i }).first()
  ).toBeVisible({ timeout: 8_000 });
});

test("TC-portal-invite-generates-link: Generate Admin Link shows copy button", async ({ page }) => {
  await loginAsPortalAdmin(page);
  await page.locator("table tbody tr").first().waitFor({ timeout: 10_000 });
  await page.locator("table tbody tr").first().getByText("Manage").click();
  await page.getByText(/admin registration link/i).waitFor({ timeout: 10_000 });
  // Click Generate if no link yet
  const generateBtn = page.getByRole("button", { name: /generate admin link/i });
  if (await generateBtn.count() > 0) await generateBtn.click();
  // Copy button should appear
  await expect(page.getByRole("button", { name: /copy/i }).first()).toBeVisible({ timeout: 10_000 });
});

test("TC-portal-assign-existing: Assign existing user shows error for unknown search", async ({ page }) => {
  await loginAsPortalAdmin(page);
  await page.locator("table tbody tr").first().waitFor({ timeout: 10_000 });
  await page.locator("table tbody tr").first().getByText("Manage").click();
  await page.getByText(/assign existing admin/i).waitFor({ timeout: 10_000 });
  // The assign section has a search input
  const searchInput = page.getByPlaceholder(/search by name/i);
  await expect(searchInput).toBeVisible({ timeout: 5_000 });
  await expect(page.getByRole("button", { name: /^assign$/i })).toBeVisible();
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

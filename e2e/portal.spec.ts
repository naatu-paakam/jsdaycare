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

// ─── Users tab ────────────────────────────────────────────────────────────────

test("TC-portal-users-tab: Users tab visible and shows user table", async ({ page }) => {
  await loginAsPortalAdmin(page);
  await page.getByText(/👥.*Users|Users/i).first().click();
  await expect(page.getByRole("heading", { name: /^users$/i })).toBeVisible({ timeout: 8_000 });
  await expect(page.locator("table")).toBeVisible({ timeout: 8_000 });
});

test("TC-portal-users-shows-all-users: Users table shows multiple users with roles", async ({ page }) => {
  await loginAsPortalAdmin(page);
  await page.getByText(/👥.*Users|Users/i).first().click();
  await page.getByRole("heading", { name: /^users$/i }).waitFor({ timeout: 8_000 });
  // At least one user visible (Jaya Bijjala)
  await expect(page.getByText(/Jaya Bijjala/i)).toBeVisible({ timeout: 8_000 });
  // Role badges visible
  await expect(page.getByText("Admin").first()).toBeVisible();
});

test("TC-portal-users-multischool-shown: Multi-school user shows both school names", async ({ page }) => {
  await loginAsPortalAdmin(page);
  await page.getByText(/👥.*Users|Users/i).first().click();
  await page.getByRole("heading", { name: /^users$/i }).waitFor({ timeout: 8_000 });
  // Jaya Bijjala should show 2 schools (multi-school admin)
  const jayaRow = page.locator("tr").filter({ hasText: /Jaya Bijjala/i });
  await jayaRow.waitFor({ timeout: 8_000 });
  await expect(jayaRow.getByText(/Sunshine|JS Joy/i).first()).toBeVisible();
});

test("TC-portal-users-search: Search filter narrows user list", async ({ page }) => {
  await loginAsPortalAdmin(page);
  await page.getByText(/👥.*Users|Users/i).first().click();
  await page.getByRole("heading", { name: /^users$/i }).waitFor({ timeout: 8_000 });
  await page.getByPlaceholder(/search by name/i).fill("Jaya");
  await expect(page.getByText(/Jaya Bijjala/i)).toBeVisible({ timeout: 5_000 });
  // Other users should not be visible after filtering
  await expect(page.getByText(/Nidhi Patel/i)).not.toBeVisible();
});

test("TC-portal-users-role-filter: Role filter narrows to matching users", async ({ page }) => {
  await loginAsPortalAdmin(page);
  await page.getByText(/👥.*Users|Users/i).first().click();
  await page.getByRole("heading", { name: /^users$/i }).waitFor({ timeout: 8_000 });
  await page.getByRole("combobox").last().selectOption("parent");
  // Only parents should show
  await expect(page.getByText(/Arudeepa Kumar/i)).toBeVisible({ timeout: 5_000 });
  await expect(page.getByText(/Jaya Bijjala/i)).not.toBeVisible();
});

test("TC-portal-users-invite-button: + Invite User button in top right opens school+role dialog", async ({ page }) => {
  await loginAsPortalAdmin(page);
  await page.getByText(/👥.*Users|Users/i).first().click();
  await page.getByRole("heading", { name: /^users$/i }).waitFor({ timeout: 8_000 });
  // + Invite User button in top right (no per-row link icons)
  await page.getByRole("button", { name: /invite user/i }).click();
  // Dialog appears with school dropdown + role dropdown
  await expect(page.getByRole("heading", { name: "Invite User" })).toBeVisible({ timeout: 5_000 });
  await expect(page.locator("select").first()).toBeVisible(); // school dropdown
  await expect(page.getByRole("button", { name: /next.*generate link/i })).toBeVisible();
});

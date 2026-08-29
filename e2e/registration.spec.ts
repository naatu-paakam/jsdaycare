import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

// ─── Registration page ────────────────────────────────────────────────────────

test("TC-register-no-token: /register without token shows invitation required message", async ({ page }) => {
  await page.goto("/register");
  await expect(page.getByText(/please use your invitation link/i)).toBeVisible({ timeout: 8_000 });
  await expect(page.getByRole("link", { name: /back to login/i })).toBeVisible();
});

test("TC-register-invalid-token: /register with bad token shows invalid invitation error", async ({ page }) => {
  await page.goto("/register?token=00000000-0000-0000-0000-000000000000");
  // Should show invalid/expired/not found error (not the registration form)
  await expect(page.getByText(/invalid|not found|expired|no invitation/i).first()).toBeVisible({ timeout: 8_000 });
});

test("TC-register-page-loads: /register page has DayCarePortal branding", async ({ page }) => {
  await page.goto("/register");
  await expect(page.getByText("DayCarePortal")).toBeVisible({ timeout: 5_000 });
});

// ─── Login page has registration link ─────────────────────────────────────────

test("TC-login-register-link: Login page has 'Have an invitation? Register here' link", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByText(/have an invitation|register here/i)).toBeVisible({ timeout: 5_000 });
  const link = page.getByRole("link", { name: /register here|register/i });
  await expect(link).toBeVisible();
});

// ─── Invite dialog — admin ─────────────────────────────────────────────────────

test.describe("Invite dialog", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("TC-invite-staff-button: Staff list has + Invite Staff button (admin)", async ({ page }) => {
    await page.goto("/staff");
    await page.getByRole("heading", { name: /staff/i }).waitFor({ timeout: 8_000 });
    await expect(page.getByRole("button", { name: /invite staff/i })).toBeVisible({ timeout: 5_000 });
  });

  test("TC-invite-staff-dialog: Invite Staff button opens invite dialog with role=staff", async ({ page }) => {
    await page.goto("/staff");
    await page.getByRole("heading", { name: /staff/i }).waitFor({ timeout: 8_000 });
    await page.getByRole("button", { name: /invite staff/i }).click();
    await expect(page.getByText(/invite|generate invite/i).first()).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/staff/i).first()).toBeVisible();
  });

  test("TC-invite-parent-button: Parents page has + Invite Parent button (admin)", async ({ page }) => {
    await page.goto("/parents");
    await page.getByRole("heading", { name: /parents/i }).waitFor({ timeout: 8_000 });
    await expect(page.getByRole("button", { name: /invite parent/i })).toBeVisible({ timeout: 5_000 });
  });

  test("TC-invite-generates-link: Invite dialog generates a /register link on submit", async ({ page }) => {
    await page.goto("/staff");
    await page.getByRole("heading", { name: /staff/i }).waitFor({ timeout: 8_000 });
    await page.getByRole("button", { name: /invite staff/i }).click();
    // Wait for invite dialog email input
    const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]').first();
    await emailInput.waitFor({ state: "visible", timeout: 8_000 });
    await emailInput.fill("newstaff@testinvite.com");
    await page.getByRole("button", { name: /generate invite link/i }).click();
    // Copy button appears when the link is generated
    await expect(page.getByRole("button", { name: /copy/i })).toBeVisible({ timeout: 12_000 });
  });
});

// ─── Multi-school admin ───────────────────────────────────────────────────────

test("TC-multischool-switcher: Multi-school admin sees school switcher button in sidebar", async ({ page }) => {
  await loginAsAdmin(page);
  // admin@jsdaycare.com is member of JS Joy Family Daycare + Sunshine
  // Sidebar shows school name as a clickable button (with dropdown chevron)
  const schoolBtn = page.locator("nav button").filter({ hasText: /JS Joy|Sunshine/i }).first();
  await schoolBtn.waitFor({ timeout: 10_000 });
  await expect(schoolBtn).toBeVisible();
  await expect(schoolBtn).toBeEnabled();
});

test("TC-multischool-dropdown: Clicking school switcher reveals all schools for the admin", async ({ page }) => {
  await loginAsAdmin(page);
  // admin@jsdaycare.com should see BOTH schools in dropdown
  const schoolBtn = page.locator("nav button").filter({ hasText: /JS Joy|Sunshine/i }).first();
  await schoolBtn.waitFor({ timeout: 10_000 });
  await schoolBtn.click();
  // Both schools should be listed
  await expect(page.getByText("JS Joy Family Daycare")).toBeVisible({ timeout: 5_000 });
  await expect(page.getByText("Sunshine")).toBeVisible({ timeout: 5_000 });
});

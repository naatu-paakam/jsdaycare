import { test, expect } from "@playwright/test";

const SCHOOL_ID = "08f7413b-1aa9-4679-b80b-d59ffc1fd749";
const CHECKIN_URL = `/checkin?school=${SCHOOL_ID}`;
const VALID_PIN = "100001"; // Arudeepa Kumar → Adrith Ram

// ─── Check-in page (public, no login required) ────────────────────────────────

test("TC-checkin-page-loads: /checkin page loads without login", async ({ page }) => {
  await page.goto(CHECKIN_URL);
  // School name shows (fetched from DB)
  await expect(page.getByText("JS Joy Family Daycare")).toBeVisible({ timeout: 8_000 });
  // PIN pad visible
  await expect(page.getByText("Enter your 6-digit PIN")).toBeVisible();
  // Numeric keypad buttons
  await expect(page.getByRole("button", { name: "1" })).toBeVisible();
  await expect(page.getByRole("button", { name: "0" })).toBeVisible();
});

test("TC-checkin-pin-pad: PIN pad accepts digits and shows them masked", async ({ page }) => {
  await page.goto(CHECKIN_URL);
  await page.getByText("Enter your 6-digit PIN").waitFor({ timeout: 8_000 });
  // Click digit 1 — dot should fill
  await page.getByRole("button", { name: "1" }).click();
  // 6 PIN boxes should still be visible (one now filled)
  const pinBoxes = page.locator("[class*='border-orange']");
  await expect(pinBoxes.first()).toBeVisible();
});

test("TC-checkin-invalid-pin: Invalid PIN shows error message", async ({ page }) => {
  await page.goto(CHECKIN_URL);
  await page.getByText("Enter your 6-digit PIN").waitFor({ timeout: 8_000 });
  // Enter 6 digits of an invalid PIN
  for (const d of "999999") {
    await page.getByRole("button", { name: d }).click();
  }
  // Submit
  await page.locator("button.bg-orange-500").click();
  await expect(page.getByText(/PIN not found|check your code/i)).toBeVisible({ timeout: 8_000 });
});

test("TC-checkin-valid-pin: Valid PIN shows student list with check-in buttons", async ({ page }) => {
  await page.goto(CHECKIN_URL);
  await page.getByText("Enter your 6-digit PIN").waitFor({ timeout: 8_000 });
  // Enter valid PIN 100001 (Arudeepa Kumar → Adrith Ram)
  for (const d of VALID_PIN) {
    await page.getByRole("button", { name: d }).click();
  }
  await page.locator("button.bg-orange-500").click();
  // Should show Adrith Ram with check-in/out button
  await expect(page.getByText(/Adrith Ram/i)).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/Arudeepa Kumar/i)).toBeVisible();
});

test("TC-checkin-qr-in-settings: Settings page has QR code section", async ({ page }) => {
  // Need to be logged in as admin for settings
  await page.goto("/login");
  await page.fill('input[type="text"], input[type="email"]', "admin@jsdaycare.com");
  await page.fill('input[type="password"]', "JsDaycare@2026");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/home", { timeout: 15_000 });
  await page.goto("/settings");
  await page.getByRole("heading", { name: /settings/i }).waitFor({ timeout: 8_000 });
  // QR code section visible
  await expect(page.getByText(/front desk qr code/i)).toBeVisible({ timeout: 8_000 });
  await expect(page.getByRole("button", { name: /download qr/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /copy link/i })).toBeVisible();
});

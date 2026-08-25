import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

test.beforeEach(async ({ page }) => {
  await loginAsAdmin(page);
});

test("TC-home-loads: /home shows today's stats section", async ({ page }) => {
  // Already on /home after login
  // Stat cards contain "Checked In Today", "Expected", "Absent"
  await expect(page.getByText("Checked In Today")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText("Expected")).toBeVisible();
});

test("TC-room-ratios: Current Room Ratios section visible on home", async ({ page }) => {
  await expect(page.getByText("Current Room Ratios")).toBeVisible({ timeout: 10_000 });
});

test("TC-compliance-alerts: Compliance Alerts section visible on home", async ({ page }) => {
  await expect(page.getByText("Compliance Alerts")).toBeVisible({ timeout: 10_000 });
});

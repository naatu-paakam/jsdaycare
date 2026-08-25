import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

const ADMIN_EMAIL = "admin@jsdaycare.com";
const ADMIN_PASSWORD = "JsDaycare@2026";

test("TC-admin-login: navigates to /login and logs in successfully", async ({ page }) => {
  await page.goto("/");
  await page.waitForURL("**/login", { timeout: 10_000 });

  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');

  await page.waitForURL("**/home", { timeout: 15_000 });
  await expect(page.getByText("Checked In Today")).toBeVisible();
});

test("TC-wrong-password: shows error for bad credentials", async ({ page }) => {
  await page.goto("/login");
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', "wrongpassword123");
  await page.click('button[type="submit"]');

  await expect(page.locator(".bg-red-50")).toBeVisible({ timeout: 10_000 });
  expect(page.url()).toContain("/login");
});

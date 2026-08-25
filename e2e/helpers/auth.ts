import { Page } from "@playwright/test";

export const ADMIN_EMAIL = "admin@jsdaycare.com";
export const ADMIN_PASSWORD = "JsDaycare@2026";

export async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  // Wait for redirect to /home
  await page.waitForURL("**/home", { timeout: 15_000 });
}

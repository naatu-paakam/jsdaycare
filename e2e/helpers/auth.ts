import { Page } from "@playwright/test";

async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.waitForURL("**/login");
  await page.fill('input[type="text"], input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(url => !url.toString().includes("/login"), { timeout: 15_000 });
}

export async function loginAsAdmin(page: Page) {
  await loginAs(page, "admin@jsdaycare.com", "JsDaycare@2026");
}

export async function loginAsTeacher(page: Page) {
  await loginAs(page, "teacher@jsdaycare.com", "JsDaycare@2026");
}

export async function loginAsParent(page: Page) {
  await loginAs(page, "parent@jsdaycare.com", "JsDaycare@2026");
}

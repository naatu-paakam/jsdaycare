import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

test.beforeEach(async ({ page }) => {
  await loginAsAdmin(page);
});

test("TC-room-list: /rooms loads with heading and New Room button", async ({ page }) => {
  await page.goto("/rooms");
  await expect(page.getByRole("heading", { name: "Rooms" })).toBeVisible();
  await expect(page.getByRole("button", { name: /new room/i })).toBeVisible();
});

test("TC-room-detail: room detail shows Students, Parents, Feed tabs", async ({ page }) => {
  await page.goto("/rooms");
  // Wait for room cards to load from Supabase
  const roomLink = page.locator('a[href^="/rooms/"]').first();
  await roomLink.waitFor({ state: "visible", timeout: 10_000 });

  await roomLink.click();
  await page.waitForURL("**/rooms/**", { timeout: 10_000 });

  await expect(page.getByRole("button", { name: /students/i })).toBeVisible({ timeout: 8_000 });
  await expect(page.getByRole("button", { name: /parents/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /feed/i })).toBeVisible();
});

test("TC-checkin-buttons: room Students tab has Check in and Mark absent buttons", async ({ page }) => {
  await page.goto("/rooms");
  // Wait for all room links, then pick "Toddlers" which has active students
  await page.locator('a[href^="/rooms/"]').first().waitFor({ state: "visible", timeout: 10_000 });

  const toddlerLink = page.locator('a[href^="/rooms/"]', { hasText: /toddler/i });
  const count = await toddlerLink.count();
  if (count === 0) { test.skip(); return; }

  await toddlerLink.click();
  await page.waitForURL("**/rooms/**", { timeout: 10_000 });

  // Wait for at least one real student row (not the loading/empty placeholder)
  await expect(page.locator("table tbody tr").filter({ hasNot: page.locator("td[colspan]") }).first()).toBeVisible({ timeout: 8_000 });

  await expect(page.getByRole("button", { name: /check in/i }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /mark absent/i }).first()).toBeVisible();
});

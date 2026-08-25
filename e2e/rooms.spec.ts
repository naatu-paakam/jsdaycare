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
  await page.waitForTimeout(2000); // wait for rooms to load

  // Find first room link
  const roomLink = page.locator('a[href^="/rooms/"]').first();
  const count = await roomLink.count();
  if (count === 0) {
    test.skip(); // No rooms seeded yet
    return;
  }

  await roomLink.click();
  await page.waitForURL("**/rooms/**", { timeout: 10_000 });

  // Tabs: "Students (N)", "Parents", "Feed"
  await expect(page.getByRole("button", { name: /students/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /parents/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /feed/i })).toBeVisible();
});

test("TC-checkin-buttons: room Students tab has Check in and Mark absent buttons", async ({ page }) => {
  await page.goto("/rooms");
  await page.waitForTimeout(2000);

  const roomLink = page.locator('a[href^="/rooms/"]').first();
  const count = await roomLink.count();
  if (count === 0) {
    test.skip();
    return;
  }

  await roomLink.click();
  await page.waitForURL("**/rooms/**", { timeout: 10_000 });

  // Students tab is active by default
  // If there are students, check in / mark absent buttons should be visible
  const studentRows = page.locator("table tbody tr");
  const rowCount = await studentRows.count();
  if (rowCount === 0 || (await studentRows.first().textContent())?.includes("No students")) {
    test.skip();
    return;
  }

  await expect(page.getByRole("button", { name: /check in/i }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /mark absent/i }).first()).toBeVisible();
});

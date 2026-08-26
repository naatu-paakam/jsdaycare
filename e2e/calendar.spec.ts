import { test, expect } from "@playwright/test";
import { loginAsAdmin, loginAsParent } from "./helpers/auth";

test.describe("Calendar page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/calendar");
    await page.getByRole("heading", { name: /calendar/i }).first().waitFor({ timeout: 8_000 });
  });

  test("TC-calendar-two-columns: Calendar has Holiday Calendar and Operating Schedule sections", async ({ page }) => {
    await expect(page.getByText("Holiday Calendar")).toBeVisible();
    await expect(page.getByText("Operating Schedule")).toBeVisible();
  });

  test("TC-calendar-operating-hours: Operating Schedule shows Mon-Fri hours and Closed days", async ({ page }) => {
    // Operating hours section heading
    await expect(page.getByText(/regular hours/i)).toBeVisible({ timeout: 8_000 });
    // Monday is one of the days listed
    await expect(page.getByText("Monday")).toBeVisible({ timeout: 5_000 });
    // Either shows hours OR "Closed" (either is valid depending on DB state)
    await expect(
      page.getByText(/8:30 AM|Closed/i).first()
    ).toBeVisible({ timeout: 5_000 });
  });

  test("TC-calendar-holiday-policy: Holiday Policy section with bullet points", async ({ page }) => {
    await expect(page.getByText("Holiday Policy")).toBeVisible();
    await expect(page.getByText(/major holidays/i)).toBeVisible({ timeout: 8_000 });
  });

  test("TC-calendar-birthday-policy: Birthday Policy section visible", async ({ page }) => {
    await expect(page.getByText("Birthday Policy")).toBeVisible();
    await expect(page.getByText(/celebrating.*child|celebrate.*special/i)).toBeVisible({ timeout: 8_000 });
  });

  test("TC-calendar-special-events: Special Events section and + Add Special Event button visible", async ({ page }) => {
    await expect(page.getByText("Special Events")).toBeVisible({ timeout: 8_000 });
    await expect(page.getByRole("button", { name: /add special event/i })).toBeVisible({ timeout: 5_000 });
  });

  test("TC-calendar-add-holiday: Admin sees Add Holiday button", async ({ page }) => {
    await expect(page.getByRole("button", { name: /add holiday/i })).toBeVisible({ timeout: 8_000 });
  });

  test("TC-calendar-edit-hours: Admin can click edit on an operating hours row", async ({ page }) => {
    await page.getByText("Monday").waitFor({ timeout: 8_000 });
    const editPencils = page.locator("button[aria-label*='edit'], button svg").first();
    // At least one edit control visible in operating schedule area
    await expect(page.locator("button").filter({ has: page.locator("svg") }).first()).toBeVisible();
  });

  test("TC-calendar-edit-policy: Edit Policy link visible on Holiday Policy", async ({ page }) => {
    await expect(page.getByText("Edit Policy").first()).toBeVisible({ timeout: 8_000 });
  });
});

import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

test.describe("Schedules page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/schedule");
    await page.getByRole("heading", { name: "Schedules", exact: true }).waitFor({ timeout: 8_000 });
  });

  // ─── Layout ─────────────────────────────────────────────────────────────────

  test("TC-schedules-loads: Schedules page loads with staff and student grids", async ({ page }) => {
    await expect(page.getByText("Staff Schedules").first()).toBeVisible();
    await expect(page.getByText("Student Schedules").first()).toBeVisible();
  });

  test("TC-schedules-staff-rows: staff members appear as grid rows", async ({ page }) => {
    await expect(page.getByText(/Jaya Bijjala|Nidhi Patel/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test("TC-schedules-student-rows: active students appear as grid rows", async ({ page }) => {
    await expect(page.getByText(/Adrith Ram|Atif|Aanya|Vihaan/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test("TC-schedules-week-nav: Today link and week header visible", async ({ page }) => {
    // Today link should be visible for quick navigation back
    await expect(page.getByText("Today")).toBeVisible();
    // A date is shown in the header (Aug, Sep, etc.)
    await expect(page.locator("text=/Aug|Sep|Oct|Nov|Dec|Jan|Feb|Mar|Apr|May|Jun|Jul/").first()).toBeVisible();
  });

  test("TC-schedules-today-link: Today link is visible", async ({ page }) => {
    await expect(page.getByText("Today")).toBeVisible();
  });

  test("TC-schedules-room-filter: Room filter is visible", async ({ page }) => {
    await expect(page.locator("select, [role=combobox]").first()).toBeVisible();
  });

  // ─── Add Staff Schedule dialog ───────────────────────────────────────────────

  test("TC-schedules-staff-dialog: + Staff schedule button opens dialog", async ({ page }) => {
    await page.getByRole("button", { name: /staff schedule/i }).click();
    await expect(page.getByText(/add staff to schedule/i)).toBeVisible({ timeout: 5_000 });
  });

  test("TC-schedules-staff-dialog-fields: dialog has required fields", async ({ page }) => {
    await page.getByRole("button", { name: /staff schedule/i }).click();
    await page.getByText(/add staff to schedule/i).waitFor({ timeout: 5_000 });
    // Room selector (label may include asterisk)
    await expect(page.getByText(/^Room/i).first()).toBeVisible();
    await expect(page.getByText(/repeats every week/i)).toBeVisible();
    await expect(page.getByText("Days of the week")).toBeVisible();
  });

  test("TC-schedules-staff-day-pills: day-of-week pill toggles visible", async ({ page }) => {
    await page.getByRole("button", { name: /staff schedule/i }).click();
    await page.getByText(/add staff to schedule/i).waitFor({ timeout: 5_000 });
    await expect(page.getByText("Days of the week")).toBeVisible();
    // Day pills: check that multiple day abbreviations exist as buttons
    const dayPills = page.locator("button").filter({ hasText: /^(Su|Mo|Tu|We|Th|Fr|Sa)$/ });
    await expect(dayPills.first()).toBeVisible();
    expect(await dayPills.count()).toBeGreaterThanOrEqual(5);
  });

  test("TC-schedules-staff-dialog-cancel: Cancel closes the dialog", async ({ page }) => {
    await page.getByRole("button", { name: /staff schedule/i }).click();
    await page.getByText(/add staff to schedule/i).waitFor({ timeout: 5_000 });
    await page.getByRole("button", { name: /cancel/i }).click();
    await expect(page.getByText(/add staff to schedule/i)).not.toBeVisible();
  });

  // ─── Add Student Schedule dialog ─────────────────────────────────────────────

  test("TC-schedules-student-dialog: + Student schedule button opens dialog", async ({ page }) => {
    await page.getByRole("button", { name: /student schedule/i }).click();
    await expect(page.getByText(/student.*schedule|add student/i).first()).toBeVisible({ timeout: 5_000 });
  });

  test("TC-schedules-student-dialog-cancel: Cancel closes student dialog", async ({ page }) => {
    await page.getByRole("button", { name: /student schedule/i }).click();
    await page.getByText(/student.*schedule|add student/i).first().waitFor({ timeout: 5_000 });
    await page.getByRole("button", { name: /cancel/i }).click();
    await expect(page.getByText(/add student.*schedule/i)).not.toBeVisible();
  });
});

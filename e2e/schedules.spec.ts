import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

test.beforeEach(async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/schedule");
  await page.getByRole("heading", { name: "Schedules", exact: true }).waitFor({ timeout: 8_000 });
});

// ─── Schedules page layout ────────────────────────────────────────────────────

test("TC-schedules-loads: Schedules page loads with staff and student grids", async ({ page }) => {
  await expect(page.getByText("Staff Schedules")).toBeVisible();
  await expect(page.getByText("Student Schedules")).toBeVisible();
});

test("TC-schedules-staff-rows: staff members appear as grid rows", async ({ page }) => {
  // At least one staff name should appear
  await expect(page.getByText(/Jaya Bijjala|Nidhi Patel/i).first()).toBeVisible({ timeout: 8_000 });
});

test("TC-schedules-student-rows: active students appear as grid rows", async ({ page }) => {
  await expect(page.getByText(/Adrith Ram|Atif|Aanya|Vihaan/i).first()).toBeVisible({ timeout: 8_000 });
});

test("TC-schedules-week-nav: previous and next week navigation works", async ({ page }) => {
  const initialHeader = await page.locator("text=/Aug|Sep|Oct|Nov|Dec|Jan|Feb|Mar/").first().textContent();
  await page.getByRole("button", { name: /next|›|>/i }).click();
  // Header should change (next week)
  const newHeader = await page.locator("text=/Aug|Sep|Oct|Nov|Dec|Jan|Feb|Mar/").first().textContent();
  expect(newHeader).not.toEqual(initialHeader);
});

test("TC-schedules-today-link: Today link navigates back to current week", async ({ page }) => {
  // Go forward one week
  await page.getByRole("button", { name: /next|›|>/i }).click();
  // Click Today
  await page.getByText("Today").click();
  // Should show current week dates
  const now = new Date();
  const month = now.toLocaleString("en-US", { month: "short" });
  await expect(page.getByText(new RegExp(month, "i")).first()).toBeVisible({ timeout: 5_000 });
});

test("TC-schedules-room-filter: Room filter dropdown is visible", async ({ page }) => {
  await expect(page.getByText(/all rooms/i)).toBeVisible();
});

// ─── Add Staff Schedule dialog ─────────────────────────────────────────────────

test("TC-schedules-staff-dialog: + Staff schedule button opens dialog", async ({ page }) => {
  await page.getByRole("button", { name: /staff schedule/i }).click();
  await expect(page.getByRole("heading", { name: /add staff to schedule/i })).toBeVisible({ timeout: 5_000 });
});

test("TC-schedules-staff-dialog-fields: dialog has all required fields", async ({ page }) => {
  await page.getByRole("button", { name: /staff schedule/i }).click();
  await page.getByRole("heading", { name: /add staff to schedule/i }).waitFor({ timeout: 5_000 });
  await expect(page.getByText("Staff")).toBeVisible();
  await expect(page.getByText("Room")).toBeVisible();
  await expect(page.getByText("Repeats every week")).toBeVisible();
  await expect(page.getByText("Start date")).toBeVisible();
  await expect(page.getByText("Start time")).toBeVisible();
  await expect(page.getByText("Days of the week")).toBeVisible();
});

test("TC-schedules-staff-day-pills: day-of-week pill toggles are visible", async ({ page }) => {
  await page.getByRole("button", { name: /staff schedule/i }).click();
  await page.getByRole("heading", { name: /add staff to schedule/i }).waitFor({ timeout: 5_000 });
  // Su Mo Tu We Th Fr Sa pills
  await expect(page.getByText("Mo")).toBeVisible();
  await expect(page.getByText("Fr")).toBeVisible();
});

test("TC-schedules-staff-dialog-cancel: Cancel closes the dialog", async ({ page }) => {
  await page.getByRole("button", { name: /staff schedule/i }).click();
  await page.getByRole("heading", { name: /add staff to schedule/i }).waitFor({ timeout: 5_000 });
  await page.getByRole("button", { name: /cancel/i }).click();
  await expect(page.getByRole("heading", { name: /add staff to schedule/i })).not.toBeVisible();
});

// ─── Add Student Schedule dialog ───────────────────────────────────────────────

test("TC-schedules-student-dialog: + Student schedule button opens dialog", async ({ page }) => {
  await page.getByRole("button", { name: /student schedule/i }).click();
  await expect(page.getByRole("heading", { name: /add student.*schedule|student schedule/i })).toBeVisible({ timeout: 5_000 });
});

test("TC-schedules-student-dialog-cancel: Cancel closes student dialog", async ({ page }) => {
  await page.getByRole("button", { name: /student schedule/i }).click();
  await page.getByRole("heading", { name: /student.*schedule/i }).waitFor({ timeout: 5_000 });
  await page.getByRole("button", { name: /cancel/i }).click();
  await expect(page.getByRole("heading", { name: /student.*schedule/i })).not.toBeVisible();
});

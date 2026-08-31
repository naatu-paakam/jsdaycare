/**
 * Admissions page — full CRUD tests.
 * Covers: Add Student (via /students/add), Edit (status/dates inline modal),
 * Delete (inline confirm Yes/No), filter tabs, stats bar.
 */
import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

test.describe("Admissions page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admissions");
    await page.getByRole("heading", { name: "Admissions" }).waitFor({ timeout: 8_000 });
  });

  // ── Stats bar ─────────────────────────────────────────────────────────────
  test("TC-admissions-stats: Stats bar shows Waitlist, Active, Withdrawn, Graduated counts", async ({ page }) => {
    await expect(page.getByText("Waitlist").first()).toBeVisible();
    await expect(page.getByText("Active").first()).toBeVisible();
    await expect(page.getByText("Withdrawn")).toBeVisible();
    await expect(page.getByText("Graduated")).toBeVisible();
  });

  // ── Filter tabs ───────────────────────────────────────────────────────────
  test("TC-admissions-filter-waitlist: Waitlist Only tab shows only waitlisted students", async ({ page }) => {
    await page.getByRole("button", { name: /waitlist only/i }).click();
    const rows = page.locator("tbody tr").filter({ hasNot: page.locator("td[colspan]") });
    const count = await rows.count();
    // Every visible status badge should be Waitlist (or table is empty)
    for (let i = 0; i < count; i++) {
      await expect(rows.nth(i).getByText(/waitlist/i)).toBeVisible();
    }
  });

  test("TC-admissions-filter-all: All Students tab shows all enrollment statuses", async ({ page }) => {
    await page.getByRole("button", { name: /all students/i }).click();
    await expect(page.locator("tbody tr").first()).toBeVisible({ timeout: 5_000 });
  });

  // ── Add Student ───────────────────────────────────────────────────────────
  test("TC-admissions-add-button: Add Student button navigates to /students/add", async ({ page }) => {
    await page.getByRole("link", { name: /add student/i }).click();
    await expect(page).toHaveURL(/\/students\/add/, { timeout: 5_000 });
    await expect(page.getByRole("heading", { name: /add student/i })).toBeVisible();
  });

  test("TC-admissions-add-required: Add Student form requires First and Last Name", async ({ page }) => {
    await page.goto("/students/add");
    await page.getByRole("button", { name: /add student/i }).click();
    // Should stay on /students/add (validation blocks submit)
    await expect(page).toHaveURL(/\/students\/add/);
  });

  test("TC-admissions-add-student: Admin can add a new waitlist student and it appears in the list", async ({ page }) => {
    await page.goto("/students/add");
    await page.getByRole("heading", { name: /add student/i }).waitFor({ timeout: 8_000 });

    // Fill first + last name via label-adjacent selectors
    await page.locator("label:has-text('First Name') ~ div input, label:has-text('First Name') + input").first().fill("TC-Student");
    await page.locator("label:has-text('Last Name') ~ div input, label:has-text('Last Name') ~ input").first().fill("AutoTest");
    await page.locator("select").filter({ hasText: /active|waitlist/i }).selectOption("waitlist");

    await page.getByRole("button", { name: /add student/i }).click();
    // Should redirect to /students on success
    await expect(page).toHaveURL(/\/admissions/, { timeout: 8_000 });

    // Verify on admissions page
    await page.goto("/admissions");
    await page.getByRole("button", { name: /waitlist only/i }).click();
    await expect(page.getByText("TC-Student AutoTest")).toBeVisible({ timeout: 6_000 });
  });

  // ── Edit ──────────────────────────────────────────────────────────────────
  test("TC-admissions-edit-button: Edit button opens modal with student name in title", async ({ page }) => {
    await page.getByRole("button", { name: /all students/i }).click();
    const firstRow = page.locator("tbody tr").filter({ hasNot: page.locator("td[colspan]") }).first();
    await firstRow.waitFor({ timeout: 6_000 });
    const studentName = await firstRow.locator("td").first().locator("a").innerText();
    await firstRow.locator("button").first().click();
    await expect(page.getByText(new RegExp(`Edit.*${studentName.split(" ")[0]}`, "i"))).toBeVisible({ timeout: 5_000 });
    await page.getByRole("button", { name: /cancel/i }).click();
  });

  test("TC-admissions-edit-status: Admin can change enrollment status via Edit modal", async ({ page }) => {
    // Navigate to add a fresh student to edit
    await page.goto("/students/add");
    await page.locator("label:has-text('First Name') ~ div input, label:has-text('First Name') + input").first().fill("TC-Edit");
    await page.locator("label:has-text('Last Name') ~ div input, label:has-text('Last Name') ~ input").first().fill("StatusTest");
    await page.locator("select").filter({ hasText: /active|waitlist/i }).selectOption("waitlist");
    await page.getByRole("button", { name: /add student/i }).click();
    await expect(page).toHaveURL(/\/admissions/, { timeout: 8_000 });

    await page.goto("/admissions");
    await page.getByRole("button", { name: /waitlist only/i }).click();
    const row = page.locator("tbody tr").filter({ hasText: "TC-Edit StatusTest" });
    await row.waitFor({ timeout: 6_000 });
    // Click edit
    await row.locator("button").first().click();
    // Change status to Active
    await page.locator("select").selectOption("active");
    await page.getByRole("button", { name: /save changes/i }).click();
    // Student disappears from Waitlist view
    await expect(page.locator("tbody tr").filter({ hasText: "TC-Edit StatusTest" })).not.toBeVisible({ timeout: 5_000 });
    // Appears in All Students as Active
    await page.getByRole("button", { name: /all students/i }).click();
    const updatedRow = page.locator("tbody tr").filter({ hasText: "TC-Edit StatusTest" });
    await expect(updatedRow.getByText(/enrolled/i)).toBeVisible({ timeout: 5_000 });
  });

  test("TC-admissions-edit-start-date: Edit modal has Start Date and End Date fields", async ({ page }) => {
    await page.getByRole("button", { name: /all students/i }).click();
    const firstRow = page.locator("tbody tr").filter({ hasNot: page.locator("td[colspan]") }).first();
    await firstRow.waitFor({ timeout: 6_000 });
    await firstRow.locator("button").first().click();
    await expect(page.locator("input[type='date']").first()).toBeVisible({ timeout: 5_000 });
    const dateCount = await page.locator("input[type='date']").count();
    expect(dateCount).toBe(2); // Start Date + End/Exit Date
    await page.getByRole("button", { name: /cancel/i }).click();
  });

  // ── Delete ────────────────────────────────────────────────────────────────
  test("TC-admissions-delete-confirm: Delete button shows inline Yes/No confirm", async ({ page }) => {
    await page.getByRole("button", { name: /all students/i }).click();
    const firstRow = page.locator("tbody tr").filter({ hasNot: page.locator("td[colspan]") }).first();
    await firstRow.waitFor({ timeout: 6_000 });
    const deleteBtn = firstRow.locator("button").last();
    await deleteBtn.click();
    await expect(firstRow.getByText(/delete\?/i)).toBeVisible({ timeout: 3_000 });
    await expect(firstRow.getByRole("button", { name: /^yes$/i })).toBeVisible();
    await expect(firstRow.getByRole("button", { name: /^no$/i })).toBeVisible();
  });

  test("TC-admissions-delete-cancel: Clicking No cancels delete and restores action buttons", async ({ page }) => {
    await page.getByRole("button", { name: /all students/i }).click();
    const firstRow = page.locator("tbody tr").filter({ hasNot: page.locator("td[colspan]") }).first();
    await firstRow.waitFor({ timeout: 6_000 });
    await firstRow.locator("button").last().click();
    await firstRow.getByRole("button", { name: /^no$/i }).click();
    // Edit/Delete buttons restored
    await expect(firstRow.locator("button").first()).toBeVisible({ timeout: 3_000 });
    await expect(firstRow.getByText(/delete\?/i)).not.toBeVisible();
  });

  test("TC-admissions-delete-student: Clicking Yes deletes student and removes from list", async ({ page }) => {
    // Add a throwaway student first
    await page.goto("/students/add");
    await page.locator("label:has-text('First Name') ~ div input, label:has-text('First Name') + input").first().fill("TC-Delete");
    await page.locator("label:has-text('Last Name') ~ div input, label:has-text('Last Name') ~ input").first().fill("MeNow");
    await page.getByRole("button", { name: /add student/i }).click();
    await expect(page).toHaveURL(/\/admissions/, { timeout: 8_000 });

    await page.goto("/admissions");
    await page.getByRole("button", { name: /all students/i }).click();
    const row = page.locator("tbody tr").filter({ hasText: "TC-Delete MeNow" });
    await row.waitFor({ timeout: 6_000 });
    await row.locator("button").last().click();
    await row.getByRole("button", { name: /^yes$/i }).click();
    await expect(page.locator("tbody tr").filter({ hasText: "TC-Delete MeNow" })).not.toBeVisible({ timeout: 6_000 });
  });

  // ── Navigation ────────────────────────────────────────────────────────────
  test("TC-admissions-name-link: Student name links to their profile page", async ({ page }) => {
    await page.getByRole("button", { name: /all students/i }).click();
    const firstLink = page.locator("tbody tr a").first();
    await firstLink.waitFor({ timeout: 6_000 });
    await firstLink.click();
    await expect(page).toHaveURL(/\/students\/[a-z0-9-]+/, { timeout: 8_000 });
  });
});

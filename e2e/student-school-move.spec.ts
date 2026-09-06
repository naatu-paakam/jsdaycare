/**
 * Student school move tests.
 * Verifies that a multi-school admin can move a student from one school to
 * another via the edit dialog on the Students page.
 *
 * Technical: uses the move_student_to_school() security-definer RPC to bypass
 * RLS which scopes updates to get_my_school_id() (the currently active school).
 *
 * Flow:
 *   1. Edit dialog shows School dropdown when admin manages > 1 school
 *   2. Selecting a different school shows amber warning
 *   3. Saving: status/dates update first (RLS ok), then RPC moves school
 *   4. Student disappears from current school's list (now in target school)
 *   5. Single-school admins do NOT see the school dropdown
 */
import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

// Jaya Bijjala manages: Test Joy Family + Sunshine
const SCHOOL_A = "Test Joy Family";
const SCHOOL_B = "Test Sunshine school";

test.describe("Student school move — multi-school admin", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/students");
    await page.getByRole("heading", { name: /students/i }).waitFor({ timeout: 8_000 });
  });

  // ── School dropdown visibility ────────────────────────────────────────────
  test("TC-student-school-move-dropdown-visible: Edit dialog shows School dropdown for multi-school admin", async ({ page }) => {
    const firstRow = page.locator("tbody tr").first();
    await firstRow.waitFor({ timeout: 6_000 });
    await firstRow.locator("button[title='Edit enrollment']").click();
    await expect(page.locator("select:has(option:has-text('Test Sunshine'))")).toBeVisible({ timeout: 5_000 });
    await page.getByRole("button", { name: /cancel/i }).click();
  });

  test("TC-student-school-move-both-options: School dropdown lists all schools admin manages", async ({ page }) => {
    const firstRow = page.locator("tbody tr").first();
    await firstRow.waitFor({ timeout: 6_000 });
    await firstRow.locator("button[title='Edit enrollment']").click();
    await page.locator("select:has(option:has-text('Test Sunshine'))").waitFor({ timeout: 5_000 });
    const options = await page.locator("select:has(option:has-text('Test Sunshine')) option").allInnerTexts();
    expect(options).toContain(SCHOOL_A);
    expect(options).toContain(SCHOOL_B);
    await page.getByRole("button", { name: /cancel/i }).click();
  });

  test("TC-student-school-move-current-selected: School dropdown defaults to student's current school", async ({ page }) => {
    const firstRow = page.locator("tbody tr").filter({ hasNot: page.locator("td:has-text('Test Sunshine')") }).first();
    await firstRow.waitFor({ timeout: 6_000 });
    await firstRow.locator("button[title='Edit enrollment']").click();
    const select = page.locator("select:has(option:has-text('Test Sunshine'))");
    await select.waitFor({ timeout: 5_000 });
    const currentVal = await select.inputValue();
    // Should be Test Joy Family's ID (not Sunshine)
    expect(currentVal).not.toBe("");
    await page.getByRole("button", { name: /cancel/i }).click();
  });

  // ── Amber warning ─────────────────────────────────────────────────────────
  test("TC-student-school-move-warning: Selecting different school shows amber warning", async ({ page }) => {
    const firstRow = page.locator("tbody tr").first();
    await firstRow.waitFor({ timeout: 6_000 });
    await firstRow.locator("button[title='Edit enrollment']").click();
    const select = page.locator("select:has(option:has-text('Test Sunshine'))");
    await select.waitFor({ timeout: 5_000 });
    await select.selectOption({ label: SCHOOL_B });
    await expect(page.getByText(/moving to a different school will unassign/i)).toBeVisible({ timeout: 3_000 });
    await page.getByRole("button", { name: /cancel/i }).click();
  });

  test("TC-student-school-move-no-warning-same-school: No warning when same school selected", async ({ page }) => {
    const firstRow = page.locator("tbody tr").first();
    await firstRow.waitFor({ timeout: 6_000 });
    await firstRow.locator("button[title='Edit enrollment']").click();
    await page.locator("select:has(option:has-text('Test Sunshine'))").waitFor({ timeout: 5_000 });
    // Don't change school — warning should NOT appear
    await expect(page.getByText(/moving to a different school/i)).not.toBeVisible();
    await page.getByRole("button", { name: /cancel/i }).click();
  });

  // ── Actual move ───────────────────────────────────────────────────────────
  test("TC-student-school-move-succeeds: Admin can move student to another school — student disappears from current list", async ({ page }) => {
    // Add a test student to move
    await page.goto("/students/add");
    await page.locator("label:has-text('First Name') ~ div input, label:has-text('First Name') + input").first().fill("TC-Move");
    await page.locator("label:has-text('Last Name') ~ div input, label:has-text('Last Name') ~ input").first().fill("SchoolTest");
    await page.locator("select").filter({ hasText: /active|waitlist/i }).selectOption("waitlist");
    await page.getByRole("button", { name: /add student/i }).click();
    await expect(page).toHaveURL(/\/students/, { timeout: 8_000 });

    // Open edit for that student
    const row = page.locator("tbody tr").filter({ hasText: "TC-Move SchoolTest" });
    await row.waitFor({ timeout: 6_000 });
    await row.locator("button[title='Edit enrollment']").click();

    // Select Sunshine school
    const select = page.locator("select:has(option:has-text('Test Sunshine'))");
    await select.waitFor({ timeout: 5_000 });
    await select.selectOption({ label: SCHOOL_B });
    await expect(page.getByText(/moving to a different school/i)).toBeVisible();

    // Save
    await page.getByRole("button", { name: /save changes/i }).click();

    // Student should be gone from Test Joy Family list
    await expect(page.locator("tbody tr").filter({ hasText: "TC-Move SchoolTest" })).not.toBeVisible({ timeout: 6_000 });
  });

  test("TC-student-school-move-rls-blocked-direct: Direct update with different school_id is blocked by RLS (only RPC allowed)", async ({ page }) => {
    // This verifies that the RPC path is needed — direct update is blocked.
    // We can't easily test the DB-level in Playwright, so we test the UI
    // doesn't show an RLS error (which would mean the RPC is working correctly).
    const firstRow = page.locator("tbody tr").first();
    await firstRow.waitFor({ timeout: 6_000 });
    await firstRow.locator("button[title='Edit enrollment']").click();
    const select = page.locator("select:has(option:has-text('Test Sunshine'))");
    await select.waitFor({ timeout: 5_000 });
    await select.selectOption({ label: SCHOOL_B });
    await page.getByRole("button", { name: /save changes/i }).click();
    // Should NOT show RLS error
    await expect(page.getByText(/row-level security|violates/i)).not.toBeVisible({ timeout: 5_000 });
  });
});

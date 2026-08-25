import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

test.beforeEach(async ({ page }) => {
  await loginAsAdmin(page);
});

test("TC-student-list: /students page loads with heading and table", async ({ page }) => {
  await page.goto("/students");
  await expect(page.getByRole("heading", { name: "Students" })).toBeVisible();
  // Table should exist
  await expect(page.locator("table")).toBeVisible({ timeout: 10_000 });
});

test("TC-add-student-form: clicking Add Student shows form with Name and DOB fields", async ({ page }) => {
  await page.goto("/students");
  await page.click('a[href="/students/add"], button:has-text("Add Student")');
  // Should navigate to add student page or show form
  await page.waitForURL("**/students/add", { timeout: 10_000 });
  await expect(page.getByText(/name/i).first()).toBeVisible();
  await expect(page.getByText(/dob|date of birth/i).first()).toBeVisible();
});

test("TC-student-profile: clicking student name loads profile with tabs", async ({ page }) => {
  await page.goto("/students");
  // Wait for a real data row — not the loading placeholder (which spans all cols)
  const realRow = page.locator("table tbody tr").filter({ hasNot: page.locator("td[colspan]") }).first();
  await realRow.waitFor({ state: "visible", timeout: 10_000 });

  const firstStudentLink = realRow.locator("td:first-child a");
  await firstStudentLink.click();
  await page.waitForURL("**/students/**", { timeout: 10_000 });

  await expect(page.getByText(/profile/i).first()).toBeVisible({ timeout: 8_000 });
  await expect(page.getByText(/contacts/i).first()).toBeVisible();
});

import { test, expect } from "@playwright/test";
import { loginAsAdmin, loginAsTeacher, loginAsParent } from "./helpers/auth";

// ─── Admin nav ────────────────────────────────────────────────────────────────

test.describe("Admin — left nav links", () => {
  test.beforeEach(async ({ page }) => { await loginAsAdmin(page); });

  test("TC-sidebar-home: Home link visible and navigates", async ({ page }) => {
    await page.goto("/students");
    // Home is a NavLink — click via text
    await page.locator("nav").getByText("Home").click();
    await expect(page).toHaveURL(/\/home/);
    await expect(page.getByText(/checked in today/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test("TC-sidebar-myschool: My School expands", async ({ page }) => {
    await page.goto("/home");
    const mySchool = page.getByRole("button", { name: /my school/i });
    await mySchool.click();
    await expect(page.getByRole("link", { name: /^students$/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /^rooms$/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /^calendar$/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /^schedules$/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /^menus$/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /^settings$/i })).toBeVisible();
  });

  test("TC-nav-students: navigates to /students", async ({ page }) => {
    await page.goto("/home");
    await page.getByRole("button", { name: /my school/i }).click();
    await page.getByRole("link", { name: /^students$/i }).click();
    await expect(page).toHaveURL(/\/students/);
    await expect(page.getByRole("heading", { name: /students/i })).toBeVisible();
  });

  test("TC-nav-parents: Parents link removed (contacts managed per-student)", async ({ page }) => {
    await page.goto("/home");
    await page.getByRole("button", { name: /my school/i }).click();
    // Parents link should NOT be in the sidebar (removed — contacts are per-student)
    await expect(page.getByRole("link", { name: /^parents$/i })).not.toBeVisible();
  });

  test("TC-nav-rooms: navigates to /rooms", async ({ page }) => {
    await page.goto("/home");
    await page.getByRole("button", { name: /my school/i }).click();
    await page.getByRole("link", { name: /^rooms$/i }).click();
    await expect(page).toHaveURL(/\/rooms/);
    await expect(page.getByRole("heading", { name: /rooms/i })).toBeVisible();
  });

  test("TC-nav-calendar: navigates to /calendar", async ({ page }) => {
    await page.goto("/home");
    await page.getByRole("button", { name: /my school/i }).click();
    await page.getByRole("link", { name: /^calendar$/i }).click();
    await expect(page).toHaveURL(/\/calendar/);
    await expect(page.getByRole("heading", { name: /calendar/i })).toBeVisible();
  });

  test("TC-nav-schedules: navigates to /schedule", async ({ page }) => {
    await page.goto("/home");
    await page.getByRole("button", { name: /my school/i }).click();
    await page.getByRole("link", { name: /^schedules$/i }).click();
    await expect(page).toHaveURL(/\/schedule/);
    await expect(page.getByRole("heading", { name: "Schedules", exact: true })).toBeVisible({ timeout: 8_000 });
  });

  test("TC-nav-menus: navigates to /menus", async ({ page }) => {
    await page.goto("/home");
    await page.getByRole("button", { name: /my school/i }).click();
    await page.getByRole("link", { name: /^menus$/i }).click();
    await expect(page).toHaveURL(/\/menus/);
    await expect(page.getByRole("heading", { name: /menus/i })).toBeVisible();
  });

  test("TC-nav-settings: navigates to /settings", async ({ page }) => {
    await page.goto("/home");
    await page.getByRole("button", { name: /my school/i }).click();
    await page.getByRole("link", { name: /^settings$/i }).click();
    await expect(page).toHaveURL(/\/settings/);
    await expect(page.getByRole("heading", { name: /settings/i })).toBeVisible();
  });

  test("TC-nav-staff: navigates to /staff", async ({ page }) => {
    await page.goto("/home");
    await page.getByRole("link", { name: /staff.*payroll/i }).click();
    await expect(page).toHaveURL(/\/staff/);
    await expect(page.getByRole("heading", { name: /staff/i })).toBeVisible();
  });

  test("TC-nav-admissions: navigates to /admissions", async ({ page }) => {
    await page.goto("/home");
    await page.getByRole("link", { name: /admissions/i }).click();
    await expect(page).toHaveURL(/\/admissions/);
    await expect(page.getByRole("heading", { name: /admissions/i })).toBeVisible();
  });

  test("TC-nav-paperwork: navigates to /paperwork", async ({ page }) => {
    await page.goto("/home");
    await page.getByRole("link", { name: /paperwork/i }).click();
    await expect(page).toHaveURL(/\/paperwork/);
    await expect(page.getByRole("heading", { name: /paperwork|forms/i })).toBeVisible();
  });

  test("TC-nav-reporting: navigates to /reporting", async ({ page }) => {
    await page.goto("/home");
    await page.getByRole("button", { name: /reporting/i }).click();
    await page.getByRole("link", { name: /^overview$/i }).click();
    await expect(page).toHaveURL(/\/reporting/);
    await expect(page.getByRole("heading", { name: /reporting|overview/i })).toBeVisible();
  });
});

// ─── Teacher nav ──────────────────────────────────────────────────────────────

test.describe("Teacher — nav and access", () => {
  test.beforeEach(async ({ page }) => { await loginAsTeacher(page); });

  test("TC-teacher-home: teacher lands on /home", async ({ page }) => {
    await expect(page).toHaveURL(/\/home/, { timeout: 10_000 });
  });

  test("TC-teacher-sees-students: can navigate to /students", async ({ page }) => {
    await page.getByRole("button", { name: /my school/i }).click();
    await page.getByRole("link", { name: /^students$/i }).click();
    await expect(page).toHaveURL(/\/students/);
    await expect(page.getByRole("heading", { name: /students/i })).toBeVisible();
  });

  test("TC-teacher-sees-rooms: can navigate to /rooms", async ({ page }) => {
    await page.getByRole("button", { name: /my school/i }).click();
    await page.getByRole("link", { name: /^rooms$/i }).click();
    await expect(page).toHaveURL(/\/rooms/);
    await expect(page.getByRole("heading", { name: /rooms/i })).toBeVisible();
  });
});

// ─── Parent nav ───────────────────────────────────────────────────────────────

test.describe("Parent — portal and access", () => {
  test.beforeEach(async ({ page }) => { await loginAsParent(page); });

  test("TC-parent-redirected: parent redirected to /parent portal", async ({ page }) => {
    await expect(page).toHaveURL(/\/parent/, { timeout: 10_000 });
  });

  test("TC-parent-sees-child: parent portal shows child name", async ({ page }) => {
    await expect(page.getByText(/adrith/i)).toBeVisible({ timeout: 15_000 });
  });

  test("TC-parent-no-admin: parent cannot access /home directly", async ({ page }) => {
    await page.goto("/home");
    // Should be redirected away from /home (back to /parent or /login)
    await expect(page).not.toHaveURL(/\/home/, { timeout: 5_000 });
  });

  test("TC-parent-no-students: parent cannot access /students directly", async ({ page }) => {
    await page.goto("/students");
    await expect(page).not.toHaveURL(/\/students/, { timeout: 5_000 });
  });
});

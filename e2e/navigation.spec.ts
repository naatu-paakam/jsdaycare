import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

test.beforeEach(async ({ page }) => {
  await loginAsAdmin(page);
});

test("TC-sidebar-home: sidebar shows Home link", async ({ page }) => {
  await expect(page.getByRole("link", { name: "Home" })).toBeVisible();
});

test("TC-sidebar-myschool: My School is expandable with Students, Rooms, Schedules links", async ({ page }) => {
  // My School is a collapsible button
  const mySchoolBtn = page.getByRole("button", { name: /my school/i });
  await expect(mySchoolBtn).toBeVisible();

  // Click to expand if not already
  const isOpen = await page.getByRole("link", { name: "Students" }).isVisible().catch(() => false);
  if (!isOpen) {
    await mySchoolBtn.click();
  }

  await expect(page.getByRole("link", { name: "Students" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Rooms" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Schedules" })).toBeVisible();
});

test("TC-sidebar-staff: Staff & Payroll link visible", async ({ page }) => {
  await expect(page.getByRole("link", { name: /staff & payroll/i })).toBeVisible();
});

test("TC-sidebar-paperwork: Paperwork link visible", async ({ page }) => {
  await expect(page.getByRole("link", { name: /paperwork/i })).toBeVisible();
});

test("TC-nav-to-students: clicking Students goes to /students", async ({ page }) => {
  // Expand My School if needed
  const mySchoolBtn = page.getByRole("button", { name: /my school/i });
  const isOpen = await page.getByRole("link", { name: "Students" }).isVisible().catch(() => false);
  if (!isOpen) {
    await mySchoolBtn.click();
  }
  await page.getByRole("link", { name: "Students" }).click();
  await expect(page).toHaveURL(/\/students/);
});

test("TC-nav-to-rooms: clicking Rooms goes to /rooms", async ({ page }) => {
  const mySchoolBtn = page.getByRole("button", { name: /my school/i });
  const isOpen = await page.getByRole("link", { name: "Rooms" }).isVisible().catch(() => false);
  if (!isOpen) {
    await mySchoolBtn.click();
  }
  await page.getByRole("link", { name: "Rooms" }).click();
  await expect(page).toHaveURL(/\/rooms/);
});

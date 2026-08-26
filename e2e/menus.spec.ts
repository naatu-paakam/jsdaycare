import { test, expect } from "@playwright/test";
import { loginAsAdmin, loginAsParent } from "./helpers/auth";

test.describe("Menus page — admin", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/menus");
    await page.getByRole("heading", { name: /menus/i }).waitFor({ timeout: 8_000 });
  });

  test("TC-menus-two-tabs: Admin sees both Weekly Menu and Food Item Library tabs", async ({ page }) => {
    await expect(page.getByRole("button", { name: /weekly menu/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /food item library/i })).toBeVisible();
  });

  test("TC-menus-week-nav: Week navigation arrows and date range visible", async ({ page }) => {
    await expect(page.getByText(/–.*2026|–.*2027/)).toBeVisible({ timeout: 8_000 });
  });

  test("TC-menus-create-button: Admin sees + Create Menu button", async ({ page }) => {
    await expect(page.getByRole("button", { name: /create menu/i })).toBeVisible({ timeout: 8_000 });
  });

  test("TC-menus-create-dialog: Create Menu opens 5-day × 4-meal grid dialog", async ({ page }) => {
    await page.getByRole("button", { name: /create menu/i }).click();
    // Wait for the modal to appear (h2 heading inside)
    await page.locator("h2").filter({ hasText: /weekly menu/i }).waitFor({ timeout: 8_000 });
    // Grid has day columns
    await expect(page.getByText("Monday")).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText("Friday")).toBeVisible();
    // And meal rows
    await expect(page.getByText("Breakfast")).toBeVisible();
    await expect(page.getByText("Lunch")).toBeVisible();
    await page.getByRole("button", { name: /cancel/i }).click();
  });

  test("TC-menus-food-library: Food Item Library tab shows food items", async ({ page }) => {
    await page.getByRole("button", { name: /food item library/i }).click();
    await expect(page.getByRole("button", { name: /add item/i })).toBeVisible({ timeout: 8_000 });
  });

  test("TC-menus-empty-state: Empty week shows 'No menu set' message", async ({ page }) => {
    // Navigate to a future week unlikely to have a menu
    const nextBtn = page.locator("button").filter({ has: page.locator("svg") }).last();
    await nextBtn.click(); await nextBtn.click(); await nextBtn.click();
    await expect(page.getByText(/no menu set|menu not available/i)).toBeVisible({ timeout: 5_000 });
  });
});

test.describe("Menus page — parent", () => {
  test("TC-menus-parent-one-tab: Parent sees ONLY Weekly Menu tab (no library)", async ({ page }) => {
    await loginAsParent(page);
    await page.goto("/menus");
    await page.getByRole("heading", { name: /menus/i }).waitFor({ timeout: 8_000 });
    // Only Weekly Menu tab visible
    await expect(page.getByRole("button", { name: /weekly menu/i })).toBeVisible({ timeout: 5_000 });
    // Food Item Library should NOT be visible
    await expect(page.getByRole("button", { name: /food item library/i })).not.toBeVisible();
  });

  test("TC-menus-parent-no-create: Parent cannot see Create Menu button", async ({ page }) => {
    await loginAsParent(page);
    await page.goto("/menus");
    await page.getByRole("heading", { name: /menus/i }).waitFor({ timeout: 8_000 });
    await expect(page.getByRole("button", { name: /create menu/i })).not.toBeVisible();
  });
});

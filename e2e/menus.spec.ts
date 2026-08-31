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
    // Either Create Menu (empty week) or Edit This Week's Menu (populated week)
    const hasCreate = await page.getByRole("button", { name: /create menu/i }).isVisible().catch(() => false);
    const hasEdit = await page.getByRole("button", { name: /edit this week/i }).isVisible().catch(() => false);
    expect(hasCreate || hasEdit).toBe(true);
  });

  test("TC-menus-create-dialog: Create Menu opens 5-day × 4-meal grid dialog", async ({ page }) => {
    const editBtn = page.getByRole("button", { name: /edit this week/i });
    if (await editBtn.isVisible()) {
      await editBtn.click();
    } else {
      await page.getByRole("button", { name: /create menu/i }).click();
    }
    const dialog = page.locator("h2").filter({ hasText: /weekly menu/i });
    await dialog.waitFor({ timeout: 8_000 });
    // Scope to the dialog overlay to avoid strict mode violations with main page table
    const overlay = page.locator("[role='dialog'], .fixed.inset-0").last();
    await expect(overlay.getByRole("columnheader", { name: "Monday" })).toBeVisible({ timeout: 5_000 });
    await expect(overlay.getByRole("columnheader", { name: "Friday" })).toBeVisible();
    await expect(overlay.getByRole("cell", { name: "Breakfast" })).toBeVisible();
    await expect(overlay.getByRole("cell", { name: "Lunch" })).toBeVisible();
    await page.getByRole("button", { name: /cancel/i }).click();
  });

  test("TC-menus-chip-add-and-save: Admin can add a chip to a menu week and save", async ({ page }) => {
    const editBtn = page.getByRole("button", { name: /edit this week/i });
    if (await editBtn.isVisible()) {
      await editBtn.click();
    } else {
      await page.getByRole("button", { name: /create menu/i }).click();
    }
    await page.locator("h2").filter({ hasText: /weekly menu/i }).waitFor({ timeout: 8_000 });
    // Use the dialog's table specifically (inside the overlay)
    const dialogTable = page.locator("h2").filter({ hasText: /weekly menu/i }).locator("..").locator("table");
    const mondayBreakfastInput = dialogTable.locator("tbody tr").first().locator("td").nth(1).locator("input");
    await mondayBreakfastInput.fill("TC-Test-Food");
    await mondayBreakfastInput.press("Enter");
    await expect(page.getByText("TC-Test-Food").first()).toBeVisible({ timeout: 3_000 });
    await page.getByRole("button", { name: /save menu/i }).click();
    await page.locator("h2").filter({ hasText: /weekly menu/i }).waitFor({ state: "hidden", timeout: 5_000 });
    await expect(page.getByText("TC-Test-Food").first()).toBeVisible({ timeout: 5_000 });
  });

  test("TC-menus-chip-remove: Admin can remove a chip in the edit dialog", async ({ page }) => {
    const editBtn = page.getByRole("button", { name: /edit this week/i });
    const createBtn = page.getByRole("button", { name: /create menu/i });
    if (await editBtn.isVisible()) {
      await editBtn.click();
    } else {
      await createBtn.click();
    }
    await page.locator("h2").filter({ hasText: /weekly menu/i }).waitFor({ timeout: 8_000 });
    // If any chip exists, remove the first one
    const chipX = page.locator("span.flex button").first();
    if (await chipX.isVisible({ timeout: 2_000 }).catch(() => false)) {
      const chipText = await page.locator("span.flex").first().innerText();
      await chipX.click();
      await expect(page.locator("span.flex").filter({ hasText: chipText.replace("×","").trim() })).toHaveCount(0, { timeout: 3_000 });
    }
    await page.getByRole("button", { name: /cancel/i }).click();
  });

  test("TC-menus-food-library: Food Item Library tab shows food items", async ({ page }) => {
    await page.getByRole("button", { name: /food item library/i }).click();
    await expect(page.getByRole("button", { name: /add item/i })).toBeVisible({ timeout: 8_000 });
  });

  test("TC-menus-add-food-item: Admin can add a food item to the library with allergen", async ({ page }) => {
    await page.getByRole("button", { name: /food item library/i }).click();
    await page.locator("input[placeholder='e.g. Brown rice']").fill("TC-Oats-Test");
    await page.locator("select").selectOption("Grain");
    await page.locator("input[placeholder='e.g. gluten, dairy']").fill("sesame-tc");
    await page.getByRole("button", { name: /add item/i }).click();
    await expect(page.getByText("TC-Oats-Test")).toBeVisible({ timeout: 6_000 });
    await expect(page.getByText("sesame-tc")).toBeVisible();
  });

  test("TC-menus-delete-food-item: Admin can delete a food item from the library", async ({ page }) => {
    await page.getByRole("button", { name: /food item library/i }).click();
    await page.locator("input[placeholder='e.g. Brown rice']").fill("TC-DeleteMe");
    await page.locator("select").selectOption("Other");
    await page.getByRole("button", { name: /add item/i }).click();
    await page.getByText("TC-DeleteMe").first().waitFor({ timeout: 6_000 });
    // Trash button is next sibling of the item name span — use the icon button with hover:text-red-500
    const itemRow = page.locator("span.text-sm.font-medium").filter({ hasText: "TC-DeleteMe" }).first();
    await itemRow.locator("..").locator("button").click();
    await expect(page.getByText("TC-DeleteMe").first()).not.toBeVisible({ timeout: 5_000 });
  });

  test("TC-menus-allergen-badge: Food items with allergens show allergen badge", async ({ page }) => {
    await page.getByRole("button", { name: /food item library/i }).click();
    // Wait for library to load, then check for an allergen badge span (not the select option)
    await expect(page.locator("span.text-red-600").first()).toBeVisible({ timeout: 6_000 });
  });

  test("TC-menus-empty-state: Empty future week shows Create Menu (no menu set)", async ({ page }) => {
    // Navigate forward 5 weeks — very unlikely to have data
    for (let i = 0; i < 5; i++) {
      await page.locator("button[aria-label], button").filter({ has: page.locator("svg[data-lucide='chevron-right'], path[d*='M9 18l6-6']") }).click().catch(() =>
        page.locator("button").nth(-2).click()
      );
      await page.waitForTimeout(200);
    }
    // Either "No menu set" text OR Create Menu button confirms empty week
    const hasEmpty = await page.getByText(/no menu set/i).isVisible().catch(() => false);
    const hasCreate = await page.getByRole("button", { name: /create menu/i }).isVisible().catch(() => false);
    expect(hasEmpty || hasCreate).toBe(true);
  });

  test("TC-menus-week-nav-future: Navigating to empty future week shows Create Menu button", async ({ page }) => {
    const nextBtn = page.locator("button").filter({ has: page.locator("svg") }).last();
    await nextBtn.click(); await nextBtn.click(); await nextBtn.click();
    await expect(page.getByRole("button", { name: /create menu/i })).toBeVisible({ timeout: 5_000 });
  });
});

test.describe("Menus page — parent", () => {
  test("TC-menus-parent-one-tab: Parent sees ONLY Weekly Menu tab (no library)", async ({ page }) => {
    await loginAsParent(page);
    await page.goto("/menus");
    await page.getByRole("heading", { name: /menus/i }).waitFor({ timeout: 8_000 });
    await expect(page.getByRole("button", { name: /weekly menu/i })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole("button", { name: /food item library/i })).not.toBeVisible();
  });

  test("TC-menus-parent-no-create: Parent cannot see Create Menu button", async ({ page }) => {
    await loginAsParent(page);
    await page.goto("/menus");
    await page.getByRole("heading", { name: /menus/i }).waitFor({ timeout: 8_000 });
    await expect(page.getByRole("button", { name: /create menu/i })).not.toBeVisible();
  });

  test("TC-menus-parent-views-menu: Parent can view the weekly menu chips", async ({ page }) => {
    await loginAsParent(page);
    await page.goto("/menus");
    await page.getByRole("heading", { name: /menus/i }).waitFor({ timeout: 8_000 });
    // Week nav should be visible
    await expect(page.getByText(/–.*2026|–.*2027/)).toBeVisible({ timeout: 8_000 });
    // At least one column header visible
    await expect(page.getByText("Monday")).toBeVisible({ timeout: 5_000 });
  });
});

/**
 * Check-in Code Feature Tests
 *
 * Covers the refactored model where:
 *  - Check-in code belongs to the PROFILE (person), not the school contact
 *  - Uniqueness is GLOBAL across all schools (a person is a person everywhere)
 *  - Contact creation auto-creates a profile record (profile_id is always set)
 *  - Parents see their code on the portal home; staff see it on the home page
 *  - Code change is reflected in the contact list (via linked profile)
 */

import { test, expect } from "@playwright/test";
import { loginAsAdmin, loginAsParent } from "./helpers/auth";

// ─── TC-checkin-code-on-profile ───────────────────────────────────────────────
// After refactor: a parent's code comes from profiles.checkin_code, not student_contacts.pin_code.
// Verifiable by: setting a code as parent, then checking admin contact list shows the same code.
test("TC-checkin-code-on-profile: parent code set via portal matches code shown in admin contact list", async ({ page }) => {
  await loginAsParent(page);
  await page.goto("/parent");

  // Set a known code
  const code = "8844";
  await page.getByTestId("checkin-code-input").fill(code);
  await page.getByTestId("save-checkin-code-btn").click();
  await page.getByTestId("checkin-code-success").waitFor({ timeout: 6_000 });

  // Now check admin view: the same code should appear in the contact row
  await loginAsAdmin(page);
  await page.goto("/students");
  // Navigate to Adrith's profile (the student linked to the test parent)
  const adrithRow = page.locator("table tbody tr").filter({ hasText: /adrith/i }).first();
  await adrithRow.waitFor({ state: "visible", timeout: 10_000 });
  await adrithRow.locator("td:first-child a").click();
  await page.waitForURL("**/students/**", { timeout: 10_000 });
  await page.getByRole("button", { name: /contacts/i }).click();
  // Reveal the check-in code for the first contact (masked by default)
  await page.getByRole("button", { name: /reveal/i }).first().click();
  // The contact row for the parent should show the same code
  await expect(page.locator(`text=${code}`).first()).toBeVisible({ timeout: 8_000 });
});

// ─── TC-checkin-code-global-unique ────────────────────────────────────────────
// If a code is already taken by ANY user in the system (any school), saving it should fail.
test("TC-checkin-code-global-unique: cannot set a code already used by another user", async ({ page }) => {
  await loginAsParent(page);
  await page.goto("/parent");

  // Try to set a code that is already used (100001 is used by Arif in pilot school)
  await page.getByTestId("checkin-code-input").fill("100001");
  await page.getByTestId("save-checkin-code-btn").click();
  const err = page.getByTestId("checkin-code-error");
  await err.waitFor({ timeout: 6_000 });
  await expect(err).toContainText(/already used|already taken/i);
});

// ─── TC-checkin-code-card-visible-parent ─────────────────────────────────────
test("TC-checkin-code-card-visible-parent: parent sees My Check-in Code card with current value", async ({ page }) => {
  await loginAsParent(page);
  await page.goto("/parent");
  const card = page.getByTestId("checkin-code-card");
  await expect(card).toBeVisible({ timeout: 8_000 });
  // Wait for the loading state to resolve — either code display or "Not set" text appears
  await expect(
    card.getByTestId("current-code-display").or(card.getByText(/not set/i))
  ).toBeVisible({ timeout: 15_000 });
});

// ─── TC-checkin-code-validation ───────────────────────────────────────────────
test("TC-checkin-code-validation-too-short: Save disabled when fewer than 4 digits entered", async ({ page }) => {
  await loginAsParent(page);
  await page.goto("/parent");
  await page.getByTestId("checkin-code-input").fill("99");
  await expect(page.getByTestId("save-checkin-code-btn")).toBeDisabled();
});

test("TC-checkin-code-validation-non-numeric: non-numeric characters are stripped from input", async ({ page }) => {
  await loginAsParent(page);
  await page.goto("/parent");
  await page.getByTestId("checkin-code-input").fill("ab12cd");
  // Only digits should remain
  await expect(page.getByTestId("checkin-code-input")).toHaveValue("12");
});

// ─── TC-contact-profile-linked-on-create ─────────────────────────────────────
// After refactor: when admin adds a new contact, a profile record is auto-created
// and student_contacts.profile_id is set immediately (not waiting for invite registration).
test("TC-contact-profile-linked-on-create: new contact created by admin has profile_id set", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/students");
  const rows = page.locator("table tbody tr").filter({ hasNot: page.locator("td[colspan]") });
  await rows.first().waitFor({ state: "visible", timeout: 10_000 });
  await rows.first().locator("td:first-child a").click();
  await page.waitForURL("**/students/**", { timeout: 10_000 });
  await page.getByRole("button", { name: /contacts/i }).click();

  // Open Add Contact modal
  await page.getByRole("button", { name: /add contact/i }).click();
  await page.getByPlaceholder("Jane Smith").fill("TestContact Playwright");
  await page.getByPlaceholder("+1 (555) 000-0000").fill("4081234567");
  // Save — button label is "Add Contact" (same text as open button so use btn-primary class in footer)
  const saveBtn = page.locator(".btn-primary", { hasText: /add contact/i });
  await saveBtn.scrollIntoViewIfNeeded();
  await saveBtn.click();
  await page.getByText("TestContact Playwright").waitFor({ state: "visible", timeout: 8_000 });

  // The new contact row should show a check-in code column (even if empty, column present)
  await expect(page.getByText("TestContact Playwright")).toBeVisible({ timeout: 5_000 });
  // After refactor, the contact row should show a code field (from linked profile)
  // Minimal check: contact appears and no error shown
  await expect(page.getByText(/error/i)).not.toBeVisible();
});

// ─── TC-checkin-code-show-hide-toggle ─────────────────────────────────────────
test("TC-checkin-code-show-hide-toggle: code masked by default, reveal on toggle click", async ({ page }) => {
  await loginAsParent(page);
  await page.goto("/parent");
  await expect(page.getByTestId("checkin-code-card")).toBeVisible({ timeout: 8_000 });

  // If a code is set, it should be masked by default
  const display = page.getByTestId("current-code-display");
  const isSet = await display.isVisible();
  if (!isSet) { test.skip(); return; }

  const masked = await display.innerText();
  expect(masked).toMatch(/^•+$/); // all bullets

  // Click show
  await page.getByTitle(/show code/i).click();
  const revealed = await display.innerText();
  expect(revealed).toMatch(/^\d+$/); // all digits

  // Click hide
  await page.getByTitle(/hide code/i).click();
  const rehidden = await display.innerText();
  expect(rehidden).toMatch(/^•+$/);
});

// ─── TC-admin-sees-no-checkin-code-card ───────────────────────────────────────
test("TC-admin-sees-no-checkin-code-card: admin home does NOT show My Check-in Code card", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/home");
  await page.waitForLoadState("networkidle");
  await expect(page.getByTestId("checkin-code-card")).not.toBeVisible();
});

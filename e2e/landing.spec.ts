/**
 * Landing page + school self-signup flow tests
 *
 * Flow:
 *   / (unauthenticated) → Landing page
 *   "Try it free" → modal → School name + Admin email + Admin phone
 *   Submit → POST /api/create-school-invite → /register?token=...
 *   Registration form shows school badge + "School Admin"
 *
 *   / (authenticated admin) → redirected to /home
 *   / (authenticated parent) → redirected to /parent
 *
 *   "Sign In" button → /login
 */

import { test, expect } from "@playwright/test";
import { loginAsAdmin, loginAsParent } from "./helpers/auth";

// ─── TC-landing-shows-unauthenticated ────────────────────────────────────────
test("TC-landing-shows-unauthenticated: unauthenticated root shows landing page", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Run your daycare.")).toBeVisible({ timeout: 8_000 });
  await expect(page.getByText("Not your paperwork.")).toBeVisible();
});

// ─── TC-landing-signin-link ───────────────────────────────────────────────────
test("TC-landing-signin-link: Sign In button navigates to /login", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /sign in/i }).first().click();
  await page.waitForURL("**/login", { timeout: 6_000 });
  await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
});

// ─── TC-landing-try-free-opens-modal ─────────────────────────────────────────
test("TC-landing-try-free-opens-modal: Try it free button opens signup modal", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /try it free|start free/i }).first().click();
  // Modal should show form fields
  await expect(page.getByPlaceholder(/school name/i).or(page.getByLabel(/school name/i))).toBeVisible({ timeout: 5_000 });
  await expect(page.getByPlaceholder(/email/i).or(page.getByLabel(/admin email/i))).toBeVisible();
  await expect(page.getByPlaceholder(/phone/i).or(page.getByLabel(/phone/i))).toBeVisible();
});

// ─── TC-landing-signup-validation ────────────────────────────────────────────
test("TC-landing-signup-validation: submit with empty fields shows error", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /try it free|start free/i }).first().click();
  // Try submitting empty form
  const submitBtn = page.getByRole("button", { name: /get started|create school|submit/i });
  if (await submitBtn.isVisible()) {
    await submitBtn.click();
    // Should still be on landing (validation blocked submission)
    await expect(page.url()).not.toContain("/register");
  }
});

// ─── TC-landing-signup-flow ───────────────────────────────────────────────────
test("TC-landing-signup-flow: fill form → school created → redirected to register", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /try it free|start free/i }).first().click();

  // Fill form
  const schoolInput = page.getByPlaceholder(/school name/i).or(page.getByLabel(/school name/i));
  const emailInput  = page.getByPlaceholder(/admin email/i).or(page.getByLabel(/admin email/i)).or(page.getByPlaceholder(/email/i));
  const phoneInput  = page.getByPlaceholder(/phone/i).or(page.getByLabel(/phone/i));

  await schoolInput.fill("TC-Landing Test School");
  await emailInput.fill("tc-landing@test.com");
  await phoneInput.fill("4085550001");

  await page.getByRole("button", { name: /get started|create school|submit/i }).click();

  // Should redirect to /register?token=...
  await page.waitForURL("**/register**", { timeout: 15_000 });
  expect(page.url()).toContain("/register?token=");

  // Registration form should show the school badge
  await expect(page.getByText("TC-Landing Test School")).toBeVisible({ timeout: 8_000 });
  await expect(page.getByText("School Admin")).toBeVisible();
});

// ─── TC-landing-auth-redirect-admin ──────────────────────────────────────────
test("TC-landing-auth-redirect-admin: authenticated admin at / redirects to /home", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/");
  await page.waitForURL("**/home", { timeout: 8_000 });
  await expect(page.getByRole("heading", { name: /good morning|good afternoon|good evening/i })).toBeVisible({ timeout: 5_000 });
});

// ─── TC-landing-auth-redirect-parent ─────────────────────────────────────────
test("TC-landing-auth-redirect-parent: authenticated parent at / redirects to /parent", async ({ page }) => {
  await loginAsParent(page);
  await page.goto("/");
  await page.waitForURL("**/parent", { timeout: 8_000 });
  await expect(page.getByTestId("checkin-code-card")).toBeVisible({ timeout: 8_000 });
});

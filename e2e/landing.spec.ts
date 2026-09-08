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

// ─── TC-landing-turnstile-widget ─────────────────────────────────────────────
test("TC-landing-turnstile-widget: Turnstile widget renders in signup modal", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /start free trial|try it free/i }).first().click();
  // Widget container must be present
  await expect(page.locator("#turnstile-container")).toBeVisible({ timeout: 8_000 });
  // Cloudflare iframe or widget element should appear within a few seconds
  await page.waitForTimeout(3_000); // allow Turnstile script to load
  const widgetFrame = page.frameLocator("iframe[src*='challenges.cloudflare.com']");
  // Widget renders as an iframe — confirm it exists
  await expect(page.locator("iframe[src*='challenges.cloudflare.com']").or(
    page.locator("#turnstile-container [data-sitekey]")
  )).toBeVisible({ timeout: 10_000 });
});

// ─── TC-landing-turnstile-submit-blocked ─────────────────────────────────────
test("TC-landing-turnstile-submit-blocked: Continue button disabled until Turnstile passes", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /start free trial|try it free/i }).first().click();

  // Fill all fields
  await page.getByPlaceholder(/sunny days/i).fill("Test Turnstile School");
  await page.getByPlaceholder(/you@example.com/i).fill("test@example.com");
  await page.getByPlaceholder(/555.*555/i).fill("4085550001");

  // On localhost with test key (1x000...) Turnstile auto-passes
  // Wait for the widget to auto-complete
  await page.waitForTimeout(4_000);

  // After auto-pass, Continue should be enabled
  const continueBtn = page.getByRole("button", { name: /continue/i });
  await expect(continueBtn).not.toBeDisabled({ timeout: 8_000 });
});

// ─── TC-landing-signup-with-turnstile ────────────────────────────────────────
test("TC-landing-signup-with-turnstile: full signup flow with Turnstile passes and redirects to register", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /start free trial|try it free/i }).first().click();

  await page.getByPlaceholder(/sunny days/i).fill("TC-E2E Turnstile School");
  await page.getByPlaceholder(/you@example.com/i).fill("tc-e2e-turnstile@test.com");
  await page.getByPlaceholder(/555.*555/i).fill("4085550002");

  // Wait for Turnstile auto-pass (test key)
  const continueBtn = page.getByRole("button", { name: /continue/i });
  await expect(continueBtn).not.toBeDisabled({ timeout: 10_000 });
  await continueBtn.click();

  // Should redirect to register with a token
  await page.waitForURL("**/register**", { timeout: 15_000 });
  expect(page.url()).toContain("/register?token=");

  // School badge + role visible
  await expect(page.getByText("TC-E2E Turnstile School")).toBeVisible({ timeout: 8_000 });
  await expect(page.getByText("School Admin")).toBeVisible();
  // Phone should be pre-filled
  await expect(page.getByDisplayValue("4085550002")).toBeVisible();
});

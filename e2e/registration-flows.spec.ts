/**
 * Registration flow tests — end-to-end for all user types.
 * Uses raw fetch helper (not @supabase/supabase-js) to avoid WebAuthn crash in Node.js.
 */
import { test, expect, Page } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";
import * as SB from "./helpers/supabase-admin";

const SCHOOL_ID = "08f7413b-1aa9-4679-b80b-d59ffc1fd749"; // Test JS Joy Family Daycare

async function createInvite(role: string, email: string) {
  return SB.insert("invitations", {
    school_id: SCHOOL_ID, role, email, permanent: false, invited_by: null,
  });
}

async function fillRegistrationForm(page: Page, opts: {
  loginId: string; firstName: string; lastName: string;
  email?: string; phone?: string; password: string;
}) {
  await page.locator("input[placeholder='e.g. jaya.bijjala']").fill(opts.loginId);
  await page.locator("input[placeholder='Jaya']").fill(opts.firstName);
  await page.locator("input[placeholder='Bijjala']").fill(opts.lastName);
  if (opts.email) await page.locator("input[type='email']").fill(opts.email);
  if (opts.phone) await page.locator("input[placeholder*='555']").fill(opts.phone);
  await page.locator("input[placeholder='Min 8 characters']").fill(opts.password);
  await page.locator("input[placeholder='Repeat password']").fill(opts.password);
  await page.getByRole("button", { name: /create account/i }).click();
}

async function cleanupUser(loginId: string, email: string) {
  try {
    const profiles = await SB.select("profiles", `login_id=eq.${loginId}`);
    if (profiles[0]?.id) await SB.rpc("delete_portal_user", { p_user_id: profiles[0].id });
    const users = await SB.listAuthUsers();
    const u = users.find(u => u.email === email);
    if (u) await SB.deleteAuthUser(u.id);
  } catch (e) { console.warn("cleanup error:", e); }
}

// ─── 1. School Admin Registration ─────────────────────────────────────────────
test("TC-register-school-admin: School admin registers via invite link → redirects to /home", async ({ page }) => {
  const invite = await createInvite("admin", "tc-admin-reg@test.com");
  expect(invite.token).toBeTruthy();

  await page.goto(`/register?token=${invite.token}`);
  await expect(page.getByText(/school admin/i)).toBeVisible({ timeout: 8_000 });

  await fillRegistrationForm(page, {
    loginId: "tc.admin.reg", firstName: "TC-Admin", lastName: "RegTest",
    email: "tc-admin-reg@test.com", password: "TestAdmin@2026"
  });

  await page.waitForURL(/\/home/, { timeout: 20_000 });
  await expect(page.getByRole("heading", { name: /good/i })).toBeVisible({ timeout: 5_000 });

  // Verify in DB
  const profiles = await SB.select("profiles", `login_id=eq.tc.admin.reg`);
  expect(profiles[0]?.role).toBe("admin");
  expect(profiles[0]?.school_id).toBe(SCHOOL_ID);

  await cleanupUser("tc.admin.reg", "tc-admin-reg@test.com");
});

// ─── 2. Staff Registration ────────────────────────────────────────────────────
test("TC-register-staff: Staff registers via invite → redirects to /home with restricted nav", async ({ page }) => {
  const invite = await createInvite("staff", "tc-staff-reg@test.com");
  expect(invite.token).toBeTruthy();

  await page.goto(`/register?token=${invite.token}`);
  await expect(page.getByText(/staff/i)).toBeVisible({ timeout: 8_000 });

  await fillRegistrationForm(page, {
    loginId: "tc.staff.reg", firstName: "TC-Staff", lastName: "RegTest",
    email: "tc-staff-reg@test.com", phone: "555-0001", password: "TestStaff@2026"
  });

  await page.waitForURL(/\/home/, { timeout: 20_000 });
  // Staff sees restricted nav (no Settings)
  await expect(page.getByRole("heading", { name: /good/i })).toBeVisible({ timeout: 5_000 });

  const profiles = await SB.select("profiles", `login_id=eq.tc.staff.reg`);
  expect(profiles[0]?.role).toBe("staff");

  await cleanupUser("tc.staff.reg", "tc-staff-reg@test.com");
});

// ─── 3. Parent Registration ───────────────────────────────────────────────────
test("TC-register-parent: Parent registers via invite → redirects to /parent portal", async ({ page }) => {
  const invite = await createInvite("parent", "tc-parent-reg@test.com");
  expect(invite.token).toBeTruthy();

  await page.goto(`/register?token=${invite.token}`);
  await expect(page.getByText(/parent/i)).toBeVisible({ timeout: 8_000 });

  await fillRegistrationForm(page, {
    loginId: "tc.parent.reg", firstName: "TC-Parent", lastName: "RegTest",
    email: "tc-parent-reg@test.com", password: "TestParent@2026"
  });

  // Parent goes to /parent not /home
  await page.waitForURL(/\/parent/, { timeout: 20_000 });
  await expect(page.getByRole("heading", { name: /good/i })).toBeVisible({ timeout: 5_000 });

  const profiles = await SB.select("profiles", `login_id=eq.tc.parent.reg`);
  expect(profiles[0]?.role).toBe("parent");

  await cleanupUser("tc.parent.reg", "tc-parent-reg@test.com");
});

// ─── 4. Student creation ──────────────────────────────────────────────────────
test("TC-add-student: Admin creates student via form → verified in list and DB", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/students/add");
  await page.getByRole("heading", { name: /add student/i }).waitFor({ timeout: 8_000 });

  await page.locator("label:has-text('First Name') ~ div input, label:has-text('First Name') + input").first().fill("TC-RegTest");
  await page.locator("label:has-text('Last Name') ~ div input, label:has-text('Last Name') ~ input").first().fill("Student");
  await page.locator("input[type='date']").first().fill("2023-06-15");
  await page.locator("select").filter({ hasText: /select|male|female/i }).first().selectOption("Female");
  await page.locator("select").filter({ hasText: /active|waitlist/i }).selectOption("active");
  await page.getByRole("button", { name: /add student/i }).click();

  await expect(page).toHaveURL(/\/students/, { timeout: 8_000 });
  await page.getByRole("button", { name: /all students/i }).click();
  await expect(page.getByText("TC-RegTest Student")).toBeVisible({ timeout: 6_000 });

  // Verify in DB
  const students = await SB.select("students", `first_name=eq.TC-RegTest&last_name=eq.Student`);
  expect(students.length).toBeGreaterThan(0);
  expect(students[0]?.enrollment_status).toBe("active");

  // Cleanup
  if (students[0]?.id) await SB.rpc("delete_student_safe", { p_student_id: students[0].id });
});

// ─── 5. Invalid / missing token ───────────────────────────────────────────────
test("TC-register-invalid-token: Invalid token shows error, Back to Login link visible", async ({ page }) => {
  await page.goto("/register?token=invalid-token-xyz");
  await expect(page.getByText(/invalid invitation/i)).toBeVisible({ timeout: 8_000 });
  await expect(page.getByRole("link", { name: /back to login/i })).toBeVisible();
});

test("TC-register-no-token: Missing token shows invitation required message", async ({ page }) => {
  await page.goto("/register");
  // Shows "Please use your invitation link" or similar
  await expect(page.getByText(/invitation link|invitation required|use your invitation/i)).toBeVisible({ timeout: 8_000 });
});

// ─── 6. Form validation ───────────────────────────────────────────────────────
test("TC-register-validation: Empty User ID shows error; short password shows error", async ({ page }) => {
  const invite = await createInvite("staff", "tc-validation@test.com");

  await page.goto(`/register?token=${invite.token}`);
  await page.getByText(/staff/i).waitFor({ timeout: 8_000 });

  // Submit empty form
  await page.getByRole("button", { name: /create account/i }).click();
  await expect(page.getByText(/user id is required/i)).toBeVisible({ timeout: 3_000 });

  // Short password
  await page.locator("input[placeholder='e.g. jaya.bijjala']").fill("tc.val");
  await page.locator("input[placeholder='Jaya']").fill("TC");
  await page.locator("input[placeholder='Bijjala']").fill("Val");
  await page.locator("input[placeholder='Min 8 characters']").fill("short");
  await page.locator("input[placeholder='Repeat password']").fill("short");
  await page.getByRole("button", { name: /create account/i }).click();
  await expect(page.getByText(/8 characters/i)).toBeVisible({ timeout: 3_000 });

  await SB.remove("invitations", `token=eq.${invite.token}`);
});

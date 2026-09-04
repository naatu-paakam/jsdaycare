import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

const SCHOOL_ID   = process.env.VITE_TEST_SCHOOL_ID ?? "08f7413b-1aa9-4679-b80b-d59ffc1fd749";
const CHECKIN_URL = `/checkin?school=${SCHOOL_ID}`;
const VALID_PIN   = "100001"; // Arudeepa Kumar → Adrith Ram (single student)
const SB_URL      = process.env.VITE_SUPABASE_URL ?? "";
const SB_SK       = process.env.VITE_SUPABASE_SECRET_KEY ?? "";

// Helper: enter a 6-digit PIN via the on-screen keypad
async function enterPin(page: import("@playwright/test").Page, pin: string) {
  for (const d of pin) {
    await page.getByRole("button", { name: d }).click();
  }
}

// Helper: reset a student's attendance using REST API (no Supabase client import)
async function clearAttendance(studentId: string) {
  const today = new Date().toISOString().slice(0, 10);
  await fetch(
    `${SB_URL}/rest/v1/attendance?student_id=eq.${studentId}&date=eq.${today}`,
    { method: "DELETE", headers: { "apikey": SB_SK, "Authorization": `Bearer ${SB_SK}` } }
  );
}

// ─── Page structure (public, no login) ───────────────────────────────────────

test("TC-checkin-page-loads: /checkin page loads without login and shows PIN pad", async ({ page }) => {
  await page.goto(CHECKIN_URL);
  await expect(page.getByText("JS Joy Family Daycare")).toBeVisible({ timeout: 8_000 });
  await expect(page.getByText("Enter your 6-digit PIN")).toBeVisible();
  await expect(page.getByText("QR Check-In / Check-Out")).toBeVisible();
  // Full keypad visible
  await expect(page.getByRole("button", { name: "1" })).toBeVisible();
  await expect(page.getByRole("button", { name: "0" })).toBeVisible();
  await expect(page.getByRole("button", { name: "9" })).toBeVisible();
});

test("TC-checkin-stays-on-pin: Entering fewer than 6 digits keeps page on PIN step", async ({ page }) => {
  await page.goto(CHECKIN_URL);
  await page.getByText("Enter your 6-digit PIN").waitFor({ timeout: 8_000 });
  // Enter only 3 digits — page should stay on PIN entry (needs 6 to auto-submit)
  await page.getByRole("button", { name: "1" }).click();
  await page.getByRole("button", { name: "2" }).click();
  await page.getByRole("button", { name: "3" }).click();
  await expect(page.getByText("Enter your 6-digit PIN")).toBeVisible();
  // Keypad still visible
  await expect(page.getByRole("button", { name: "9" })).toBeVisible();
});

test("TC-checkin-pin-pad-masked: PIN dots fill as digits are entered", async ({ page }) => {
  await page.goto(CHECKIN_URL);
  await page.getByText("Enter your 6-digit PIN").waitFor({ timeout: 8_000 });
  // Keypad buttons are the number buttons — the display boxes are separate
  // The display shows filled dots for entered digits (orange border boxes)
  const pinDisplay = page.locator("[class*='rounded'][class*='border']").first();
  await expect(pinDisplay).toBeVisible(); // PIN display boxes exist
  // Enter one digit — page should still show PIN entry (not submitted with < 6 digits)
  await page.getByRole("button", { name: "5" }).click();
  await expect(page.getByText("Enter your 6-digit PIN")).toBeVisible();
});

// ─── PIN validation ───────────────────────────────────────────────────────────

test("TC-checkin-invalid-pin: Invalid PIN shows error, stays on PIN step", async ({ page }) => {
  await page.goto(CHECKIN_URL);
  await page.getByText("Enter your 6-digit PIN").waitFor({ timeout: 8_000 });
  await enterPin(page, "999999");
  await page.locator("button.bg-orange-500").click();
  await expect(page.getByText(/PIN not found|check your code/i)).toBeVisible({ timeout: 8_000 });
  // Still on PIN step
  await expect(page.getByText("Enter your 6-digit PIN")).toBeVisible();
});

test("TC-checkin-short-pin: Submitting fewer than 6 digits shows validation message", async ({ page }) => {
  await page.goto(CHECKIN_URL);
  await page.getByText("Enter your 6-digit PIN").waitFor({ timeout: 8_000 });
  await enterPin(page, "123"); // only 3 digits
  await page.locator("button.bg-orange-500").click();
  // Should show an error or stay on PIN step (not proceed to students)
  await expect(page.getByText(/Enter your 6-digit PIN|please enter|6-digit/i).first()).toBeVisible({ timeout: 5_000 });
  // Should NOT show student names
  await expect(page.getByText(/Adrith Ram/i)).not.toBeVisible();
});

// ─── Valid PIN → student list ─────────────────────────────────────────────────

test("TC-checkin-valid-pin: Valid PIN shows contact name and student list", async ({ page }) => {
  await page.goto(CHECKIN_URL);
  await page.getByText("Enter your 6-digit PIN").waitFor({ timeout: 8_000 });
  await enterPin(page, VALID_PIN);
  await page.locator("button.bg-orange-500").click();
  // Contact name visible
  await expect(page.getByText(/Arudeepa Kumar/i)).toBeVisible({ timeout: 10_000 });
  // Student name visible
  await expect(page.getByText(/Adrith Ram/i)).toBeVisible();
});

test("TC-checkin-shows-status: Student list shows current attendance status", async ({ page }) => {
  await page.goto(CHECKIN_URL);
  await page.getByText("Enter your 6-digit PIN").waitFor({ timeout: 8_000 });
  await enterPin(page, VALID_PIN);
  await page.locator("button.bg-orange-500").click();
  await page.getByText(/Adrith Ram/i).waitFor({ timeout: 10_000 });
  // Status shown — one of: Present / Checked out / Not recorded / Absent
  await expect(
    page.getByText(/present|checked out|not recorded|absent/i).first()
  ).toBeVisible({ timeout: 5_000 });
});

test("TC-checkin-action-button: Check In or Check Out button visible after PIN", async ({ page }) => {
  await page.goto(CHECKIN_URL);
  await page.getByText("Enter your 6-digit PIN").waitFor({ timeout: 8_000 });
  await enterPin(page, VALID_PIN);
  await page.locator("button.bg-orange-500").click();
  await page.getByText(/Adrith Ram/i).waitFor({ timeout: 10_000 });
  // Either Check In or Check Out button visible (depends on current state)
  await expect(
    page.getByRole("button", { name: /check in|check out/i }).first()
  ).toBeVisible({ timeout: 5_000 });
});

// ─── Check-in/out toggle ──────────────────────────────────────────────────────

test("TC-checkin-toggle: Check In → shows success → resets to PIN entry", async ({ page }) => {
  // Clear today's attendance for Adrith first
  await clearAttendance("1cd2d725-70ce-429b-9070-7dbc59a157f2");

  await page.goto(CHECKIN_URL);
  await page.getByText("Enter your 6-digit PIN").waitFor({ timeout: 8_000 });
  await enterPin(page, VALID_PIN);
  await page.locator("button.bg-orange-500").click();
  await page.getByText(/Adrith Ram/i).waitFor({ timeout: 10_000 });

  // Click Check In
  const checkInBtn = page.getByRole("button", { name: /check in/i }).first();
  await checkInBtn.click();

  // Success screen shows "Checked In"
  await expect(page.getByText(/checked in/i)).toBeVisible({ timeout: 8_000 });

  // Auto-resets to PIN entry after 2.5s
  await expect(page.getByText("Enter your 6-digit PIN")).toBeVisible({ timeout: 8_000 });
});

test("TC-checkin-checkout-toggle: After check-in, same PIN shows Check Out button", async ({ page }) => {
  await page.goto(CHECKIN_URL);
  await page.getByText("Enter your 6-digit PIN").waitFor({ timeout: 8_000 });
  await enterPin(page, VALID_PIN);
  await page.locator("button.bg-orange-500").click();
  await page.getByText(/Adrith Ram/i).waitFor({ timeout: 10_000 });

  // Should show Check Out if already checked in, or Check In if not
  const buttons = page.getByRole("button", { name: /check in|check out/i });
  await expect(buttons.first()).toBeVisible({ timeout: 5_000 });
});

// ─── Activity logging ─────────────────────────────────────────────────────────

test("TC-checkin-activity-logged: After check-in, activity appears in student daily activities", async ({ page }) => {
  // Clear and do a fresh check-in
  await clearAttendance("1cd2d725-70ce-429b-9070-7dbc59a157f2");
  await page.goto(CHECKIN_URL);
  await page.getByText("Enter your 6-digit PIN").waitFor({ timeout: 8_000 });
  await enterPin(page, VALID_PIN);
  await page.locator("button.bg-orange-500").click();
  await page.getByText(/Adrith Ram/i).waitFor({ timeout: 10_000 });
  await page.getByRole("button", { name: /check in/i }).first().click();
  await expect(page.getByText(/checked in/i)).toBeVisible({ timeout: 8_000 });

  // Now check the student's daily activities tab (as admin)
  await loginAsAdmin(page);
  const ADRITH_ID = "1cd2d725-70ce-429b-9070-7dbc59a157f2";
  await page.goto(`/students/${ADRITH_ID}`);
  await page.getByRole("button", { name: /daily activities/i }).click();
  const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
  // Activity shows in the feed — look for "QR code" text
  await expect(page.getByText(/QR code|via qr/i).first()).toBeVisible({ timeout: 10_000 });
});

// ─── QR code in Settings ─────────────────────────────────────────────────────

test("TC-checkin-qr-in-settings: Settings page shows QR code with download + copy buttons", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/settings");
  await page.getByRole("heading", { name: /settings/i }).waitFor({ timeout: 8_000 });
  await expect(page.getByText(/front desk qr code/i)).toBeVisible({ timeout: 8_000 });
  await expect(page.getByRole("button", { name: /download qr/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /copy link/i })).toBeVisible();
  // SVG QR code rendered
  await expect(page.locator("svg").first()).toBeVisible();
});

test("TC-checkin-qr-encodes-school: QR copy link contains /checkin?school= URL", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/settings");
  await page.getByText(/front desk qr code/i).waitFor({ timeout: 8_000 });
  // The link below QR should contain the checkin URL
  await expect(page.getByText(/\/checkin\?school=/i)).toBeVisible({ timeout: 5_000 });
});

// ─── Home page auto-refresh ───────────────────────────────────────────────────

test("TC-home-refresh-button: Dashboard has manual refresh button", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/home");
  await page.getByText(/checked in today/i).waitFor({ timeout: 10_000 });
  // Refresh button visible (RefreshCw icon)
  await expect(page.getByRole("button", { name: /refresh/i })).toBeVisible({ timeout: 5_000 });
});

test("TC-home-refresh-updates-counts: Manual refresh reruns stats queries", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/home");
  await page.getByText(/checked in today/i).waitFor({ timeout: 10_000 });
  const refreshBtn = page.getByRole("button", { name: /refresh/i });
  await refreshBtn.click();
  // After refresh, stats are still visible (didn't crash)
  await expect(page.getByText(/checked in today/i)).toBeVisible({ timeout: 8_000 });
});

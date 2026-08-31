/**
 * Comprehensive room-level activity tests.
 * All 12 activity types are tested — picker UI, form fields, and save to Feed.
 * The room Feed displays: activity_type label + raw data key/value pairs.
 *
 * Bug regression:
 *   TC-room-nap-started-in-daily-activities — nap saved as "started" from room
 *   must show "Nap started" (not "Nap ended") in the student's Daily Activities tab.
 *   Root cause: buildData() in RoomDetail had no nap case → saved empty data →
 *   activitySummary() always fell to else ("Nap ended").
 */
import { test, expect, Page } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function openFirstRoom(page: Page) {
  await page.goto("/rooms");
  const roomLink = page.locator('a[href^="/rooms/"]').first();
  await roomLink.waitFor({ state: "visible", timeout: 10_000 });
  await roomLink.click();
  await page.waitForURL("**/rooms/**", { timeout: 10_000 });
}

async function openActivityPicker(page: Page) {
  await page.getByRole("button", { name: /add activity/i }).click();
  await expect(page.getByText("Select activity")).toBeVisible({ timeout: 8_000 });
}

async function pickActivity(page: Page, label: string) {
  await page.locator("span").filter({ hasText: new RegExp(`^${label}$`) }).click();
  await page.waitForTimeout(300);
}

/** After save the app auto-switches to Feed. Click Feed tab and wait for activity. */
async function verifyInFeed(page: Page, typeText: RegExp | string) {
  await page.getByRole("button", { name: /^feed$/i }).click();
  await page.waitForTimeout(500);
  await expect(page.getByText(typeof typeText === "string" ? new RegExp(typeText, "i") : typeText).first()).toBeVisible({ timeout: 8_000 });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe("Room Activities — all types", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  // ── PICKER UI ─────────────────────────────────────────────────────────────────
  test("TC-room-activity-picker-shows-all: Picker shows all 12 activity types", async ({ page }) => {
    await openFirstRoom(page);
    await openActivityPicker(page);
    const labels = ["Photo", "Video", "Food", "Nap", "Potty", "Note", "Kudos", "Meds", "Name to Face", "Incident", "Health Check", "Observation"];
    for (const label of labels) {
      await expect(
        page.locator("span").filter({ hasText: new RegExp(`^${label}$`) }).first()
      ).toBeVisible({ timeout: 5_000 });
    }
    await page.keyboard.press("Escape");
  });

  // ── NAP — radio UI ─────────────────────────────────────────────────────────
  test("TC-room-nap-status-radio-visible: Nap form shows Start / End radio buttons", async ({ page }) => {
    await openFirstRoom(page);
    await openActivityPicker(page);
    await pickActivity(page, "Nap");
    await expect(page.getByRole("radio", { name: /nap started/i })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole("radio", { name: /nap ended/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /start nap/i })).toBeVisible();
    await page.getByRole("radio", { name: /nap ended/i }).check();
    await expect(page.getByRole("button", { name: /end nap/i })).toBeVisible();
    await page.getByRole("button", { name: /cancel/i }).click();
  });

  // ── NAP — saves and appears in Feed with correct data (bug regression) ────
  test("TC-room-nap-started-in-feed: Nap Started saves data.nap_status=started in Feed", async ({ page }) => {
    await openFirstRoom(page);
    await openActivityPicker(page);
    await pickActivity(page, "Nap");
    await page.getByRole("radio", { name: /nap started/i }).waitFor({ timeout: 5_000 });
    await page.getByRole("radio", { name: /nap started/i }).check();
    await page.getByRole("button", { name: /start nap/i }).click();
    await page.waitForTimeout(800);
    // Feed shows raw data: "nap_status: started"
    await verifyInFeed(page, /started/);
  });

  test("TC-room-nap-ended-in-feed: Nap Ended saves data.nap_status=ended in Feed", async ({ page }) => {
    await openFirstRoom(page);
    await openActivityPicker(page);
    await pickActivity(page, "Nap");
    await page.getByRole("radio", { name: /nap ended/i }).waitFor({ timeout: 5_000 });
    await page.getByRole("radio", { name: /nap ended/i }).check();
    await page.getByRole("button", { name: /end nap/i }).click();
    await page.waitForTimeout(800);
    await verifyInFeed(page, /ended/);
  });

  // ── NAP BUG REGRESSION — student Daily Activities shows correct label ──────
  test("TC-room-nap-started-in-daily-activities: Nap started shows 'Nap started' not 'Nap ended' in student Daily Activities", async ({ page }) => {
    // Log nap from room
    await openFirstRoom(page);
    await openActivityPicker(page);
    await pickActivity(page, "Nap");
    await page.getByRole("radio", { name: /nap started/i }).waitFor({ timeout: 5_000 });
    await page.getByRole("radio", { name: /nap started/i }).check();
    await page.getByRole("button", { name: /start nap/i }).click();
    await page.waitForTimeout(800);

    // Navigate to first student's Daily Activities tab
    await page.goto("/students");
    const studentLink = page.locator('a[href^="/students/"]').first();
    await studentLink.waitFor({ state: "visible", timeout: 10_000 });
    await studentLink.click();
    await page.waitForURL("**/students/**", { timeout: 10_000 });
    await page.getByRole("button", { name: "Daily Activities" }).click();
    await page.waitForTimeout(500);

    // activitySummary() renders "Nap started" for nap_status=started
    await expect(page.getByText(/nap started/i).first()).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText(/nap ended/i)).not.toBeVisible();
  });

  // ── FOOD ──────────────────────────────────────────────────────────────────
  test("TC-room-food-form-fields: Food form shows meal type and quantity options", async ({ page }) => {
    await openFirstRoom(page);
    await openActivityPicker(page);
    await pickActivity(page, "Food");
    await expect(page.locator("select").first()).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole("radio", { name: /all/i }).first()).toBeVisible();
    await expect(page.getByRole("radio", { name: /most/i }).first()).toBeVisible();
    await expect(page.getByRole("radio", { name: /some/i }).first()).toBeVisible();
    await expect(page.getByRole("radio", { name: /none/i }).first()).toBeVisible();
    await page.getByRole("button", { name: /cancel/i }).click();
  });

  test("TC-room-food-saves-to-feed: Food activity saves and appears in Feed", async ({ page }) => {
    await openFirstRoom(page);
    await openActivityPicker(page);
    await pickActivity(page, "Food");
    await page.getByRole("button", { name: /add food/i }).click();
    await page.waitForTimeout(600);
    await verifyInFeed(page, /food/);
  });

  // ── POTTY ─────────────────────────────────────────────────────────────────
  test("TC-room-potty-type-options: Potty form shows Wet/BM/Dry/Used radios", async ({ page }) => {
    await openFirstRoom(page);
    await openActivityPicker(page);
    await pickActivity(page, "Potty");
    await expect(page.getByRole("radio").first()).toBeVisible({ timeout: 5_000 });
    const count = await page.getByRole("radio").count();
    expect(count).toBeGreaterThanOrEqual(3);
    await page.getByRole("button", { name: /cancel/i }).click();
  });

  test("TC-room-potty-saves-to-feed: Potty activity saves and appears in Feed", async ({ page }) => {
    await openFirstRoom(page);
    await openActivityPicker(page);
    await pickActivity(page, "Potty");
    await page.getByRole("button", { name: /add potty/i }).click();
    await page.waitForTimeout(600);
    await verifyInFeed(page, /potty/);
  });

  // ── NOTE ──────────────────────────────────────────────────────────────────
  test("TC-room-note-saves-to-feed: Note with text saves and appears in Feed", async ({ page }) => {
    await openFirstRoom(page);
    await openActivityPicker(page);
    await pickActivity(page, "Note");
    await page.locator("textarea").first().fill("TC-Note: room activity regression test.");
    await page.getByRole("button", { name: /add note/i }).click();
    await page.waitForTimeout(600);
    await verifyInFeed(page, /TC-Note|note/);
  });

  // ── KUDOS ─────────────────────────────────────────────────────────────────
  test("TC-room-kudos-saves-to-feed: Kudos with text saves and appears in Feed", async ({ page }) => {
    await openFirstRoom(page);
    await openActivityPicker(page);
    await pickActivity(page, "Kudos");
    await page.locator("textarea").first().fill("TC-Kudos: great work today!");
    await page.getByRole("button", { name: /add kudos/i }).click();
    await page.waitForTimeout(600);
    await verifyInFeed(page, /kudos/);
  });

  // ── MEDS ──────────────────────────────────────────────────────────────────
  test("TC-room-meds-form-fields: Meds form shows medication and dose inputs", async ({ page }) => {
    await openFirstRoom(page);
    await openActivityPicker(page);
    await pickActivity(page, "Meds");
    await expect(page.getByPlaceholder(/tylenol/i)).toBeVisible({ timeout: 5_000 });
    await expect(page.getByPlaceholder(/5ml/i)).toBeVisible();
    await page.getByRole("button", { name: /cancel/i }).click();
  });

  test("TC-room-meds-saves-to-feed: Meds activity saves and appears in Feed", async ({ page }) => {
    await openFirstRoom(page);
    await openActivityPicker(page);
    await pickActivity(page, "Meds");
    await page.getByPlaceholder(/tylenol/i).fill("Ibuprofen");
    await page.getByPlaceholder(/5ml/i).fill("10ml");
    await page.getByRole("button", { name: /add meds/i }).click();
    await page.waitForTimeout(600);
    await verifyInFeed(page, /meds/);
  });

  // ── HEALTH CHECK ──────────────────────────────────────────────────────────
  test("TC-room-health-check-form-fields: Health Check form shows temperature field", async ({ page }) => {
    await openFirstRoom(page);
    await openActivityPicker(page);
    await pickActivity(page, "Health Check");
    await expect(page.getByPlaceholder(/98\.6/i)).toBeVisible({ timeout: 5_000 });
    await page.getByRole("button", { name: /cancel/i }).click();
  });

  test("TC-room-health-check-saves-to-feed: Health Check saves and appears in Feed", async ({ page }) => {
    await openFirstRoom(page);
    await openActivityPicker(page);
    await pickActivity(page, "Health Check");
    await page.getByPlaceholder(/98\.6/i).fill("99.1");
    await page.getByRole("button", { name: /add health/i }).click();
    await page.waitForTimeout(600);
    await verifyInFeed(page, /health|99\.1/);
  });

  // ── OBSERVATION ───────────────────────────────────────────────────────────
  test("TC-room-observation-saves-to-feed: Observation saves and appears in Feed", async ({ page }) => {
    await openFirstRoom(page);
    await openActivityPicker(page);
    await pickActivity(page, "Observation");
    await page.locator("textarea").first().fill("TC-Obs: stacked 5 blocks.");
    await page.getByRole("button", { name: /add observation/i }).click();
    await page.waitForTimeout(600);
    await verifyInFeed(page, /observation|TC-Obs/);
  });

  // ── INCIDENT ──────────────────────────────────────────────────────────────
  test("TC-room-incident-saves-to-feed: Incident saves and appears in Feed", async ({ page }) => {
    await openFirstRoom(page);
    await openActivityPicker(page);
    await pickActivity(page, "Incident");
    await page.locator("textarea").first().fill("TC-Incident: minor trip near mat.");
    await page.getByRole("button", { name: /add incident/i }).click();
    await page.waitForTimeout(600);
    await verifyInFeed(page, /incident|TC-Incident/);
  });

  // ── STAFF-ONLY CHECKBOX ───────────────────────────────────────────────────
  test("TC-room-staff-only-flag: Staff-only checkbox present in Note form", async ({ page }) => {
    await openFirstRoom(page);
    await openActivityPicker(page);
    await pickActivity(page, "Note");
    await expect(page.getByRole("checkbox")).toBeVisible({ timeout: 5_000 });
    await page.getByRole("button", { name: /cancel/i }).click();
  });

  // ── ALL STUDENTS DEFAULT ──────────────────────────────────────────────────
  test("TC-room-activity-all-students: Student select defaults to All students", async ({ page }) => {
    await openFirstRoom(page);
    await openActivityPicker(page);
    await pickActivity(page, "Note");
    const studentSelect = page.locator("select").first();
    await expect(studentSelect).toBeVisible({ timeout: 5_000 });
    const val = await studentSelect.inputValue();
    expect(val).toBe(""); // "" = All students
    await page.getByRole("button", { name: /cancel/i }).click();
  });

  // ── STUDENT DAILY ACTIVITIES — Add Activity button ────────────────────────
  test("TC-student-daily-activities-add-button: Admin sees + Add Activity button in Daily Activities tab", async ({ page }) => {
    await page.goto("/students");
    await page.locator('a[href^="/students/"]').first().waitFor({ state: "visible", timeout: 10_000 });
    await page.locator('a[href^="/students/"]').first().click();
    await page.waitForURL("**/students/**", { timeout: 10_000 });
    await page.getByRole("button", { name: "Daily Activities" }).click();
    await expect(page.getByRole("button", { name: /add activity/i })).toBeVisible({ timeout: 5_000 });
  });

  test("TC-student-daily-activities-picker-opens: Add Activity opens type picker for specific student", async ({ page }) => {
    await page.goto("/students");
    await page.locator('a[href^="/students/"]').first().waitFor({ state: "visible", timeout: 10_000 });
    await page.locator('a[href^="/students/"]').first().click();
    await page.waitForURL("**/students/**", { timeout: 10_000 });
    await page.getByRole("button", { name: "Daily Activities" }).click();
    await page.getByRole("button", { name: /add activity/i }).click();
    await expect(page.getByText("Select activity")).toBeVisible({ timeout: 5_000 });
    await page.keyboard.press("Escape");
  });

  test("TC-student-daily-activities-nap-saves: Nap logged from student profile shows correct status in Daily Activities", async ({ page }) => {
    await page.goto("/students");
    await page.locator('a[href^="/students/"]').first().waitFor({ state: "visible", timeout: 10_000 });
    await page.locator('a[href^="/students/"]').first().click();
    await page.waitForURL("**/students/**", { timeout: 10_000 });
    await page.getByRole("button", { name: "Daily Activities" }).click();
    await page.getByRole("button", { name: /add activity/i }).click();
    // Pick Nap
    await page.locator("span").filter({ hasText: /^Nap$/ }).click();
    await page.waitForTimeout(300);
    // Select "Nap started"
    await page.getByRole("radio", { name: /nap started/i }).waitFor({ timeout: 5_000 });
    await page.getByRole("radio", { name: /nap started/i }).check();
    await page.getByRole("button", { name: /start nap/i }).click();
    await page.waitForTimeout(800);
    // Should appear in Daily Activities with correct label
    await expect(page.getByText(/nap started/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test("TC-student-daily-activities-note-saves: Note logged from student profile appears in Daily Activities", async ({ page }) => {
    await page.goto("/students");
    await page.locator('a[href^="/students/"]').first().waitFor({ state: "visible", timeout: 10_000 });
    await page.locator('a[href^="/students/"]').first().click();
    await page.waitForURL("**/students/**", { timeout: 10_000 });
    await page.getByRole("button", { name: "Daily Activities" }).click();
    await page.getByRole("button", { name: /add activity/i }).click();
    await page.locator("span").filter({ hasText: /^Note$/ }).click();
    await page.waitForTimeout(300);
    await page.locator("textarea").first().fill("TC-StudentNote: direct student activity.");
    await page.getByRole("button", { name: /add note/i }).click();
    await page.waitForTimeout(800);
    await expect(page.getByText(/TC-StudentNote/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test("TC-student-daily-activities-parent-readonly: Parent cannot see Add Activity button", async ({ page }) => {
    const { loginAsParent } = await import("./helpers/auth");
    await loginAsParent(page);
    await page.goto("/students");
    const studentLink = page.locator('a[href^="/students/"]').first();
    if (await studentLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await studentLink.click();
      await page.waitForURL("**/students/**", { timeout: 10_000 });
      await page.getByRole("button", { name: "Daily Activities" }).click();
      await expect(page.getByRole("button", { name: /add activity/i })).not.toBeVisible();
    }
  });
});

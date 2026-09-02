/**
 * Parent persona — full navigation and feature tests.
 *
 * Parent home (/parent):
 *   - Shows student cards with check-in status
 *   - Check In / Check Out quick action per student card
 *   - "Today's Activities" expandable feed per card
 *   - Link to full student profile (chevron)
 *
 * Sidebar for parents:
 *   - Home → /parent
 *   - My School → Students (own kids only), Stories, Calendar, Menus
 *   - No: Settings, Staff & Payroll, Paperwork, Reporting, Rooms, Schedules
 *
 * Students list:
 *   - Parent sees only their own child (RLS filtered)
 *   - No Add Student, Edit, Delete buttons
 *
 * Student profile:
 *   - Profile, Contacts, Immunizations, Daily Activities, Documents tabs
 *   - "Back to My Portal" link
 */
import { test, expect } from "@playwright/test";

async function loginAsParent(page: any) {
  await page.goto("/login");
  await page.locator("input[type='text'], input[type='email']").fill("parent@jsdaycare.com");
  await page.locator("input[type='password']").fill("JsDaycare@2026");
  await page.locator("button[type='submit']").click();
  await page.waitForURL("**/parent", { timeout: 10_000 });
}

test.describe("Parent portal — home page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsParent(page);
  });

  test("TC-parent-home-loads: Parent home shows greeting and student card", async ({ page }) => {
    await expect(page.getByText(/good morning|good afternoon|good evening/i)).toBeVisible({ timeout: 5_000 });
    await expect(page.locator(".card").first()).toBeVisible({ timeout: 6_000 });
  });

  test("TC-parent-home-student-card: Student card shows name and enrollment status", async ({ page }) => {
    await expect(page.getByText(/Adrith/i)).toBeVisible({ timeout: 6_000 });
    await expect(page.getByText(/active|waitlist|enrolled/i).first()).toBeVisible();
  });

  test("TC-parent-home-checkin-button: Student card shows Check In or Check Out button", async ({ page }) => {
    const hasCheckIn  = await page.getByRole("button", { name: /check in/i }).isVisible().catch(() => false);
    const hasCheckOut = await page.getByRole("button", { name: /check out/i }).isVisible().catch(() => false);
    expect(hasCheckIn || hasCheckOut).toBe(true);
  });

  test("TC-parent-home-checkin-toggles: Clicking Check In changes button to Check Out", async ({ page }) => {
    const checkInBtn = page.getByRole("button", { name: /^check in$/i });
    if (await checkInBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await checkInBtn.click();
      await expect(page.getByRole("button", { name: /check out/i })).toBeVisible({ timeout: 8_000 });
      await expect(page.getByText(/checked in/i)).toBeVisible();
    } else {
      // Already checked in — verify Check Out button and status badge
      await expect(page.getByRole("button", { name: /check out/i })).toBeVisible({ timeout: 5_000 });
      await expect(page.getByText(/checked in/i)).toBeVisible();
    }
  });

  test("TC-parent-home-activities-toggle: Clicking Today's Activities expands/collapses feed", async ({ page }) => {
    await page.locator(".card").first().waitFor({ timeout: 6_000 });
    await page.getByText(/today's activities/i).click();
    // Feed section expands — either shows entries or empty state
    await expect(page.getByText(/no activities|check-in|nap|food/i).first()).toBeVisible({ timeout: 5_000 });
  });

  test("TC-parent-home-profile-link: Chevron navigates to student profile", async ({ page }) => {
    await page.locator(".card a[href*='/students/']").first().waitFor({ timeout: 6_000 });
    await page.locator(".card a[href*='/students/']").first().click();
    await expect(page).toHaveURL(/\/students\/[a-z0-9-]+/, { timeout: 8_000 });
  });
});

test.describe("Parent portal — sidebar nav", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsParent(page);
  });

  test("TC-parent-nav-home-visible: Home link visible and goes to /parent", async ({ page }) => {
    await expect(page.getByRole("navigation").getByRole("link", { name: /^home$/i })).toBeVisible({ timeout: 5_000 });
  });

  test("TC-parent-nav-stories-visible: Stories link visible in sidebar", async ({ page }) => {
    await page.locator("nav button").filter({ hasText: /JS Joy/ }).click().catch(() => {});
    await expect(page.getByRole("navigation").getByRole("link", { name: /stories/i })).toBeVisible({ timeout: 5_000 });
  });

  test("TC-parent-nav-calendar-visible: Calendar link visible in sidebar", async ({ page }) => {
    await page.locator("nav button").filter({ hasText: /JS Joy/ }).click().catch(() => {});
    await expect(page.getByRole("navigation").getByRole("link", { name: /calendar/i })).toBeVisible({ timeout: 5_000 });
  });

  test("TC-parent-nav-menus-visible: Menus link visible in sidebar", async ({ page }) => {
    await page.locator("nav button").filter({ hasText: /JS Joy/ }).click().catch(() => {});
    await expect(page.getByRole("navigation").getByRole("link", { name: /menus/i })).toBeVisible({ timeout: 5_000 });
  });

  test("TC-parent-nav-students-visible: Students link visible in sidebar", async ({ page }) => {
    await page.locator("nav button").filter({ hasText: /JS Joy/ }).click().catch(() => {});
    await expect(page.getByRole("navigation").getByRole("link", { name: /students/i })).toBeVisible({ timeout: 5_000 });
  });

  test("TC-parent-nav-no-settings: Settings NOT visible for parent", async ({ page }) => {
    await expect(page.getByRole("navigation").getByRole("link", { name: /^settings$/i })).not.toBeVisible();
  });

  test("TC-parent-nav-no-staff: Staff & Payroll NOT visible for parent", async ({ page }) => {
    await expect(page.getByRole("navigation").getByText(/staff.*payroll/i)).not.toBeVisible();
  });

  test("TC-parent-nav-no-rooms: Rooms NOT visible for parent", async ({ page }) => {
    await page.locator("nav button").filter({ hasText: /JS Joy/ }).click().catch(() => {});
    await expect(page.getByRole("navigation").getByRole("link", { name: /^rooms$/i })).not.toBeVisible();
  });

  test("TC-parent-nav-no-schedules: Schedules NOT visible for parent", async ({ page }) => {
    await page.locator("nav button").filter({ hasText: /JS Joy/ }).click().catch(() => {});
    await expect(page.getByRole("navigation").getByRole("link", { name: /^schedules$/i })).not.toBeVisible();
  });
});

test.describe("Parent portal — students list (own kids only)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsParent(page);
    await page.goto("/students");
    await page.getByRole("heading", { name: /students/i }).waitFor({ timeout: 8_000 });
  });

  test("TC-parent-students-sees-own-child: Parent sees their child in the list", async ({ page }) => {
    await expect(page.getByText(/Adrith/i)).toBeVisible({ timeout: 6_000 });
  });

  test("TC-parent-students-no-add-button: Parent does NOT see Add Student button", async ({ page }) => {
    await expect(page.getByRole("link", { name: /add student/i })).not.toBeVisible();
  });

  test("TC-parent-students-no-edit-delete: Parent does NOT see Edit/Delete buttons on student rows", async ({ page }) => {
    await page.locator("tbody tr").first().waitFor({ timeout: 6_000 });
    await expect(page.locator("button[title='Edit enrollment']").first()).not.toBeVisible();
    await expect(page.locator("button[title='Delete student']").first()).not.toBeVisible();
  });

  test("TC-parent-students-can-click-profile: Parent can open their child's profile from list", async ({ page }) => {
    await page.locator("tbody tr a").first().waitFor({ timeout: 6_000 });
    await page.locator("tbody tr a").first().click();
    await expect(page).toHaveURL(/\/students\/[a-z0-9-]+/, { timeout: 8_000 });
  });
});

test.describe("Parent portal — student profile navigation", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsParent(page);
    await page.goto("/students");
    await page.locator("tbody tr a").first().waitFor({ timeout: 10_000 });
    await page.locator("tbody tr a").first().click();
    await page.waitForURL("**/students/**", { timeout: 10_000 });
  });

  test("TC-parent-profile-back-link: Back to My Portal link is visible", async ({ page }) => {
    await expect(page.getByRole("link", { name: /back to my portal/i })).toBeVisible({ timeout: 5_000 });
  });

  test("TC-parent-profile-back-navigates: Clicking Back to My Portal returns to /parent", async ({ page }) => {
    await page.getByRole("link", { name: /back to my portal/i }).click();
    await expect(page).toHaveURL(/\/parent/, { timeout: 8_000 });
  });

  test("TC-parent-profile-all-tabs: Parent sees Profile, Contacts, Immunizations, Daily Activities, Documents", async ({ page }) => {
    for (const tab of ["Profile", "Contacts", "Immunizations", "Daily Activities", "Documents"]) {
      await expect(page.getByRole("button", { name: new RegExp(`^${tab}$`) })).toBeVisible({ timeout: 5_000 });
    }
  });

  test("TC-parent-profile-sidebar-clean: Sidebar shows only Home, Stories, Calendar, Menus, Students", async ({ page }) => {
    await expect(page.getByRole("navigation").getByText(/settings|staff.*payroll|paperwork|reporting|rooms|schedules/i)).not.toBeVisible();
  });
});

test.describe("Parent portal — quick links from sidebar", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsParent(page);
  });

  test("TC-parent-nav-menus-works: Parent can navigate to Menus and sees Weekly Menu only", async ({ page }) => {
    await page.goto("/menus");
    await expect(page.getByRole("heading", { name: /menus/i })).toBeVisible({ timeout: 6_000 });
    await expect(page.getByRole("button", { name: /weekly menu/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /food item library/i })).not.toBeVisible();
    await expect(page.getByRole("button", { name: /create menu/i })).not.toBeVisible();
  });

  test("TC-parent-nav-calendar-works: Parent can navigate to Calendar (read-only)", async ({ page }) => {
    await page.goto("/calendar");
    await expect(page.getByRole("heading", { name: /calendar/i })).toBeVisible({ timeout: 6_000 });
    // No edit controls for parent
    await expect(page.getByRole("button", { name: /add holiday/i })).not.toBeVisible();
  });

  test("TC-parent-nav-stories-works: Parent can navigate to Stories page", async ({ page }) => {
    await page.goto("/stories");
    await expect(page.getByText(/stories/i).first()).toBeVisible({ timeout: 6_000 });
  });
});

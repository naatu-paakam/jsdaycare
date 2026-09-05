import { defineConfig, devices } from "@playwright/test";
import { config as loadDotenv } from "dotenv";

// Load .env so VITE_TEST_PASSWORD etc. are available in Node.js Playwright process
loadDotenv();

export default defineConfig({
  testDir: "./e2e",
  globalTeardown: "./e2e/global-teardown.ts",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 2,  // Keep low to avoid concurrent Supabase auth conflicts
  retries: 2,
  use: {
    baseURL: "http://localhost:5174",
    screenshot: "only-on-failure",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5174",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});

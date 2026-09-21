import { defineConfig, devices } from "@playwright/test";
import { e2eDatabaseUrl, PLAYWRIGHT_ORIGIN, PLAYWRIGHT_PORT } from "./tests/e2e/env";

const e2eUrl = e2eDatabaseUrl();
process.env.E2E_DATABASE_URL = e2eUrl;

export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: PLAYWRIGHT_ORIGIN,
    trace: "on-first-retry",
  },
  webServer: {
    command: `npx next dev --port ${PLAYWRIGHT_PORT}`,
    url: PLAYWRIGHT_ORIGIN,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      DATABASE_URL: e2eUrl,
      BETTER_AUTH_URL: PLAYWRIGHT_ORIGIN,
      NEXT_DIST_DIR: ".next-e2e",
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});

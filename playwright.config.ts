import { defineConfig, devices } from "@playwright/test";

const PORT = 3200;

/**
 * Browser tests (e2e/). They build the app and run the production server with
 * your .env.local, so they read the real Supabase data and never sign in or
 * write anything. Production rather than `next dev`: pages don't compile on
 * first visit, so timings are real and tests don't time out while they build.
 *
 *   npm run test:e2e
 *
 * To test against a server you already started, set E2E_BASE_URL.
 */
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  reporter: "list",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `npm run build && npx next start -p ${PORT}`,
        url: baseURL,
        reuseExistingServer: true,
        timeout: 300_000,
      },
});

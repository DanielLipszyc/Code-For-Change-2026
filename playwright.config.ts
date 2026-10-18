import { defineConfig, devices } from "@playwright/test";

const PORT = 3200;

/**
 * Browser tests (e2e/). They start a dev server that uses your .env.local, so
 * they read the real Supabase data and never sign in. That's also why they
 * aren't in CI yet: CI would need test keys (see docs/ARCHITECTURE.md).
 *
 *   npm run test:e2e
 */
export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  reporter: "list",
  // The dev server compiles each page on its first visit
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `npx next dev -p ${PORT}`,
    url: `http://localhost:${PORT}/about`,
    reuseExistingServer: true,
    timeout: 180_000,
  },
});

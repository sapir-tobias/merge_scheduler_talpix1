// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright config for the Scheduler e2e suite.
 *
 * `webServer` boots the full stack via the root `npm run dev` (concurrently
 * starts the FastAPI backend on :8000 and the Vite frontend on :5173, which
 * proxies /api to the backend). Set `reuseExistingServer` so a stack already
 * running locally is reused instead of spawning a second one.
 */
module.exports = defineConfig({
  testDir: './Tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    cwd: '..',
    url: 'http://localhost:5173',
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
});

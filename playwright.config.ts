import { defineConfig, devices } from '@playwright/test'

// Browser tests against a production build (engineering standards, sections
// 8 and 15). The port comes from the environment so suites can run side by
// side on one machine: set PLAYWRIGHT_PORT when 3100 is taken.
const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 3100)
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`

export default defineConfig({
  testDir: './tests',
  // Only the browser suites. Unit tests run under Jest (`npm test`).
  testMatch: ['a11y/**/*.spec.ts', 'e2e/**/*.spec.ts'],
  // Not "test-results": the axe JSON results live there, and Playwright
  // empties its outputDir at the start of every run.
  outputDir: './playwright-output',
  fullyParallel: false,
  workers: 1,
  // No retries: a test that passes on a retry is flaky, and a flaky test is
  // a bug to fix, not to hide.
  retries: 0,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }]
  ],
  timeout: 30_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'off',
    video: 'off',
    // Sandboxes without a matching managed browser can point at a
    // pre-provisioned Chromium. Unset in CI and on a normal laptop.
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
      : undefined
  },

  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } }
  ],

  webServer: {
    // A production build and `next start`, not the dev server: every route is
    // precompiled, which removes a class of hydration-timing flake and is
    // what visitors get.
    command: `npx next build && npx next start --port ${PORT}`,
    url: BASE_URL,
    env: {
      NEXTAUTH_URL: BASE_URL,
      // Signs test sessions only. Never a real secret.
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ?? 'playwright-test-secret',
      NEXT_TELEMETRY_DISABLED: '1'
    },
    reuseExistingServer: !process.env.CI,
    timeout: 240_000
  }
})

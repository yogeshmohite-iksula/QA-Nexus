// QA Nexus PM1 — E2E behavioral smoke config.
//
// Sister to tests/visual/playwright.config.ts (screenshot VR). This config
// runs BEHAVIORAL flows — new-user journey smoke for pilot Mon 2026-06-08.
// Single chromium project, desktop viewport; individual tests resize for
// mobile checks. NOT screenshot-based — asserts DOM + interactions.
//
// Run locally (dev server must be up on :3000):
//   pnpm --filter web exec playwright test --config=tests/e2e/playwright.config.ts
//
// Override base URL:
//   BASE_URL=http://localhost:3000 pnpm --filter web exec playwright test \
//     --config=tests/e2e/playwright.config.ts

import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.ts',
  timeout: 30_000,
  expect: { timeout: 8_000 },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1, // sequential — single dev server, keeps logs readable
  reporter: [['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
    colorScheme: 'dark',
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
  ],
});

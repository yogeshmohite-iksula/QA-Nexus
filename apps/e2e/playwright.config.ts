// QA Nexus PM1 — Playwright config.
//
// Spec: MS0-T031. Smoke test exercises the full FE → BE auth + onboarding
// flow on every PR. Browsers tested: Chromium (default), Mobile Safari
// (CLAUDE.md Rule 12 RWD enforcement at iPhone SE 375px).
//
// Fully skipped tests until T014 Resend lands the real magic-link flow
// (currently the EmailService is in stub mode → magic-link click fails
// because the token never lands in a clickable email).
//
// Local dev:   pnpm --filter @qa-nexus/e2e test
// CI:          .github/workflows/e2e.yml runs the same command after
//              spinning up FE + API in background.

import { defineConfig, devices } from '@playwright/test';

const PORT_FE = process.env.E2E_FE_PORT ?? '3000';
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT_FE}`;

export default defineConfig({
  testDir: './tests',
  // Each spec gets up to 60s. CI's slower than local; keep generous.
  timeout: 60_000,
  // Per-action defaults (clicks, gotos): 10s. Cold-start dyno may need this.
  expect: { timeout: 10_000 },

  // Fail builds if a test was accidentally `.only` left in.
  forbidOnly: !!process.env.CI,

  // Retry CI failures once (free tier flake mitigation).
  retries: process.env.CI ? 1 : 0,

  // Run serially in CI (free dyno can't handle parallel) but parallel locally.
  workers: process.env.CI ? 1 : undefined,

  // HTML reporter for both local + CI; uploaded as CI artifact.
  reporter: [['html', { outputFolder: 'playwright-report', open: 'never' }], ['list']],

  use: {
    baseURL: BASE_URL,
    // Capture trace on first retry so flake debugging is easy.
    trace: 'on-first-retry',
    // Always screenshot on failure.
    screenshot: 'only-on-failure',
    // Video only on failure (saves disk in CI).
    video: 'retain-on-failure',
    // Honor system color scheme.
    colorScheme: 'dark',
  },

  projects: [
    {
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone SE'],
        // CLAUDE.md Rule 12 minimum: 320 px wide. iPhone SE = 375px which
        // is iPhone-realistic; for true 320 px (older iPhone 5/SE-1) we'd
        // need a custom device. 375 covers 95% of mobile-tested viewports.
      },
    },
  ],

  // CI starts FE + API via the workflow YAML; locally, leave webServer unset
  // so devs can run `pnpm dev` in a separate terminal and rerun playwright
  // freely without a server cold-start every time.
  webServer: process.env.E2E_AUTOSTART
    ? [
        {
          command: 'pnpm --filter @qa-nexus/api start:prod',
          port: 3001,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
        {
          command: 'pnpm --filter web dev',
          port: Number(PORT_FE),
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
      ]
    : undefined,
});

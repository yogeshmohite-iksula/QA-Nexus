// QA Nexus PM1 — Visual Regression (VR) Playwright config.
//
// Spec: Day-18 evening brief. Sister to apps/e2e/playwright.config.ts
// (which exercises FE↔API behavioral flows for MS0-T031). This config
// is for SCREENSHOT comparison ONLY — locks pixel-level FE rendering
// against canonical baselines committed under
// `apps/web/tests/visual/__screenshots__/`.
//
// FE+1 owns the canonical baseline screenshots committed under
// `canonical/<frame>/<viewport>.png`. The specs in this directory
// compare live renders against those baselines via
// `expect(page).toHaveScreenshot(...)`.
//
// Local dev:
//   pnpm --filter @qa-nexus/web test:visual
//   pnpm --filter @qa-nexus/web test:visual --update-snapshots   (regen baselines)
//
// CI: .github/workflows/ci.yml job `visual-regression` runs the same
// command after `pnpm dev` is up. Diff PNGs are uploaded as workflow
// artifact on failure so reviewers can download + inspect.

import { defineConfig } from '@playwright/test';

const PORT_FE = process.env.VR_FE_PORT ?? '3000';
const BASE_URL = process.env.VR_BASE_URL ?? `http://localhost:${PORT_FE}`;

export default defineConfig({
  // Specs live alongside this config — keep VR tests grouped.
  testDir: '.',
  // VR loads pages, waits for stable paint, snapshots — generous
  // per-test timeout for CI's slower runners.
  timeout: 60_000,
  expect: {
    timeout: 10_000,
    // Brief: maxDiffPixelRatio 0.01 (1% of pixels may differ);
    //        threshold 0.2 (per-pixel color tolerance, normalized 0-1).
    // These two together are the canon visual-gate threshold for PM1.
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
      threshold: 0.2,
      // Disable subpixel-anti-alias artefacts that Linux vs macOS
      // renderers produce differently — fonts get fuzzy by 1-2px on
      // free CI runners. Single-platform CI sidesteps this; the
      // threshold above also absorbs minor jitter.
      animations: 'disabled',
      caret: 'hide',
    },
  },

  // Fail builds if a test was accidentally `.only` left in.
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // VR is bursty I/O (page load + screenshot disk write); limit
  // workers in CI for free-runner stability.
  workers: process.env.CI ? 1 : undefined,

  // Day-18 evening rebase realignment: snapshot path resolves to
  //   apps/web/tests/visual/canonical/{frame}/{viewport}.png
  // so FE+1's 12 baseline PNGs (committed under canonical/F08/, F15/,
  // etc.) are picked up directly without a separate move step.
  // {arg} = frame slug passed to toHaveScreenshot (e.g. 'F08').
  // {projectName} = viewport pixel-count short name ('320', '768',
  // '1024', '1440' — see projects[] below; chromium- prefix dropped
  // to match FE+1's bare-viewport filenames).
  // Platform suffix dropped: macOS local + Linux CI share canonicals;
  // tolerance config (maxDiffPixelRatio + threshold) absorbs the 1-2
  // px subpixel anti-alias deltas between renderers.
  snapshotPathTemplate: '{testDir}/canonical/{arg}/{projectName}.png',

  // HTML reporter for both local + CI; uploaded as CI artifact on failure.
  reporter: [['html', { outputFolder: 'playwright-report-visual', open: 'never' }], ['list']],

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off', // VR doesn't need video — diff PNGs are the artifact
    colorScheme: 'dark',
    // Disable browser-extension-injected DOM noise that browser-tools
    // may inject in dev mode (Day-15 RWD-iteration learning).
    ignoreHTTPSErrors: true,
  },

  // Chromium ONLY per brief — free tier downloads only one browser
  // (~140 MB vs ~400 MB for chromium+firefox+webkit). Mobile-Safari /
  // Firefox VR can be added in M5 if FE+1 needs them.
  //
  // Project name = bare viewport pixel-count (`320`, `768`, `1024`,
  // `1440`) so snapshotPathTemplate's `{projectName}` resolves to FE+1's
  // canonical PNG filenames directly (canonical/F08/320.png etc.).
  projects: [
    {
      name: '320',
      use: {
        browserName: 'chromium',
        viewport: { width: 320, height: 568 }, // iPhone SE
        deviceScaleFactor: 1,
      },
    },
    {
      name: '768',
      use: {
        browserName: 'chromium',
        viewport: { width: 768, height: 1024 }, // iPad portrait
        deviceScaleFactor: 1,
      },
    },
    {
      name: '1024',
      use: {
        browserName: 'chromium',
        viewport: { width: 1024, height: 768 }, // small desktop
        deviceScaleFactor: 1,
      },
    },
    {
      name: '1440',
      use: {
        browserName: 'chromium',
        viewport: { width: 1440, height: 900 }, // canonical desktop
        deviceScaleFactor: 1,
      },
    },
  ],
});

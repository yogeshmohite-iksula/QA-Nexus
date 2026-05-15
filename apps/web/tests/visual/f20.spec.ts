// QA Nexus PM1 — F20 Run Results VR baselines.
//
// Locks F20 Run Results renders against the canonical baselines at
// each of the 4 viewports per CLAUDE.md Hard Rule 12 (RWD).
//
// Baselines live at:
//   apps/web/tests/visual/canonical/F20/{320,768,1024,1440}.png
// (captured via tests/visual/capture-canonical-baselines.mjs from the
// canonical F20 v2 HTML — `PM1_UI_v2/Redesign Frame by claude design/
// F20 Run Results v2.html`).
//
// Route gate: F20 React port (`/projects/:slug/runs/:runId/results/`)
// is currently on PR #150 (Day-18 verbatim re-port, holding for M4
// close cascade). Until #150 merges, the route returns 404 on origin/
// main and this spec will fail. The F20_ROUTE_READY env flag gates
// the spec at the describe level; CI flips it once #150 merges.
// Same pattern as VR_BASELINES_READY → frame-specific route flags
// keep the seed-PR-time VR job green while the F20/F21 routes are
// still in-flight.

import { test, expect } from '@playwright/test';

test.describe('F20 Run Results — VR baselines (Hard Rule 12 RWD)', () => {
  test.skip(
    !process.env.VR_BASELINES_READY,
    'canonical baselines not yet active — set VR_BASELINES_READY=1 to enable',
  );
  test.skip(
    !process.env.F20_ROUTE_READY,
    'F20 React route not yet on main (PR #150 holding) — set F20_ROUTE_READY=1 once merged',
  );

  test('renders within tolerance', async ({ page }, testInfo) => {
    await page.goto('/projects/iksula-returns/runs/RUN-RET-2026-04-25-002/results');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('F20', {
      maxDiffPixelRatio: 0.01,
      threshold: 0.2,
      animations: 'disabled',
      caret: 'hide',
      mask: [],
    });

    testInfo.annotations.push({
      type: 'viewport',
      description: testInfo.project.name,
    });
  });
});

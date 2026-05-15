// QA Nexus PM1 — F21 Defects Hub VR baselines.
//
// Locks F21 Defects Hub renders against the canonical baselines at
// each of the 4 viewports per CLAUDE.md Hard Rule 12 (RWD).
//
// Baselines live at:
//   apps/web/tests/visual/canonical/F21/{320,768,1024,1440}.png
// (captured via tests/visual/capture-canonical-baselines.mjs from the
// canonical F21 v2 HTML — `PM1_UI_v2/Redesign Frame by claude design/
// F21 Defects Hub v2.html`).
//
// Route gate: F21 React port (`/projects/:slug/defects/`) was parked
// on `wip/f21-pre-tooling-fix` per Day-18 tooling decision (PR #152
// closed; will be re-ported Day-20 via the new `.claude/skills/
// frame-port/` workflow). Until the re-port merges to main, the
// route returns 404 on origin/main and this spec will fail. The
// F21_ROUTE_READY env flag gates the spec at the describe level;
// CI flips it once the re-port merges.

import { test, expect } from '@playwright/test';

test.describe('F21 Defects Hub — VR baselines (Hard Rule 12 RWD)', () => {
  test.skip(
    !process.env.VR_BASELINES_READY,
    'canonical baselines not yet active — set VR_BASELINES_READY=1 to enable',
  );
  test.skip(
    !process.env.F21_ROUTE_READY,
    'F21 React route not yet on main (parked on wip/f21-pre-tooling-fix) — set F21_ROUTE_READY=1 once Day-20 re-port merges',
  );

  test('renders within tolerance', async ({ page }, testInfo) => {
    await page.goto('/projects/iksula-returns/defects');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('F21', {
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

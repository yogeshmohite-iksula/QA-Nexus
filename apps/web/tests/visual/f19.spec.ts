// QA Nexus PM1 — F19 Run Console VR baselines.
//
// Locks F19 Run Console renders against the canonical baselines at
// each of the 4 viewports per CLAUDE.md Hard Rule 12 (RWD).
//
// Baselines live at:
//   apps/web/tests/visual/canonical/F19/{320,768,1024,1440}.png
// (captured via tests/visual/capture-canonical-baselines.mjs from the
// canonical F19 v2 HTML — `PM1_UI_v2/Redesign Frame by claude design/
// F19 Run Console v2.html`).
//
// Route: F19 is the Run Console page for an active run. The Iksula
// anchor run (`RUN-RET-2026-04-25-002` on slug `iksula-returns`) is
// statically generated via `generateStaticParams`; reachable without
// auth because the (app) route group's session check tolerates the
// in-memory dev seed.

import { test, expect } from '@playwright/test';

test.describe('F19 Run Console — VR baselines (Hard Rule 12 RWD)', () => {
  // Gate: VR_BASELINES_READY guards the entire VR suite until the
  // seed PR is merged. Once VR_BASELINES_READY=1 in CI, all frame
  // specs become active.
  test.skip(
    !process.env.VR_BASELINES_READY,
    'canonical baselines not yet active — set VR_BASELINES_READY=1 to enable',
  );

  test('renders within tolerance', async ({ page }, testInfo) => {
    await page.goto('/projects/iksula-returns/runs/RUN-RET-2026-04-25-002');

    // Wait for hydration to settle — Next.js App Router hydration
    // streams in chunks; skipping this is the #1 source of VR flake.
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Snapshot resolves to `canonical/F19/{projectName}.png` per the
    // snapshotPathTemplate in playwright.config.ts. {arg}='F19';
    // {projectName} carries the viewport short name (320/768/1024/1440).
    await expect(page).toHaveScreenshot('F19', {
      maxDiffPixelRatio: 0.01,
      threshold: 0.2,
      animations: 'disabled',
      caret: 'hide',
      // No volatile regions on F19's static run-console layout —
      // mask added if WebSocket live-pill timestamps land in Day-20
      // Pattern B.
      mask: [],
    });

    testInfo.annotations.push({
      type: 'viewport',
      description: testInfo.project.name,
    });
  });
});

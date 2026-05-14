// QA Nexus PM1 — VR template spec (Day-18 evening brief).
//
// Locks F08 Home page renders against the canonical baseline at each
// of the 4 viewports per CLAUDE.md Hard Rule 12 (RWD).
//
// FE+1 fills `canonical/F08/*.png` — those are the source-of-truth
// renders captured from a known-good FE state (typically right after
// a visual-gate-approved merge). The `__screenshots__/` directory
// holds the auto-generated comparison baselines that Playwright
// regenerates on `--update-snapshots`. The two-tier split keeps the
// editorially-blessed canonicals separate from the runtime baselines
// (which CI may regenerate when intentional design changes land).
//
// Pattern for adding new VR specs:
//   1. Copy this file → `<frame>.spec.ts` (e.g. `f15-knowledge-base.spec.ts`)
//   2. Update the route + selectors
//   3. Run locally: `pnpm test:visual --update-snapshots`
//   4. Inspect __screenshots__/<frame>.spec.ts/*.png against canonical/
//   5. Commit baselines + spec
//
// IMPORTANT: This template does NOT yet have committed baselines. First
// run will FAIL by design (Playwright auto-generates them on the first
// pass when `--update-snapshots` is supplied). FE+1's job per the brief
// is to populate `canonical/F08/*.png` then run --update-snapshots once
// to seed `__screenshots__/`.

import { test, expect } from '@playwright/test';

test.describe('F08 Home — VR baselines (Hard Rule 12 RWD)', () => {
  // Skip until FE+1 lands canonical/F08/*.png + initial baselines.
  // Remove this skip when the seed PR follows.
  test.skip(
    !process.env.VR_BASELINES_READY,
    'canonical baselines not yet committed — set VR_BASELINES_READY=1 to enable',
  );

  test('renders within tolerance', async ({ page }, testInfo) => {
    await page.goto('/home');

    // Wait for hydration to settle — Next.js App Router hydration
    // streams in chunks; skipping this is the #1 source of VR flake.
    // 500ms is conservative for the Iksula-data-pre-fetched home.
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Snapshot resolves to `canonical/F08/{projectName}.png` per the
    // snapshotPathTemplate in playwright.config.ts. {arg}='F08' (frame
    // slug); {projectName} carries the viewport short name (320 / 768 /
    // 1024 / 1440). A single call yields 4 baselines (one per project)
    // matching FE+1's canonical PNG filenames directly.
    await expect(page).toHaveScreenshot('F08', {
      // Inline overrides take precedence over expect.toHaveScreenshot
      // defaults in playwright.config.ts. Re-state the brief's canon
      // here for VR-spec readability — a future maintainer scanning
      // this file sees the exact tolerance without grepping config.
      maxDiffPixelRatio: 0.01,
      threshold: 0.2,
      animations: 'disabled',
      caret: 'hide',
      // Mask volatile regions (timestamps, "live" badges, telemetry
      // rates). FE+1 fills these once the F08 layout is final.
      mask: [],
    });

    // Annotate the test with the project name for reporter clarity.
    testInfo.annotations.push({
      type: 'viewport',
      description: testInfo.project.name,
    });
  });
});

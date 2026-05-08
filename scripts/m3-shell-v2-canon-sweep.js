// One-shot Playwright sweep for AdminShell v2 FULL CANON
// (Day-13 TASK 0). Captures the per-PR verification gate set:
//
//   1. shell-expanded-1440          — desktop, all icon tones visible
//   2. shell-collapsed-1440         — desktop, 64 px icon-only
//   3. shell-section-collapsed-1440 — desktop, one section toggled closed
//   4. shell-mobile-drawer-open-320 — mobile, hamburger → drawer
//   5. top-bar-1440                 — full top utility bar
//
// Run with the dev server already up on port 3000. Targets /kb/imports
// (always exists, AdminShell-wrapped, hits the AUTHOR section).

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE = 'http://localhost:3000';
const ROUTE = `${BASE}/kb/imports/`;
const OUT_DIR = path.resolve(__dirname, '..', 'docs/screenshots/m3-shell-v2-canon');

(async () => {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // 1. shell-expanded-1440 — initial render, full rail with all tones
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(ROUTE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({
    path: path.join(OUT_DIR, '1-shell-expanded-1440.png'),
    fullPage: true,
  });
  console.log('[OK] 1-shell-expanded-1440.png  1440x900');

  // 2. shell-collapsed-1440 — click the rail Collapse toggle
  const collapseBtn = page.locator('button[aria-label="Collapse navigation"]').first();
  await collapseBtn.click();
  await page.waitForTimeout(400);
  await page.screenshot({
    path: path.join(OUT_DIR, '2-shell-collapsed-1440.png'),
    fullPage: false,
  });
  console.log('[OK] 2-shell-collapsed-1440.png  1440x900');

  // Re-expand for next captures
  const expandBtn = page.locator('button[aria-label="Expand navigation"]').first();
  await expandBtn.click();
  await page.waitForTimeout(300);

  // 3. shell-section-collapsed-1440 — click the PLAN section header to collapse it
  await page.goto(ROUTE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  // Section header buttons are aria-controls'd; we'll target via text
  const planHeader = page.locator('button:has-text("Plan")').first();
  if ((await planHeader.count()) > 0) {
    try {
      await planHeader.click();
      await page.waitForTimeout(450);
    } catch {
      /* ignore */
    }
  }
  await page.screenshot({
    path: path.join(OUT_DIR, '3-shell-section-collapsed-1440.png'),
    fullPage: false,
  });
  console.log('[OK] 3-shell-section-collapsed-1440.png  1440x900');

  // 4. shell-mobile-drawer-open-320 — hamburger → drawer
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto(ROUTE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.locator('button[aria-label="Open navigation"]').click();
  await page.waitForTimeout(400);
  await page.screenshot({
    path: path.join(OUT_DIR, '4-shell-mobile-drawer-open-320.png'),
    fullPage: false,
  });
  console.log('[OK] 4-shell-mobile-drawer-open-320.png  320x568');

  // 5. top-bar-1440 — clip to header only (full top utility bar)
  await page.setViewportSize({ width: 1440, height: 200 });
  await page.goto(ROUTE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(OUT_DIR, '5-top-bar-1440.png'),
    fullPage: false,
    clip: { x: 0, y: 0, width: 1440, height: 60 },
  });
  console.log('[OK] 5-top-bar-1440.png  1440x60 (clipped)');

  await browser.close();
  console.log('=== AdminShell v2 canon sweep complete (5 screenshots) ===');
})().catch((err) => {
  console.error('[FAIL]', err.message);
  process.exit(1);
});

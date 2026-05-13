// Visual gate sweep for F19 Run Console Pattern A scaffold (M4 Day-17).
//
// API 400 image protocol BINDING — viewport-bounded clip:, NOT
// fullPage:true. All captures < 1 MB.
//
// Round 2: captures 1440-EXPANDED (default rail) + 1440-COLLAPSED
// (after rail-toggle click) + 320-MOBILE to verify Issue 3 metadata
// bar reflow holds in both sidebar states.
//
// Run: node scripts/m4-f19-run-console-sweep.js

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE = 'http://localhost:3000';
const ROUTE = `${BASE}/projects/iksula-returns/runs/RUN-RET-2026-04-25-002`;
const OUT_DIR = path.resolve(__dirname, '..', 'docs/screenshots/m4-f19-run-console');

async function shoot(page, viewport, file) {
  await page.setViewportSize(viewport);
  await page.goto(ROUTE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  await page.screenshot({
    path: file,
    clip: { x: 0, y: 0, width: viewport.width, height: viewport.height },
  });
  console.log(`[OK] ${path.basename(file)}  ${viewport.width}x${viewport.height}`);
}

async function shootCollapsedRail(page, viewport, file) {
  await page.setViewportSize(viewport);
  await page.goto(ROUTE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  // Click the rail toggle to collapse the sidebar to 64px
  const toggleSelectors = [
    'button[aria-label="Collapse navigation rail"]',
    'button[aria-label="Collapse"]',
    'button.rail-toggle',
    '[data-testid="rail-toggle"]',
  ];
  let toggled = false;
  for (const sel of toggleSelectors) {
    const handle = await page.$(sel);
    if (handle) {
      await handle.click();
      toggled = true;
      await page.waitForTimeout(400);
      break;
    }
  }
  if (!toggled) {
    console.log(
      `  [note] could not find rail-toggle for collapsed capture — capturing expanded state`,
    );
  }
  await page.screenshot({
    path: file,
    clip: { x: 0, y: 0, width: viewport.width, height: viewport.height },
  });
  console.log(
    `[OK] ${path.basename(file)}  ${viewport.width}x${viewport.height} (rail ${toggled ? 'COLLAPSED' : 'default'})`,
  );
}

(async () => {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  // 1440 desktop, sidebar EXPANDED (default state on first visit) —
  // tests Issue 3 metadata bar at the narrowest desktop case.
  await shoot(page, { width: 1440, height: 900 }, path.join(OUT_DIR, 'f19-1440.png'));

  // 1024 laptop
  await shoot(page, { width: 1024, height: 768 }, path.join(OUT_DIR, 'f19-1024.png'));

  // 768 tablet
  await shoot(page, { width: 768, height: 1024 }, path.join(OUT_DIR, 'f19-768.png'));

  // 320 mobile — vertical stack
  await shoot(page, { width: 320, height: 568 }, path.join(OUT_DIR, 'f19-320.png'));

  // 1440 desktop, sidebar COLLAPSED (after rail-toggle click) — for
  // visual comparison vs expanded state.
  await shootCollapsedRail(
    page,
    { width: 1440, height: 900 },
    path.join(OUT_DIR, 'f19-1440-rail-collapsed.png'),
  );

  await browser.close();
  console.log('=== F19 Run Console sweep complete ===');
})().catch((err) => {
  console.error('[FAIL]', err.message);
  process.exit(1);
});

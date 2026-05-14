// Visual gate sweep for F20 Run Results Pattern A (M4 Day-18, PR #147).
//
// Captures 5 viewport configurations: 1440 (expanded rail) ·
// 1440-rail-collapsed · 1024 · 768 · 320.
//
// API 400 image protocol — viewport-bounded clip:, NOT fullPage:true.
//
// Run: node scripts/m4-f20-results-sweep.js
// Override base via PROBE_BASE=http://localhost:3001

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE = process.env.PROBE_BASE || 'http://localhost:3001';
const ROUTE = `${BASE}/projects/iksula-returns/runs/RUN-RET-2026-04-25-002/results/`;
const OUT_DIR = path.resolve(__dirname, '..', 'docs/screenshots/m4-f20-results');

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
  const sels = ['button[aria-label="Collapse navigation"]', 'button[aria-label="Collapse"]'];
  let toggled = false;
  for (const s of sels) {
    const h = await page.$(s);
    if (h) {
      await h.click();
      toggled = true;
      await page.waitForTimeout(400);
      break;
    }
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

  await shoot(page, { width: 1440, height: 900 }, path.join(OUT_DIR, 'f20-1440.png'));
  await shootCollapsedRail(
    page,
    { width: 1440, height: 900 },
    path.join(OUT_DIR, 'f20-1440-rail-collapsed.png'),
  );
  await shoot(page, { width: 1024, height: 768 }, path.join(OUT_DIR, 'f20-1024.png'));
  await shoot(page, { width: 768, height: 1024 }, path.join(OUT_DIR, 'f20-768.png'));
  await shoot(page, { width: 320, height: 568 }, path.join(OUT_DIR, 'f20-320.png'));

  await browser.close();
  console.log('=== F20 Run Results sweep complete ===');
})().catch((err) => {
  console.error('[FAIL]', err.message);
  process.exit(1);
});

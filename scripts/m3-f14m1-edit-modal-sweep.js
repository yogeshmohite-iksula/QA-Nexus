// Sweep for F14m1 Edit Requirement Modal (M3 Day-13 evening TASK 3).
// Captures the modal open at desktop + tablet + mobile sizes per
// the per-PR verification gate (sections 5-8 for modals).

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE = 'http://localhost:3000';
const ROUTE = `${BASE}/requirements/?edit=RET-247`;
const NEW_ROUTE = `${BASE}/requirements/?edit=new`;
const OUT_DIR = path.resolve(__dirname, '..', 'docs/screenshots/m3-f14m1-edit-modal');

async function shoot(page, viewport, url, file) {
  await page.setViewportSize(viewport);
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.waitForSelector('[role="dialog"]', { state: 'visible', timeout: 8000 });
  await page.screenshot({ path: file, fullPage: false });
  console.log(`[OK] ${path.basename(file)}  ${viewport.width}x${viewport.height}`);
}

(async () => {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Edit RET-247 at 1440 (desktop)
  await shoot(page, { width: 1440, height: 900 }, ROUTE, path.join(OUT_DIR, 'f14m1-edit-1440.png'));

  // Edit RET-247 at 768 (tablet)
  await shoot(page, { width: 768, height: 1024 }, ROUTE, path.join(OUT_DIR, 'f14m1-edit-768.png'));

  // Edit RET-247 at 320 (mobile, full-screen drawer)
  await shoot(page, { width: 320, height: 568 }, ROUTE, path.join(OUT_DIR, 'f14m1-edit-320.png'));

  // New requirement at 1440 (empty form)
  await shoot(
    page,
    { width: 1440, height: 900 },
    NEW_ROUTE,
    path.join(OUT_DIR, 'f14m1-new-1440.png'),
  );

  // Click "Suggest 5 ACs" to capture the post-Composer state
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(ROUTE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.waitForSelector('[role="dialog"]', { state: 'visible' });
  const suggestBtn = page.locator('button:has-text("Suggest 5 ACs")').first();
  if ((await suggestBtn.count()) > 0) {
    await suggestBtn.click();
    // Composer simulated round-trip is 1.4 s; wait 1.7 s
    await page.waitForTimeout(1700);
    await page.screenshot({
      path: path.join(OUT_DIR, 'f14m1-composer-suggested-1440.png'),
      fullPage: false,
    });
    console.log('[OK] f14m1-composer-suggested-1440.png  1440x900');
  }

  await browser.close();
  console.log('=== F14m1 Edit Requirement Modal sweep complete ===');
})().catch((err) => {
  console.error('[FAIL]', err.message);
  process.exit(1);
});

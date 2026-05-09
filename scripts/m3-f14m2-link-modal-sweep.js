// Sweep for F14m2 Link Test Case Modal (M3 Day-13 evening TASK 4).
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE = 'http://localhost:3000';
const ROUTE = `${BASE}/requirements/?link=RET-247`;
const OUT_DIR = path.resolve(__dirname, '..', 'docs/screenshots/m3-f14m2-link-modal');

async function shoot(page, viewport, file) {
  await page.setViewportSize(viewport);
  await page.goto(ROUTE, { waitUntil: 'networkidle' });
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

  await shoot(page, { width: 1440, height: 900 }, path.join(OUT_DIR, 'f14m2-link-1440.png'));
  await shoot(page, { width: 768, height: 1024 }, path.join(OUT_DIR, 'f14m2-link-768.png'));
  await shoot(page, { width: 320, height: 568 }, path.join(OUT_DIR, 'f14m2-link-320.png'));

  // Click "Show suggested" toggle to capture filtered state
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(ROUTE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const showBtn = page.locator('button:has-text("Show 4 suggested")').first();
  if ((await showBtn.count()) > 0) {
    await showBtn.click();
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(OUT_DIR, 'f14m2-suggested-filtered-1440.png'),
      fullPage: false,
    });
    console.log('[OK] f14m2-suggested-filtered-1440.png  1440x900');
  }

  await browser.close();
  console.log('=== F14m2 Link Test Case Modal sweep complete ===');
})().catch((err) => {
  console.error('[FAIL]', err.message);
  process.exit(1);
});

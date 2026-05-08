// Sweep for F14 Requirements page (Day-13 TASK 2 Pattern A scaffold).

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE = 'http://localhost:3000';
const ROUTE = `${BASE}/requirements/`;
const OUT_DIR = path.resolve(__dirname, '..', 'docs/screenshots/m3-f14-requirements');

async function shoot(page, viewport, file, prep) {
  await page.setViewportSize(viewport);
  await page.goto(ROUTE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  if (prep) await prep(page);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`[OK] ${path.basename(file)}  ${viewport.width}x${viewport.height}`);
}

(async () => {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // 1. List @ 1440 with pre-selected bulk-bar visible
  await shoot(page, { width: 1440, height: 900 }, path.join(OUT_DIR, 'f14-list-1440.png'));

  // 2. List @ 320 (mobile, hamburger visible)
  await shoot(page, { width: 320, height: 568 }, path.join(OUT_DIR, 'f14-list-320.png'));

  // 3. Bulk-action-bar @ 1440 — clip the section near the top of the table
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(ROUTE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  // Just take a fullPage and let visual reviewer scroll
  await page.screenshot({
    path: path.join(OUT_DIR, 'f14-bulk-action-bar-1440.png'),
    fullPage: true,
  });
  console.log('[OK] f14-bulk-action-bar-1440.png  1440x900');

  await browser.close();
  console.log('=== F14 Requirements sweep complete ===');
})().catch((err) => {
  console.error('[FAIL]', err.message);
  process.exit(1);
});

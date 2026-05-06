// One-shot Playwright sweep for F13 KB Imports Pattern A scaffold.
// Captures: list@1440, list@320, delete-confirm@1440.
// Usage:    node scripts/m2-f13-imports-sweep.js
// Requires: dev server already running on http://localhost:3000

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ROUTE = 'http://localhost:3001/kb/imports/';
const OUT_DIR = path.resolve(__dirname, '..', 'docs/screenshots/m2-f13-kb-imports');

async function shoot(page, viewport, name) {
  await page.setViewportSize(viewport);
  await page.goto(ROUTE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const file = path.join(OUT_DIR, name);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`[OK] ${name}  ${viewport.width}x${viewport.height}`);
}

(async () => {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // 1. desktop list
  await shoot(page, { width: 1440, height: 900 }, 'f13-imports-list-1440.png');

  // 2. mobile list
  await shoot(page, { width: 320, height: 568 }, 'f13-imports-list-320.png');

  // 3. desktop with delete-confirm modal open
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(ROUTE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  // Click first delete trash button inside the visible desktop table.
  // Mobile cards (also containing aria-label="Delete ..." buttons) are
  // display:none at md+ — pick visible only.
  const visibleDelete = page.locator('button[aria-label^="Delete "]:visible').first();
  await visibleDelete.scrollIntoViewIfNeeded();
  await visibleDelete.click({ force: true });
  await page.waitForSelector('[role="dialog"]', { state: 'visible', timeout: 8000 });
  await page.waitForTimeout(400);
  await page.screenshot({
    path: path.join(OUT_DIR, 'f13-imports-delete-confirm-1440.png'),
    fullPage: false,
  });
  console.log('[OK] f13-imports-delete-confirm-1440.png  1440x900');

  await browser.close();
  console.log('=== F13 sweep complete ===');
})().catch((err) => {
  console.error('[FAIL]', err.message);
  process.exit(1);
});

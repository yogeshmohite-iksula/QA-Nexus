// One-shot Playwright sweep for F13 Pattern A→B flip (Day-12 TASK 2).
// Captures whatever real BE state we land in (empty / loaded / error).
// Run with the dev server already up on port 3000.

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE = 'http://localhost:3000';
const ROUTE = `${BASE}/kb/imports/`;
const OUT_DIR = path.resolve(__dirname, '..', 'docs/screenshots/m2-f13-kb-imports-pattern-b');

async function shoot(page, viewport, file, prep) {
  await page.setViewportSize(viewport);
  await page.goto(ROUTE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800); // let React Query settle
  if (prep) await prep(page);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`[OK] ${path.basename(file)}  ${viewport.width}x${viewport.height}`);
}

(async () => {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // 1. Desktop list — whatever state the BE returns (empty / loaded / error)
  await shoot(page, { width: 1440, height: 900 }, path.join(OUT_DIR, 'f13-list-1440.png'));

  // 2. Mobile list — same data, smaller viewport
  await shoot(page, { width: 320, height: 568 }, path.join(OUT_DIR, 'f13-list-320.png'));

  // 3. Mobile @ 320 with hamburger visible (Rule 14 + Rule 12 simultaneous compliance)
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto(ROUTE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(OUT_DIR, 'f13-mobile-with-hamburger-320.png'),
    fullPage: false,
  });
  console.log('[OK] f13-mobile-with-hamburger-320.png  320x568');

  // 4. If rows exist, click delete on first row + screenshot the confirm modal.
  //    If no rows, this step gracefully skips.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(ROUTE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const deleteBtn = page.locator('button[aria-label^="Delete "]:visible').first();
  if ((await deleteBtn.count()) > 0) {
    try {
      await deleteBtn.scrollIntoViewIfNeeded();
      await deleteBtn.click({ force: true });
      await page.waitForSelector('[role="dialog"]', { state: 'visible', timeout: 5000 });
      await page.waitForTimeout(400);
      await page.screenshot({
        path: path.join(OUT_DIR, 'f13-delete-confirm-1440.png'),
        fullPage: false,
      });
      console.log('[OK] f13-delete-confirm-1440.png  1440x900');
    } catch (e) {
      console.log(`[SKIP] f13-delete-confirm-1440.png — ${e.message}`);
    }
  } else {
    console.log('[SKIP] f13-delete-confirm-1440.png — no rows in BE dev DB');
  }

  await browser.close();
  console.log('=== F13 Pattern B sweep complete ===');
})().catch((err) => {
  console.error('[FAIL]', err.message);
  process.exit(1);
});

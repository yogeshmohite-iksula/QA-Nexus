// Sweep for F16c Bulk Import Modal (Day-14 Sat evening TASK B1).
// Captures the modal open at desktop / tablet / mobile per the
// per-PR verification gate (Stage modal at 1120×860 desktop /
// full-screen mobile).
//
// Reached via /test-cases?bulk-import=1 — the modal is hosted on
// the F22 Test Case Library placeholder page, opened from F16a
// chooser → "Bulk Import" card.

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE = 'http://localhost:3000';
const ROUTE = `${BASE}/test-cases/?bulk-import=1`;
const OUT_DIR = path.resolve(__dirname, '..', 'docs/screenshots/m3-f16c-bulk-import');

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

  // 1. Desktop (1440 — fits the 1120 modal with breathing room)
  await shoot(page, { width: 1440, height: 900 }, path.join(OUT_DIR, 'f16c-1440.png'));

  // 2. Laptop (1024 — modal still fits, pair-row 5-col grid)
  await shoot(page, { width: 1024, height: 768 }, path.join(OUT_DIR, 'f16c-1024.png'));

  // 3. Tablet (768 — pair rows degrade to 2-col stack)
  await shoot(page, { width: 768, height: 1024 }, path.join(OUT_DIR, 'f16c-768.png'));

  // 4. Mobile (320 — full-screen sheet, strategy radios stack)
  await shoot(page, { width: 320, height: 568 }, path.join(OUT_DIR, 'f16c-320.png'));

  // 5. Strategy "Keep new (replace)" selected — desktop
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(ROUTE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  const replaceRadio = page.getByRole('radio', { name: /Keep new/i });
  if ((await replaceRadio.count()) > 0) {
    await replaceRadio.click();
    await page.waitForTimeout(300);
    await page.screenshot({
      path: path.join(OUT_DIR, 'f16c-strategy-replace-1440.png'),
      fullPage: false,
    });
    console.log('[OK] f16c-strategy-replace-1440.png  1440x900');
  }

  await browser.close();
  console.log('=== F16c Bulk Import Modal sweep complete ===');
})().catch((err) => {
  console.error('[FAIL]', err.message);
  process.exit(1);
});

// One-shot Playwright sweep for F12 KB Upload Pattern A→B flip
// (Day-12 TASK 1 RESUME). Captures whatever real BE state we land in.

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE = 'http://localhost:3000';
const ROUTE = `${BASE}/kb/upload/`;
const OUT_DIR = path.resolve(__dirname, '..', 'docs/screenshots/m2-f12-kb-upload-pattern-b');

async function shoot(page, viewport, file, prep) {
  await page.setViewportSize(viewport);
  await page.goto(ROUTE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  if (prep) await prep(page);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`[OK] ${path.basename(file)}  ${viewport.width}x${viewport.height}`);
}

(async () => {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // 1. Drop-zone @ 1440 — initial render
  await shoot(page, { width: 1440, height: 900 }, path.join(OUT_DIR, 'f12-drop-zone-1440.png'));

  // 2. Drop-zone @ 320 — mobile reflow
  await shoot(page, { width: 320, height: 568 }, path.join(OUT_DIR, 'f12-drop-zone-320.png'));

  // 3. Selected state @ 1440 — file picked, "Upload document" CTA visible
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(ROUTE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  try {
    await page.setInputFiles('input[type="file"]', {
      name: 'sample_spec.md',
      mimeType: 'text/markdown',
      buffer: Buffer.from('# Sample doc for F12 Pattern B sweep\n'),
    });
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(OUT_DIR, 'f12-selected-1440.png'),
      fullPage: true,
    });
    console.log('[OK] f12-selected-1440.png  1440x900');
  } catch (e) {
    console.log(`[SKIP] f12-selected-1440.png — ${e.message}`);
  }

  // 4. Uploading / processing @ 1440 — click Upload, capture mid-flight
  try {
    const uploadBtn = page.locator('button:has-text("Upload document")').first();
    await uploadBtn.click();
    // Capture during the uploading step (Step 1 → Step 2 → Step 3 takes ~2-5 s)
    await page.waitForTimeout(700);
    await page.screenshot({
      path: path.join(OUT_DIR, 'f12-uploading-1440.png'),
      fullPage: true,
    });
    console.log('[OK] f12-uploading-1440.png  1440x900');
    // Wait a little more for the success/error terminal state
    await page.waitForTimeout(2500);
    await page.screenshot({
      path: path.join(OUT_DIR, 'f12-terminal-state-1440.png'),
      fullPage: true,
    });
    console.log('[OK] f12-terminal-state-1440.png  1440x900');
  } catch (e) {
    console.log(`[SKIP] uploading screenshots — ${e.message}`);
  }

  await browser.close();
  console.log('=== F12 Pattern B sweep complete ===');
})().catch((err) => {
  console.error('[FAIL]', err.message);
  process.exit(1);
});

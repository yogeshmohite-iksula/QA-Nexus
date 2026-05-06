// One-shot Playwright sweep for the F12 + F13 AdminShell-wrap fix.
//
// Captures 6 fresh screenshots:
//   F12: drop-zone@1440 + drop-zone@320 + processing@1440 (mid-upload)
//   F13: list@1440     + list@320      + delete-confirm@1440
//
// Replaces existing m2-f12-kb-upload + m2-f13-kb-imports screenshots.
// Run with the dev server already up on port 3001.

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE = 'http://localhost:3001';
const F12_DIR = path.resolve(__dirname, '..', 'docs/screenshots/m2-f12-kb-upload');
const F13_DIR = path.resolve(__dirname, '..', 'docs/screenshots/m2-f13-kb-imports');

async function shoot(page, viewport, url, file, prep) {
  await page.setViewportSize(viewport);
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  if (prep) await prep(page);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`[OK] ${path.basename(file)}  ${viewport.width}x${viewport.height}`);
}

(async () => {
  if (!fs.existsSync(F12_DIR)) fs.mkdirSync(F12_DIR, { recursive: true });
  if (!fs.existsSync(F13_DIR)) fs.mkdirSync(F13_DIR, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // ─── F12 — Upload modal ───────────────────────────────────────────────
  await shoot(
    page,
    { width: 1440, height: 900 },
    `${BASE}/kb/upload/`,
    path.join(F12_DIR, 'f12-kb-upload-initial-1440.png'),
  );
  await shoot(
    page,
    { width: 320, height: 568 },
    `${BASE}/kb/upload/`,
    path.join(F12_DIR, 'f12-kb-upload-initial-320.png'),
  );

  // F12 processing — capture the uploading state mid-flight.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/kb/upload/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  // Use setInputFiles directly on the sr-only file input (works for
  // hidden inputs — that's the recommended Playwright path).
  await page.setInputFiles('input[type="file"]', {
    name: 'sample_spec.md',
    mimeType: 'text/markdown',
    buffer: Buffer.from('# sample doc content for f12 sweep'),
  });
  await page.waitForTimeout(400);
  // The form is now in the "selected" state — click "Upload document"
  // button (the page CTA, NOT the AdminShell topbar Upload, which is
  // a Link not a button).
  const uploadBtn = page.locator('button:has-text("Upload document")').first();
  await uploadBtn.click();
  // Capture during the uploading state — progress bar visible, ~30-60%.
  await page.waitForTimeout(700);
  await page.screenshot({
    path: path.join(F12_DIR, 'f12-kb-upload-processing-1440.png'),
    fullPage: true,
  });
  console.log('[OK] f12-kb-upload-processing-1440.png  1440x900');

  // ─── F13 — Imports list ───────────────────────────────────────────────
  await shoot(
    page,
    { width: 1440, height: 900 },
    `${BASE}/kb/imports/`,
    path.join(F13_DIR, 'f13-imports-list-1440.png'),
  );
  await shoot(
    page,
    { width: 320, height: 568 },
    `${BASE}/kb/imports/`,
    path.join(F13_DIR, 'f13-imports-list-320.png'),
  );

  // F13 delete-confirm modal
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/kb/imports/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const visibleDelete = page.locator('button[aria-label^="Delete "]:visible').first();
  await visibleDelete.scrollIntoViewIfNeeded();
  await visibleDelete.click({ force: true });
  await page.waitForSelector('[role="dialog"]', { state: 'visible', timeout: 8000 });
  await page.waitForTimeout(400);
  await page.screenshot({
    path: path.join(F13_DIR, 'f13-imports-delete-confirm-1440.png'),
    fullPage: false,
  });
  console.log('[OK] f13-imports-delete-confirm-1440.png  1440x900');

  await browser.close();
  console.log('=== Shell-wrap sweep complete (6 screenshots) ===');
})().catch((err) => {
  console.error('[FAIL]', err.message);
  process.exit(1);
});

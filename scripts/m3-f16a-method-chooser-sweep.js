// Sweep for F16a Test Case Method Chooser modal (Day-13 evening TASK 6).
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE = 'http://localhost:3000';
const ROUTE = `${BASE}/test-cases/?new-test-case=1`;
const TRIGGER_ROUTE = `${BASE}/test-cases/`;
const OUT_DIR = path.resolve(__dirname, '..', 'docs/screenshots/m3-f16a-method-chooser');

async function shoot(page, viewport, url, file) {
  await page.setViewportSize(viewport);
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  if (url === ROUTE) {
    await page.waitForSelector('[role="dialog"]', { state: 'visible', timeout: 8000 });
  }
  await page.screenshot({ path: file, fullPage: false });
  console.log(`[OK] ${path.basename(file)}  ${viewport.width}x${viewport.height}`);
}

(async () => {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Trigger page (placeholder + + New test case CTA)
  await shoot(
    page,
    { width: 1440, height: 900 },
    TRIGGER_ROUTE,
    path.join(OUT_DIR, 'f16a-trigger-1440.png'),
  );

  // Modal open at desktop (3-card grid)
  await shoot(
    page,
    { width: 1440, height: 900 },
    ROUTE,
    path.join(OUT_DIR, 'f16a-chooser-1440.png'),
  );

  // Modal at tablet
  await shoot(
    page,
    { width: 768, height: 1024 },
    ROUTE,
    path.join(OUT_DIR, 'f16a-chooser-768.png'),
  );

  // Modal at mobile (cards stack vertically)
  await shoot(page, { width: 320, height: 568 }, ROUTE, path.join(OUT_DIR, 'f16a-chooser-320.png'));

  await browser.close();
  console.log('=== F16a Method Chooser sweep complete ===');
})().catch((err) => {
  console.error('[FAIL]', err.message);
  process.exit(1);
});

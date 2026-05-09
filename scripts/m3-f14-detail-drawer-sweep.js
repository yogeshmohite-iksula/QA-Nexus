// Sweep for F14 Requirement Detail Drawer (Day-14 TASK A3).
// Captures the slide-in right-side drawer at desktop + mobile sizes
// per the per-PR verification gate.

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE = 'http://localhost:3000';
const VIEW_ROUTE = `${BASE}/requirements/?view=RET-247`;
const VIEW_DRAFT_ROUTE = `${BASE}/requirements/?view=RET-251`;
const OUT_DIR = path.resolve(__dirname, '..', 'docs/screenshots/m3-f14-detail-drawer');

async function shoot(page, viewport, url, file) {
  await page.setViewportSize(viewport);
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  await page.waitForSelector('[role="dialog"]', { state: 'visible', timeout: 8000 });
  await page.screenshot({ path: file, fullPage: false });
  console.log(`[OK] ${path.basename(file)}  ${viewport.width}x${viewport.height}`);
}

(async () => {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // 1. Drawer open at desktop (1440) — RET-247 (in-review, full coverage)
  await shoot(
    page,
    { width: 1440, height: 900 },
    VIEW_ROUTE,
    path.join(OUT_DIR, 'f14-drawer-1440.png'),
  );

  // 2. Drawer open at tablet (768)
  await shoot(
    page,
    { width: 768, height: 1024 },
    VIEW_ROUTE,
    path.join(OUT_DIR, 'f14-drawer-768.png'),
  );

  // 3. Drawer open at mobile (320) — full-screen sheet
  await shoot(
    page,
    { width: 320, height: 568 },
    VIEW_ROUTE,
    path.join(OUT_DIR, 'f14-drawer-320.png'),
  );

  // 4. Drawer with empty-coverage state (RET-251 draft, 0 linked)
  await shoot(
    page,
    { width: 1440, height: 900 },
    VIEW_DRAFT_ROUTE,
    path.join(OUT_DIR, 'f14-drawer-empty-coverage-1440.png'),
  );

  await browser.close();
  console.log('=== F14 Detail Drawer sweep complete ===');
})().catch((err) => {
  console.error('[FAIL]', err.message);
  process.exit(1);
});

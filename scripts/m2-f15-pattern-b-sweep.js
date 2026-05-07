// One-shot Playwright sweep for F15 KB Pattern A→B flip (Day-12 TASK 3).
// Captures whatever real BE state the dev session lands in.
// F15 lives under /projects/[slug]/kb (project-scoped).

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE = 'http://localhost:3000';
const ROUTE = `${BASE}/projects/ret/kb/`;
const OUT_DIR = path.resolve(__dirname, '..', 'docs/screenshots/m2-f15-kb-pattern-b');

async function shoot(page, viewport, file, prep) {
  await page.setViewportSize(viewport);
  await page.goto(ROUTE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000); // let TanStack Query settle
  if (prep) await prep(page);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`[OK] ${path.basename(file)}  ${viewport.width}x${viewport.height}`);
}

(async () => {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // 1. Desktop @ 1440 — initial search render (whatever state BE returns)
  await shoot(page, { width: 1440, height: 900 }, path.join(OUT_DIR, 'f15-search-1440.png'));

  // 2. Mobile @ 320
  await shoot(page, { width: 320, height: 568 }, path.join(OUT_DIR, 'f15-search-320.png'));

  // 3. Empty-query state — clear the search and capture the idle/empty render
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(ROUTE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const searchInput = page.locator('input[type="search"], input[placeholder*="Search" i]').first();
  if ((await searchInput.count()) > 0) {
    try {
      await searchInput.fill('');
      await page.waitForTimeout(500);
      await page.screenshot({
        path: path.join(OUT_DIR, 'f15-search-empty-1440.png'),
        fullPage: true,
      });
      console.log('[OK] f15-search-empty-1440.png  1440x900');
    } catch (e) {
      console.log(`[SKIP] f15-search-empty-1440.png — ${e.message}`);
    }
  } else {
    console.log('[SKIP] f15-search-empty-1440.png — search input not located');
  }

  await browser.close();
  console.log('=== F15 Pattern B sweep complete ===');
})().catch((err) => {
  console.error('[FAIL]', err.message);
  process.exit(1);
});

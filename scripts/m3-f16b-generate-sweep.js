// Sweep for F16b A1 Generate from Requirement Pattern A scaffold
// (M3 Day-14 Sat afternoon TASK A2). Captures the page open at
// desktop / laptop / tablet / mobile sizes per the per-PR
// verification gate (sections 1-8 — full page, not modal).
//
// Per Day-14 brief TASK A1: Playwright CLI (direct npm import) — NOT
// MCP. This script runs as `node scripts/m3-f16b-generate-sweep.js`
// and uses the playwright npm package directly.

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE = 'http://localhost:3000';
const ROUTE = `${BASE}/test-cases/generate/?source=RET-247`;
const OUT_DIR = path.resolve(__dirname, '..', 'docs/screenshots/m3-f16b-generate');

async function shoot(page, viewport, file) {
  await page.setViewportSize(viewport);
  await page.goto(ROUTE, { waitUntil: 'networkidle' });
  // Allow streaming-card animation to start + initial layout settle
  await page.waitForTimeout(900);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`[OK] ${path.basename(file)}  ${viewport.width}x${viewport.height}`);
}

(async () => {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // 1. Desktop (xl ≥1280) — 3-col workspace fully expanded
  await shoot(page, { width: 1440, height: 900 }, path.join(OUT_DIR, 'f16b-1440.png'));

  // 2. Laptop (lg 1024-1279) — right pane auto-collapses
  await shoot(page, { width: 1024, height: 768 }, path.join(OUT_DIR, 'f16b-1024.png'));

  // 3. Tablet (md 768) — should stack the two left panes; mobile rail
  await shoot(page, { width: 768, height: 1024 }, path.join(OUT_DIR, 'f16b-768.png'));

  // 4. Mobile (320 × 568, iPhone SE)
  await shoot(page, { width: 320, height: 568 }, path.join(OUT_DIR, 'f16b-320.png'));

  // 5. Activity-pane closed — desktop view after dismissing the right pane
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(ROUTE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  const closeBtn = page.locator('button[aria-label="Close activity panel"]').first();
  if ((await closeBtn.count()) > 0) {
    await closeBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(OUT_DIR, 'f16b-activity-closed-1440.png'),
      fullPage: true,
    });
    console.log('[OK] f16b-activity-closed-1440.png  1440x900');
  }

  await browser.close();
  console.log('=== F16b Generate page sweep complete ===');
})().catch((err) => {
  console.error('[FAIL]', err.message);
  process.exit(1);
});

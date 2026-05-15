// Hard Rule 13 visual-gate sweep for F21 (v2.1.2 diff-probe AMBER).
// Captures 320 px (mobile) + 1440 px (desktop) per Yogesh's approval.
// Output: docs/visual-gates/F21-v2.1.2-{320,1440}.png
// API 400 image protocol — clip:, NOT fullPage:true. < 300 KB each.

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE = process.env.PROBE_BASE || 'http://localhost:3000';
const ROUTE = `${BASE}/projects/iksula-returns/defects/`;
const OUT_DIR = path.resolve(__dirname, '..', 'docs/visual-gates');

async function shoot(page, vp, file) {
  await page.setViewportSize(vp);
  await page.goto(ROUTE, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  await page.screenshot({
    path: file,
    clip: { x: 0, y: 0, width: vp.width, height: vp.height },
  });
  const sz = fs.statSync(file).size;
  console.log(`[OK] ${path.basename(file)}  ${vp.width}x${vp.height}  ${sz}B`);
}

(async () => {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ colorScheme: 'dark' });
  const page = await ctx.newPage();
  await shoot(page, { width: 1440, height: 900 }, path.join(OUT_DIR, 'F21-v2.1.2-1440.png'));
  await shoot(page, { width: 320, height: 568 }, path.join(OUT_DIR, 'F21-v2.1.2-320.png'));
  await browser.close();
  console.log('=== F21 v2.1.2 visual gate sweep complete ===');
})().catch((err) => {
  console.error('[FAIL]', err.message);
  process.exit(1);
});

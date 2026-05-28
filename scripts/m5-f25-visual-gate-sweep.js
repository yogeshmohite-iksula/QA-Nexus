// Hard Rule 13 visual-gate sweep for F25 Executive Dashboard.
// Captures 320 px (mobile) + 1440 px (desktop) per Yogesh's approval.
// Output: docs/visual-gates/F25-v2.1.2-{320,1440}.png
//
// F25 is Prove-mode flagship — ivory canvas (light theme default).
// Day-19 lesson: fullPage:true + tall viewport (2400 px) to capture full page.

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');

const BASE = process.env.PROBE_BASE || 'http://localhost:3000';
const ROUTE = `${BASE}/dashboard/executive/`;
const OUT_DIR = path.resolve(__dirname, '..', 'docs/visual-gates');

async function shoot(page, vp, file) {
  await page.setViewportSize(vp);
  await page.goto(ROUTE, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  await page.screenshot({ path: file, fullPage: true });
  let sz = fs.statSync(file).size;
  if (sz > 1024 * 1024) {
    try {
      execFileSync('sips', ['-Z', '1600', file], { stdio: 'pipe' });
      sz = fs.statSync(file).size;
      console.log(
        `[OK] ${path.basename(file)}  ${vp.width}x${vp.height} fullPage  ${sz}B (sips-resized)`,
      );
      return;
    } catch (e) {
      // sips not available; leave at original size
    }
  }
  console.log(`[OK] ${path.basename(file)}  ${vp.width}x${vp.height} fullPage  ${sz}B`);
}

(async () => {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await shoot(page, { width: 1440, height: 2400 }, path.join(OUT_DIR, 'F25-v2.1.2-1440.png'));
  await shoot(page, { width: 320, height: 2400 }, path.join(OUT_DIR, 'F25-v2.1.2-320.png'));
  await browser.close();
  console.log('=== F25 v2.1.2 visual gate sweep complete ===');
})().catch((err) => {
  console.error('[FAIL]', err.message);
  process.exit(1);
});

// Hard Rule 13 visual-gate sweep for F21 (v2.1.2 diff-probe AMBER).
// Captures 320 px (mobile) + 1440 px (desktop) per Yogesh's approval.
// Output: docs/visual-gates/F21-v2.1.2-{320,1440}.png
//
// Day-19 Round-2 fix (per followup `da`): use fullPage: true + tall
// viewport (height 2400 px) so the screenshot captures everything BELOW
// the fold — the v1 capture used a 900 px viewport + clip:, which cut
// off the right-rail Activity/Comments and the bottom of the list pane.
// API 400 image protocol still respected — sips-resize if >1 MB.

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');

const BASE = process.env.PROBE_BASE || 'http://localhost:3000';
const ROUTE = `${BASE}/projects/iksula-returns/defects/`;
const OUT_DIR = path.resolve(__dirname, '..', 'docs/visual-gates');

async function shoot(page, vp, file) {
  await page.setViewportSize(vp);
  await page.goto(ROUTE, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  await page.screenshot({ path: file, fullPage: true });
  let sz = fs.statSync(file).size;
  // API 400 image protocol — sips-resize if file >1 MB
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
  const ctx = await browser.newContext({ colorScheme: 'dark' });
  const page = await ctx.newPage();
  // Tall viewport height ensures sd-rail content fits in viewport before fullPage extends
  await shoot(page, { width: 1440, height: 2400 }, path.join(OUT_DIR, 'F21-v2.1.2-1440.png'));
  await shoot(page, { width: 320, height: 2400 }, path.join(OUT_DIR, 'F21-v2.1.2-320.png'));
  await browser.close();
  console.log('=== F21 v2.1.2 visual gate sweep complete ===');
})().catch((err) => {
  console.error('[FAIL]', err.message);
  process.exit(1);
});

// F20 visual-gate side-by-side screenshot sweep (Hard Rule 17 verbatim).
//
// Captures the canonical F20 HTML (served via /_design-refs/F20-canonical.html)
// AND the React port at the same viewport for direct comparison.
//
// Output: docs/screenshots/m4-f20-side-by-side/
//   - canonical-1440.png  (canonical HTML)
//   - react-1440.png      (React port)
//   - canonical-320.png
//   - react-320.png

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE = process.env.PROBE_BASE || 'http://localhost:3001';
const CANONICAL = `${BASE}/_design-refs/F20-canonical.html`;
const REACT = `${BASE}/projects/iksula-returns/runs/RUN-RET-2026-04-25-002/results/`;
const OUT_DIR = path.resolve(__dirname, '..', 'docs/screenshots/m4-f20-side-by-side');

async function shoot(page, url, viewport, file) {
  await page.setViewportSize(viewport);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await page.screenshot({
    path: file,
    clip: { x: 0, y: 0, width: viewport.width, height: viewport.height },
  });
  console.log(`[OK] ${path.basename(file)}  ${viewport.width}x${viewport.height}`);
}

(async () => {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  await shoot(
    page,
    CANONICAL,
    { width: 1440, height: 900 },
    path.join(OUT_DIR, 'canonical-1440.png'),
  );
  await shoot(page, REACT, { width: 1440, height: 900 }, path.join(OUT_DIR, 'react-1440.png'));
  await shoot(
    page,
    CANONICAL,
    { width: 320, height: 568 },
    path.join(OUT_DIR, 'canonical-320.png'),
  );
  await shoot(page, REACT, { width: 320, height: 568 }, path.join(OUT_DIR, 'react-320.png'));

  await browser.close();
  console.log('=== F20 side-by-side sweep complete ===');
})().catch((err) => {
  console.error('[FAIL]', err.message);
  process.exit(1);
});

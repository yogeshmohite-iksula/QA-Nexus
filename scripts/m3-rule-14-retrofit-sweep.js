// Sweep for the F08 + F09 Hard Rule 14 retrofit (Day-13 TASK 1).
// Captures both pages at desktop + mobile to prove they now inherit
// the AdminShell v2 canon (collapse toggle + hamburger + colored
// nav-icon chips).

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE = 'http://localhost:3000';
const OUT_DIR = path.resolve(__dirname, '..', 'docs/screenshots/m3-rule-14-retrofit');

async function shoot(page, viewport, url, file) {
  await page.setViewportSize(viewport);
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`[OK] ${path.basename(file)}  ${viewport.width}x${viewport.height}`);
}

(async () => {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // F08 Home
  await shoot(
    page,
    { width: 1440, height: 900 },
    `${BASE}/home/`,
    path.join(OUT_DIR, 'f08-home-1440.png'),
  );
  await shoot(
    page,
    { width: 320, height: 568 },
    `${BASE}/home/`,
    path.join(OUT_DIR, 'f08-home-320.png'),
  );

  // F09 Projects List
  await shoot(
    page,
    { width: 1440, height: 900 },
    `${BASE}/projects/`,
    path.join(OUT_DIR, 'f09-projects-1440.png'),
  );
  await shoot(
    page,
    { width: 320, height: 568 },
    `${BASE}/projects/`,
    path.join(OUT_DIR, 'f09-projects-320.png'),
  );

  await browser.close();
  console.log('=== F08 + F09 retrofit sweep complete ===');
})().catch((err) => {
  console.error('[FAIL]', err.message);
  process.exit(1);
});

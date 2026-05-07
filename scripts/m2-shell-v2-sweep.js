// One-shot Playwright sweep for AdminShell v2 (Hard Rule 14, TASK 0).
//
// Captures 7 screenshots:
//   1. shell-expanded-1440          — default desktop, 240 px rail
//   2. shell-collapsed-1440         — post-toggle, 64 px rail
//   3. shell-mobile-drawer-closed-320  — hamburger visible top-left
//   4. shell-mobile-drawer-open-320    — drawer slid in, backdrop visible
//   5. f12-shell-v2-1440            — F12 inheriting v2 shell
//   6. f13-shell-v2-1440            — F13 inheriting v2 shell
//   7. f15-shell-v2-1440            — F15 inheriting v2 shell (existing route)
//
// Run with the dev server already up on port 3000.

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE = 'http://localhost:3000';
const OUT_DIR = path.resolve(__dirname, '..', 'docs/screenshots/m2-task0-shell-v2');

async function shoot(page, viewport, url, file, prep) {
  await page.setViewportSize(viewport);
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  if (prep) await prep(page);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`[OK] ${path.basename(file)}  ${viewport.width}x${viewport.height}`);
}

(async () => {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // 1. shell-expanded-1440 (use F13 imports as the canonical view)
  await shoot(
    page,
    { width: 1440, height: 900 },
    `${BASE}/kb/imports/`,
    path.join(OUT_DIR, '1-shell-expanded-1440.png'),
  );

  // 2. shell-collapsed-1440 — click the Collapse button, then screenshot
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/kb/imports/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.locator('button[aria-label="Collapse navigation"]').click();
  await page.waitForTimeout(400); // let the 200ms transition settle
  await page.screenshot({
    path: path.join(OUT_DIR, '2-shell-collapsed-1440.png'),
    fullPage: false,
  });
  console.log('[OK] 2-shell-collapsed-1440.png  1440x900');

  // Re-expand for next page (so it doesn't carry over via localStorage)
  await page.locator('button[aria-label="Expand navigation"]').click();
  await page.waitForTimeout(300);

  // 3. shell-mobile-drawer-closed-320 — hamburger visible
  await shoot(
    page,
    { width: 320, height: 568 },
    `${BASE}/kb/imports/`,
    path.join(OUT_DIR, '3-shell-mobile-drawer-closed-320.png'),
  );

  // 4. shell-mobile-drawer-open-320 — click hamburger, drawer slides in
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto(`${BASE}/kb/imports/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.locator('button[aria-label="Open navigation"]').click();
  await page.waitForTimeout(400);
  await page.screenshot({
    path: path.join(OUT_DIR, '4-shell-mobile-drawer-open-320.png'),
    fullPage: false,
  });
  console.log('[OK] 4-shell-mobile-drawer-open-320.png  320x568');

  // 5. f12-shell-v2-1440 — F12 inheriting the v2 shell
  await shoot(
    page,
    { width: 1440, height: 900 },
    `${BASE}/kb/upload/`,
    path.join(OUT_DIR, '5-f12-shell-v2-1440.png'),
  );

  // 6. f13-shell-v2-1440 — F13 inheriting the v2 shell
  await shoot(
    page,
    { width: 1440, height: 900 },
    `${BASE}/kb/imports/`,
    path.join(OUT_DIR, '6-f13-shell-v2-1440.png'),
  );

  // 7. f15-shell-v2-1440 — F15 inheriting the v2 shell. F15 is at
  //    /projects/[slug]/kb (project-scoped). Use the Iksula Returns
  //    anchor (slug=ret).
  await shoot(
    page,
    { width: 1440, height: 900 },
    `${BASE}/projects/ret/kb/`,
    path.join(OUT_DIR, '7-f15-shell-v2-1440.png'),
  );

  await browser.close();
  console.log('=== AdminShell v2 sweep complete (7 screenshots) ===');
})().catch((err) => {
  console.error('[FAIL]', err.message);
  process.exit(1);
});

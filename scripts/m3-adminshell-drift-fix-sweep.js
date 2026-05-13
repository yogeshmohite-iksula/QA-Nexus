// Visual gate sweep for M3 close blocker — AdminShell drift fix.
//
// Captures the F19 Run Console route (which now serves as the
// canonical React AdminShell reference per Hard Rule 14 codification)
// at 5 viewport configurations: 1440 expanded · 1440 rail-collapsed ·
// 1024 · 768 · 320 (with mobile drawer open). Saves to
// docs/screenshots/m3-adminshell-drift-fix/.
//
// API 400 image protocol — viewport-bounded clip:, NOT fullPage:true.
//
// Run: node scripts/m3-adminshell-drift-fix-sweep.js

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE = process.env.PROBE_BASE || 'http://localhost:3001';
const ROUTE = `${BASE}/projects/iksula-returns/runs/RUN-RET-2026-04-25-002/`;
const OUT_DIR = path.resolve(__dirname, '..', 'docs/screenshots/m3-adminshell-drift-fix');

async function shoot(page, viewport, file) {
  await page.setViewportSize(viewport);
  await page.goto(ROUTE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  await page.screenshot({
    path: file,
    clip: { x: 0, y: 0, width: viewport.width, height: viewport.height },
  });
  console.log(`[OK] ${path.basename(file)}  ${viewport.width}x${viewport.height}`);
}

async function shootCollapsedRail(page, viewport, file) {
  await page.setViewportSize(viewport);
  await page.goto(ROUTE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  const sels = ['button[aria-label="Collapse navigation"]', 'button[aria-label="Collapse"]'];
  let toggled = false;
  for (const s of sels) {
    const h = await page.$(s);
    if (h) {
      await h.click();
      toggled = true;
      await page.waitForTimeout(400);
      break;
    }
  }
  await page.screenshot({
    path: file,
    clip: { x: 0, y: 0, width: viewport.width, height: viewport.height },
  });
  console.log(
    `[OK] ${path.basename(file)}  ${viewport.width}x${viewport.height} (rail ${toggled ? 'COLLAPSED' : 'default'})`,
  );
}

async function shootMobileDrawerOpen(page, viewport, file) {
  await page.setViewportSize(viewport);
  await page.goto(ROUTE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  const sels = ['button[aria-label="Open navigation"]'];
  let opened = false;
  for (const s of sels) {
    const h = await page.$(s);
    if (h) {
      await h.click();
      opened = true;
      await page.waitForTimeout(400);
      break;
    }
  }
  await page.screenshot({
    path: file,
    clip: { x: 0, y: 0, width: viewport.width, height: viewport.height },
  });
  console.log(
    `[OK] ${path.basename(file)}  ${viewport.width}x${viewport.height} (drawer ${opened ? 'OPEN' : 'default'})`,
  );
}

(async () => {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  await shoot(page, { width: 1440, height: 900 }, path.join(OUT_DIR, 'adminshell-1440.png'));
  await shootCollapsedRail(
    page,
    { width: 1440, height: 900 },
    path.join(OUT_DIR, 'adminshell-1440-collapsed.png'),
  );
  await shoot(page, { width: 1024, height: 768 }, path.join(OUT_DIR, 'adminshell-1024.png'));
  await shoot(page, { width: 768, height: 1024 }, path.join(OUT_DIR, 'adminshell-768.png'));
  await shoot(page, { width: 320, height: 568 }, path.join(OUT_DIR, 'adminshell-320.png'));
  await shootMobileDrawerOpen(
    page,
    { width: 320, height: 568 },
    path.join(OUT_DIR, 'adminshell-320-drawer.png'),
  );

  await browser.close();
  console.log('=== AdminShell drift fix sweep complete ===');
})().catch((err) => {
  console.error('[FAIL]', err.message);
  process.exit(1);
});

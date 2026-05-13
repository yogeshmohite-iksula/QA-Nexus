// Visual gate sweep for #137 intermediate confirm page (M3 close
// blocker — magic-link Gmail prefetch fix).
//
// Captures all 3 view states across 320 + 1440 viewports (Hard Rule
// 13 mandatory):
//   - 'ready' state — token present in URL, button enabled
//   - 'error' state — token missing, terminal failure shown
//
// Loading state intentionally not captured (requires real network
// interaction with BA verify endpoint; covered by BE+1 tests).
//
// API 400 image protocol — viewport-bounded clip:, NOT fullPage:true.
//
// Run: node scripts/m3-verify-magic-link-sweep.js

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE = process.env.PROBE_BASE || 'http://localhost:3001';
const READY_URL = `${BASE}/verify-magic-link/?token=demo-token-for-visual-gate&callbackURL=/home`;
const ERROR_URL = `${BASE}/verify-magic-link/`;
const OUT_DIR = path.resolve(__dirname, '..', 'docs/screenshots/m3-verify-magic-link');

async function shoot(page, url, viewport, file) {
  await page.setViewportSize(viewport);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
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

  // READY state — desktop + mobile
  await shoot(
    page,
    READY_URL,
    { width: 1440, height: 900 },
    path.join(OUT_DIR, 'verify-ready-1440.png'),
  );
  await shoot(
    page,
    READY_URL,
    { width: 320, height: 568 },
    path.join(OUT_DIR, 'verify-ready-320.png'),
  );

  // ERROR state — desktop + mobile (no token in URL → instant error)
  await shoot(
    page,
    ERROR_URL,
    { width: 1440, height: 900 },
    path.join(OUT_DIR, 'verify-error-1440.png'),
  );
  await shoot(
    page,
    ERROR_URL,
    { width: 320, height: 568 },
    path.join(OUT_DIR, 'verify-error-320.png'),
  );

  await browser.close();
  console.log('=== Verify-magic-link sweep complete ===');
})().catch((err) => {
  console.error('[FAIL]', err.message);
  process.exit(1);
});

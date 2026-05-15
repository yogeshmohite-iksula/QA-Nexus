// Canonical baseline capture for Tier-2 Playwright VR suite (Day-18).
//
// Opens each v2 HTML in headed Chromium via Playwright at file:// URL,
// renders, and takes a full-page screenshot at 4 viewports.
//
// Output:
//   apps/web/tests/visual/canonical/<frame>/<viewport>.png
//
// 3 frames × 4 viewports = 12 PNGs total.
//
// Run: pnpm --filter @qa-nexus/web exec node tests/visual/capture-canonical-baselines.mjs

import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const CANON_DIR = path.join(
  REPO_ROOT,
  'QA Nexus',
  'PM1',
  'PM1_UI_v2',
  'Redesign Frame by claude design',
);
const OUT_DIR = path.join(__dirname, 'canonical');

const FRAMES = [
  { id: 'F19', file: 'F19 Run Console v2.html' },
  { id: 'F20', file: 'F20 Run Results v2.html' },
  { id: 'F21', file: 'F21 Defects Hub v2.html' },
];
const VIEWPORTS = [
  { name: '320', width: 320, height: 568 },
  { name: '768', width: 768, height: 1024 },
  { name: '1024', width: 1024, height: 768 },
  { name: '1440', width: 1440, height: 900 },
];

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ deviceScaleFactor: 1 });

for (const frame of FRAMES) {
  const frameDir = path.join(OUT_DIR, frame.id);
  await fs.mkdir(frameDir, { recursive: true });
  const srcPath = path.join(CANON_DIR, frame.file);
  const fileUrl = `file://${encodeURI(srcPath).replace(/'/g, '%27').replace(/#/g, '%23')}`;
  for (const vp of VIEWPORTS) {
    const page = await ctx.newPage();
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(fileUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    const out = path.join(frameDir, `${vp.name}.png`);
    await page.screenshot({ path: out, fullPage: true });
    const stat = await fs.stat(out);
    console.log(`[OK] ${frame.id}/${vp.name}.png  ${vp.width}x${vp.height}  ${stat.size}B`);
    await page.close();
  }
}
await browser.close();
console.log('=== Canonical baseline capture complete (12 PNGs) ===');

#!/usr/bin/env node
// F26 Step 6 visual gate — capture 320 + 1440 screenshots for Yogesh review.
//
// Usage:
//   1. pnpm dev (in apps/web, running on :3000)
//   2. Sign in as Admin (Yogesh seed user is auto-signed-in per CurrentUserProvider)
//   3. node apps/web/tests/visual/capture-f26-visual-gate.mjs
//   4. Screenshots saved to docs/screenshots/f26-port-{320,1440}.png
//   5. Post both PNGs + diff-probe report.json to MAIN chat for Yogesh approval
//
// This is the ONE-SHOT capture for Hard Rule 13 visual gate review.
// Separate from VR baseline locking (which uses tests/visual/f26.spec.ts
// + canonical baselines once port lands on main).

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const BASE_URL = process.env.F26_BASE_URL ?? 'http://localhost:3000';
const ROUTE = '/admin/agents';
const OUT_DIR = resolve('docs/screenshots');

const VIEWPORTS = [
  { name: '320', width: 320, height: 720 }, // iPhone SE — Hard Rule 12 floor
  { name: '1440', width: 1440, height: 900 }, // standard desktop
];

mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  deviceScaleFactor: 2, // retina-quality screenshots
});

console.log(`→ F26 visual gate capture for ${BASE_URL}${ROUTE}`);
console.log('');

for (const vp of VIEWPORTS) {
  const page = await context.newPage();
  await page.setViewportSize({ width: vp.width, height: vp.height });

  try {
    await page.goto(`${BASE_URL}${ROUTE}`, { waitUntil: 'networkidle', timeout: 30_000 });
    await page.waitForTimeout(800); // settle animations

    const out = `${OUT_DIR}/f26-port-${vp.name}.png`;
    await page.screenshot({ path: out, fullPage: true });
    console.log(`  ✓ ${vp.name}px → ${out}`);
  } catch (e) {
    console.error(`  ✗ ${vp.name}px FAILED: ${e.message?.slice(0, 100)}`);
  } finally {
    await page.close();
  }
}

await context.close();
await browser.close();
console.log('');
console.log('Done. Post the 2 PNGs to MAIN chat for Yogesh Hard Rule 13 visual gate.');

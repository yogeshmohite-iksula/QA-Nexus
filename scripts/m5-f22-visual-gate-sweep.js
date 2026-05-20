// F22 Defect Detail — visual-gate screenshot sweep.
// Mirrors scripts/m4-f20-visual-gate-sweep.js (Day-20 lesson #5):
//   - fullPage: true so the rail + below-fold content are captured
//   - desktop viewport height = 2400px so AdminShell rail + main fit cleanly
//
// Targets:
//   320×1600  (mobile portrait fullPage)
//   1440×2400 (desktop fullPage)
//
// Output: docs/visual-gates/F22-v2.1.2-{320,1440}.png

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const PORT_URL = 'http://localhost:3000/projects/iksula-returns/defects/DEF-RET-2104/';
const OUT_DIR = resolve('docs/visual-gates');

const VIEWPORTS = [
  { name: '320', width: 320, height: 1600 },
  { name: '1440', width: 1440, height: 2400 },
];

mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch();
for (const v of VIEWPORTS) {
  const ctx = await browser.newContext({
    viewport: { width: v.width, height: v.height },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  await page.goto(PORT_URL, { waitUntil: 'networkidle' });
  // Settle: fonts + transitions
  await page.waitForTimeout(800);

  const out = resolve(OUT_DIR, `F22-v2.1.2-${v.name}.png`);
  await page.screenshot({ path: out, fullPage: true });
  console.log(`✓ ${v.name}px → ${out}`);
  await ctx.close();
}
await browser.close();
console.log('done.');

// Visual-gate capture helper for CLAUDE.md Rule 13.
// Replaces the Playwright MCP server on sessions where the MCP isn't loaded.
// Captures a single page at one viewport. Run twice per route (320×568 + 1440×900).
//
// Usage (from repo root or apps/web/):
//   node apps/web/scripts/screenshot-frame.mjs <url> <width> <height> <out-path>
//
// Example:
//   node apps/web/scripts/screenshot-frame.mjs \
//     http://localhost:3000/onboarding/invited/qa-engineer 320 568 \
//     docs/screenshots/rwd-invited-qa-320.png
//
// Exits 0 on success, 1 on bad args or capture failure. Non-zero exit
// surfaces as a husky-style failure if the visual-gate is wired into a
// pre-commit script later.

import { chromium } from 'playwright';

const [, , url, w, h, out] = process.argv;
if (!url || !w || !h || !out) {
  console.error('usage: node screenshot-frame.mjs <url> <width> <height> <out-path>');
  process.exit(1);
}

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: +w, height: +h } });
const page = await context.newPage();

// 'networkidle' can hang on Next dev (HMR websocket); 'load' is the right
// signal for a first-paint visual check. Falls back gracefully on slow
// first compile via the 60s timeout.
await page.goto(url, { waitUntil: 'load', timeout: 60000 });

// Brief settle for client-only effects (FormProvider hydration, suspense
// boundaries resolving, font swaps). 800 ms is enough on this machine.
await page.waitForTimeout(800);

await page.screenshot({ path: out, fullPage: true, type: 'png' });
await browser.close();
console.log(`Saved ${out} (${w}x${h})`);

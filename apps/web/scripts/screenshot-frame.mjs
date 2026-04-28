// Visual-gate capture helper for CLAUDE.md Rule 13.
// Replaces the Playwright MCP server on sessions where the MCP isn't loaded.
// Captures a single page at one viewport. Run twice per route (320×568 + 1440×900).
//
// Usage (from repo root or apps/web/):
//   node apps/web/scripts/screenshot-frame.mjs <url> <width> <height> <out-path>
//
// Example:
//   node apps/web/scripts/screenshot-frame.mjs \
//     http://localhost:3000/home 320 568 \
//     docs/screenshots/rwd-home-qa-320.png
//
// NOTE: this file ships in PR #7 (feature/fe-day-2-invited-onboarding). When
// that PR merges to main, this duplicate copy on feature/fe-f08a-home-qa-engineer
// will resolve via the rebase. Until then, both branches carry the script.

import { chromium } from 'playwright';

const [, , url, w, h, out] = process.argv;
if (!url || !w || !h || !out) {
  console.error('usage: node screenshot-frame.mjs <url> <width> <height> <out-path>');
  process.exit(1);
}

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: +w, height: +h } });
const page = await context.newPage();

await page.goto(url, { waitUntil: 'load', timeout: 60000 });
await page.waitForTimeout(800);
await page.screenshot({ path: out, fullPage: true, type: 'png' });
await browser.close();
console.log(`Saved ${out} (${w}x${h})`);

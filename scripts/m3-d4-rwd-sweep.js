// M3 Day-15 TASK D4 — RWD verification sweep across all M3 pages.
//
// Captures 7 pages × 4 viewports = 28 viewport-bounded PNGs per
// Hard Rule 12 (RWD mandatory at 320 / 768 / 1024 / 1440) +
// Hard Rule 13 (visual gate evidence) + API 400 image protocol
// (`clip:` not `fullPage:`).
//
// Pages covered:
//   1. F14 Requirements list page         → /requirements
//   2. F14 Detail Drawer (right-side)     → /requirements?view=<id>
//   3. F14m1 Edit Requirement Modal       → /requirements?edit=<id>
//   4. F14m2 Link Test Case Modal         → /requirements?link=<id>
//   5. F16a Test Case Method Chooser      → /test-cases?new-test-case=1
//   6. F16b A1 Generate page (Pattern B)  → /test-cases/generate?source=RET-247
//   7. F16c Bulk Import Modal             → /test-cases?bulk-import=1
//
// NOT covered: F14m3 Convert to Jira Modal — no React component on
// main as of 2026-05-10 (file `convert-to-jira-modal.tsx` doesn't exist
// under apps/web/components/requirements/). Documented in PR body as
// shipping-gap not RWD finding.
//
// All BE-dependent fetches are route-mocked with the canonical fixtures
// so screenshots show meaningful UI states instead of network-error
// fallbacks. Composer endpoint mock pulls from
// `composer-sample-RET-247.json` (matches PR #116 sweep approach).
//
// Run: `node scripts/m3-d4-rwd-sweep.js`

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE = 'http://localhost:3000';
const OUT_DIR = path.resolve(__dirname, '..', 'docs/screenshots/m3-d4-rwd-sweep');
const FIXTURE_PATH = path.resolve(
  __dirname,
  '..',
  '..',
  'Project10-QA_Nexus',
  'docs/architecture/composer-sample-RET-247.json',
);

// Composer mock payload — strip developer-facing _meta fields.
const composerFixture = JSON.parse(fs.readFileSync(FIXTURE_PATH, 'utf8'));
const composerMockResponse = {
  ok: composerFixture.ok,
  runId: composerFixture.runId,
  cases: composerFixture.cases,
  llmMetadata: composerFixture.llmMetadata,
  stubbed: composerFixture.stubbed,
};

const VIEWPORTS = [
  { width: 1440, height: 900, label: '1440' },
  { width: 1024, height: 768, label: '1024' },
  { width: 768, height: 1024, label: '768' },
  { width: 320, height: 568, label: '320' },
];

// Each page: route + label prefix + optional setup-action before screenshot.
// `setup` runs after navigation, before screenshot — used to dismiss
// boot toasts, scroll to a section, etc.
const PAGES = [
  { key: 'F14-list', route: '/requirements' },
  { key: 'F14-drawer', route: '/requirements?view=req-ret-247' },
  { key: 'F14m1-edit', route: '/requirements?edit=req-ret-247' },
  { key: 'F14m2-link', route: '/requirements?link=req-ret-247' },
  { key: 'F16a-chooser', route: '/test-cases?new-test-case=1' },
  { key: 'F16b-PB-generate', route: '/test-cases/generate?source=RET-247' },
  { key: 'F16c-bulk-import', route: '/test-cases?bulk-import=1' },
];

async function shootClipped(page, viewport, file) {
  await page.setViewportSize(viewport);
  await page.waitForTimeout(900); // settle after viewport change
  await page.screenshot({
    path: file,
    clip: { x: 0, y: 0, width: viewport.width, height: viewport.height },
  });
}

(async () => {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext();

  // Universal route mock — Composer endpoint (used by F16b auto-fetch).
  await context.route(
    /\/api\/projects\/.+\/requirements\/.+\/test-cases\/generate/,
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(composerMockResponse),
      });
    },
  );

  // Stub any other /api/* call that may fire — return empty success
  // shape so pages don't show error states. Pattern A pages (F14, F14m1,
  // F14m2, F16a, F16c) use local canned data + don't fetch, so this is
  // a safety net for any hidden fetches.
  await context.route(/\/api\/.+/, async (route) => {
    if (route.request().url().includes('/test-cases/generate')) {
      // Already handled by the Composer mock above.
      return route.fallback();
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, items: [], data: null }),
    });
  });

  const page = await context.newPage();

  let captured = 0;
  let failed = [];

  for (const p of PAGES) {
    for (const vp of VIEWPORTS) {
      const file = path.join(OUT_DIR, `${p.key}-${vp.label}.png`);
      try {
        await page.setViewportSize(vp);
        await page.goto(`${BASE}${p.route}`, { waitUntil: 'domcontentloaded' });
        // Allow page-level effects (auto-fetch, modal mount, animation tick)
        await page.waitForTimeout(1200);
        await shootClipped(page, vp, file);
        captured++;
        console.log(`[OK] ${p.key} @ ${vp.label}  → ${path.basename(file)}`);
      } catch (e) {
        failed.push({ key: p.key, vp: vp.label, err: e.message });
        console.error(`[FAIL] ${p.key} @ ${vp.label}: ${e.message}`);
      }
    }
  }

  await browser.close();
  console.log(`\n=== Sweep complete: ${captured} OK, ${failed.length} FAIL ===`);
  if (failed.length > 0) {
    console.log('Failed shots:');
    failed.forEach((f) => console.log(`  - ${f.key} @ ${f.vp}: ${f.err}`));
    process.exit(1);
  }
})().catch((err) => {
  console.error('[FATAL]', err.message);
  process.exit(1);
});

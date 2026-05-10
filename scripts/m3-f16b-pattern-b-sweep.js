// Sweep for F16b A1 Generate from Requirement Pattern B flip
// (M3 Day-15 TASK D2 — PR #116). Captures the page at 4 viewports per
// the per-PR verification gate (sections 1-8 — full page, not modal).
//
// Differences from PR #110's `m3-f16b-generate-sweep.js`:
//   - VIEWPORT-BOUNDED screenshots (`clip:` not `fullPage:true`) per
//     API 400 image protocol (memory: feedback_api_400_image_protocol).
//   - Route-mocks `POST /api/projects/.../test-cases/generate` with the
//     canonical reference fixture so screenshots show meaningful Pattern B
//     UI (real cases populated, NOT empty-state fallback from missing BE).
//     Mirrors what users see when Render env wires GROQ_API_KEY OR returns
//     stubbed-mode (`stubbed:true`) data.
//   - Out dir: `docs/screenshots/m3-rwd/F16b-PB-*.png` (per FE+1 protocol).
//
// Run: `node scripts/m3-f16b-pattern-b-sweep.js`

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE = 'http://localhost:3000';
const ROUTE = `${BASE}/test-cases/generate?source=RET-247`;
const OUT_DIR = path.resolve(__dirname, '..', 'docs/screenshots/m3-rwd');
const FIXTURE_PATH = path.resolve(
  __dirname,
  '..',
  '..',
  'Project10-QA_Nexus',
  'docs/architecture/composer-sample-RET-247.json',
);

// Load reference fixture from MAIN worktree (canonical wire-shape).
const fixture = JSON.parse(fs.readFileSync(FIXTURE_PATH, 'utf8'));
// Strip the `_meta` + `_error_response_examples` + `_streaming_mode`
// developer-facing fields — server doesn't emit those at runtime.
const mockResponse = {
  ok: fixture.ok,
  runId: fixture.runId,
  cases: fixture.cases,
  llmMetadata: fixture.llmMetadata,
  stubbed: fixture.stubbed,
};

async function shootClipped(page, viewport, file) {
  await page.setViewportSize(viewport);
  await page.goto(ROUTE, { waitUntil: 'domcontentloaded' });
  // Wait for auto-trigger fetch + adapter render. Networkidle would
  // include retry-jitter; just give a fixed beat.
  await page.waitForTimeout(1200);
  await page.screenshot({
    path: file,
    clip: { x: 0, y: 0, width: viewport.width, height: viewport.height },
  });
  console.log(`[OK] ${path.basename(file)}  ${viewport.width}x${viewport.height}`);
}

(async () => {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext();

  // Route-mock the Composer endpoint so the page renders the populated
  // case list, NOT the network-error fallback. Matches both stubbed +
  // real Groq production paths (wire shape identical).
  await context.route(
    /\/api\/projects\/.+\/requirements\/.+\/test-cases\/generate/,
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockResponse),
      });
    },
  );

  const page = await context.newPage();

  // 1. Desktop (xl ≥1280) — 3-col workspace fully expanded
  await shootClipped(page, { width: 1440, height: 900 }, path.join(OUT_DIR, 'F16b-PB-1440.png'));

  // 2. Laptop (lg 1024-1279) — right pane auto-collapses
  await shootClipped(page, { width: 1024, height: 768 }, path.join(OUT_DIR, 'F16b-PB-1024.png'));

  // 3. Tablet (md 768)
  await shootClipped(page, { width: 768, height: 1024 }, path.join(OUT_DIR, 'F16b-PB-768.png'));

  // 4. Mobile (320 × 568, iPhone SE)
  await shootClipped(page, { width: 320, height: 568 }, path.join(OUT_DIR, 'F16b-PB-320.png'));

  await browser.close();
  console.log('=== F16b Pattern B sweep complete ===');
})().catch((err) => {
  console.error('[FAIL]', err.message);
  process.exit(1);
});

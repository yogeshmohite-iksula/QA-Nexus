#!/usr/bin/env node
/**
 * NFR-001 page-load latency probe — FCP + LCP across the main authenticated routes.
 *
 * PM1_PRD §10 NFR-001 budget: p50 < 1.5s, p95 < 3s (FCP/LCP).
 *
 * STATUS: skeleton — structure validated Day-1 PM (FE dev server was not running).
 * Run Wed against the production-warm FE. Authenticated routes (app pages) need a
 * signed-in session: sign in via the dev console-stub magic link (finding F-7) in the
 * SAME browser context, OR pass STORAGE_STATE (a Playwright storageState JSON path).
 *
 * Usage:
 *   pnpm --filter @qa-nexus/web nfr:pageload
 *   ROUTES_LIMIT=2 LOOPS=3 pnpm --filter @qa-nexus/web nfr:pageload   # smoke
 *   OUT=/tmp/nfr-001-results.json pnpm --filter @qa-nexus/web nfr:pageload
 *
 * Env:
 *   BASE_URL       default http://localhost:3000
 *   LOOPS          cold loads per route (default 20)
 *   ROUTES_LIMIT   only the first N routes (smoke)
 *   STORAGE_STATE  path to a Playwright storageState JSON (auth session) — optional
 *   OUT            structured JSON output path
 *
 * NOTE ON ROUTES: these are the REAL URLs. Next.js route groups `(app)` are
 * path-transparent — they never appear in the URL (Day-1 finding; the original brief
 * listed `/(app)/...` which 404s). Route existence is confirmed Wed against the live FE
 * (some — executive dashboard, admin/settings — may still be unbuilt → recorded as 404).
 */

import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const ROUTES = [
  '/home',
  '/projects',
  '/test-cases',
  '/requirements',
  '/projects/iksula-returns/defects',
  '/projects/iksula-returns/defects/DEF-RET-2104',
  '/dashboard/executive',
  '/admin/settings',
];

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const LOOPS = parseInt(process.env.LOOPS ?? '20', 10);
const ROUTES_LIMIT = process.env.ROUTES_LIMIT ? parseInt(process.env.ROUTES_LIMIT, 10) : undefined;
const STORAGE_STATE = process.env.STORAGE_STATE;
const OUT = process.env.OUT;

const GATE = { fcpP50: 1500, lcpP95: 3000 };

function pct(arr, q) {
  if (arr.length === 0) return -1;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(s.length * q))];
}

async function main() {
  const subset = ROUTES_LIMIT ? ROUTES.slice(0, ROUTES_LIMIT) : ROUTES;
  console.log(`[nfr-001] BASE=${BASE} loops=${LOOPS} routes=${subset.length}`);
  if (STORAGE_STATE) console.log(`[nfr-001] using auth storageState: ${STORAGE_STATE}`);

  const browser = await chromium.launch({ headless: true });
  const results = [];

  try {
    for (const route of subset) {
      const url = BASE + route;
      const fcp = [];
      const lcp = [];
      let lastStatus = 0;

      for (let i = 0; i < LOOPS; i++) {
        // Fresh context per iteration = true cold load (no warm cache).
        const context = await browser.newContext(
          STORAGE_STATE ? { storageState: STORAGE_STATE } : {},
        );
        const page = await context.newPage();
        try {
          const resp = await page.goto(url, { waitUntil: 'load', timeout: 30000 });
          lastStatus = resp?.status() ?? 0;
          // Let LCP settle briefly after load before reading.
          await page.waitForTimeout(300);
          const perf = await page.evaluate(() => {
            const paint = performance.getEntriesByType('paint');
            const f = paint.find((e) => e.name === 'first-contentful-paint')?.startTime ?? -1;
            const lcpE = performance.getEntriesByType('largest-contentful-paint');
            const l = lcpE.length ? lcpE[lcpE.length - 1].startTime : -1;
            return { f, l };
          });
          if (perf.f > 0) fcp.push(perf.f);
          if (perf.l > 0) lcp.push(perf.l);
        } catch (err) {
          console.error(`[nfr-001] ${url} failed: ${err.message}`);
        } finally {
          await context.close();
        }
        process.stdout.write('.');
      }
      process.stdout.write('\n');

      const r = {
        path: route,
        url,
        status: lastStatus,
        fcp: { p50: pct(fcp, 0.5), p95: pct(fcp, 0.95), n: fcp.length },
        lcp: { p50: pct(lcp, 0.5), p95: pct(lcp, 0.95), n: lcp.length },
      };
      results.push(r);
      console.log(
        `[nfr-001] ${route} [${lastStatus}] FCP p50=${r.fcp.p50.toFixed(0)} p95=${r.fcp.p95.toFixed(0)} · LCP p50=${r.lcp.p50.toFixed(0)} p95=${r.lcp.p95.toFixed(0)} ms`,
      );
    }
  } finally {
    await browser.close();
  }

  if (OUT) {
    writeFileSync(
      OUT,
      JSON.stringify({ base: BASE, loops: LOOPS, gate: GATE, routes: results }, null, 2),
    );
    console.log(`[nfr-001] JSON: ${OUT}`);
  }

  const over = results.filter((r) => r.fcp.p50 > GATE.fcpP50 || r.lcp.p95 > GATE.lcpP95);
  console.log(
    over.length === 0
      ? `[nfr-001] GATE PASS — all ${results.length} routes within FCP p50<${GATE.fcpP50} / LCP p95<${GATE.lcpP95}ms`
      : `[nfr-001] GATE: ${over.length}/${results.length} routes over budget (investigate / may be unbuilt 404s)`,
  );
}

main().catch((err) => {
  console.error('[nfr-001] fatal:', err);
  process.exit(1);
});

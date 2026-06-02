#!/usr/bin/env node
/**
 * NFR-002 API latency baseline — measures p50/p95/p99 per endpoint.
 *
 * PM1_PRD §10 NFR-002 budget: p50 < 200ms, p95 < 500ms (excluding LLM calls).
 *
 * Reusable + parameterized so the same script runs tonight (public endpoints,
 * no auth) and Wed AM (authenticated endpoints, with a session cookie):
 *
 *   node scripts/nfr-api-latency.mjs                 # public endpoints, N=100
 *   N=200 node scripts/nfr-api-latency.mjs           # custom request count
 *   BASE_URL=https://qa-nexus-api.onrender.com node scripts/nfr-api-latency.mjs
 *   COOKIE="better-auth.session_token=…" node scripts/nfr-api-latency.mjs --auth
 *
 * Env:
 *   BASE_URL  default http://localhost:3001
 *   N         requests per endpoint (default 100)
 *   COOKIE    session cookie string for authenticated endpoints
 *   OUT       output JSON path (default /tmp/nfr-002-results.json)
 * Flags:
 *   --auth    include the authenticated endpoint set (requires COOKIE)
 */

import { writeFileSync } from 'node:fs';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3001';
const N = parseInt(process.env.N ?? '100', 10);
const COOKIE = process.env.COOKIE ?? '';
const OUT = process.env.OUT ?? '/tmp/nfr-002-results.json';
const includeAuth = process.argv.includes('--auth');

// Real route shapes (verified Day-1 — NOT the flat ?project= forms; routes are
// project-scoped under /api/projects/:id/…). authed:true endpoints need COOKIE.
const ENDPOINTS = [
  { path: '/health', authed: false },
  { path: '/health/deep', authed: false },
  // Authenticated set — Wed AM with a console-stub magic-link session cookie.
  { path: '/api/projects', authed: true },
  { path: '/api/projects/iksula-returns', authed: true },
  { path: '/api/projects/iksula-returns/test-cases', authed: true },
  { path: '/api/projects/iksula-returns/requirements', authed: true },
  { path: '/api/projects/iksula-returns/defects', authed: true },
  { path: '/api/projects/iksula-returns/runs', authed: true },
  { path: '/api/projects/iksula-returns/reports', authed: true },
  { path: '/llm/providers', authed: true },
];

const GATE = { p50: 200, p95: 500 }; // ms, NFR-002

function pct(sorted, p) {
  if (sorted.length === 0) return null;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[idx];
}

async function measure(ep) {
  const url = `${BASE_URL}${ep.path}`;
  const headers = ep.authed && COOKIE ? { cookie: COOKIE } : {};
  const lat = [];
  let errors = 0;
  let lastStatus = 0;
  for (let i = 0; i < N; i++) {
    const t0 = performance.now();
    try {
      const res = await fetch(url, { headers });
      lastStatus = res.status;
      await res.text(); // drain body for fair timing
      if (res.status >= 500) errors++;
    } catch {
      errors++;
      lastStatus = -1;
    }
    lat.push(performance.now() - t0);
  }
  lat.sort((a, b) => a - b);
  const p50 = pct(lat, 50);
  const p95 = pct(lat, 95);
  const p99 = pct(lat, 99);
  const pass = p50 != null && p50 <= GATE.p50 && p95 != null && p95 <= GATE.p95;
  return {
    path: ep.path,
    authed: ep.authed,
    n: N,
    status: lastStatus,
    errors,
    p50_ms: p50 != null ? +p50.toFixed(1) : null,
    p95_ms: p95 != null ? +p95.toFixed(1) : null,
    p99_ms: p99 != null ? +p99.toFixed(1) : null,
    min_ms: lat.length ? +lat[0].toFixed(1) : null,
    max_ms: lat.length ? +lat[lat.length - 1].toFixed(1) : null,
    gate: `p50<${GATE.p50} p95<${GATE.p95}`,
    verdict: pass ? 'PASS' : 'FAIL',
  };
}

async function main() {
  const targets = ENDPOINTS.filter((e) => !e.authed || (includeAuth && COOKIE));
  const skipped = ENDPOINTS.filter((e) => e.authed && !(includeAuth && COOKIE));

  console.log(`NFR-002 API latency · BASE_URL=${BASE_URL} · N=${N}`);
  console.log(`gate: p50<${GATE.p50}ms p95<${GATE.p95}ms\n`);
  console.log('endpoint'.padEnd(46), 'p50', 'p95', 'p99', 'err', 'verdict');

  const results = [];
  for (const ep of targets) {
    const r = await measure(ep);
    results.push(r);
    console.log(
      r.path.padEnd(46),
      String(r.p50_ms).padStart(6),
      String(r.p95_ms).padStart(6),
      String(r.p99_ms).padStart(6),
      String(r.errors).padStart(3),
      ' ',
      r.verdict,
    );
  }

  if (skipped.length) {
    console.log(
      `\nDEFERRED (need COOKIE + --auth, Wed AM): ${skipped.map((s) => s.path).join(', ')}`,
    );
  }

  const report = {
    nfr: 'NFR-002 API latency',
    baseUrl: BASE_URL,
    n: N,
    gate: GATE,
    measured: results,
    deferred: skipped.map((s) => s.path),
  };
  writeFileSync(OUT, JSON.stringify(report, null, 2));
  console.log(`\nJSON: ${OUT}`);
  // Don't fail the process on a single FAIL — this is a baseline, not a gate.
}

main().catch((err) => {
  console.error('nfr-api-latency failed:', err);
  process.exit(1);
});

// Curator perf benchmark — measures p50/p95/p99 latency for /duplicates
// against a live API endpoint with a known-corpus project.
//
// Spec: Day-14 Block B++ TASK B++2 step 1. Filed as a reusable artifact
// because BE+1 sandbox session lacks Render/Postgres/auth access; Yogesh
// or MAIN runs this once #112 merges + Render staging boots.
//
// Acceptance gate (ADR-014 §"Implementation plan" + Day-14 brief):
//   /duplicates p95 < 200ms (50-TC corpus, 384-dim cosine via bge-small)
//
// Run (apps/api dir, uses repo's ts-node):
//   cd apps/api && \
//     QA_NEXUS_API_BASE=https://qa-nexus-api.onrender.com \
//     QA_NEXUS_AUTH_COOKIE='better-auth.session_token=...' \
//     QA_NEXUS_PROJECT_ID=<uuid> \
//     QA_NEXUS_TC_ID=<uuid> \
//     pnpm exec ts-node --transpile-only \
//       --compiler-options '{"module":"commonjs","moduleResolution":"node"}' \
//       ../../scripts/curator-perf-benchmark.ts [iterations=20]
//
// Output: pretty-printed perf summary + JSONL line appended to
// docs/performance/m3-acceptance-baseline.jsonl for trend tracking.
//
// Hard rules respected:
//   - No secrets in repo (env vars only)
//   - No live-credential default (script exits 1 if env unset)
//   - $0 cost gate (read-only HTTP calls; no LLM/Groq invocations)

/* eslint-disable no-console */
import { performance } from 'node:perf_hooks';
import { writeFileSync, appendFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const BASE = process.env.QA_NEXUS_API_BASE;
const COOKIE = process.env.QA_NEXUS_AUTH_COOKIE;
const PROJECT_ID = process.env.QA_NEXUS_PROJECT_ID;
const TC_ID = process.env.QA_NEXUS_TC_ID;
const ITER = Number(process.argv[2] ?? '20');
const OUT_PATH = 'docs/performance/m3-acceptance-baseline.jsonl';

function bail(msg: string): never {
  console.error(`[bench] FAIL: ${msg}`);
  process.exit(1);
}

if (!BASE) bail('QA_NEXUS_API_BASE env var required (e.g. https://qa-nexus-api.onrender.com)');
if (!COOKIE) bail('QA_NEXUS_AUTH_COOKIE env var required (BetterAuth session cookie)');
if (!PROJECT_ID) bail('QA_NEXUS_PROJECT_ID env var required');
if (!TC_ID) bail('QA_NEXUS_TC_ID env var required (a real TC UUID in the project)');
if (!Number.isFinite(ITER) || ITER < 1 || ITER > 200) bail('iterations must be in [1, 200]');

async function hitDuplicates(): Promise<{ ms: number; ok: boolean; status: number }> {
  const t0 = performance.now();
  const res = await fetch(`${BASE}/api/projects/${PROJECT_ID}/test-cases/${TC_ID}/duplicates`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: COOKIE!,
    },
    // Default thresholds + topK per CuratorCheckRequest Zod defaults.
    body: JSON.stringify({}),
  });
  // Drain body to ensure full response is included in latency.
  await res.text();
  return { ms: performance.now() - t0, ok: res.ok, status: res.status };
}

function pct(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

async function main(): Promise<void> {
  console.log(`[bench] target=${BASE}/api/projects/${PROJECT_ID}/test-cases/${TC_ID}/duplicates`);
  console.log(`[bench] iterations=${ITER}`);

  // 2 warm-up calls — first call eats Render dyno wake-up + bge-small cold-load.
  console.log('[bench] warm-up (2 calls)...');
  for (let i = 0; i < 2; i++) {
    const w = await hitDuplicates();
    console.log(`[bench]   warm-up ${i + 1}: ${w.ms.toFixed(0)}ms (status=${w.status})`);
  }

  console.log('[bench] measuring...');
  const samples: number[] = [];
  let failures = 0;
  for (let i = 0; i < ITER; i++) {
    const r = await hitDuplicates();
    if (!r.ok) failures += 1;
    samples.push(r.ms);
    if ((i + 1) % 5 === 0) {
      console.log(`[bench]   ${i + 1}/${ITER} (last=${r.ms.toFixed(0)}ms status=${r.status})`);
    }
  }

  samples.sort((a, b) => a - b);
  const p50 = pct(samples, 50);
  const p95 = pct(samples, 95);
  const p99 = pct(samples, 99);
  const max = samples[samples.length - 1];
  const avg = samples.reduce((s, n) => s + n, 0) / samples.length;

  console.log('');
  console.log('[bench] === Curator /duplicates perf ===');
  console.log(`[bench]   iterations: ${ITER}`);
  console.log(`[bench]   failures:   ${failures}`);
  console.log(`[bench]   avg:        ${avg.toFixed(0)}ms`);
  console.log(`[bench]   p50:        ${p50.toFixed(0)}ms`);
  console.log(`[bench]   p95:        ${p95.toFixed(0)}ms  (target <200ms per ADR-014)`);
  console.log(`[bench]   p99:        ${p99.toFixed(0)}ms`);
  console.log(`[bench]   max:        ${max.toFixed(0)}ms`);
  console.log('');

  // Append a JSONL line for trend tracking.
  if (!existsSync(dirname(OUT_PATH))) mkdirSync(dirname(OUT_PATH), { recursive: true });
  const row = {
    ts: new Date().toISOString(),
    endpoint: 'curator.duplicates',
    iterations: ITER,
    failures,
    avg_ms: Math.round(avg),
    p50_ms: Math.round(p50),
    p95_ms: Math.round(p95),
    p99_ms: Math.round(p99),
    max_ms: Math.round(max),
    target_p95_ms: 200,
    target_met: p95 < 200,
  };
  if (existsSync(OUT_PATH)) {
    appendFileSync(OUT_PATH, JSON.stringify(row) + '\n');
  } else {
    writeFileSync(OUT_PATH, JSON.stringify(row) + '\n');
  }
  console.log(`[bench] appended row to ${OUT_PATH}`);

  if (p95 >= 200) {
    console.warn(
      `[bench] WARN: p95=${p95.toFixed(0)}ms exceeds 200ms target — flag P2 followup ` +
        `(don't block M3 close per Day-14 brief).`,
    );
  } else {
    console.log(`[bench] OK: p95=${p95.toFixed(0)}ms < 200ms target ✅`);
  }
}

main().catch((err) => {
  console.error('[bench] FAIL:', err instanceof Error ? err.message : err);
  process.exit(1);
});

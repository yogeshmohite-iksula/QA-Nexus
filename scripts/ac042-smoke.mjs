#!/usr/bin/env node
/**
 * AC042 smoke harness — runs ONE defect through the Sherlock RCA pipeline.
 *
 * Per Day-27 M5 retro §6.8 + Day-1 pilot-push finding F-2: a permanent
 * single-defect smoke (4 Groq calls, ~15s) MUST run before the ~200-call
 * binding corpus eval to catch schema/prompt bridge regressions cheaply.
 * (During Day-28 this ran via a transient AC042_LIMIT env that was never
 * landed on main; this script + the AC042_CASE harness flag make it permanent.)
 *
 * This is a thin CLI wrapper. The actual Groq-calling run is delegated to the
 * existing ts-node harness `apps/api/test/ac042-eval.ts`, scoped to a single
 * case via the AC042_CASE env var — so there is ONE source of truth for the
 * Nest bootstrap + scoring, and the smoke can never drift from the binding run.
 *
 * Usage:
 *   node scripts/ac042-smoke.mjs --case def-006
 *   node scripts/ac042-smoke.mjs --case def-006 --debug
 *   node scripts/ac042-smoke.mjs --case def-006 --no-burn
 *   pnpm --filter @qa-nexus/api ac042:smoke -- --case def-006 --no-burn
 *
 * Flags:
 *   --case <id>   defect ID from the corpus (def-006 … def-050) — default def-006
 *   --debug       dump the full per-agent RCA result (AC042_DEBUG=1 in the harness)
 *   --no-burn     dry-run: validate corpus-case structure only, ZERO Groq calls
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

// --- flag parsing -----------------------------------------------------------
const args = process.argv.slice(2);
function flagValue(name, fallback) {
  const i = args.indexOf(name);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
}
const caseId = flagValue('--case', 'def-006');
const debug = args.includes('--debug');
const noBurn = args.includes('--no-burn');

// --- corpus-case structure validation (always, even in live mode) -----------
const corpusPath = resolve(repoRoot, 'apps/api/test/golden-sets/sherlock-rca', `${caseId}.json`);

if (!existsSync(corpusPath)) {
  console.error(`[ac042-smoke] ERROR: corpus case not found: ${corpusPath}`);
  console.error(`[ac042-smoke] expected an id like def-006 … def-050`);
  process.exit(2);
}

let defectCase;
try {
  defectCase = JSON.parse(readFileSync(corpusPath, 'utf8'));
} catch (err) {
  console.error(`[ac042-smoke] ERROR: ${corpusPath} is not valid JSON: ${err.message}`);
  process.exit(2);
}

// The corpus shape is { id, input: { errorMessage, stackTrace, … }, groundTruth }.
const problems = [];
if (defectCase.id !== caseId) problems.push(`id mismatch: file says "${defectCase.id}"`);
if (!defectCase.input?.errorMessage) problems.push('missing input.errorMessage');
if (!defectCase.groundTruth?.rootCauseCategory)
  problems.push('missing groundTruth.rootCauseCategory');
if (problems.length) {
  console.error(`[ac042-smoke] ERROR: malformed corpus case ${caseId}:`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(2);
}

console.log(`[ac042-smoke] case:        ${caseId}`);
console.log(`[ac042-smoke] testCaseId:  ${defectCase.input.testCaseId ?? '(none)'}`);
console.log(`[ac042-smoke] errorMessage: ${String(defectCase.input.errorMessage).slice(0, 90)}…`);
console.log(`[ac042-smoke] groundTruth:  ${defectCase.groundTruth.rootCauseCategory}`);
console.log(
  `[ac042-smoke] acceptable:   [${(defectCase.groundTruth.acceptableAlternatives ?? []).join(', ')}]`,
);

if (noBurn) {
  console.log(`[ac042-smoke] --no-burn: corpus structure VALID. Zero Groq calls made. ✅`);
  process.exit(0);
}

// --- live mode: delegate to the binding harness, scoped to one case ---------
console.log(`[ac042-smoke] live run: 1 defect through 4 Sherlock agents (~4 Groq calls)…`);
const env = { ...process.env, AC042_CASE: caseId };
if (debug) env.AC042_DEBUG = '1';

const child = spawnSync('pnpm', ['--filter', '@qa-nexus/api', 'ac042:eval'], {
  cwd: repoRoot,
  env,
  stdio: 'inherit',
});

if (child.error) {
  console.error(`[ac042-smoke] failed to spawn harness: ${child.error.message}`);
  process.exit(2);
}
process.exit(child.status ?? 1);

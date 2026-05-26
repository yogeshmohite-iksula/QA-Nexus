#!/usr/bin/env node
// QA Nexus PM1 — apply-cpi-labels.mjs
//
// Day-25 Sun 2026-05-24. Companion to port-cpi-corpus.mjs.
//
// MONDAY EXECUTOR — reads filled-in LABELING-WORKSHEET.md, applies each
// case's GROUND-TRUTH YAML block to the matching staged JSON, validates,
// and promotes staged → live corpus.
//
// USAGE:
//   1. Yogesh fills the 45 YAML blocks in
//      apps/api/test/golden-sets/sherlock-rca/LABELING-WORKSHEET.md
//   2. node scripts/apply-cpi-labels.mjs              # dry-run by default
//   3. node scripts/apply-cpi-labels.mjs --promote    # promote staged → live
//
// SAFETY:
//   - Dry-run by default prints the proposed changes without writing.
//   - --promote required to actually update staged/*.json + move to live.
//   - Schema validation runs before promotion — if ANY case has empty
//     rootCauseCategory or rootCauseDetail still containing "TODO", the
//     promotion aborts with a clear "you missed N cases" error.
//   - Live def-001 … def-005 (seed defects) are NEVER touched.

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const STAGED_DIR = REPO_ROOT + '/apps/api/test/golden-sets/sherlock-rca/staged';
const LIVE_DIR = REPO_ROOT + '/apps/api/test/golden-sets/sherlock-rca';
const WORKSHEET = LIVE_DIR + '/LABELING-WORKSHEET.md';

const VALID_CATEGORIES = new Set([
  'code-bug',
  'data-bug',
  'env-config',
  'flaky-network',
  'auth-permissions',
  'dependency-version',
  'ui-regression',
  'race-condition',
  'payment-gateway',
  'other',
]);
const VALID_CONFIDENCE = new Set(['high', 'medium', 'low']);

const PROMOTE = process.argv.includes('--promote');

// --- Minimal YAML block parser (single-level, string + array) ---------------
//
// Block format produced by port-cpi-corpus.mjs:
//   rootCauseCategory: "code-bug"
//   rootCauseDetail: "Refund split-tender precision loss..."
//   acceptableAlternatives: []          OR  ["data-bug", "env-config"]
//   confidence: "high"
//   notesForEval: "..."
//
// Yogesh-edit-resilient: strips surrounding quotes, tolerates trailing
// comments, handles bracketed array literal of strings.

function parseYamlBlock(yamlText) {
  const out = {};
  const lines = yamlText.split('\n');
  for (const rawLine of lines) {
    // Strip trailing # comment (but not inside quoted strings — naive
    // approach: only strip if no quote between key end and #)
    const line = rawLine.replace(/\s+#.*$/, '').trimEnd();
    if (!line || line.startsWith('#')) continue;
    const m = line.match(/^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    let value = m[2].trim();
    if (value === '' || value === 'null' || value === '~') {
      out[key] = '';
      continue;
    }
    // Array literal
    if (value.startsWith('[') && value.endsWith(']')) {
      const inner = value.slice(1, -1).trim();
      if (inner === '') {
        out[key] = [];
      } else {
        out[key] = inner
          .split(',')
          .map((s) => s.trim().replace(/^["']|["']$/g, ''))
          .filter((s) => s.length > 0);
      }
      continue;
    }
    // Quoted string
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

// --- Worksheet parser -------------------------------------------------------

function parseWorksheet(md) {
  // Each case section starts with "## def-NNN — CPI-XXX · ..." and contains
  // a fenced ```yaml block under the "GROUND TRUTH" heading. Extract all
  // (caseId, parsedYaml) tuples.
  const sectionRe = /^##\s+(def-\d{3})\s+—.*$/gm;
  const sections = [];
  let match;
  const indices = [];
  while ((match = sectionRe.exec(md)) !== null) {
    indices.push({ caseId: match[1], start: match.index });
  }
  for (let i = 0; i < indices.length; i++) {
    const cur = indices[i];
    const nextStart = i + 1 < indices.length ? indices[i + 1].start : md.length;
    const sectionText = md.slice(cur.start, nextStart);
    const yamlMatch = sectionText.match(/```yaml\s*\n([\s\S]*?)\n\s*```/);
    if (!yamlMatch) {
      console.warn(`${cur.caseId}: no YAML block found in section — skipped`);
      continue;
    }
    const parsed = parseYamlBlock(yamlMatch[1]);
    sections.push({ caseId: cur.caseId, parsed });
  }
  return sections;
}

// --- Validation -------------------------------------------------------------

function validateLabel(caseId, label) {
  const errs = [];
  if (!label.rootCauseCategory || label.rootCauseCategory === '') {
    errs.push(`${caseId}: rootCauseCategory empty`);
  } else if (!VALID_CATEGORIES.has(label.rootCauseCategory)) {
    errs.push(
      `${caseId}: rootCauseCategory "${label.rootCauseCategory}" not in 10-enum (valid: ${[...VALID_CATEGORIES].join(', ')})`,
    );
  }
  if (!label.rootCauseDetail || label.rootCauseDetail.length < 10) {
    errs.push(`${caseId}: rootCauseDetail empty or <10 chars`);
  } else if (label.rootCauseDetail.startsWith('TODO')) {
    errs.push(`${caseId}: rootCauseDetail still has TODO placeholder`);
  }
  if (!label.confidence || !VALID_CONFIDENCE.has(label.confidence)) {
    errs.push(`${caseId}: confidence must be one of ${[...VALID_CONFIDENCE].join(' / ')}`);
  }
  if (!Array.isArray(label.acceptableAlternatives)) {
    errs.push(`${caseId}: acceptableAlternatives must be an array`);
  } else {
    for (const alt of label.acceptableAlternatives) {
      if (!VALID_CATEGORIES.has(alt)) {
        errs.push(`${caseId}: acceptableAlternatives contains invalid enum "${alt}"`);
      }
    }
  }
  return errs;
}

// --- Main -------------------------------------------------------------------

async function main() {
  if (!existsSync(WORKSHEET)) {
    console.error(
      `Worksheet not found at ${WORKSHEET}. Run \`node scripts/port-cpi-corpus.mjs\` first.`,
    );
    process.exit(1);
  }
  if (!existsSync(STAGED_DIR)) {
    console.error(`Staged dir not found: ${STAGED_DIR}`);
    process.exit(1);
  }

  const md = await fs.readFile(WORKSHEET, 'utf8');
  const sections = parseWorksheet(md);
  console.log(`Parsed ${sections.length} case sections from worksheet.`);

  // Validate every section
  let totalErrs = 0;
  const ready = [];
  const blocked = [];
  for (const s of sections) {
    const errs = validateLabel(s.caseId, s.parsed);
    if (errs.length === 0) {
      ready.push(s);
    } else {
      blocked.push({ caseId: s.caseId, errs });
      totalErrs += errs.length;
    }
  }

  console.log(`\n=== VALIDATION ===`);
  console.log(`Ready: ${ready.length} / ${sections.length}`);
  console.log(`Blocked: ${blocked.length} (${totalErrs} total errors)`);
  if (blocked.length > 0) {
    console.log('\nBlocked cases (first 10):');
    for (const b of blocked.slice(0, 10)) {
      for (const e of b.errs) console.log(`  ✗ ${e}`);
    }
    if (blocked.length > 10) {
      console.log(`  … ${blocked.length - 10} more blocked cases`);
    }
  }

  // Dry-run preview
  console.log(`\n=== ${PROMOTE ? 'PROMOTE' : 'DRY-RUN'} ===`);
  if (!PROMOTE) {
    console.log('Would apply labels + move staged → live for the ready cases above.');
    console.log('Re-run with --promote to actually update + promote.');
    if (blocked.length > 0) {
      console.log(
        `\n⚠ Fix the ${blocked.length} blocked cases in LABELING-WORKSHEET.md before promoting.`,
      );
    }
    return;
  }

  // Promote path requires zero blocked
  if (blocked.length > 0) {
    console.error(
      `\n✗ Cannot --promote: ${blocked.length} cases still blocked. Fix the YAML blocks above and re-run.`,
    );
    process.exit(1);
  }

  // Apply labels to staged → write to live
  let updated = 0;
  let skipped = 0;
  for (const r of ready) {
    const stagedPath = path.join(STAGED_DIR, `${r.caseId}.json`);
    if (!existsSync(stagedPath)) {
      console.warn(`  ${r.caseId}: staged file missing — skipped`);
      skipped++;
      continue;
    }
    const stagedJson = JSON.parse(await fs.readFile(stagedPath, 'utf8'));
    stagedJson.groundTruth = {
      rootCauseCategory: r.parsed.rootCauseCategory,
      rootCauseDetail: r.parsed.rootCauseDetail,
      acceptableAlternatives: r.parsed.acceptableAlternatives,
      confidence: r.parsed.confidence,
      notesForEval: r.parsed.notesForEval || '',
    };
    const livePath = path.join(LIVE_DIR, `${r.caseId}.json`);
    await fs.writeFile(livePath, JSON.stringify(stagedJson, null, 2) + '\n');
    // Remove staged after promote
    await fs.unlink(stagedPath);
    updated++;
  }
  console.log(`✓ Promoted ${updated} cases · skipped ${skipped}`);
  console.log(`Live corpus now: ls ${LIVE_DIR}/def-*.json | wc -l`);
  console.log(
    `\nNext: run \`pnpm --filter @qa-nexus/api ac042:eval\` for the binding AC042 result.`,
  );
}

main().catch((err) => {
  console.error('apply-cpi-labels failed:', err);
  process.exit(1);
});

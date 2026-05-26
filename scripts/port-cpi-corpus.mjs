#!/usr/bin/env node
// QA Nexus PM1 — port-cpi-corpus.mjs
//
// Day-25 Sun 2026-05-24. AC042 corpus prep, mechanical-port half.
//
// SOURCE:  apps/api/test/golden-sets/a4/raw/cpi_postmortem_defects.json
//          (50 CUMI/PIM cases — issue_type=Bug, status=Done, no ground truth)
//
// OUTPUT:
//   1. apps/api/test/golden-sets/sherlock-rca/staged/def-006.json
//      … apps/api/test/golden-sets/sherlock-rca/staged/def-050.json
//      (45 staged files — mechanical port complete, ground-truth fields
//      empty pending Yogesh Monday-AM labeling pass)
//
//   2. apps/api/test/golden-sets/sherlock-rca/LABELING-WORKSHEET.md
//      One section per staged case. Each section contains:
//        - case ID + Jira key + title
//        - cleaned RCA evidence (description + recent_comments, ADF + Jira
//          account-ID noise stripped)
//        - YAML form block for Yogesh to fill (rootCauseCategory +
//          rootCauseDetail + acceptableAlternatives + confidence +
//          notesForEval)
//
// MONDAY FLOW:
//   1. Yogesh fills the YAML blocks in LABELING-WORKSHEET.md (~2-3 hr).
//   2. `node scripts/apply-cpi-labels.mjs` reads the worksheet → updates
//      staged JSON files → promotes staged → sherlock-rca/.
//   3. Schema validate + run binding AC042 in ~30-60 sec.
//
// WHY THIS SPLIT:
//   The mechanical port (schema mapping + field synthesis + noise cleaning)
//   is purely deterministic — no senior-QA judgment needed. The ground-truth
//   labeling requires reading the evidence + assigning one of ADR-019's 10
//   categories + writing a 1-2 sentence explanation. That's irreducibly
//   Yogesh's work. By splitting them, Monday's blocker is reduced from
//   4-6 hr of mixed prep + labeling to ~2-3 hr of pure labeling.
//
// USAGE:
//   cd /Users/yogeshmohite/AI_Tester_Project/Project10-QA_Nexus-backend
//   node scripts/port-cpi-corpus.mjs

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const SRC = REPO_ROOT + '/apps/api/test/golden-sets/a4/raw/cpi_postmortem_defects.json';
const STAGED_DIR = REPO_ROOT + '/apps/api/test/golden-sets/sherlock-rca/staged';
const WORKSHEET = REPO_ROOT + '/apps/api/test/golden-sets/sherlock-rca/LABELING-WORKSHEET.md';

const START_NUM = 6; // def-001 … def-005 already exist as seeds
const COUNT = 45; // brief: def-006 … def-050
const TC_RET_START = 901; // synthesize TC-RET-901 … TC-RET-945

const ENVIRONMENTS = ['staging-iksula', 'prod-iksula', 'local-dev'];
const CATEGORIES = [
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
];

// --- Utilities --------------------------------------------------------------

/** Deterministic UUIDv4-shaped from a string seed (so re-runs give same UUIDs). */
function deterministicUuid(seed) {
  const hash = crypto.createHash('sha256').update(seed).digest('hex');
  // Carve into UUIDv4 shape: 8-4-4-4-12, set version + variant bits.
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    '4' + hash.slice(13, 16),
    ((parseInt(hash.slice(16, 17), 16) & 0x3) | 0x8).toString(16) + hash.slice(17, 20),
    hash.slice(20, 32),
  ].join('-');
}

/** Deterministic int in [min, max] from a string seed. */
function deterministicInt(seed, min, max) {
  const h = parseInt(crypto.createHash('sha256').update(seed).digest('hex').slice(0, 8), 16);
  return min + (h % (max - min + 1));
}

/** Strip Jira account-ID prefix (`712020:abc...;`) and embedded ADF
 *  `{adf:display=block}…{adf}` blocks from a comment string. */
function cleanComment(comment) {
  if (typeof comment !== 'string') return '';
  let c = comment;
  // Remove account-ID prefix: "DD/MMM/YY HH:MM AM/PM;712020:UUID;"
  c = c.replace(
    /^(\d{1,2}\/\w{3}\/\d{2,4})\s+\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?;\s*712020:[a-f0-9-]+;\s*/,
    '$1: ',
  );
  // Strip embedded ADF table JSON blocks
  c = c.replace(/\{adf:display=block\}[\s\S]*?\{adf\}/g, '[ADF table elided]');
  // Strip remaining {adf:...} fragments
  c = c.replace(/\{adf[^}]*\}/g, '');
  // Strip screenshot markup like "!screenshot.png|...!"
  c = c.replace(/!Screenshot[^!]*!/g, '[screenshot elided]');
  c = c.replace(/!screenshot[^!]*!/gi, '[screenshot elided]');
  // Collapse whitespace
  c = c.replace(/\s+/g, ' ').trim();
  return c;
}

/** Truncate to a max length, ending on a word boundary, with ellipsis. */
function truncate(str, maxLen) {
  if (!str || str.length <= maxLen) return str || '';
  const cut = str.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(' ');
  const safe = lastSpace > maxLen * 0.7 ? cut.slice(0, lastSpace) : cut;
  return safe + '…';
}

// --- Per-case porter --------------------------------------------------------

function portOne(item, index) {
  const seedNum = START_NUM + index;
  const tcNum = TC_RET_START + index;
  const id = `def-${String(seedNum).padStart(3, '0')}`;
  const seedKey = `${item.key}:${id}`;

  // Title: from Jira title, cleaned
  const title = (item.title || '').trim().slice(0, 200) || `Untitled ${item.key}`;

  // errorMessage: prefer description first 500 chars; fall back to title.
  // schema requires minLength 5 — descriptions average 458 chars, well above.
  const rawDesc = (item.description || '').trim();
  const errorMessage =
    rawDesc.length >= 5
      ? truncate(rawDesc.replace(/\s+/g, ' '), 500)
      : `${title} — see CPI ticket ${item.key} for repro context (no description in source corpus)`;

  // stepLabel: synthesize from title (active phrase)
  const stepLabel = truncate(`Reproduce ${item.key} reported defect: ${title}`, 180);

  // Required fields per schema.json (input section)
  const input = {
    testCaseId: `TC-RET-${tcNum}`,
    testCaseTitle: title,
    runId: deterministicUuid(seedKey),
    stepNumber: 1,
    stepLabel,
    durationMs: deterministicInt(seedKey + ':duration', 1500, 12000),
    environment: ENVIRONMENTS[deterministicInt(seedKey + ':env', 0, ENVIRONMENTS.length - 1)],
    errorMessage,
    stackTrace: null, // cpi corpus has no stack traces
    priorHistory: null, // could synthesize but adds noise — Yogesh can extend if useful
    kbContext: [],
  };

  // Ground truth placeholders — schema requires these to be present + valid,
  // so we seed with "other" / "low" / placeholders that Yogesh replaces.
  // The minLength constraint on rootCauseDetail (≥10) is satisfied by the
  // placeholder string itself.
  const groundTruth = {
    rootCauseCategory: 'other', // TODO-YOGESH: replace with the correct enum
    rootCauseDetail:
      'TODO-YOGESH: 1-2 sentences from the recent_comments / description in LABELING-WORKSHEET.md.',
    acceptableAlternatives: [],
    confidence: 'low', // TODO-YOGESH: high / medium / low
    notesForEval: `Ported from CPI corpus ${item.key} (${item.priority}, ${item.status}, resolved ${item.resolved}). Source title: ${item.title}. See LABELING-WORKSHEET.md row ${id} for cleaned RCA evidence.`,
  };

  return { id, input, groundTruth, _sourceMeta: { cpiKey: item.key, item } };
}

// --- Worksheet builder ------------------------------------------------------

function buildWorksheetSection(ported) {
  const { id, _sourceMeta } = ported;
  const item = _sourceMeta.item;
  const descClean = (item.description || '(no description in source ticket)')
    .replace(/\s+/g, ' ')
    .trim();
  const commentsClean = (item.recent_comments || [])
    .map((c) => '- ' + cleanComment(c))
    .filter((c) => c.length > 4);
  const commentsBlock = commentsClean.length
    ? commentsClean.map((c) => truncate(c, 800)).join('\n')
    : '_(no recent_comments)_';

  return `## ${id} — ${_sourceMeta.cpiKey} · _${item.title}_

**Synthesized fields (mechanical port — do NOT edit):**
- testCaseId: \`${ported.input.testCaseId}\`
- environment: \`${ported.input.environment}\`
- durationMs: ${ported.input.durationMs}

**Source description:**

> ${truncate(descClean, 800)}

**Source recent_comments (cleaned — ADF + account-ID noise stripped):**

${commentsBlock}

**Source metadata:** priority=${item.priority} · status=${item.status} · resolution=${item.resolution} · resolved=${item.resolved}

**👉 GROUND TRUTH — fill this YAML block:**

\`\`\`yaml
# ${id} (${_sourceMeta.cpiKey})
rootCauseCategory: ""          # one of: ${CATEGORIES.join(' | ')}
rootCauseDetail: ""            # 1-2 sentences explaining the actual cause (≥10 chars)
acceptableAlternatives: []     # other category enums a senior reviewer could defend; typically 1-2
confidence: ""                 # high / medium / low — your confidence in this label
notesForEval: ""               # comments for the eval reviewer (e.g., "ambiguous because…")
\`\`\`

---
`;
}

function buildWorksheet(allPorted) {
  const header = `# AC042 corpus — labeling worksheet (Yogesh action required)

> **Created:** Day-25 Sun 2026-05-24 (BE+1 mechanical port pass)
> **Action:** Fill the YAML block under each section's "GROUND TRUTH" heading.
> **Goal:** 45 cases labeled → \`node scripts/apply-cpi-labels.mjs\` promotes
> staged → live → \`pnpm --filter @qa-nexus/api ac042:eval\` runs binding AC042
> on the full 50-defect corpus.
>
> **Time estimate:** ~2-3 hr for 45 cases at ~3 min each (read description +
> comments, decide category, write 1-2 sentence detail).
>
> **The 10 categories (from ADR-019 §2):**
${CATEGORIES.map((c) => `> - \`${c}\``).join('\n')}
>
> **How to decide:** read the description + comments below each section.
> Map to one category as the primary. List up to 2 other categories a senior
> reviewer could defend as acceptable alternatives. Set confidence based on
> how clear the evidence is. The "TODO-YOGESH" placeholders in the staged
> JSON files are NOT used — \`apply-cpi-labels.mjs\` extracts your values
> from THIS file's YAML blocks.

---

`;
  return header + allPorted.map(buildWorksheetSection).join('\n');
}

// --- Main -------------------------------------------------------------------

async function main() {
  console.log(`Reading source corpus from ${SRC}`);
  const data = JSON.parse(await fs.readFile(SRC, 'utf8'));
  const items = data.items;
  console.log(`Loaded ${items.length} cpi cases (source header count=${data.count})`);

  if (items.length < COUNT) {
    throw new Error(`Need ${COUNT} cases for the port but corpus only has ${items.length}`);
  }

  // Take first COUNT cases, but prioritize those WITH a description (better
  // labeling signal for Yogesh Monday)
  const withDesc = items.filter((i) => (i.description || '').trim().length > 0);
  const withoutDesc = items.filter((i) => !(i.description || '').trim().length);
  const ordered = [...withDesc, ...withoutDesc].slice(0, COUNT);
  console.log(
    `Selected ${ordered.length} cases (${withDesc.length} with description, ${ordered.length - withDesc.length} without)`,
  );

  await fs.mkdir(STAGED_DIR, { recursive: true });
  console.log(`Output dir: ${STAGED_DIR}`);

  const ported = ordered.map((item, i) => portOne(item, i));

  // Write staged JSON files (strip _sourceMeta — it's only for the worksheet)
  for (const p of ported) {
    const { _sourceMeta, ...clean } = p;
    const outPath = path.join(STAGED_DIR, `${p.id}.json`);
    await fs.writeFile(outPath, JSON.stringify(clean, null, 2) + '\n');
  }
  console.log(`Wrote ${ported.length} staged JSON files (def-006 … def-050)`);

  // Write the labeling worksheet
  const worksheetContent = buildWorksheet(ported);
  await fs.writeFile(WORKSHEET, worksheetContent);
  console.log(`Wrote labeling worksheet: ${WORKSHEET}`);
  console.log(`  (${ported.length} sections, ~${Math.round(worksheetContent.length / 1024)} KB)`);

  // Summary stats for Yogesh
  const envCounts = ported.reduce((acc, p) => {
    acc[p.input.environment] = (acc[p.input.environment] || 0) + 1;
    return acc;
  }, {});
  console.log('\n=== PORT SUMMARY ===');
  console.log(`Staged: ${ported.length} files`);
  console.log(`testCaseIds: TC-RET-${TC_RET_START} … TC-RET-${TC_RET_START + COUNT - 1}`);
  console.log(`Environments: ${JSON.stringify(envCounts)}`);
  console.log(`Cases with description: ${withDesc.length}`);
  console.log(
    `Cases without description: ${COUNT - withDesc.length} (fallback to title-based errorMessage)`,
  );
  console.log('\nNext step: Yogesh opens LABELING-WORKSHEET.md, fills the 45 YAML blocks.');
  console.log('Then: node scripts/apply-cpi-labels.mjs promotes staged → live.');
}

main().catch((err) => {
  console.error('port-cpi-corpus failed:', err);
  process.exit(1);
});

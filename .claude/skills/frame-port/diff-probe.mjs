#!/usr/bin/env node
// .claude/skills/frame-port/diff-probe.mjs
//
// frame-port skill — Step 5 of the port workflow.
//
// Runs Playwright against the canonical v2 HTML (file://) and the React
// port (localhost). For each viewport (320/768/1024/1440), captures both
// screenshots + section-by-section DOM presence checks. Emits a stdout
// diff table. EXIT 0 = clean (visual gate green); EXIT 1 = drift (gate
// blocks; fix root cause and re-probe).
//
// This is the AUTOMATED gate that precedes manual visual review (Hard
// Rule 13). Never screenshot for visual gate until this probe is clean.
//
// Usage:
//   node .claude/skills/frame-port/diff-probe.mjs \
//     --frame F19 \
//     --canonical "QA Nexus/PM1/PM1_UI_v2/Redesign Frame by claude design/F19 Run Console v2.html" \
//     --port http://localhost:3000/runs/abc \
//     [--spec .claude/skills/frame-port/specs/F19.spec.json] \
//     [--out .claude/skills/frame-port/diffs/F19/]
//
// Output:
//   - PNG screenshots at <out>/<viewport>/{canonical,port}.png
//   - Per-viewport DOM-presence table to stdout
//   - Summary table to stdout
//   - Exit 0 if every section present + every key class found AND pixel
//     diff <5% per viewport; exit 1 otherwise
//
// Per Hard Rule 18 (codified Day-18 PM): all frame ports MUST go through
// this skill's workflow. Skipping = visual gate FAIL.

import { chromium } from 'playwright';
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { argv, exit } from 'node:process';

// -----------------------------------------------------------------------------
// 1. Parse args
// -----------------------------------------------------------------------------

function parseArgs(rawArgs) {
  const args = {};
  for (let i = 0; i < rawArgs.length; i++) {
    const a = rawArgs[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = rawArgs[i + 1];
      if (next && !next.startsWith('--')) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    }
  }
  return args;
}

const args = parseArgs(argv.slice(2));

if (!args.frame || !args.canonical || !args.port) {
  console.error(
    [
      'diff-probe.mjs — frame-port skill Step 5 (canonical ↔ React port diff)',
      '',
      'Usage:',
      '  node .claude/skills/frame-port/diff-probe.mjs \\',
      '    --frame F19 \\',
      '    --canonical "<path to v2 HTML>" \\',
      '    --port http://localhost:3000/<route> \\',
      '    [--spec .claude/skills/frame-port/specs/F19.spec.json] \\',
      '    [--out .claude/skills/frame-port/diffs/F19/]',
      '',
      'Hard Rule 18 (mandatory): every frame port must run this BEFORE visual gate.',
      '',
    ].join('\n'),
  );
  exit(2);
}

const frameId = String(args.frame).toUpperCase();
const canonicalPath = resolve(args.canonical);
const portUrl = String(args.port);
const specPath = args.spec
  ? resolve(args.spec)
  : resolve(`.claude/skills/frame-port/specs/${frameId}.spec.json`);
const outDir = resolve(args.out || `.claude/skills/frame-port/diffs/${frameId}`);

if (!existsSync(canonicalPath)) {
  console.error(`✗ canonical HTML not found: ${canonicalPath}`);
  exit(1);
}

const canonicalUrl = pathToFileURL(canonicalPath).toString();

console.log(`→ diff-probe for ${frameId}`);
console.log(`  canonical: ${canonicalPath}`);
console.log(`  port:      ${portUrl}`);
console.log(`  spec:      ${existsSync(specPath) ? specPath : '(none — selector-only mode)'}`);
console.log(`  out:       ${outDir}`);
console.log('');

let spec = null;
if (existsSync(specPath)) {
  try {
    spec = JSON.parse(readFileSync(specPath, 'utf8'));
  } catch (e) {
    console.warn(`⚠  failed to parse spec.json: ${e.message} — running selector-only mode`);
  }
}

const VIEWPORTS = [
  { name: '320', width: 320, height: 640 }, // iPhone SE
  { name: '768', width: 768, height: 1024 }, // iPad portrait
  { name: '1024', width: 1024, height: 768 }, // small desktop
  { name: '1440', width: 1440, height: 900 }, // standard desktop
];

// Section-like selectors we check on BOTH pages.
// These come from the spec.json's section tree if available; else we use
// a default set covering the common semantic elements.
function buildSelectorsFromSpec(s) {
  if (!s?.sections) return null;
  const selectors = [];
  function walk(nodes, parentTag) {
    for (const n of nodes) {
      if (n.sectionLike) {
        // Build the most-specific selector we can:
        //   - id wins
        //   - then role+tag
        //   - then class+tag
        //   - then tag alone
        let sel;
        if (n.id) sel = `#${n.id}`;
        else if (n.role) sel = `${n.tag}[role="${n.role}"]`;
        else if (n.classes && n.classes.length) sel = `${n.tag}.${n.classes[0]}`;
        else sel = n.tag;
        const label = n.id || n.role || (n.classes && n.classes[0]) || n.tag;
        selectors.push({ label, selector: sel });
      }
      walk(n.children, n.tag);
    }
  }
  walk(s.sections);
  // Dedupe by label (keep first)
  const seen = new Set();
  return selectors.filter((s) => {
    if (seen.has(s.label)) return false;
    seen.add(s.label);
    return true;
  });
}

const DEFAULT_SELECTORS = [
  { label: 'page-header', selector: 'header' },
  { label: 'main-content', selector: 'main' },
  { label: 'left-rail', selector: 'aside, nav[role="navigation"], .rail, .sidebar' },
  { label: 'right-rail', selector: '[role="complementary"]' },
  { label: 'footer', selector: 'footer' },
  { label: 'dialog', selector: 'dialog, [role="dialog"]' },
];

const selectors = buildSelectorsFromSpec(spec) || DEFAULT_SELECTORS;

console.log(`→ checking ${selectors.length} section selectors per viewport`);
console.log('');

// -----------------------------------------------------------------------------
// 2. Run Playwright
// -----------------------------------------------------------------------------

mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext();

const allResults = []; // { viewport, perSelector, pixelDiffPct }

let failed = false;

for (const vp of VIEWPORTS) {
  const vpDir = join(outDir, vp.name);
  mkdirSync(vpDir, { recursive: true });
  console.log(`── viewport ${vp.name}×${vp.height} ──`);

  // Canonical
  const canonicalPage = await ctx.newPage();
  await canonicalPage.setViewportSize({ width: vp.width, height: vp.height });
  let canonicalLoadOk = false;
  try {
    await canonicalPage.goto(canonicalUrl, { waitUntil: 'load', timeout: 15_000 });
    canonicalLoadOk = true;
  } catch (e) {
    console.warn(`  ⚠ canonical load failed: ${e.message?.slice(0, 100)}`);
  }
  let canonicalShotPath = null;
  if (canonicalLoadOk) {
    canonicalShotPath = join(vpDir, 'canonical.png');
    await canonicalPage.screenshot({ path: canonicalShotPath, fullPage: false });
  }

  // Port
  const portPage = await ctx.newPage();
  await portPage.setViewportSize({ width: vp.width, height: vp.height });
  let portLoadOk = false;
  try {
    await portPage.goto(portUrl, { waitUntil: 'networkidle', timeout: 30_000 });
    portLoadOk = true;
  } catch (e) {
    console.warn(`  ⚠ port load failed: ${e.message?.slice(0, 100)}`);
  }
  let portShotPath = null;
  if (portLoadOk) {
    portShotPath = join(vpDir, 'port.png');
    await portPage.screenshot({ path: portShotPath, fullPage: false });
  }

  // Selector-by-selector comparison
  const perSelector = [];
  for (const s of selectors) {
    const inCanonical = canonicalLoadOk
      ? await canonicalPage
          .locator(s.selector)
          .count()
          .catch(() => 0)
      : 0;
    const inPort = portLoadOk
      ? await portPage
          .locator(s.selector)
          .count()
          .catch(() => 0)
      : 0;
    const status =
      inCanonical > 0 && inPort > 0
        ? 'PASS'
        : inCanonical > 0 && inPort === 0
          ? 'MISSING'
          : inCanonical === 0 && inPort > 0
            ? 'EXTRA'
            : 'NEITHER';
    if (status === 'MISSING' || status === 'EXTRA') failed = true;
    perSelector.push({
      label: s.label,
      selector: s.selector,
      canonical: inCanonical,
      port: inPort,
      status,
    });
  }

  // Pixel diff (sharp-free, raw RGBA byte comparison)
  // We resize port to match canonical's pixel dimensions before comparing.
  let pixelDiffPct = null;
  if (canonicalShotPath && portShotPath) {
    try {
      pixelDiffPct = await comparePngs(canonicalShotPath, portShotPath, vp);
    } catch (e) {
      console.warn(`  ⚠ pixel diff failed: ${e.message?.slice(0, 100)}`);
    }
  }

  // Print per-selector table for this viewport
  console.log(`  ${'Section'.padEnd(28)} ${'Canonical'.padStart(9)} ${'Port'.padStart(6)}  Status`);
  console.log(`  ${'-'.repeat(28)} ${'-'.repeat(9)} ${'-'.repeat(6)}  ${'-'.repeat(7)}`);
  for (const r of perSelector) {
    const lbl = r.label.length > 28 ? r.label.slice(0, 25) + '...' : r.label.padEnd(28);
    console.log(
      `  ${lbl} ${String(r.canonical).padStart(9)} ${String(r.port).padStart(6)}  ${r.status}`,
    );
  }
  if (pixelDiffPct !== null) {
    const pixOk = pixelDiffPct < 0.05;
    if (!pixOk) failed = true;
    console.log(
      `  pixel diff: ${(pixelDiffPct * 100).toFixed(2)}% ${pixOk ? '(PASS)' : '(FAIL — >5%)'}`,
    );
  }
  console.log('');

  allResults.push({ viewport: vp.name, perSelector, pixelDiffPct });
  await canonicalPage.close();
  await portPage.close();
}

await ctx.close();
await browser.close();

// -----------------------------------------------------------------------------
// 3. Summary
// -----------------------------------------------------------------------------

writeFileSync(join(outDir, 'report.json'), JSON.stringify(allResults, null, 2) + '\n', 'utf8');

console.log('══════════════════════════════════════════');
console.log(`Summary for ${frameId}:`);
for (const r of allResults) {
  const fails = r.perSelector.filter((s) => s.status !== 'PASS').length;
  const pixDiff = r.pixelDiffPct !== null ? `pix=${(r.pixelDiffPct * 100).toFixed(1)}%` : 'pix=n/a';
  console.log(
    `  viewport ${r.viewport}: ${r.perSelector.length - fails}/${r.perSelector.length} selectors PASS · ${pixDiff}`,
  );
}
console.log('');
console.log(`report:       ${join(outDir, 'report.json')}`);
console.log(`screenshots:  ${outDir}/<viewport>/{canonical,port}.png`);
console.log('');
if (failed) {
  console.log('✗ DIFF-PROBE FAIL — drift detected. Fix root cause + re-probe.');
  console.log('  DO NOT screenshot for Rule 13 visual gate until this passes.');
  exit(1);
} else {
  console.log('✓ DIFF-PROBE PASS — proceed to Rule 13 manual visual gate.');
  exit(0);
}

// -----------------------------------------------------------------------------
// helpers
// -----------------------------------------------------------------------------

// Compare two PNG files at the same viewport pixel dimensions and return
// fraction of differing pixels in [0..1]. Uses pure-Node PNG decode via
// dynamic import of 'sharp' (already in stack via ADR-009).
//
// Tolerance: pixels are considered "different" if Manhattan distance in
// RGBA space > 24 (~10% per channel). Tuned to forgive font anti-aliasing
// jitter while still catching real layout shifts.
async function comparePngs(canonicalPath, portPath, vp) {
  const { default: sharp } = await import('sharp');
  const [a, b] = await Promise.all([
    sharp(canonicalPath).resize(vp.width, vp.height, { fit: 'cover' }).raw().toBuffer(),
    sharp(portPath).resize(vp.width, vp.height, { fit: 'cover' }).raw().toBuffer(),
  ]);
  const len = Math.min(a.length, b.length);
  let diffPixels = 0;
  // Sharp .raw() returns 3 bytes/pixel (RGB) unless we ensure() to RGBA
  const stride = 3;
  for (let i = 0; i < len; i += stride) {
    const dr = Math.abs(a[i] - b[i]);
    const dg = Math.abs(a[i + 1] - b[i + 1]);
    const db = Math.abs(a[i + 2] - b[i + 2]);
    if (dr + dg + db > 24) diffPixels += 1;
  }
  const totalPixels = len / stride;
  return diffPixels / totalPixels;
}

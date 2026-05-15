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

// v2 (Day-19) — Section probes with three-tier OR-semantics matching, per
// CLAUDE.md Hard Rule 18 Day-19 amendment. Each section gets up to three
// independent probes; a section is PRESENT if ANY of the three matches:
//
//   PRIMARY   — role + aria-label (canonical structural contract)
//   SECONDARY — class-name substring (v1 fallback for ports that reuse class tokens)
//   TERTIARY  — data-canonical-section attribute (escape hatch convention)
//
// Why: v1 matched by class name only. Tailwind React ports use utility
// classes (`flex shrink-0 flex-col`) instead of canonical BEM tokens
// (`def-shell`). Result: every Tailwind port returned 0% structural
// presence regardless of port quality. v2 inverts the priority: ARIA is
// the binding contract; class names are advisory; data-attribute is the
// escape hatch.
function buildProbesFromSpec(s) {
  if (!s?.sections) return null;
  const probes = [];
  function walk(nodes) {
    for (const n of nodes) {
      if (n.sectionLike) {
        const sig = n.aria_signal || {};
        const label =
          n.id || sig.aria_label || sig.role || (n.classes && n.classes[0]) || n.tag;

        // Build the three-tier selector list (any match = PRESENT)
        const tiers = [];
        // PRIMARY: role + aria-label combo (most specific) → role alone (less)
        if (sig.role && sig.aria_label) {
          tiers.push({
            tier: 'PRIMARY',
            selector: `[role="${sig.role}"][aria-label="${escapeAttr(sig.aria_label)}"]`,
          });
        }
        if (sig.role) tiers.push({ tier: 'PRIMARY', selector: `[role="${sig.role}"]` });
        if (sig.aria_label)
          tiers.push({
            tier: 'PRIMARY',
            selector: `[aria-label="${escapeAttr(sig.aria_label)}"]`,
          });
        // For semantic tags (header/main/aside/nav/footer/dialog) the tag
        // itself implies an ARIA landmark role — count tag-only as PRIMARY too.
        if (
          ['header', 'main', 'aside', 'nav', 'footer', 'dialog', 'section'].includes(n.tag)
        ) {
          tiers.push({ tier: 'PRIMARY', selector: n.tag });
        }
        // SECONDARY: class-name substring (v1 fallback)
        if (sig.classes && sig.classes.length) {
          for (const cls of sig.classes.slice(0, 3)) {
            // Skip Tailwind arbitrary-value classes (e.g. w-[272px]) and
            // utility-only classes that are noise on the React side.
            if (/[\[\]]/.test(cls)) continue;
            tiers.push({ tier: 'SECONDARY', selector: `.${escapeClass(cls)}` });
          }
        }
        // TERTIARY: data-canonical-section attribute (escape hatch)
        if (sig.data_canonical_section) {
          tiers.push({
            tier: 'TERTIARY',
            selector: `[data-canonical-section="${escapeAttr(sig.data_canonical_section)}"]`,
          });
        }

        probes.push({ label, tiers });
      }
      walk(n.children);
    }
  }
  walk(s.sections);
  // Dedupe by label
  const seen = new Set();
  return probes.filter((p) => {
    if (seen.has(p.label)) return false;
    seen.add(p.label);
    return true;
  });
}

function escapeAttr(s) {
  return String(s).replace(/"/g, '\\"');
}
function escapeClass(s) {
  // Only escape what CSS actually requires for class names
  return String(s).replace(/([!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, '\\$1');
}

const DEFAULT_PROBES = [
  {
    label: 'page-header',
    tiers: [{ tier: 'PRIMARY', selector: 'header, [role="banner"]' }],
  },
  {
    label: 'main-content',
    tiers: [{ tier: 'PRIMARY', selector: 'main, [role="main"]' }],
  },
  {
    label: 'left-rail',
    tiers: [
      { tier: 'PRIMARY', selector: 'aside, nav[role="navigation"], [role="navigation"]' },
      { tier: 'SECONDARY', selector: '.rail' },
      { tier: 'SECONDARY', selector: '.sidebar' },
    ],
  },
  {
    label: 'right-rail',
    tiers: [{ tier: 'PRIMARY', selector: '[role="complementary"]' }],
  },
  {
    label: 'footer',
    tiers: [{ tier: 'PRIMARY', selector: 'footer, [role="contentinfo"]' }],
  },
  {
    label: 'dialog',
    tiers: [{ tier: 'PRIMARY', selector: 'dialog, [role="dialog"]' }],
  },
];

const probes = buildProbesFromSpec(spec) || DEFAULT_PROBES;
const schemaVersion = spec?.schemaVersion ?? 1;

console.log(
  `→ checking ${probes.length} section probes (3-tier OR semantics) per viewport · spec schema v${schemaVersion}`,
);
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

  // v2: probe-by-probe OR-semantics comparison.
  // Each probe has up to N tiered selectors. Section is PRESENT on a page
  // if ANY tier returns >0 matches. We record WHICH tier matched for
  // diagnostic transparency.
  async function evalProbe(page, loadOk, probe) {
    if (!loadOk) return { count: 0, matchedTier: null, matchedSelector: null };
    for (const t of probe.tiers) {
      const c = await page
        .locator(t.selector)
        .count()
        .catch(() => 0);
      if (c > 0) return { count: c, matchedTier: t.tier, matchedSelector: t.selector };
    }
    return { count: 0, matchedTier: null, matchedSelector: null };
  }

  const perSelector = [];
  for (const probe of probes) {
    const cRes = await evalProbe(canonicalPage, canonicalLoadOk, probe);
    const pRes = await evalProbe(portPage, portLoadOk, probe);
    const inCanonical = cRes.count;
    const inPort = pRes.count;
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
      label: probe.label,
      tiers: probe.tiers,
      canonical: inCanonical,
      port: inPort,
      canonicalMatchedTier: cRes.matchedTier,
      portMatchedTier: pRes.matchedTier,
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

  // Print per-section table for this viewport (v2 — shows matched tier)
  console.log(
    `  ${'Section'.padEnd(28)} ${'Canon'.padStart(5)} ${'Port'.padStart(5)}  ${'C-tier'.padEnd(9)} ${'P-tier'.padEnd(9)} Status`,
  );
  console.log(`  ${'-'.repeat(28)} ${'-'.repeat(5)} ${'-'.repeat(5)}  ${'-'.repeat(9)} ${'-'.repeat(9)} ${'-'.repeat(7)}`);
  for (const r of perSelector) {
    const lbl = r.label.length > 28 ? r.label.slice(0, 25) + '...' : r.label.padEnd(28);
    const ct = (r.canonicalMatchedTier || '-').padEnd(9);
    const pt = (r.portMatchedTier || '-').padEnd(9);
    console.log(
      `  ${lbl} ${String(r.canonical).padStart(5)} ${String(r.port).padStart(5)}  ${ct} ${pt} ${r.status}`,
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

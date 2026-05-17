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
//     [--scope content|full] \   # default: content (5% threshold, blocks);
//                                # full: 50% warning-only (debug)
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

// v2.1 (Day-19 mid-morning) — content-region pixel crop scope.
//   --scope content (default) → crop to <main> region (skip rail + topbar)
//                              and pixel-diff cropped images. 5% threshold.
//                              Resolves AdminShell-vs-canonical-shell pixel
//                              floor surfaced by F21 practice re-port.
//   --scope full              → v1/v2 behavior (full viewport pixel-diff).
//                              50% threshold, warning-only — never blocks.
const scope = args.scope === 'full' ? 'full' : 'content';
const PIXEL_THRESHOLD = scope === 'content' ? 0.05 : 0.5;
const PIXEL_BLOCKS = scope === 'content';

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
        // v2.1.1 (Day-19 Bug B fix): read from BOTH v1 top-level fields
        // AND v2 aria_signal block, so backward-compat with v1 spec.jsons
        // is honored. The OR-semantics of Hard Rule 18 Day-19 amendment
        // Part 1 require all three matchers to run; previously, v1 specs
        // (no aria_signal block) silently dropped the SECONDARY class-match
        // because sig.classes was undefined.
        const sig = n.aria_signal || {};
        const role = sig.role ?? n.role ?? null;
        const aria_label = sig.aria_label ?? null;
        const classes = sig.classes && sig.classes.length ? sig.classes : n.classes || [];
        const data_canonical_section = sig.data_canonical_section ?? null;

        const label = n.id || aria_label || role || (classes && classes[0]) || n.tag;

        // Build the three-tier selector list (any match = PRESENT)
        const tiers = [];
        // PRIMARY: role + aria-label combo (most specific) → role alone (less)
        if (role && aria_label) {
          tiers.push({
            tier: 'PRIMARY',
            selector: `[role="${role}"][aria-label="${escapeAttr(aria_label)}"]`,
          });
        }
        if (role) tiers.push({ tier: 'PRIMARY', selector: `[role="${role}"]` });
        if (aria_label)
          tiers.push({
            tier: 'PRIMARY',
            selector: `[aria-label="${escapeAttr(aria_label)}"]`,
          });
        // For semantic tags (header/main/aside/nav/footer/dialog) the tag
        // itself implies an ARIA landmark role — count tag-only as PRIMARY too.
        if (['header', 'main', 'aside', 'nav', 'footer', 'dialog', 'section'].includes(n.tag)) {
          tiers.push({ tier: 'PRIMARY', selector: n.tag });
        }
        // SECONDARY: class-name substring (v1 fallback). Hard Rule 18 Day-19
        // amendment Part 1 requires this matcher to run for ANY section
        // that has class tokens — even when ARIA is also present.
        if (classes && classes.length) {
          for (const cls of classes.slice(0, 3)) {
            // Skip Tailwind arbitrary-value classes (e.g. w-[272px]) and
            // utility-only classes that are noise on the React side.
            if (/[\[\]]/.test(cls)) continue;
            tiers.push({ tier: 'SECONDARY', selector: `.${escapeClass(cls)}` });
          }
        }
        // TERTIARY: data-canonical-section attribute (escape hatch)
        if (data_canonical_section) {
          tiers.push({
            tier: 'TERTIARY',
            selector: `[data-canonical-section="${escapeAttr(data_canonical_section)}"]`,
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

  // v2.1: measure shell dims on BOTH sources, derive UNION content crop.
  // v2.1.1 (Day-19 Bug A fix): the v2.1 implementation measured AdminShell
  // dims on the React port only and applied the SAME crop to canonical.
  // Canonical has its OWN custom shell with DIFFERENT dimensions; same-crop
  // clipped canonical's content on the left, widening the diff at desktop
  // viewports. Hard Rule 18 Day-19 amendment Part 2 specifies the union:
  //   crop_x = max(canonical_rail_width, port_rail_width)
  //   crop_y = max(canonical_topbar_height, port_topbar_height)
  // This ensures BOTH shells are excluded from the comparison.
  let cropBounds = null;
  let canonicalShellBounds = null;
  let portShellBounds = null;
  if (scope === 'content') {
    if (canonicalLoadOk) canonicalShellBounds = await measureContentBounds(canonicalPage, vp);
    if (portLoadOk) portShellBounds = await measureContentBounds(portPage, vp);
    cropBounds = unionShellCrop(canonicalShellBounds, portShellBounds, vp);
  }

  // Pixel diff (sharp raw RGBA, with optional content-region crop applied
  // to BOTH images before compare).
  let pixelDiffPct = null;
  if (canonicalShotPath && portShotPath) {
    try {
      pixelDiffPct = await comparePngs(canonicalShotPath, portShotPath, vp, cropBounds);
    } catch (e) {
      console.warn(`  ⚠ pixel diff failed: ${e.message?.slice(0, 100)}`);
    }
  }

  // Print per-section table for this viewport (v2 — shows matched tier)
  console.log(
    `  ${'Section'.padEnd(28)} ${'Canon'.padStart(5)} ${'Port'.padStart(5)}  ${'C-tier'.padEnd(9)} ${'P-tier'.padEnd(9)} Status`,
  );
  console.log(
    `  ${'-'.repeat(28)} ${'-'.repeat(5)} ${'-'.repeat(5)}  ${'-'.repeat(9)} ${'-'.repeat(9)} ${'-'.repeat(7)}`,
  );
  for (const r of perSelector) {
    const lbl = r.label.length > 28 ? r.label.slice(0, 25) + '...' : r.label.padEnd(28);
    const ct = (r.canonicalMatchedTier || '-').padEnd(9);
    const pt = (r.portMatchedTier || '-').padEnd(9);
    console.log(
      `  ${lbl} ${String(r.canonical).padStart(5)} ${String(r.port).padStart(5)}  ${ct} ${pt} ${r.status}`,
    );
  }
  if (pixelDiffPct !== null) {
    const pixOk = pixelDiffPct < PIXEL_THRESHOLD;
    if (!pixOk && PIXEL_BLOCKS) failed = true;
    const tag = pixOk
      ? `(PASS, scope=${scope})`
      : PIXEL_BLOCKS
        ? `(FAIL — >${(PIXEL_THRESHOLD * 100).toFixed(0)}%, scope=${scope})`
        : `(WARN — >${(PIXEL_THRESHOLD * 100).toFixed(0)}%, scope=${scope}, non-blocking)`;
    console.log(`  pixel diff: ${(pixelDiffPct * 100).toFixed(2)}% ${tag}`);
    if (cropBounds) {
      console.log(
        `  union crop:  x=${cropBounds.x} y=${cropBounds.y} w=${cropBounds.width} h=${cropBounds.height}`,
      );
      if (canonicalShellBounds)
        console.log(
          `    canonical: rail=${canonicalShellBounds._rail}px topbar=${canonicalShellBounds._topbar}px`,
        );
      if (portShellBounds)
        console.log(
          `    port:      rail=${portShellBounds._rail}px topbar=${portShellBounds._topbar}px`,
        );
    }
  }
  console.log('');

  // v2.1.2: serialize BOTH `pixelDiff` and `pixelDiffPct` for the report.
  // The two are aliases — JSON.stringify will keep both. Using two keys
  // covers both naming conventions FE+1 / BE+1 / external tooling may
  // look up. Forces null (not undefined) so JSON serialization never
  // silently drops the field.
  const pixelDiffFinal =
    pixelDiffPct === undefined || pixelDiffPct === null || Number.isNaN(pixelDiffPct)
      ? null
      : pixelDiffPct;
  allResults.push({
    viewport: vp.name,
    perSelector,
    pixelDiff: pixelDiffFinal,
    pixelDiffPct: pixelDiffFinal,
    cropBounds,
    canonicalShellBounds,
    portShellBounds,
  });
  await canonicalPage.close();
  await portPage.close();
}

await ctx.close();
await browser.close();

// -----------------------------------------------------------------------------
// 3. Summary
// -----------------------------------------------------------------------------

const reportEnvelope = {
  frame: frameId,
  scope,
  pixelThreshold: PIXEL_THRESHOLD,
  pixelBlocks: PIXEL_BLOCKS,
  schemaVersion: spec?.schemaVersion ?? null,
  generatedAt: new Date().toISOString(),
  viewports: allResults,
};
writeFileSync(join(outDir, 'report.json'), JSON.stringify(reportEnvelope, null, 2) + '\n', 'utf8');

console.log('══════════════════════════════════════════');
console.log(
  `Summary for ${frameId} (scope=${scope}, threshold=${(PIXEL_THRESHOLD * 100).toFixed(0)}%):`,
);
for (const r of allResults) {
  const fails = r.perSelector.filter((s) => s.status !== 'PASS').length;
  const pixDiff = r.pixelDiffPct !== null ? `pix=${(r.pixelDiffPct * 100).toFixed(1)}%` : 'pix=n/a';
  console.log(
    `  viewport ${r.viewport}: ${r.perSelector.length - fails}/${r.perSelector.length} sections PASS · ${pixDiff}`,
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
// fraction of differing pixels in [0..1]. Uses sharp for PNG decode +
// resize + crop (already in stack via ADR-009); pixelmatch for the actual
// pixel comparison.
//
// v2.1 (Day-19): if cropBounds is provided, both images are first resized
// to viewport dims then cropped to the same content rectangle BEFORE the
// pixel-by-pixel compare. This implements the two-canonical model — shell
// pixels (Rule 14 / F19 React canonical) are NOT comparable to per-frame
// custom-shell pixels (Rule 15 / v2 HTML canonical), so we exclude them.
//
// v2.1.2 (Day-19 Bug C fix): switched from raw RGBA Manhattan distance
// (threshold 24, NO anti-alias awareness) to pixelmatch with the same
// options as the project's playwright VR config (`apps/web/tests/visual/
// playwright.config.ts`):
//   - threshold: 0.2        (color tolerance, normalized 0..1)
//   - includeAA: false      (ignore anti-aliased glyph + icon edges)
//   - alpha: 0.1            (transparency tolerance)
// Previously, every AA edge — 1-2px partial-alpha gradient per glyph —
// counted as full-pixel drift, inflating diff 3-4x vs visible content
// drift. pixelmatch's AA detection eliminates that noise.
async function comparePngs(canonicalPath, portPath, vp, cropBounds = null) {
  const { default: sharp } = await import('sharp');
  const { default: pixelmatch } = await import('pixelmatch');

  // Decode + resize. ensureAlpha() gives us RGBA (4 bytes/pixel), which
  // is what pixelmatch expects.
  const baseA = sharp(canonicalPath).resize(vp.width, vp.height, { fit: 'cover' }).ensureAlpha();
  const baseB = sharp(portPath).resize(vp.width, vp.height, { fit: 'cover' }).ensureAlpha();

  let width = vp.width;
  let height = vp.height;
  if (cropBounds && cropBounds.width > 0 && cropBounds.height > 0) {
    const safe = clampCrop(cropBounds, vp);
    baseA.extract(safe);
    baseB.extract(safe);
    width = safe.width;
    height = safe.height;
  }

  const [a, b] = await Promise.all([baseA.raw().toBuffer(), baseB.raw().toBuffer()]);
  const diff = Buffer.alloc(width * height * 4);

  const diffPixels = pixelmatch(a, b, diff, width, height, {
    threshold: 0.2,
    includeAA: false,
    alpha: 0.1,
    diffColor: [255, 0, 0],
    aaColor: [255, 255, 0],
  });

  const totalPixels = width * height;
  return totalPixels > 0 ? diffPixels / totalPixels : 0;
}

// v2.1 — Measure the rendered AdminShell rail width + topbar height on the
// React port at the current viewport, derive content crop bounds.
//
// AdminShell rail behavior (per Hard Rule 14 Day-17 amendment):
//   - desktop ≥1024px: 240px expanded (default) or 64px collapsed
//   - <1024px: rail becomes hamburger drawer (overlays content, width=0)
//
// Topbar behavior: fixed 64px on F19 React canonical at all viewports.
//
// We try multiple selector candidates so the probe works whether the
// AdminShell uses semantic tags (aside, header) or class hooks. Falls
// back to conservative defaults (rail=0, topbar=64) so the probe never
// crashes on a port that hasn't wired AdminShell yet.
async function measureContentBounds(page, vp) {
  // Try to find the rail. Multiple candidates because AdminShell may use
  // any of these patterns; we take the first that resolves.
  const railSelectors = [
    'aside[data-testid="admin-shell-rail"]',
    '[data-canonical-section="rail"]',
    'aside[role="navigation"]',
    'nav[aria-label*="primary" i]',
    'aside.rail',
    'aside',
  ];
  const topbarSelectors = [
    'header[data-testid="admin-shell-topbar"]',
    '[data-canonical-section="topbar"]',
    'header[role="banner"]',
    'header.shell-header',
    'header',
  ];

  let railWidth = 0;
  if (vp.width >= 1024) {
    for (const sel of railSelectors) {
      try {
        const box = await page.locator(sel).first().boundingBox({ timeout: 800 });
        if (box && box.width > 0 && box.width < vp.width / 2) {
          railWidth = Math.round(box.width);
          break;
        }
      } catch {
        // selector not present, try next
      }
    }
  } // else mobile: rail overlays as drawer, content occupies full width

  let topbarHeight = 64;
  for (const sel of topbarSelectors) {
    try {
      const box = await page.locator(sel).first().boundingBox({ timeout: 800 });
      if (box && box.height > 0 && box.height < vp.height / 3) {
        topbarHeight = Math.round(box.height);
        break;
      }
    } catch {
      // selector not present, try next
    }
  }

  return {
    x: railWidth,
    y: topbarHeight,
    width: Math.max(0, vp.width - railWidth),
    height: Math.max(0, vp.height - topbarHeight),
    _rail: railWidth,
    _topbar: topbarHeight,
  };
}

// v2.1.1 — compute the UNION shell crop from both sources. crop_x is the
// MAX of canonical_rail_width and port_rail_width; crop_y is the MAX of
// the two topbar heights. This excludes BOTH shells from the pixel-diff,
// since the SHELL is canonicalized via F19 React (Rule 14) and the
// canonical v2 HTML has its own custom shell at different dims.
function unionShellCrop(canonical, port, vp) {
  // If neither resolves, no crop (fall back to full-image compare).
  if (!canonical && !port) return null;
  const railA = canonical?._rail ?? 0;
  const railB = port?._rail ?? 0;
  const topA = canonical?._topbar ?? 0;
  const topB = port?._topbar ?? 0;
  const railUnion = Math.max(railA, railB);
  const topUnion = Math.max(topA, topB);
  return {
    x: railUnion,
    y: topUnion,
    width: Math.max(0, vp.width - railUnion),
    height: Math.max(0, vp.height - topUnion),
    _rail: railUnion,
    _topbar: topUnion,
    _canonicalRail: railA,
    _portRail: railB,
    _canonicalTopbar: topA,
    _portTopbar: topB,
  };
}

// Clamp a crop rect to safe viewport bounds. sharp.extract() is strict —
// any out-of-bounds value throws. We never want a crash to swallow the
// pixel-diff; clamp instead.
function clampCrop(b, vp) {
  const left = Math.max(0, Math.min(b.x, vp.width - 1));
  const top = Math.max(0, Math.min(b.y, vp.height - 1));
  const width = Math.max(1, Math.min(b.width, vp.width - left));
  const height = Math.max(1, Math.min(b.height, vp.height - top));
  return { left, top, width, height };
}

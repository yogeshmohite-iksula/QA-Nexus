#!/usr/bin/env node
// .claude/skills/frame-port/extract-spec.mjs
//
// frame-port skill — Step 2 of the port workflow.
//
// Reads a canonical v2 HTML file, parses with jsdom, emits a structured
// spec.json that captures the section tree, design tokens used, asset
// references, and the names of the canned-data keys the React port must
// import from `canned-data.ts` (Hard Rule 17, sibling).
//
// Usage:
//   node .claude/skills/frame-port/extract-spec.mjs \
//     --frame F19 \
//     --html "QA Nexus/PM1/PM1_UI_v2/Redesign Frame by claude design/F19 Run Console v2.html" \
//     [--out .claude/skills/frame-port/specs/F19.spec.json]
//
// Output shape:
//   {
//     "frame": "F19",
//     "sourceHtml": "<path>",
//     "extractedAt": "<ISO>",
//     "sections": [{ id, role, classes, tag, children: [...] }, ...],
//     "tokens_used": ["--primary", "--border-strong", ...],
//     "token_definitions": { "--primary": "...", ... },
//     "assets": ["/icons/foo.svg", "data:image/...", ...],
//     "canned_data_keys": {
//       "data_attributes": ["data-case", "data-tone", ...],
//       "heading_exemplars": ["Run Console", "Cluster A · Refund Core", ...],
//       "aria_exemplars": ["Close evidence rail", "Filter runs", ...]
//     }
//   }
//
// (canned_data_keys is OBJECT form, not array. FE+1 cross-references each
// sub-list against the strings FE+1 will import from canned-data.ts.
// Schema-mismatch noted Day-19 polish — docstring previously showed array
// form; code has always emitted object form — see lines 313-316 below.)
//
// NO TSX generation. The spec is the contract that gets shown to Yogesh
// for approval BEFORE FE+1 writes component code. After approval, FE+1
// scaffolds TSX from spec.json + canned-data.ts.
//
// Per Hard Rule 18 (codified Day-18 PM): all frame ports MUST go through
// this skill's workflow. Skipping = visual gate FAIL.

import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { argv, exit } from 'node:process';
import { JSDOM } from 'jsdom';

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

if (!args.frame || !args.html) {
  console.error(
    [
      'extract-spec.mjs — frame-port skill Step 2 (HTML → spec.json)',
      '',
      'Usage:',
      '  node .claude/skills/frame-port/extract-spec.mjs \\',
      '    --frame F19 \\',
      '    --html "<path to v2 HTML>" \\',
      '    [--out .claude/skills/frame-port/specs/F19.spec.json]',
      '',
      'Hard Rule 18 (mandatory): every frame port must run this BEFORE writing component code.',
      '',
    ].join('\n'),
  );
  exit(2);
}

const frameId = String(args.frame).toUpperCase();
const htmlPath = resolve(args.html);
const defaultOut = `.claude/skills/frame-port/specs/${frameId}.spec.json`;
const outPath = resolve(args.out || defaultOut);

if (!existsSync(htmlPath)) {
  console.error(`✗ HTML file not found: ${htmlPath}`);
  exit(1);
}

console.log(`→ extract-spec for ${frameId}`);
console.log(`  source: ${htmlPath}`);
console.log(`  output: ${outPath}`);

// -----------------------------------------------------------------------------
// 2. Parse with jsdom
// -----------------------------------------------------------------------------

const rawHtml = readFileSync(htmlPath, 'utf8');
const dom = new JSDOM(rawHtml);
const doc = dom.window.document;

// -----------------------------------------------------------------------------
// 3. Section tree extraction
// -----------------------------------------------------------------------------

// We treat as "section" anything that's a top-level structural element:
//   <header>, <main>, <aside>, <nav>, <section>, <footer>, <article>, <dialog>
//   + elements with role="region"/"banner"/"complementary"/"navigation"/etc.
//   + elements with class names that look like top-level containers
//     (e.g. `.shell`, `.layout`, `.page`, `.rail`, `.panel`, `.modal`, `.drawer`)
const SECTION_TAGS = new Set([
  'header',
  'main',
  'aside',
  'nav',
  'section',
  'footer',
  'article',
  'dialog',
]);

const STRUCTURAL_ROLES = new Set([
  'region',
  'banner',
  'complementary',
  'navigation',
  'main',
  'contentinfo',
  'dialog',
  'tablist',
  'tabpanel',
  'toolbar',
]);

const STRUCTURAL_CLASS_HINTS = [
  /\bshell\b/,
  /\blayout\b/,
  /\bpage\b/,
  /\brail\b/,
  /\bpanel\b/,
  /\bmodal\b/,
  /\bdrawer\b/,
  /\bsidebar\b/,
  /\bsidenav\b/,
  /\bcontent\b/,
  /\bhero\b/,
  /\bcanvas\b/,
  /\bbody-area\b/,
];

function isSectionLike(node) {
  if (node.nodeType !== 1) return false;
  const tag = node.tagName?.toLowerCase();
  if (SECTION_TAGS.has(tag)) return true;
  const role = node.getAttribute?.('role');
  if (role && STRUCTURAL_ROLES.has(role)) return true;
  const cls = node.getAttribute?.('class') || '';
  if (cls && STRUCTURAL_CLASS_HINTS.some((re) => re.test(cls))) return true;
  return false;
}

function buildSectionTree(node, depth = 0, max = 5) {
  if (!node || node.nodeType !== 1 || depth > max) return null;
  const sectionLike = isSectionLike(node);
  const tag = node.tagName.toLowerCase();
  const id = node.getAttribute('id') || undefined;
  const role = node.getAttribute('role') || undefined;
  const classes =
    (node.getAttribute('class') || '').split(/\s+/).filter(Boolean).slice(0, 8) || undefined; // cap to first 8 classes for readability

  const children = [];
  for (const child of node.children) {
    const sub = buildSectionTree(child, depth + 1, max);
    if (sub) children.push(sub);
  }

  // Skip non-section-like nodes that have no section-like descendants
  if (!sectionLike && children.length === 0) return null;

  return {
    tag,
    ...(id ? { id } : {}),
    ...(role ? { role } : {}),
    ...(classes && classes.length ? { classes } : {}),
    sectionLike,
    children,
  };
}

const root = doc.body || doc.documentElement;
const sectionTree = [];
for (const child of root.children) {
  const sub = buildSectionTree(child);
  if (sub) sectionTree.push(sub);
}

// -----------------------------------------------------------------------------
// 4. Design tokens used (CSS custom properties referenced anywhere)
// -----------------------------------------------------------------------------

// Scan inline <style> blocks + style attributes for `var(--token)` references.
// We DON'T look at external CSS — the v2 HTML files are self-contained design
// references with the token block at the top.
const tokenSet = new Set();
const TOKEN_RE = /var\(\s*(--[a-z][a-z0-9-]*)/gi;

for (const style of doc.querySelectorAll('style')) {
  let m;
  while ((m = TOKEN_RE.exec(style.textContent || '')) !== null) tokenSet.add(m[1]);
}
for (const el of doc.querySelectorAll('[style]')) {
  let m;
  const s = el.getAttribute('style') || '';
  TOKEN_RE.lastIndex = 0;
  while ((m = TOKEN_RE.exec(s)) !== null) tokenSet.add(m[1]);
}

// Also extract the token DEFINITIONS (`--token: value;` in :root, html, etc.)
// — these are what the React port's globals.css must contain.
const DEFINITION_RE = /(--[a-z][a-z0-9-]*)\s*:\s*([^;}\n]+)/gi;
const tokenDefs = {};
for (const style of doc.querySelectorAll('style')) {
  const txt = style.textContent || '';
  let m;
  while ((m = DEFINITION_RE.exec(txt)) !== null) {
    const name = m[1];
    const value = m[2].trim();
    if (!tokenDefs[name]) tokenDefs[name] = value;
  }
}

// -----------------------------------------------------------------------------
// 5. Assets (img src, background-image url, source srcset, link icon)
// -----------------------------------------------------------------------------

const assetSet = new Set();
for (const img of doc.querySelectorAll('img[src]')) assetSet.add(img.getAttribute('src'));
for (const source of doc.querySelectorAll('source[srcset]')) {
  for (const part of (source.getAttribute('srcset') || '').split(',')) {
    const url = part.trim().split(/\s+/)[0];
    if (url) assetSet.add(url);
  }
}
for (const link of doc.querySelectorAll('link[rel*="icon"][href]')) {
  assetSet.add(link.getAttribute('href'));
}

// background-image: url(...) in inline styles + <style> blocks
const BG_URL_RE = /background(?:-image)?\s*:[^;]*url\(\s*['"]?([^'")]+)/gi;
for (const style of doc.querySelectorAll('style')) {
  let m;
  while ((m = BG_URL_RE.exec(style.textContent || '')) !== null) assetSet.add(m[1]);
}
for (const el of doc.querySelectorAll('[style]')) {
  const s = el.getAttribute('style') || '';
  let m;
  BG_URL_RE.lastIndex = 0;
  while ((m = BG_URL_RE.exec(s)) !== null) assetSet.add(m[1]);
}

// -----------------------------------------------------------------------------
// 6. Canned-data keys (cross-reference with canned-data.ts)
// -----------------------------------------------------------------------------

// We surface candidate keys for the React port's canned-data.ts:
//   - Every data-* attribute name (becomes a key category)
//   - Every distinct heading text (h1-h6) capped at 20
//   - Every text node from elements with .id (often labeled "headline" / "title")
//   - Every aria-label
//
// FE+1 organizes these into semantic exports during port work.

const cannedKeys = new Set();

// data-* attribute names
for (const el of doc.querySelectorAll('*')) {
  for (const attr of el.attributes || []) {
    if (attr.name?.startsWith('data-')) cannedKeys.add(attr.name);
  }
}

// Heading exemplars (limit 20)
const headingExemplars = [];
for (const h of doc.querySelectorAll('h1, h2, h3, h4, h5, h6')) {
  const text = (h.textContent || '').replace(/\s+/g, ' ').trim();
  if (text && text.length <= 200) headingExemplars.push(text);
  if (headingExemplars.length >= 20) break;
}

// aria-labels (limit 20)
const ariaExemplars = [];
for (const el of doc.querySelectorAll('[aria-label]')) {
  const text = (el.getAttribute('aria-label') || '').trim();
  if (text && !ariaExemplars.includes(text)) ariaExemplars.push(text);
  if (ariaExemplars.length >= 20) break;
}

// -----------------------------------------------------------------------------
// 7. Render spec.json
// -----------------------------------------------------------------------------

const spec = {
  frame: frameId,
  sourceHtml: htmlPath,
  extractedAt: new Date().toISOString(),
  generator: '.claude/skills/frame-port/extract-spec.mjs',
  sections: sectionTree,
  tokens_used: [...tokenSet].sort(),
  token_definitions: tokenDefs,
  assets: [...assetSet].sort(),
  canned_data_keys: {
    data_attributes: [...cannedKeys].sort(),
    heading_exemplars: headingExemplars,
    aria_exemplars: ariaExemplars,
  },
};

const outDir = dirname(outPath);
if (!existsSync(outDir)) {
  mkdirSync(outDir, { recursive: true });
  console.log(`→ created ${outDir}`);
}
writeFileSync(outPath, JSON.stringify(spec, null, 2) + '\n', 'utf8');

// -----------------------------------------------------------------------------
// 8. Summary
// -----------------------------------------------------------------------------

function countSections(nodes, acc = { total: 0, sectionLike: 0 }) {
  for (const n of nodes) {
    acc.total += 1;
    if (n.sectionLike) acc.sectionLike += 1;
    countSections(n.children, acc);
  }
  return acc;
}

const sectionStats = countSections(sectionTree);

console.log('');
console.log('✓ extracted spec:');
console.log(
  `    sections (total / structural)  ${sectionStats.total} / ${sectionStats.sectionLike}`,
);
console.log(`    tokens used                    ${spec.tokens_used.length}`);
console.log(`    tokens defined in HTML         ${Object.keys(spec.token_definitions).length}`);
console.log(`    assets referenced              ${spec.assets.length}`);
console.log(`    data-* attribute names         ${spec.canned_data_keys.data_attributes.length}`);
console.log(`    heading exemplars              ${spec.canned_data_keys.heading_exemplars.length}`);
console.log(`    aria-label exemplars           ${spec.canned_data_keys.aria_exemplars.length}`);
console.log('');
console.log(`✓ wrote ${outPath}`);
console.log('');
console.log('Next (per frame-port SKILL.md workflow):');
console.log('  Step 3: show this spec.json to Yogesh for approval');
console.log('  Step 4: only after approval, scaffold TSX from spec.json + canned-data.ts');
console.log('  Step 5: run diff-probe.mjs against localhost — gate before visual review');

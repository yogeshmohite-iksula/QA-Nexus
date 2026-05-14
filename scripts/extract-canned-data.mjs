#!/usr/bin/env node
// scripts/extract-canned-data.mjs
//
// Hard Rule 17 enforcement tool — extracts canned data from a canonical v2 HTML
// frame into a TypeScript module the React port consumes verbatim.
//
// Usage:
//   node scripts/extract-canned-data.mjs \
//     --frame F22 \
//     --html "QA Nexus/PM1/PM1_UI_v2/Redesign Frame by claude design/F22 Defect Detail v2.html" \
//     [--out apps/web/components/f22-defect-detail/canned-data.ts]
//
// Output: a TypeScript file with the verbatim text content from the HTML,
// organized into named exports the React port imports from. This script
// extracts everything it can; the FE+1 dev then organizes the output into
// semantically named exports (e.g. CLUSTER_TITLES, DEFECT_IDS, RIGHT_RAIL_LABELS).
//
// Per CLAUDE.md Hard Rule 17:
//   ALL text content in the React port MUST come from canned-data.ts.
//   ANY string in a component file that doesn't trace back to the v2 HTML
//   is a Hard Rule 17 violation → visual gate FAIL.
//
// Pure Node — no npm dependencies. Uses regex + state machine, not a real
// DOM parser. The output is deliberately conservative: it errs on the side
// of extracting too much rather than too little. The dev's job is to
// organize the output into semantic exports.

import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
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

if (!args.frame || !args.html) {
  console.error(
    [
      'extract-canned-data.mjs — Hard Rule 17 extraction tool',
      '',
      'Usage:',
      '  node scripts/extract-canned-data.mjs --frame F22 --html "<path/to/v2.html>" [--out <path>]',
      '',
      'Required:',
      '  --frame   Frame ID, e.g. F22',
      '  --html    Path to the canonical v2 HTML file',
      '',
      'Optional:',
      '  --out     Output TS file path (default: apps/web/components/<frame-slug>/canned-data.ts)',
      '',
    ].join('\n'),
  );
  exit(2);
}

const frameId = String(args.frame).toUpperCase();
const htmlPath = resolve(args.html);
const frameSlug = frameId.toLowerCase();
const defaultOut = `apps/web/components/${frameSlug}/canned-data.ts`;
const outPath = resolve(args.out || defaultOut);

if (!existsSync(htmlPath)) {
  console.error(`✗ HTML file not found: ${htmlPath}`);
  exit(1);
}

console.log(`→ extracting canned data from ${htmlPath}`);
console.log(`→ frame:  ${frameId}`);
console.log(`→ output: ${outPath}`);

// -----------------------------------------------------------------------------
// 2. Read + sanitize the HTML
// -----------------------------------------------------------------------------

const rawHtml = readFileSync(htmlPath, 'utf8');

// Strip <script>, <style>, <!--comments-->. These are NOT user-visible text.
function stripNonContent(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');
}

const html = stripNonContent(rawHtml);

// -----------------------------------------------------------------------------
// 3. Extractors — each returns a labeled array of strings
// -----------------------------------------------------------------------------

const HTML_ENTITIES = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
  '&nbsp;': ' ',
  '&hellip;': '…',
  '&ndash;': '–',
  '&mdash;': '—',
  '&#8211;': '–',
  '&#8212;': '—',
  '&#8230;': '…',
  '&times;': '×',
  '&copy;': '©',
};

function decodeEntities(s) {
  return s
    .replace(/&[a-z]+;|&#\d+;/gi, (m) => HTML_ENTITIES[m.toLowerCase()] ?? m)
    .replace(/\s+/g, ' ')
    .trim();
}

function unique(arr) {
  return [...new Set(arr.filter((x) => x && x.length > 0))];
}

// -----------------------------------------------------------------------------
// 3a. Title
// -----------------------------------------------------------------------------

function extractTitle(h) {
  const m = h.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? decodeEntities(m[1]) : '';
}

// -----------------------------------------------------------------------------
// 3b. Headings (h1..h6)
// -----------------------------------------------------------------------------

function extractHeadings(h) {
  const result = {};
  for (let level = 1; level <= 6; level++) {
    const re = new RegExp(`<h${level}[^>]*>([\\s\\S]*?)<\\/h${level}>`, 'gi');
    const matches = [...h.matchAll(re)].map((m) => decodeEntities(stripTags(m[1])));
    result[`h${level}`] = unique(matches);
  }
  return result;
}

// -----------------------------------------------------------------------------
// 3c. data-* attribute values (often canonical IDs)
// -----------------------------------------------------------------------------

function extractDataAttrs(h) {
  const result = {};
  const re = /data-([a-z][a-z0-9-]*)="([^"]+)"/gi;
  let m;
  while ((m = re.exec(h)) !== null) {
    const key = m[1];
    const value = m[2];
    if (!result[key]) result[key] = [];
    result[key].push(value);
  }
  for (const key of Object.keys(result)) {
    result[key] = unique(result[key]);
  }
  return result;
}

// -----------------------------------------------------------------------------
// 3d. Specific ID patterns (defect / ticket / test case / requirement IDs)
// -----------------------------------------------------------------------------

const ID_PATTERNS = {
  testCaseIds: /\bTC-[A-Z]+-\d{3,5}\b/g,
  defectIds: /\bDEF-\d{3,5}\b/g,
  requirementIds: /\bREQ-\d{3,5}\b/g,
  jiraTicketIds: /\b(?:RET|CART|PAY|AUTH|OPS)-\d{2,6}\b/g,
  importIds: /#\d{2,5}\b/g,
};

function extractIds(h) {
  const result = {};
  for (const [name, re] of Object.entries(ID_PATTERNS)) {
    const matches = [...h.matchAll(re)].map((m) => m[0]);
    result[name] = unique(matches);
  }
  return result;
}

// -----------------------------------------------------------------------------
// 3e. Text content of common content elements
// -----------------------------------------------------------------------------

const TEXT_TAGS = [
  'span',
  'div',
  'p',
  'li',
  'a',
  'button',
  'label',
  'td',
  'th',
  'small',
  'em',
  'strong',
  'b',
  'i',
  'code',
];

function stripTags(s) {
  return s
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTextByTag(h) {
  const result = {};
  for (const tag of TEXT_TAGS) {
    const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
    const matches = [];
    let m;
    while ((m = re.exec(h)) !== null) {
      const text = decodeEntities(stripTags(m[1]));
      if (text && text.length >= 1 && text.length <= 200) {
        matches.push(text);
      }
    }
    result[tag] = unique(matches);
  }
  return result;
}

// -----------------------------------------------------------------------------
// 3f. Image alt text + img src
// -----------------------------------------------------------------------------

function extractImageMeta(h) {
  const altRe = /<img[^>]+\balt="([^"]*)"/gi;
  const srcRe = /<img[^>]+\bsrc="([^"]+)"/gi;
  const alts = unique([...h.matchAll(altRe)].map((m) => decodeEntities(m[1])));
  const srcs = unique([...h.matchAll(srcRe)].map((m) => m[1]));
  return { alts, srcs };
}

// -----------------------------------------------------------------------------
// 3g. Aria-label + title attrs (a11y / tooltip text — often canonical)
// -----------------------------------------------------------------------------

function extractAriaAndTitle(h) {
  const ariaRe = /\baria-label="([^"]+)"/gi;
  const titleRe = /\btitle="([^"]+)"/gi;
  const arias = unique([...h.matchAll(ariaRe)].map((m) => decodeEntities(m[1])));
  const titles = unique([...h.matchAll(titleRe)].map((m) => decodeEntities(m[1])));
  return { arias, titles };
}

// -----------------------------------------------------------------------------
// 4. Run all extractors
// -----------------------------------------------------------------------------

const extracted = {
  pageTitle: extractTitle(html),
  headings: extractHeadings(html),
  dataAttrs: extractDataAttrs(html),
  ids: extractIds(html),
  textByTag: extractTextByTag(html),
  images: extractImageMeta(html),
  ariaAndTitle: extractAriaAndTitle(html),
};

// -----------------------------------------------------------------------------
// 5. Render to TypeScript output
// -----------------------------------------------------------------------------

function tsLiteral(value) {
  if (typeof value === 'string') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    return '[\n' + value.map((v) => `  ${tsLiteral(v)},`).join('\n') + '\n]';
  }
  if (value && typeof value === 'object') {
    const keys = Object.keys(value);
    if (keys.length === 0) return '{}';
    return (
      '{\n' +
      keys
        .map((k) => {
          const safeKey = /^[a-z_$][a-z0-9_$]*$/i.test(k) ? k : JSON.stringify(k);
          return `  ${safeKey}: ${indent(tsLiteral(value[k]))},`;
        })
        .join('\n') +
      '\n}'
    );
  }
  return JSON.stringify(value);
}

function indent(s) {
  return s.split('\n').join('\n  ');
}

function renderOutput(frame, htmlSource, data) {
  const banner = [
    '// Auto-generated by scripts/extract-canned-data.mjs',
    '// Source HTML: ' + htmlSource,
    '// Frame: ' + frame,
    '// Generated: ' + new Date().toISOString(),
    '//',
    '// Hard Rule 17 (CLAUDE.md): ALL text content in the React port for this',
    '// frame MUST come from this file. ANY string in a component file that',
    "// doesn't trace back to the v2 HTML is a Hard Rule 17 violation →",
    '// visual gate FAIL.',
    '//',
    '// This file is intended as a STARTING POINT — the FE+1 dev should',
    '// organize these raw extracts into semantically named exports',
    '// (e.g. DEFECT_TITLES, CLUSTER_HEADINGS, RIGHT_RAIL_LABELS) that the',
    '// React port imports from. Re-run this script to refresh extracts; do',
    "// NOT hand-edit the RAW block (it'll be overwritten).",
    '',
    '/* eslint-disable */',
    '',
  ].join('\n');

  return (
    banner +
    '\n' +
    'export const ' +
    frame +
    '_RAW = ' +
    tsLiteral(data) +
    ' as const;\n' +
    '\n' +
    '/**\n' +
    ' * Page-level metadata extracted from the canonical v2 HTML <title> +\n' +
    ' * the first <h1>. Always safe to import directly.\n' +
    ' */\n' +
    'export const ' +
    frame +
    '_PAGE_TITLE = ' +
    tsLiteral(data.pageTitle || (data.headings.h1[0] ?? '')) +
    ' as const;\n' +
    '\n' +
    '/**\n' +
    ' * Add semantically-named exports below as the React port consumes\n' +
    ' * verbatim text from ' +
    frame +
    '_RAW. Examples:\n' +
    ' *\n' +
    ' *   export const ' +
    frame +
    '_RIGHT_RAIL_LABELS = ' +
    frame +
    '_RAW.textByTag.span.slice(0, 8);\n' +
    ' *   export const ' +
    frame +
    '_DEFECT_IDS = ' +
    frame +
    '_RAW.ids.defectIds;\n' +
    ' *   export const ' +
    frame +
    '_HEADINGS = ' +
    frame +
    '_RAW.headings;\n' +
    ' */\n'
  );
}

// -----------------------------------------------------------------------------
// 6. Write output
// -----------------------------------------------------------------------------

const outDir = dirname(outPath);
if (!existsSync(outDir)) {
  mkdirSync(outDir, { recursive: true });
  console.log(`→ created ${outDir}`);
}

const output = renderOutput(frameId, htmlPath, extracted);
writeFileSync(outPath, output, 'utf8');

// -----------------------------------------------------------------------------
// 7. Summary
// -----------------------------------------------------------------------------

const counts = {
  pageTitle: extracted.pageTitle ? 1 : 0,
  headings: Object.values(extracted.headings).reduce((a, arr) => a + arr.length, 0),
  dataAttrs: Object.keys(extracted.dataAttrs).length,
  idMatches: Object.values(extracted.ids).reduce((a, arr) => a + arr.length, 0),
  textTags: Object.values(extracted.textByTag).reduce((a, arr) => a + arr.length, 0),
  imageAlts: extracted.images.alts.length,
  imageSrcs: extracted.images.srcs.length,
  arias: extracted.ariaAndTitle.arias.length,
  titles: extracted.ariaAndTitle.titles.length,
};

console.log('');
console.log('✓ extracted canned data:');
for (const [k, v] of Object.entries(counts)) {
  console.log(`    ${k.padEnd(12)} ${v}`);
}
console.log('');
console.log(`✓ wrote ${outPath}`);
console.log('');
console.log('Next: import named exports from this file into your React port.');
console.log('      Hard Rule 17 — no string in *.tsx unless it traces here.');

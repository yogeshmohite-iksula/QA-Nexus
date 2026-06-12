#!/usr/bin/env node
// P0-C guard — fails if any non-roster ("fictional") person name appears in
// FE canned-data / component strings. Iksula data canon (CLAUDE.md) is the only
// allowed roster for demo data. Run: node scripts/check-roster-names.mjs
// Wire into CI (lint job) to prevent regression of the Day-32 name scrub.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const BANNED = ['Suresh', 'Priya', 'Ritu', 'Arjun', 'Neha', 'Riya', 'Ravi', 'Meera'];
const ROOT = 'apps/web';
const EXT = /\.(ts|tsx)$/;

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    if (e === 'node_modules' || e === '.next' || e === 'out') continue;
    const p = join(dir, e);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (EXT.test(e)) out.push(p);
  }
  return out;
}

const hits = [];
for (const file of walk(ROOT)) {
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    for (const name of BANNED) {
      if (new RegExp(`\\b${name}\\b`).test(line)) {
        hits.push(`${file}:${i + 1}  ${name}  ${line.trim().slice(0, 80)}`);
      }
    }
  });
}

if (hits.length) {
  console.error(`✗ ${hits.length} non-roster name(s) found (use Iksula canon only — CLAUDE.md):`);
  hits.forEach((h) => console.error('  ' + h));
  process.exit(1);
}
console.log('✓ no non-roster names in apps/web — Iksula canon clean');

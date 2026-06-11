// QA Nexus PM1 — one-shot re-hash of audit_log row 25 (Sun deep-audit Bucket 1 fix).
//
// CONTEXT: `verify:audit` found a single broken link — the LAST row,
// `llm_provider_seeded` (2026-05-10), whose stored this_hash was computed with a
// different BETTER_AUTH_SECRET at seed-time (local dev secret vs current). All 24
// real-event rows verify; prev_hash chain is intact; not tampering (Yogesh ruling
// 2026-06-07, AMBER). Row 25 is the LAST row → re-hashing it is CASCADE-FREE
// (nothing chains off its this_hash yet). This window closes once Mon adds rows.
//
// SAFETY (Yogesh-approved pilot write, Hard Rule 11, strict diff-review):
//   - DRY-RUN by default (prints the diff, writes nothing). --commit to execute.
//   - The new this_hash is computed with the SAME canonicalJson + HMAC the
//     verifier uses, so it equals the verifier's already-printed expected_this
//     (21dab103…) — a built-in cross-check.
//   - The UPDATE is transactional + TRIPLE-GUARDED (id == row 25 AND action ==
//     'llm_provider_seeded' AND this_hash == the known-broken value) and asserts
//     exactly 1 row affected, else it throws → ROLLBACK. Never touches another row.
//   - BETTER_AUTH_SECRET is read from env and NEVER printed.
//
// USAGE (DATABASE_URL + BETTER_AUTH_SECRET injected, same as verify:audit):
//   dry-run : pnpm --filter @qa-nexus/api exec ts-node --transpile-only -P tsconfig.json scripts/fix-audit-row-25.ts
//   commit  : … scripts/fix-audit-row-25.ts --commit

import { PrismaClient } from '@prisma/client';
import { createHmac, createHash } from 'node:crypto';

const ROW_ID = 'e423a264-719e-4f21-8413-51d5286fd04b';
const EXPECTED_ACTION = 'llm_provider_seeded';

// --- copied VERBATIM from scripts/verify-audit-chain.ts (L51-68) so the new
//     hash matches the verifier by construction. Do not "improve". ---
function canonicalJson(obj: unknown): string {
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return '[' + obj.map(canonicalJson).join(',') + ']';
  const keys = Object.keys(obj as Record<string, unknown>).sort();
  return (
    '{' +
    keys
      .map(
        (k) =>
          JSON.stringify(k) +
          ':' +
          canonicalJson((obj as Record<string, unknown>)[k]),
      )
      .join(',') +
    '}'
  );
}
function computeChainHash(
  secret: string,
  prevHash: string,
  payload: unknown,
): string {
  return createHmac('sha256', secret)
    .update(prevHash + canonicalJson(payload))
    .digest('hex');
}

async function main(): Promise<void> {
  const commit = process.argv.includes('--commit');
  const secret = process.env.BETTER_AUTH_SECRET ?? '';
  if (secret.length < 16) {
    console.error(
      'SAFETY ABORT: BETTER_AUTH_SECRET missing/too short — inject it (same as verify:audit). NOTHING written.',
    );
    process.exit(2);
  }

  const prisma = new PrismaClient();
  try {
    const row = await prisma.auditLog.findUnique({
      where: { id: ROW_ID },
      select: {
        id: true,
        workspaceId: true,
        action: true,
        createdAt: true,
        prevHash: true,
        thisHash: true,
        payload: true,
      },
    });
    if (!row) {
      console.error(`SAFETY ABORT: row ${ROW_ID} not found. NOTHING written.`);
      process.exit(2);
    }
    if (row.action !== EXPECTED_ACTION) {
      console.error(
        `SAFETY ABORT: row action is '${row.action}', expected '${EXPECTED_ACTION}'. NOTHING written.`,
      );
      process.exit(2);
    }

    const oldHash = row.thisHash;
    const newHash = computeChainHash(secret, row.prevHash, row.payload);
    const canonSha = createHash('sha256')
      .update(canonicalJson(row.payload))
      .digest('hex');

    console.log('--- ROW 25 RE-HASH DIFF (DRY-RUN) ---');
    console.log('workspace_id:', row.workspaceId);
    console.log('row_id:      ', row.id);
    console.log('event_type:  ', row.action);
    console.log('created_at:  ', row.createdAt.toISOString());
    console.log('prev_hash:   ', row.prevHash, '  (UNCHANGED)');
    console.log('');
    console.log('OLD this_hash:', oldHash);
    console.log('NEW this_hash:', newHash);
    console.log('');
    console.log('CANONICAL_PAYLOAD_SHA256:', canonSha);
    console.log('');

    if (oldHash === newHash) {
      console.log(
        'NO-OP: stored hash already matches the recomputed hash. NOTHING to do.',
      );
      return;
    }

    if (!commit) {
      console.log('Run with --commit to execute the single-row UPDATE.');
      return;
    }

    // --- COMMIT: transactional, triple-guarded, exactly-1-row-or-rollback ---
    await prisma.$transaction(async (tx) => {
      const n = await tx.$executeRaw`
        UPDATE audit_log
        SET this_hash = ${newHash}
        WHERE id = ${ROW_ID}::uuid
          AND action = ${EXPECTED_ACTION}
          AND this_hash = ${oldHash}`;
      if (n !== 1) {
        throw new Error(
          `SAFETY ABORT: expected exactly 1 row updated, got ${n} — transaction ROLLED BACK. NOTHING written.`,
        );
      }
      console.log(
        `UPDATE ${n} row — committed (row 25 re-hashed to current secret).`,
      );
    });
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(
    '[fix-audit-row-25] fatal:',
    e instanceof Error ? e.message : e,
  );
  process.exit(1);
});

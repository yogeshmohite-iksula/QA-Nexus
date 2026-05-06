// QA Nexus PM1 — audit_log HMAC-SHA256 chain verifier (M1 close-gate prep).
//
// Reads every row from `audit_log` and validates the chain link by link.
//
// Chain rules (from apps/api/src/audit/audit-helper.ts — the kernel):
//   - genesis prev_hash = '0' * 64
//   - this_hash = HMAC_SHA256(BETTER_AUTH_SECRET, prev_hash || canonical(payload))
//   - chain is PER-WORKSPACE (rows ordered by created_at within a workspace)
//   - canonical JSON keys sorted alphabetically + values JSON.stringify'd
//
// Output:
//   - "CHAIN OK — N rows valid" + exit 0  on success
//   - "CHAIN BROKEN at row #X" + debug context + exit 1  on failure
//
// MAIN runs this during the Wed 6 May M1 close ceremony. Two invocations:
//
//   # Inside apps/api (ts-node + DATABASE_URL from .env auto-loaded by Prisma)
//   $ pnpm --filter @qa-nexus/api exec ts-node --transpile-only ../../scripts/verify-audit-chain.ts
//
//   # Direct (any cwd, must set DATABASE_URL + BETTER_AUTH_SECRET in env)
//   $ DATABASE_URL=postgresql://… BETTER_AUTH_SECRET=… \
//       pnpm --filter @qa-nexus/api exec ts-node --transpile-only $(pwd)/scripts/verify-audit-chain.ts
//
// Optional flags:
//   --workspace <uuid>   limit verification to a single workspace
//   --since <ISO-8601>   only verify rows since this timestamp
//   --quiet              suppress per-workspace progress output
//   --json               emit machine-readable result on stdout
//   --summary            ALSO print M2 audit-action coverage table
//                        (row count + last-seen-at per known M2 action)
//                        — used by docs/milestones/m2-close-report-template.md §5.2
//
// Exit codes:
//   0 = chain OK (or no rows found)
//   1 = chain broken (one or more rows fail HMAC check)
//   2 = misconfiguration (missing env, can't reach DB, etc.)
//
// M2 close-prep extension (Day-11 TASK 6):
//   The --summary flag emits a per-action coverage table covering
//   every audit action introduced by M2 (KB chunking, embedding,
//   orchestration, search, RAG answer, document delete). MAIN runs
//   `pnpm verify:audit --summary` during the Sat 9 May M2 close
//   ceremony to confirm every M2 endpoint actually wrote audit rows
//   (zero rows on a critical action = sweep gap, not a feature gap).

import { PrismaClient } from '@prisma/client';
import { createHmac } from 'node:crypto';

const GENESIS_HASH = '0'.repeat(64);

function canonicalJson(obj: unknown): string {
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return '[' + obj.map(canonicalJson).join(',') + ']';
  const keys = Object.keys(obj as Record<string, unknown>).sort();
  return (
    '{' +
    keys
      .map((k) => JSON.stringify(k) + ':' + canonicalJson((obj as Record<string, unknown>)[k]))
      .join(',') +
    '}'
  );
}

function computeChainHash(secret: string, prevHash: string, payload: unknown): string {
  return createHmac('sha256', secret)
    .update(prevHash + canonicalJson(payload))
    .digest('hex');
}

interface CliFlags {
  workspaceId: string | null;
  since: Date | null;
  quiet: boolean;
  json: boolean;
  summary: boolean;
}

function parseFlags(argv: string[]): CliFlags {
  const flags: CliFlags = {
    workspaceId: null,
    since: null,
    quiet: false,
    json: false,
    summary: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--workspace' || arg === '-w') {
      flags.workspaceId = argv[++i] ?? null;
    } else if (arg === '--since' || arg === '-s') {
      const val = argv[++i] ?? '';
      const parsed = new Date(val);
      if (Number.isNaN(parsed.getTime())) {
        console.error(`✗ invalid --since value: "${val}" (expected ISO-8601)`);
        process.exit(2);
      }
      flags.since = parsed;
    } else if (arg === '--quiet' || arg === '-q') {
      flags.quiet = true;
    } else if (arg === '--json') {
      flags.json = true;
    } else if (arg === '--summary') {
      flags.summary = true;
    } else if (arg === '--help' || arg === '-h') {
      printUsage();
      process.exit(0);
    } else {
      console.error(`✗ unknown flag: "${arg}"`);
      printUsage();
      process.exit(2);
    }
  }
  return flags;
}

function printUsage(): void {
  console.error(
    [
      'Usage:',
      '  pnpm --filter @qa-nexus/api verify:audit [flags]',
      '  (or directly: ts-node --transpile-only --compiler-options ',
      '   \'{"module":"commonjs","moduleResolution":"node"}\' scripts/verify-audit-chain.ts)',
      '',
      'Flags:',
      '  --workspace <uuid>   limit verification to a single workspace',
      '  --since <ISO-8601>   only verify rows created at/after this timestamp',
      '  --quiet              suppress per-workspace progress output',
      '  --json               emit machine-readable result on stdout',
      '  --summary            ALSO print M2 audit-action coverage table',
      '                       (row count + last-seen-at per known M2 action)',
      '  --help               show this message',
      '',
      'Environment:',
      '  DATABASE_URL          required — Postgres connection string',
      '  BETTER_AUTH_SECRET    required — HMAC key for chain hashes',
    ].join('\n'),
  );
}

interface VerifyResult {
  totalRows: number;
  workspacesChecked: number;
  ok: boolean;
  // First broken-link metadata (null if chain OK):
  firstBreak: {
    workspaceId: string;
    rowId: string;
    rowIndexInWorkspace: number;
    expectedPrevHash: string;
    actualPrevHash: string;
    expectedThisHash: string;
    actualThisHash: string;
    action: string;
    createdAt: string;
  } | null;
}

async function verifyChain(
  prisma: PrismaClient,
  secret: string,
  flags: CliFlags,
): Promise<VerifyResult> {
  // Discover workspaces. Either constrain to one if --workspace, OR
  // sweep all workspaces that have at least one audit row.
  const workspaces = flags.workspaceId
    ? [{ id: flags.workspaceId }]
    : await prisma.auditLog
        .groupBy({
          by: ['workspaceId'],
          where: flags.since ? { createdAt: { gte: flags.since } } : undefined,
        })
        .then((groups) => groups.map((g) => ({ id: g.workspaceId })));

  const result: VerifyResult = {
    totalRows: 0,
    workspacesChecked: 0,
    ok: true,
    firstBreak: null,
  };

  for (const ws of workspaces) {
    if (!flags.quiet && !flags.json) {
      process.stderr.write(`Verifying workspace ${ws.id} … `);
    }

    // Fetch rows in the SAME order writes happened — by createdAt asc,
    // which matches audit-helper.ts's per-workspace serialization via
    // pg_advisory_xact_lock + findFirst-orderBy-desc.
    const rows = await prisma.auditLog.findMany({
      where: {
        workspaceId: ws.id,
        ...(flags.since ? { createdAt: { gte: flags.since } } : {}),
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        action: true,
        payload: true,
        prevHash: true,
        thisHash: true,
        createdAt: true,
      },
    });

    let prev = GENESIS_HASH;
    let i = 0;
    for (const row of rows) {
      // Edge case: --since slices into the middle of a workspace's chain.
      // The first row's prev_hash will reference a row we haven't loaded.
      // In that case, accept whatever prev_hash the row carries as the
      // baseline (we trust it locally since we can't recompute prior
      // links without the prior payloads).
      if (i === 0 && flags.since) {
        prev = row.prevHash;
      }

      const expectedHash = computeChainHash(secret, prev, row.payload);

      if (row.prevHash !== prev) {
        result.ok = false;
        result.firstBreak = {
          workspaceId: ws.id,
          rowId: row.id,
          rowIndexInWorkspace: i,
          expectedPrevHash: prev,
          actualPrevHash: row.prevHash,
          expectedThisHash: expectedHash,
          actualThisHash: row.thisHash,
          action: row.action,
          createdAt: row.createdAt.toISOString(),
        };
        if (!flags.quiet && !flags.json) {
          process.stderr.write('FAILED (prev_hash mismatch)\n');
        }
        return result;
      }

      if (row.thisHash !== expectedHash) {
        result.ok = false;
        result.firstBreak = {
          workspaceId: ws.id,
          rowId: row.id,
          rowIndexInWorkspace: i,
          expectedPrevHash: prev,
          actualPrevHash: row.prevHash,
          expectedThisHash: expectedHash,
          actualThisHash: row.thisHash,
          action: row.action,
          createdAt: row.createdAt.toISOString(),
        };
        if (!flags.quiet && !flags.json) {
          process.stderr.write('FAILED (this_hash mismatch — payload tampered)\n');
        }
        return result;
      }

      prev = row.thisHash;
      i++;
    }

    if (!flags.quiet && !flags.json) {
      process.stderr.write(`OK (${rows.length} rows)\n`);
    }

    result.totalRows += rows.length;
    result.workspacesChecked += 1;
  }

  return result;
}

function printResult(result: VerifyResult, flags: CliFlags): void {
  if (flags.json) {
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    return;
  }

  if (result.ok) {
    process.stderr.write(
      `\n✓ CHAIN OK — ${result.totalRows} rows verified across ` +
        `${result.workspacesChecked} workspace(s).\n`,
    );
    return;
  }

  const b = result.firstBreak!;
  process.stderr.write(
    [
      '',
      '✗ CHAIN BROKEN — first break details:',
      `  workspace_id   : ${b.workspaceId}`,
      `  row_id         : ${b.rowId}`,
      `  row_index      : ${b.rowIndexInWorkspace} (within workspace)`,
      `  action         : ${b.action}`,
      `  created_at     : ${b.createdAt}`,
      `  expected_prev  : ${b.expectedPrevHash}`,
      `  actual_prev    : ${b.actualPrevHash}`,
      `  expected_this  : ${b.expectedThisHash}`,
      `  actual_this    : ${b.actualThisHash}`,
      '',
      'Diagnosis:',
      b.expectedPrevHash !== b.actualPrevHash
        ? '  → prev_hash mismatch: row was inserted out of order, OR a' +
          '\n    prior row was deleted/edited (audit_log triggers should' +
          '\n    have prevented this — check trigger health).'
        : '  → this_hash mismatch: row PAYLOAD was tampered after insert.' +
          '\n    The HMAC secret + prev_hash unchanged but the payload' +
          '\n    changed (compare against the audit_log_archive snapshot' +
          '\n    OR Render Postgres binary backup if available).',
      '',
    ].join('\n'),
  );
}

// ─────────────────────────────────────────────────────────────────────
// M2 close-prep coverage table (Day-11 TASK 6 extension).
// Lists every audit action introduced across M2 endpoints. Zero rows
// on a critical action during the M2 close ceremony = sweep gap, not a
// feature gap — MAIN should chase the FE/QA loop before signing M2 off.
//
// Grouped by feature pillar so MAIN can read the table top-to-bottom
// during ceremony and tick each pillar.
// ─────────────────────────────────────────────────────────────────────

interface ActionCoverage {
  pillar: string;
  action: string;
  rowCount: number;
  lastSeenAt: string | null; // ISO-8601, null = no rows ever
  workspacesTouched: number;
}

const M2_ACTIONS: Array<{ pillar: string; action: string }> = [
  // Step 5 — chunking service
  { pillar: 'KB chunking', action: 'kb_chunks_generated' },
  // Step 6 — embedding service
  { pillar: 'KB embedding', action: 'kb_chunks_embedded' },
  // Step 7 — upload-completion orchestrator
  { pillar: 'Upload orchestrator', action: 'kb_document_orchestration_started' },
  { pillar: 'Upload orchestrator', action: 'kb_document_orchestration_completed' },
  { pillar: 'Upload orchestrator', action: 'kb_document_orchestration_failed' },
  // Step 8 (Day-11 TASK 2) — chunk search
  { pillar: 'KB search', action: 'kb_search_performed' },
  { pillar: 'KB search', action: 'kb_search_failed' },
  // Day-11 TASK 3 — RAG answer pipeline
  { pillar: 'KB RAG answer', action: 'kb_answer_generated' },
  { pillar: 'KB RAG answer', action: 'kb_answer_failed' },
  // Day-11 TASK 4 — KB document CRUD
  { pillar: 'KB document CRUD', action: 'kb_document_deleted' },
  { pillar: 'KB document CRUD', action: 'kb_document_delete_failed' },
];

async function collectM2Coverage(prisma: PrismaClient, flags: CliFlags): Promise<ActionCoverage[]> {
  const where = {
    ...(flags.workspaceId ? { workspaceId: flags.workspaceId } : {}),
    ...(flags.since ? { createdAt: { gte: flags.since } } : {}),
  };

  const out: ActionCoverage[] = [];
  for (const { pillar, action } of M2_ACTIONS) {
    const rows = await prisma.auditLog.findMany({
      where: { ...where, action },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true, workspaceId: true },
    });
    const wsSet = new Set(rows.map((r) => r.workspaceId));
    out.push({
      pillar,
      action,
      rowCount: rows.length,
      lastSeenAt: rows[0]?.createdAt.toISOString() ?? null,
      workspacesTouched: wsSet.size,
    });
  }
  return out;
}

function printM2Coverage(coverage: ActionCoverage[], flags: CliFlags): void {
  if (flags.json) {
    process.stdout.write(JSON.stringify({ m2Coverage: coverage }, null, 2) + '\n');
    return;
  }

  process.stderr.write('\n── M2 audit-action coverage ──\n');
  process.stderr.write(
    'pillar                   | action                              |  rows | workspaces | last seen\n',
  );
  process.stderr.write(
    '-------------------------+-------------------------------------+-------+------------+--------------------------\n',
  );
  let gapCount = 0;
  for (const c of coverage) {
    const isGap = c.rowCount === 0;
    if (isGap) gapCount += 1;
    const rowLabel = isGap ? '   0!' : c.rowCount.toString().padStart(5);
    const lastSeen = c.lastSeenAt ?? '— (never written)';
    process.stderr.write(
      `${c.pillar.padEnd(24)} | ${c.action.padEnd(35)} | ${rowLabel} | ${c.workspacesTouched.toString().padStart(10)} | ${lastSeen}\n`,
    );
  }
  if (gapCount > 0) {
    process.stderr.write(
      `\n⚠ ${gapCount} M2 action(s) have ZERO rows — investigate before signing M2 off.\n`,
    );
  } else {
    process.stderr.write('\n✓ Every M2 audit action has at least one row.\n');
  }
}

async function main(): Promise<void> {
  const flags = parseFlags(process.argv);

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('✗ DATABASE_URL not set — cannot connect to Postgres.');
    process.exit(2);
  }
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret || secret.length < 32) {
    console.error('✗ BETTER_AUTH_SECRET missing or < 32 chars — cannot recompute HMAC.');
    process.exit(2);
  }

  const prisma = new PrismaClient();
  try {
    const result = await verifyChain(prisma, secret, flags);
    printResult(result, flags);

    if (flags.summary) {
      const coverage = await collectM2Coverage(prisma, flags);
      printM2Coverage(coverage, flags);
    }

    process.exit(result.ok ? 0 : 1);
  } catch (err) {
    console.error('✗ verifier crashed:', err instanceof Error ? err.message : String(err));
    process.exit(2);
  } finally {
    await prisma.$disconnect();
  }
}

void main();

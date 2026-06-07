#!/usr/bin/env ts-node
// QA Nexus PM1 — Iksula pilot DATA seed (Sun pre-MVP, Bucket 5C).
// =============================================================================
// Populates the PILOT DB with the demo QA dataset that prisma/seed.ts explicitly
// deferred (lines 11-14: "Sample projects / requirements / test cases — wait for
// MS0-T032 A1/A2/A4 golden-set seed"). That deferred seed was never built; this
// is it. The pilot already has workspace "Iksula" + 8 users — this attaches the
// QA content to those existing rows.
//
// RATIFIED SCOPE (Yogesh, 2026-06-07, all forks = (a)):
//   Q1(a) Defects: transform the Sherlock-RCA golden-set JSONs (real TC-RET linkage)
//   Q2(a) Projects: RET POPULATED + CART/PAY/AUTH/OPS as EMPTY SHELLS (F09 canon)
//   Q3(a) Counts: representative (~30 reqs / ~50 TCs / ~5 suites / ~15-30 defects);
//         expand to full canon (142/1284/67) on Day-29.
//
// USAGE:
//   pnpm --filter @qa-nexus/api seed:pilot            # DRY-RUN (default) — 0 writes
//   pnpm --filter @qa-nexus/api seed:pilot -- --commit  # real writes (needs Yogesh "GO seed")
//
// SAFETY (Hard Rule 11 + "Neon pilot data is sacred"):
//   - DRY-RUN is the DEFAULT. Nothing is written unless --commit is passed.
//   - --commit refuses unless: BETTER_AUTH_SECRET ≥32 chars (audit chain) AND the
//     workspace "Iksula" + ≥8 users already exist (proves we're pointed at the pilot,
//     not an empty/wrong DB). We attach to those users; we never create users here.
//   - Idempotent: every entity is create-if-absent on its unique key. Re-running =
//     zero new rows = zero new audit rows = chain hash unchanged.
//   - Audit: each NEW primary entity (project/requirement/test_case/test_suite/defect)
//     writes ONE audit_log row via writeAuditRow() with the CURRENT BETTER_AUTH_SECRET,
//     so the HMAC chain stays GREEN (no row-25-style seed-time secret drift). Audit is
//     written ONLY on create (never on the existing-row path) → idempotent.
//   - The audit row for a seeded entity uses action "<entity>.seeded" (honest: this is
//     seed provenance, NOT a user action) with payload.seededBy = this script.
//
// EMBEDDINGS: TestCase.embedding is Unsupported("vector(384)") — Prisma cannot write it.
//   Seeded test cases have NULL embedding; pgvector similarity search returns 0 rows for
//   them until a separate raw-SQL backfill (mirror populate-embeddings.ts). NOT needed for
//   F09 / F14 / F16 list views, F27 users, F28 audit, or F26 agents. Documented, not faked.
// =============================================================================

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  PrismaClient,
  Priority,
  RequirementStatus,
  RequirementSource,
  TestCaseStatus,
  TestSuiteStatus,
  DefectStatus,
} from '@prisma/client';
import { writeAuditRow } from '../src/audit/audit-helper';

const COMMIT = process.argv.includes('--commit');
const SECRET = process.env.BETTER_AUTH_SECRET ?? '';
const DB_URL = process.env.DATABASE_URL ?? '';
const GOLDEN_DIR = join(__dirname, '..', 'test', 'golden-sets', 'sherlock-rca');

// ── Iksula data canon (CLAUDE.md "Iksula data canon" — verbatim) ──────────────
const WORKSPACE_NAME = 'Iksula';
const EMAIL = {
  akshay: 'akshay.panchal@iksula.com',
  yogesh: 'yogesh.mohite@iksula.com',
  kishor: 'kishor.kadam@iksula.com',
  nitin: 'nitin.gomle@iksula.com',
  nadim: 'nadim.siddiqui@iksula.com',
  govind: 'govind.daware@iksula.com',
  mohanraj: 'mohanraj.k@iksula.com',
  sagar: 'sagar.todankar@iksula.com',
} as const;
const QA_ENGINEERS = [
  EMAIL.kishor,
  EMAIL.nitin,
  EMAIL.nadim,
  EMAIL.govind,
  EMAIL.mohanraj,
  EMAIL.sagar,
];
const SUITE_OWNERS = [
  EMAIL.akshay,
  EMAIL.kishor,
  EMAIL.nitin,
  EMAIL.nadim,
  EMAIL.govind,
];

// 5 projects: RET populated, the other 4 empty shells (Q2a). NOTE: the schema
// Project model has NO branch/status column — F09's "main / staging amber" is
// display-only canned data, not a DB field. Shells = key + name + description only.
interface ProjectDef {
  key: string;
  name: string;
  description: string;
  populated: boolean;
  createdBy: string;
}
const PROJECTS: ProjectDef[] = [
  {
    key: 'RET',
    name: 'Iksula Returns',
    description:
      'Returns, refunds and reverse-logistics for Iksula — anchor pilot project (Sprint 42, release R-2026-04-PaymentV2).',
    populated: true,
    createdBy: EMAIL.akshay,
  },
  {
    key: 'CART',
    name: 'Iksula Commerce',
    description: 'Storefront, cart and checkout.',
    populated: false,
    createdBy: EMAIL.yogesh,
  },
  {
    key: 'PAY',
    name: 'Iksula Payments',
    description: 'Payment gateway and settlement.',
    populated: false,
    createdBy: EMAIL.yogesh,
  },
  {
    key: 'AUTH',
    name: 'Iksula Mobile App',
    description: 'Customer mobile app (auth + account).',
    populated: false,
    createdBy: EMAIL.yogesh,
  },
  {
    key: 'OPS',
    name: 'Iksula Internal Ops',
    description: 'Internal operations and tooling.',
    populated: false,
    createdBy: EMAIL.yogesh,
  },
];

// ~30 RET requirements (Returns domain, Sprint 42 mix). source=jira, sourceRef=key.
interface ReqDef {
  key: string;
  title: string;
  description: string;
  priority: Priority;
  status: RequirementStatus;
}
const P = Priority;
const RS = RequirementStatus;
const REQUIREMENTS: ReqDef[] = [
  {
    key: 'RET-001',
    title: 'Return eligibility window enforcement (30-day)',
    description:
      'Customers can request a return only within 30 days of delivery; expired orders are blocked with a clear reason.',
    priority: P.P1,
    status: RS.done,
  },
  {
    key: 'RET-002',
    title: 'Initiate return from order history',
    description:
      'A customer can start a return for any eligible line item directly from the order-history screen.',
    priority: P.P1,
    status: RS.done,
  },
  {
    key: 'RET-003',
    title: 'Generate RMA number on return request',
    description:
      'Every accepted return request produces a unique RMA number used across pickup, refund and reconciliation.',
    priority: P.P2,
    status: RS.active,
  },
  {
    key: 'RET-004',
    title: 'Refund to original payment method',
    description:
      'Approved refunds are issued back to the original tender (card / UPI / wallet) used at purchase.',
    priority: P.P0,
    status: RS.active,
  },
  {
    key: 'RET-005',
    title: 'Split-tender refund allocation (gift card + card)',
    description:
      'When an order was paid with multiple tenders, the refund is allocated proportionally to each tender without precision loss.',
    priority: P.P0,
    status: RS.active,
  },
  {
    key: 'RET-006',
    title: 'Partial return refund calculation',
    description:
      'Returning a subset of an order refunds exactly the returned-item subtotal plus proportional tax and shipping.',
    priority: P.P1,
    status: RS.active,
  },
  {
    key: 'RET-007',
    title: 'Restocking fee for opened items',
    description:
      'A configurable restocking fee is deducted from the refund for items returned opened or used.',
    priority: P.P2,
    status: RS.active,
  },
  {
    key: 'RET-008',
    title: 'Return shipping label generation',
    description:
      'A prepaid return shipping label is generated and emailed when a pickup is not selected.',
    priority: P.P2,
    status: RS.active,
  },
  {
    key: 'RET-009',
    title: 'Prepaid return label cost deduction',
    description:
      'When the customer opts for a prepaid label, its cost is deducted from the refund per policy.',
    priority: P.P3,
    status: RS.draft,
  },
  {
    key: 'RET-010',
    title: 'Gift-card-only refund path',
    description:
      'Orders paid entirely by gift card refund back to a gift card balance, not to a bank tender.',
    priority: P.P1,
    status: RS.active,
  },
  {
    key: 'RET-011',
    title: 'Return pickup scheduling (reverse logistics)',
    description:
      'A customer can schedule a doorstep pickup slot; the courier partner is notified with the RMA.',
    priority: P.P2,
    status: RS.active,
  },
  {
    key: 'RET-012',
    title: 'Exchange instead of refund',
    description:
      'Eligible returns can be converted to a same-value exchange rather than a monetary refund.',
    priority: P.P2,
    status: RS.draft,
  },
  {
    key: 'RET-013',
    title: 'Return fraud risk scoring',
    description:
      'Each return is scored for fraud (serial returner, high-value, address mismatch) and high-risk requests are held for manual review.',
    priority: P.P1,
    status: RS.active,
  },
  {
    key: 'RET-014',
    title: 'Bulk return for multi-item orders',
    description:
      'A customer can return multiple items from one order in a single request with one RMA.',
    priority: P.P2,
    status: RS.active,
  },
  {
    key: 'RET-015',
    title: 'Return status notifications (email)',
    description:
      'Customers receive email updates at request, pickup, received and refunded stages.',
    priority: P.P3,
    status: RS.active,
  },
  {
    key: 'RET-016',
    title: 'Refund SLA tracking (5 business days)',
    description:
      'Refund completion is tracked against a 5-business-day SLA and breaches are surfaced to ops.',
    priority: P.P1,
    status: RS.active,
  },
  {
    key: 'RET-017',
    title: 'Damaged-on-arrival instant refund',
    description:
      'Items reported damaged-on-arrival with evidence qualify for an instant refund without return shipment.',
    priority: P.P1,
    status: RS.active,
  },
  {
    key: 'RET-018',
    title: 'Non-returnable item rejection',
    description:
      'Items flagged non-returnable (innerwear, perishables, final-sale) are rejected at request time.',
    priority: P.P2,
    status: RS.done,
  },
  {
    key: 'RET-019',
    title: 'Return window extension for festive season',
    description:
      'Configurable extended return window applies to orders placed during festive campaigns.',
    priority: P.P3,
    status: RS.draft,
  },
  {
    key: 'RET-020',
    title: 'COD order refund to bank / UPI',
    description:
      'Cash-on-delivery orders refund to a customer-provided bank account or UPI handle after verification.',
    priority: P.P0,
    status: RS.active,
  },
  {
    key: 'RET-021',
    title: 'Refund reversal on failed pickup',
    description:
      'If a scheduled pickup fails after a provisional refund, the refund is reversed and the customer notified.',
    priority: P.P1,
    status: RS.active,
  },
  {
    key: 'RET-022',
    title: 'Return reason code capture',
    description:
      'Customers select a structured reason code which drives analytics and RTV routing.',
    priority: P.P3,
    status: RS.done,
  },
  {
    key: 'RET-023',
    title: 'Store-credit refund option',
    description:
      'Customers can opt to receive store credit (with a bonus) instead of a tender refund.',
    priority: P.P2,
    status: RS.draft,
  },
  {
    key: 'RET-024',
    title: 'Refund tax recalculation',
    description:
      'Refund amounts recompute GST/tax correctly for partial and discounted-line returns.',
    priority: P.P1,
    status: RS.active,
  },
  {
    key: 'RET-025',
    title: 'Price-protection partial refund',
    description:
      'When an item drops in price within the protection window, the difference is refunded.',
    priority: P.P2,
    status: RS.draft,
  },
  {
    key: 'RET-026',
    title: 'Return-to-vendor (RTV) routing',
    description:
      'Received returns are routed to RTV or restock based on condition and reason code.',
    priority: P.P3,
    status: RS.active,
  },
  {
    key: 'RET-027',
    title: 'Refund webhook to PaymentV2 gateway',
    description:
      'On refund approval, an idempotent webhook notifies the PaymentV2 gateway and awaits a settlement ack.',
    priority: P.P0,
    status: RS.active,
  },
  {
    key: 'RET-028',
    title: 'Idempotent refund on duplicate submit',
    description:
      'Duplicate refund submissions for the same RMA must not double-refund; the second call is a safe no-op.',
    priority: P.P0,
    status: RS.active,
  },
  {
    key: 'RET-029',
    title: 'Refund audit trail + reconciliation',
    description:
      'Every refund records an immutable audit entry reconciled nightly against gateway settlements.',
    priority: P.P1,
    status: RS.active,
  },
  {
    key: 'RET-030',
    title: 'Self-service return cancellation',
    description:
      'A customer can cancel a return request before pickup; any provisional hold is released.',
    priority: P.P2,
    status: RS.draft,
  },
];

// 5 RET test suites.
const SUITES: { name: string; description: string }[] = [
  {
    name: 'Returns Regression Suite',
    description: 'Core returns happy-path regression run every release.',
  },
  {
    name: 'Refund Edge Cases',
    description:
      'Split-tender, partial, COD, gift-card and precision refund scenarios.',
  },
  {
    name: 'Return Eligibility & Policy',
    description: 'Window, non-returnable, fraud and policy-enforcement checks.',
  },
  {
    name: 'Payment V2 Confirmation',
    description:
      'Refund webhook + gateway reconciliation for the PaymentV2 release.',
  },
  {
    name: 'Returns Smoke',
    description: 'Fast pre-deploy smoke across the critical returns flows.',
  },
];

// ~15 fresh RET test cases (top-up above the mined golden set). Keys TC-RET-10xx
// are deliberately above the golden-set numeric range → zero key collisions.
const FRESH_TCS: { key: string; title: string; expectedResult: string }[] = [
  {
    key: 'TC-RET-1001',
    title: 'Return blocked after 30-day window',
    expectedResult: 'Return request rejected with "window expired" reason.',
  },
  {
    key: 'TC-RET-1002',
    title: 'Initiate return for a single eligible line item',
    expectedResult:
      'Return draft created with correct item and RMA placeholder.',
  },
  {
    key: 'TC-RET-1003',
    title: 'RMA number is unique per accepted return',
    expectedResult: 'A unique RMA is generated and stored on the request.',
  },
  {
    key: 'TC-RET-1004',
    title: 'Full refund to original card tender',
    expectedResult: 'Refund equals order total and targets the original card.',
  },
  {
    key: 'TC-RET-1005',
    title: 'Restocking fee deducted for opened item',
    expectedResult:
      'Refund equals item price minus the configured restocking fee.',
  },
  {
    key: 'TC-RET-1006',
    title: 'Prepaid return label emailed to customer',
    expectedResult: 'A valid prepaid label PDF is generated and emailed.',
  },
  {
    key: 'TC-RET-1007',
    title: 'Gift-card order refunds to gift-card balance',
    expectedResult: 'Refund credits the gift-card balance, not a bank tender.',
  },
  {
    key: 'TC-RET-1008',
    title: 'Pickup slot booked and courier notified',
    expectedResult: 'Pickup is scheduled and the courier receives the RMA.',
  },
  {
    key: 'TC-RET-1009',
    title: 'High-risk return held for manual review',
    expectedResult: 'A high fraud score routes the return to manual review.',
  },
  {
    key: 'TC-RET-1010',
    title: 'Bulk return of three items under one RMA',
    expectedResult: 'All three items are grouped under a single RMA.',
  },
  {
    key: 'TC-RET-1011',
    title: 'Refund SLA breach surfaced to ops',
    expectedResult:
      'A refund older than 5 business days is flagged as breached.',
  },
  {
    key: 'TC-RET-1012',
    title: 'Damaged-on-arrival instant refund with evidence',
    expectedResult: 'Instant refund issued without requiring return shipment.',
  },
  {
    key: 'TC-RET-1013',
    title: 'Non-returnable item rejected at request',
    expectedResult: 'A final-sale item is rejected before draft creation.',
  },
  {
    key: 'TC-RET-1014',
    title: 'COD refund to verified UPI handle',
    expectedResult: 'Refund posts to the verified UPI handle after checks.',
  },
  {
    key: 'TC-RET-1015',
    title: 'Store-credit refund applies bonus',
    expectedResult:
      'Store-credit option credits item value plus the configured bonus.',
  },
];

// ── Golden-set transform types ────────────────────────────────────────────────
interface GoldenInput {
  testCaseId: string;
  testCaseTitle: string;
  stepLabel?: string;
  environment?: string;
  errorMessage?: string;
}
interface GoldenGroundTruth {
  rootCauseCategory?: string;
  rootCauseDetail?: string;
  confidence?: string;
}
interface GoldenDefect {
  id: string;
  input: GoldenInput;
  groundTruth: GoldenGroundTruth;
}

function loadGolden(): GoldenDefect[] {
  const files = readdirSync(GOLDEN_DIR)
    .filter((f) => /^def-\d+\.json$/.test(f))
    .sort();
  return files.map(
    (f) =>
      JSON.parse(readFileSync(join(GOLDEN_DIR, f), 'utf8')) as GoldenDefect,
  );
}

function deriveExpected(stepLabel: string | undefined): string {
  if (!stepLabel)
    return 'Operation completes successfully per acceptance criteria.';
  const m = stepLabel.split(/\s[—-]\s|expect/i);
  const tail = m.length > 1 ? m[m.length - 1].trim() : stepLabel.trim();
  return tail.charAt(0).toUpperCase() + tail.slice(1);
}

function mapSeverity(
  cat: string | undefined,
  confidence: string | undefined,
): Priority {
  switch (cat) {
    case 'payment-gateway':
    case 'race-condition':
      return Priority.P0;
    case 'code-bug':
      return confidence === 'high' ? Priority.P0 : Priority.P1;
    case 'data-bug':
    case 'auth-permissions':
      return Priority.P1;
    case 'env-config':
    case 'ui-regression':
      return Priority.P2;
    default:
      return Priority.P3;
  }
}

function deriveComponent(cat: string | undefined): string {
  switch (cat) {
    case 'payment-gateway':
      return 'payments-gateway';
    case 'auth-permissions':
      return 'auth';
    case 'ui-regression':
      return 'returns-ui';
    case 'env-config':
      return 'environment';
    case 'data-bug':
      return 'returns-data';
    default:
      return 'refund-service';
  }
}

const DEFECT_STATUS_CYCLE: DefectStatus[] = [
  DefectStatus.new,
  DefectStatus.triaged,
  DefectStatus.in_progress,
  DefectStatus.resolved,
  DefectStatus.verified,
  DefectStatus.closed,
  DefectStatus.reopened,
  DefectStatus.blocked,
];
// Deterministic backdating base so F25/F21 timelines render (seed runs once;
// re-runs skip existing rows so timestamps are stable). Fixed string → no
// Date.now() nondeterminism in the plan.
const BASE = new Date('2026-05-20T10:00:00.000Z').getTime();
const DAY = 86_400_000;

const MAX_DEFECTS = 25; // ratified ~15-30 band (Q3a)

// ── Plan structures ───────────────────────────────────────────────────────────
interface Pencil {
  kind: string;
  label: string;
  exists: boolean;
}

async function main(): Promise<void> {
  const maskedHost = (() => {
    try {
      return new URL(DB_URL).host || '(unset)';
    } catch {
      return '(unset)';
    }
  })();

  console.log('--- PILOT SEED (seed-iksula-pilot.ts) ---');
  console.log(
    `Mode: ${COMMIT ? 'COMMIT (writes enabled)' : 'DRY-RUN (no writes)'}`,
  );
  console.log(`Target host: ${maskedHost}`);

  if (COMMIT && (!SECRET || SECRET.length < 32)) {
    console.error(
      '[seed:pilot] REFUSED — BETTER_AUTH_SECRET missing or <32 chars. The audit chain ' +
        'write needs the current secret (no row-25-style drift). Set it and re-run.',
    );
    process.exit(2);
  }

  const prisma = new PrismaClient();
  try {
    // ── Preflight: workspace + users MUST already exist (proves this is the pilot). ──
    const ws = await prisma.workspace.findFirst({
      where: { name: WORKSPACE_NAME },
    });
    if (!ws) {
      console.error(
        `[seed:pilot] REFUSED — workspace "${WORKSPACE_NAME}" not found at ${maskedHost}. ` +
          'Wrong DB, or prisma/seed.ts has not run. Aborting (no writes).',
      );
      process.exit(2);
    }
    const users = await prisma.user.findMany({
      where: { workspaceId: ws.id },
      select: { id: true, email: true, displayName: true },
    });
    const idByEmail = new Map(users.map((u) => [u.email, u.id]));
    const requiredEmails = Object.values(EMAIL);
    const missing = requiredEmails.filter((e) => !idByEmail.has(e));
    if (missing.length > 0) {
      console.error(
        `[seed:pilot] REFUSED — ${missing.length} canon user(s) missing: ${missing.join(', ')}. ` +
          'Run prisma/seed.ts first. Aborting (no writes).',
      );
      process.exit(2);
    }
    const uid = (email: string): string => {
      const id = idByEmail.get(email);
      if (!id) throw new Error(`user not found: ${email}`);
      return id;
    };
    console.log(
      `Preflight: workspace "${ws.name}" FOUND (id=${ws.id}) · users FOUND ${users.length}/8 ✅`,
    );

    const secretArg = SECRET; // only used on the --commit path
    const pencils: Pencil[] = [];
    let auditWouldWrite = 0;

    // Helper: create-if-absent + audit-on-create-only. Returns the row id.
    async function ensure<T extends { id: string }>(
      kind: string,
      label: string,
      findExisting: () => Promise<{ id: string } | null>,
      create: () => Promise<T>,
      audit: (id: string) => {
        workspaceId: string;
        actorId: string | null;
        entityType: string;
        entityId: string;
        action: string;
        payload: Record<string, unknown>;
      },
    ): Promise<string> {
      const existing = await findExisting();
      pencils.push({ kind, label, exists: !!existing });
      if (existing) return existing.id;
      auditWouldWrite += 1;
      if (!COMMIT) return '00000000-0000-0000-0000-000000000000'; // placeholder id (dry-run, no children writes)
      const row = await create();
      const a = audit(row.id);
      await writeAuditRow(prisma, {
        workspaceId: a.workspaceId,
        actorId: a.actorId,
        entityType: a.entityType,
        entityId: a.entityId,
        action: a.action,
        payload: a.payload,
        secret: secretArg,
      });
      return row.id;
    }

    // ── Projects ──────────────────────────────────────────────────────────────
    const projectIdByKey = new Map<string, string>();
    for (const pj of PROJECTS) {
      const id = await ensure(
        'project',
        `${pj.key} "${pj.name}"${pj.populated ? ' (populated)' : ' (shell)'}`,
        () =>
          prisma.project.findUnique({
            where: { workspaceId_key: { workspaceId: ws.id, key: pj.key } },
            select: { id: true },
          }),
        () =>
          prisma.project.create({
            data: {
              workspaceId: ws.id,
              key: pj.key,
              name: pj.name,
              description: pj.description,
              createdBy: uid(pj.createdBy),
            },
            select: { id: true },
          }),
        (id) => ({
          workspaceId: ws.id,
          actorId: uid(pj.createdBy),
          entityType: 'project',
          entityId: id,
          action: 'project.seeded',
          payload: {
            key: pj.key,
            name: pj.name,
            seededBy: 'seed-iksula-pilot.ts',
          },
        }),
      );
      projectIdByKey.set(pj.key, id);
    }
    const retId = projectIdByKey.get('RET');
    if (!retId) throw new Error('RET project id missing');
    const retExists =
      pencils.find((p) => p.kind === 'project' && p.label.startsWith('RET'))
        ?.exists ?? false;

    // ── Requirements (RET) ──────────────────────────────────────────────────────
    const reqIdByKey = new Map<string, string>();
    for (const r of REQUIREMENTS) {
      const id = await ensure(
        'requirement',
        `${r.key} "${r.title}"`,
        () =>
          retExists
            ? prisma.requirement.findUnique({
                where: { projectId_key: { projectId: retId, key: r.key } },
                select: { id: true },
              })
            : Promise.resolve(null),
        () =>
          prisma.requirement.create({
            data: {
              projectId: retId,
              key: r.key,
              title: r.title,
              description: r.description,
              priority: r.priority,
              status: r.status,
              sprint: r.status === RS.draft ? null : 'Sprint 42',
              source: RequirementSource.jira,
              sourceRef: r.key,
              createdBy: uid(EMAIL.akshay),
            },
            select: { id: true },
          }),
        (id) => ({
          workspaceId: ws.id,
          actorId: uid(EMAIL.akshay),
          entityType: 'requirement',
          entityId: id,
          action: 'requirement.seeded',
          payload: {
            key: r.key,
            priority: r.priority,
            status: r.status,
            seededBy: 'seed-iksula-pilot.ts',
          },
        }),
      );
      reqIdByKey.set(r.key, id);
    }

    // ── Test cases (RET): mine TC-RET-* from golden set + fresh top-up ──────────
    const golden = loadGolden();
    const retGolden = golden.filter((g) =>
      g.input.testCaseId.startsWith('TC-RET-'),
    );
    const skipped = golden.length - retGolden.length;
    // De-dup defended (golden ids are unique, but guard anyway).
    const seenTc = new Set<string>();
    const minedTcs = retGolden.filter((g) => {
      if (seenTc.has(g.input.testCaseId)) return false;
      seenTc.add(g.input.testCaseId);
      return true;
    });

    const reqKeys = REQUIREMENTS.map((r) => r.key);
    const tcIdByKey = new Map<string, string>();
    let tcIndex = 0;

    // mined
    for (const g of minedTcs) {
      const key = g.input.testCaseId;
      const author = QA_ENGINEERS[tcIndex % QA_ENGINEERS.length];
      const expected = deriveExpected(g.input.stepLabel);
      const env = g.input.environment ?? 'staging-iksula';
      const idx = tcIndex;
      const id = await ensure(
        'test_case',
        `${key} "${g.input.testCaseTitle}" (mined)`,
        () =>
          retExists
            ? prisma.testCase.findUnique({
                where: { projectId_key: { projectId: retId, key } },
                select: { id: true },
              })
            : Promise.resolve(null),
        () =>
          prisma.testCase.create({
            data: {
              projectId: retId,
              key,
              title: g.input.testCaseTitle,
              preconditions: `Order with a completed purchase in ${env}.`,
              stepsJson: [
                {
                  n: 1,
                  action:
                    g.input.stepLabel ??
                    'Execute the returns flow step under test.',
                  expected,
                },
              ],
              expectedResult: expected,
              priority: mapSeverity(
                g.groundTruth.rootCauseCategory,
                g.groundTruth.confidence,
              ),
              status: TestCaseStatus.active,
              createdBy: uid(author),
            },
            select: { id: true },
          }),
        (id) => ({
          workspaceId: ws.id,
          actorId: uid(author),
          entityType: 'test_case',
          entityId: id,
          action: 'test_case.seeded',
          payload: {
            key,
            title: g.input.testCaseTitle,
            origin: `golden:${g.id}`,
            seededBy: 'seed-iksula-pilot.ts',
          },
        }),
      );
      tcIdByKey.set(key, id);
      // Trace link → a requirement (round-robin) for F14↔F16 traceability.
      if (COMMIT && retExists === false) {
        const reqId = reqIdByKey.get(reqKeys[idx % reqKeys.length]);
        if (reqId && id !== '00000000-0000-0000-0000-000000000000') {
          await prisma.testCaseLink
            .create({ data: { testCaseId: id, requirementId: reqId } })
            .catch(() => undefined);
        }
      }
      tcIndex += 1;
    }

    // fresh top-up
    for (const t of FRESH_TCS) {
      const author = QA_ENGINEERS[tcIndex % QA_ENGINEERS.length];
      const idx = tcIndex;
      const id = await ensure(
        'test_case',
        `${t.key} "${t.title}" (fresh)`,
        () =>
          retExists
            ? prisma.testCase.findUnique({
                where: { projectId_key: { projectId: retId, key: t.key } },
                select: { id: true },
              })
            : Promise.resolve(null),
        () =>
          prisma.testCase.create({
            data: {
              projectId: retId,
              key: t.key,
              title: t.title,
              preconditions:
                'Order with a completed purchase in staging-iksula.',
              stepsJson: [
                { n: 1, action: t.title, expected: t.expectedResult },
              ],
              expectedResult: t.expectedResult,
              priority: Priority.P2,
              status: TestCaseStatus.reviewed,
              createdBy: uid(author),
            },
            select: { id: true },
          }),
        (id) => ({
          workspaceId: ws.id,
          actorId: uid(author),
          entityType: 'test_case',
          entityId: id,
          action: 'test_case.seeded',
          payload: {
            key: t.key,
            title: t.title,
            origin: 'fresh',
            seededBy: 'seed-iksula-pilot.ts',
          },
        }),
      );
      tcIdByKey.set(t.key, id);
      if (COMMIT && retExists === false) {
        const reqId = reqIdByKey.get(reqKeys[idx % reqKeys.length]);
        if (reqId && id !== '00000000-0000-0000-0000-000000000000') {
          await prisma.testCaseLink
            .create({ data: { testCaseId: id, requirementId: reqId } })
            .catch(() => undefined);
        }
      }
      tcIndex += 1;
    }

    // ── Test suites (RET) — no unique key → findFirst-then-create ───────────────
    const suiteIds: string[] = [];
    for (let i = 0; i < SUITES.length; i++) {
      const s = SUITES[i];
      const owner = SUITE_OWNERS[i % SUITE_OWNERS.length];
      const id = await ensure(
        'test_suite',
        `"${s.name}" owner=${owner.split('@')[0]}`,
        () =>
          retExists
            ? prisma.testSuite.findFirst({
                where: { projectId: retId, name: s.name },
                select: { id: true },
              })
            : Promise.resolve(null),
        () =>
          prisma.testSuite.create({
            data: {
              projectId: retId,
              name: s.name,
              description: s.description,
              ownerId: uid(owner),
              status: TestSuiteStatus.healthy,
            },
            select: { id: true },
          }),
        (id) => ({
          workspaceId: ws.id,
          actorId: uid(owner),
          entityType: 'test_suite',
          entityId: id,
          action: 'test_suite.seeded',
          payload: { name: s.name, seededBy: 'seed-iksula-pilot.ts' },
        }),
      );
      suiteIds.push(id);
    }
    // Suite membership: round-robin every seeded TC across the 5 suites.
    if (COMMIT && retExists === false) {
      const allTcIds = [...tcIdByKey.values()].filter(
        (v) => v !== '00000000-0000-0000-0000-000000000000',
      );
      const orderBySuite = new Map<string, number>();
      for (let i = 0; i < allTcIds.length; i++) {
        const suiteId = suiteIds[i % suiteIds.length];
        if (suiteId === '00000000-0000-0000-0000-000000000000') continue;
        const order = orderBySuite.get(suiteId) ?? 0;
        orderBySuite.set(suiteId, order + 1);
        await prisma.testSuiteMember
          .create({
            data: { suiteId, testCaseId: allTcIds[i], displayOrder: order },
          })
          .catch(() => undefined);
      }
    }

    // ── Defects (RET): transform up to MAX_DEFECTS golden TC-RET-* entries ───────
    const defectSource = retGolden.slice(0, MAX_DEFECTS);
    let defIndex = 0;
    for (const g of defectSource) {
      const seq = String(defIndex + 1).padStart(3, '0');
      const key = `DEF-${seq}`;
      const severity = mapSeverity(
        g.groundTruth.rootCauseCategory,
        g.groundTruth.confidence,
      );
      const status = DEFECT_STATUS_CYCLE[defIndex % DEFECT_STATUS_CYCLE.length];
      const assignee =
        status === DefectStatus.new
          ? null
          : QA_ENGINEERS[defIndex % QA_ENGINEERS.length];
      const createdAt = new Date(BASE - (defIndex % 18) * DAY);
      const resolvedAt =
        status === DefectStatus.resolved ||
        status === DefectStatus.verified ||
        status === DefectStatus.closed ||
        status === DefectStatus.reopened
          ? new Date(createdAt.getTime() + 2 * DAY)
          : null;
      const verifiedAt =
        status === DefectStatus.verified || status === DefectStatus.closed
          ? new Date(createdAt.getTime() + 3 * DAY)
          : null;
      const closedAt =
        status === DefectStatus.closed
          ? new Date(createdAt.getTime() + 4 * DAY)
          : null;
      const triggeredByTestCaseId = tcIdByKey.get(g.input.testCaseId);
      const title = `${g.input.testCaseTitle} — failure`;
      const description =
        (g.input.errorMessage ?? 'Returns flow assertion failed.') +
        (g.groundTruth.rootCauseDetail
          ? `\n\nRoot cause: ${g.groundTruth.rootCauseDetail}`
          : '');
      await ensure(
        'defect',
        `${key} "${title}" sev=${severity} status=${status}${assignee ? ` assignee=${assignee.split('@')[0]}` : ''}`,
        () =>
          retExists
            ? prisma.defect.findUnique({
                where: { projectId_key: { projectId: retId, key } },
                select: { id: true },
              })
            : Promise.resolve(null),
        () =>
          prisma.defect.create({
            data: {
              projectId: retId,
              key,
              title,
              description,
              severity,
              status,
              component: deriveComponent(g.groundTruth.rootCauseCategory),
              assigneeId: assignee ? uid(assignee) : null,
              triggeredByTestCaseId:
                triggeredByTestCaseId &&
                triggeredByTestCaseId !== '00000000-0000-0000-0000-000000000000'
                  ? triggeredByTestCaseId
                  : null,
              createdAt,
              resolvedAt,
              verifiedAt,
              closedAt,
            },
            select: { id: true },
          }),
        (id) => ({
          workspaceId: ws.id,
          actorId: assignee ? uid(assignee) : uid(EMAIL.akshay),
          entityType: 'defect',
          entityId: id,
          action: 'defect.seeded',
          payload: {
            key,
            severity,
            status,
            origin: `golden:${g.id}`,
            seededBy: 'seed-iksula-pilot.ts',
          },
        }),
      );
      defIndex += 1;
    }

    // ── Report ──────────────────────────────────────────────────────────────────
    const count = (kind: string) => pencils.filter((p) => p.kind === kind);
    const newOf = (kind: string) => count(kind).filter((p) => !p.exists).length;
    const summarize = (kind: string) =>
      `${count(kind).length} (new: ${newOf(kind)}, existing: ${count(kind).length - newOf(kind)})`;

    console.log('\n--- PLAN ---');
    console.log(
      `Projects:    ${summarize('project')}  [RET populated + 4 shells]`,
    );
    console.log(`Requirements:${summarize('requirement')}  [RET]`);
    console.log(
      `Test cases:  ${summarize('test_case')}  [${minedTcs.length} mined TC-RET-* + ${FRESH_TCS.length} fresh; ${skipped} non-RET golden entries skipped → PAY/other shells kept empty]`,
    );
    console.log(`Test suites: ${summarize('test_suite')}  [RET]`);
    console.log(
      `Defects:     ${summarize('defect')}  [transformed from golden-set, linked to TC-RET-*]`,
    );
    console.log(
      `\nNEW audit_log rows this run: ${COMMIT ? auditWouldWrite : `${auditWouldWrite} (estimated)`}`,
    );

    console.log('\n--- SAMPLE ROWS ---');
    const sample = (kind: string, n: number) =>
      count(kind)
        .slice(0, n)
        .forEach((p) =>
          console.log(
            `  ${kind.padEnd(12)} ${p.label}${p.exists ? '  [exists]' : ''}`,
          ),
        );
    sample('project', 5);
    sample('requirement', 3);
    sample('test_case', 3);
    sample('test_suite', 5);
    sample('defect', 4);

    if (!COMMIT) {
      console.log(
        '\n--- DRY-RUN complete · 0 DB writes · pilot untouched ✅ ---',
      );
      console.log(
        'Re-run with `-- --commit` (after Yogesh "GO seed") to execute.',
      );
    } else {
      console.log('\n--- COMMIT complete ✅ ---');
      console.log(
        'Verify: pnpm --filter @qa-nexus/api verify:audit -- --since 2026-06-07 (expect CHAIN OK).',
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('[seed:pilot] error:', err);
  process.exit(1);
});

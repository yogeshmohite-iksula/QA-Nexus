// Requirements seed data + Zod schema + read-only hook.
//
// PM1_ERD §3.7 TB-006 is binding for the schema shape (id, project_id,
// key, title, description, epic_key, priority enum, status enum,
// sprint, source enum, source_ref, created_by, created_at,
// updated_at). Front-end uses a slightly trimmed view-model that
// drops project_id (resolved from useActiveProject) and source_ref
// (only surfaced in F14m1's edit drawer for Jira-sourced reqs).
//
// Pattern A: ZERO fetch. `useRequirements()` returns seed data only.
// Real `/api/projects/:slug/requirements` GET wires at MS0-T030.5+
// (M2 BE schema lands ~2026-05-25 per Milestone_M2_Docs_KB.md).
//
// Locked frame ref: PM1_UI_v2/frame  html view/F14 Requirements.html
// Enum tokens (status='draft|active|done|archived', priority='P0|P1|P2|P3')
// match ERD verbatim. The locked HTML's "Active" / "Draft" chip copy
// renders via `statusLabel()` / `priorityLabel()` helpers below — the
// underlying schema string stays canonical.

import { useMemo } from 'react';
import { z } from 'zod';
import { SEED_IDS } from '@/lib/demo-seed';

// ---------------------------------------------------------------------------
// Schema (matches ERD §3.7 TB-006)
// ---------------------------------------------------------------------------

export const requirementStatusValues = ['draft', 'active', 'done', 'archived'] as const;
export const requirementPriorityValues = ['P0', 'P1', 'P2', 'P3'] as const;
export const requirementSourceValues = ['manual', 'jira', 'upload'] as const;

export type RequirementStatus = (typeof requirementStatusValues)[number];
export type RequirementPriority = (typeof requirementPriorityValues)[number];
export type RequirementSource = (typeof requirementSourceValues)[number];

export const requirementSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  key: z.string().regex(/^[A-Z]{2,5}-\d{3,5}$/), // e.g. "RET-001" or "REQ-088"
  title: z.string().min(3).max(200),
  description: z.string().max(4000).default(''),
  epicKey: z.string().nullable().default(null),
  priority: z.enum(requirementPriorityValues),
  status: z.enum(requirementStatusValues),
  sprint: z.string().nullable().default(null), // e.g. "Sprint 42"
  source: z.enum(requirementSourceValues),
  sourceRef: z.string().nullable().default(null), // Jira key or upload file id
  createdById: z.string().uuid(),
  createdAt: z.string(), // ISO timestamp
  updatedAt: z.string(),
  // View-only — derived/joined; not in TB-006 itself
  testCaseCount: z.number().int().min(0).default(0),
  tags: z.array(z.string()).default([]),
});

export type Requirement = z.infer<typeof requirementSchema>;

// ---------------------------------------------------------------------------
// View labels — locked HTML / 01_SYSTEM compatible
// ---------------------------------------------------------------------------

export const requirementStatusLabel: Record<RequirementStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  done: 'Done',
  archived: 'Archived',
};

export const requirementPriorityLabel: Record<RequirementPriority, string> = {
  P0: 'P0',
  P1: 'P1',
  P2: 'P2',
  P3: 'P3',
};

export const requirementSourceLabel: Record<RequirementSource, string> = {
  manual: 'Manual',
  jira: 'Jira',
  upload: 'Uploaded',
};

// ---------------------------------------------------------------------------
// Seed: 24 RET-### requirements scoped to the Iksula Returns project.
//
// Distribution:
//   status   — draft 4 / active 12 / done 6 / archived 2
//   priority — P0 3 / P1 8 / P2 8 / P3 5
//   sprint   — Sprint 41 6 / Sprint 42 12 / Sprint 43 4 / null 2
//   source   — manual 8 / jira 14 / upload 2
//
// Titles drawn from the locked frame's visible copy where possible
// (refund flow + Iksula Returns domain), invented for the rest.
// IDs are deterministic uuids derived from the key + project — keeps
// snapshots stable.
// ---------------------------------------------------------------------------

const RET_ID = SEED_IDS.projects.ret;
const YOGESH_ID = SEED_IDS.users.yogesh;
const AKSHAY_ID = SEED_IDS.users.akshay;
const KISHOR_ID = SEED_IDS.users.kishor;
const NITIN_ID = SEED_IDS.users.nitin;
const NADIM_ID = SEED_IDS.users.nadim;
const GOVIND_ID = SEED_IDS.users.govind;
const MOHANRAJ_ID = SEED_IDS.users.mohanraj;
const SAGAR_ID = SEED_IDS.users.sagar;

// Deterministic uuid stub — `req-XXXX` keys hashed to a stable v5-like
// layout. Avoids depending on a uuid lib at seed time.
function reqUuid(slot: number): string {
  const hex = slot.toString(16).padStart(4, '0');
  return `00000000-0000-4000-8000-0000re${hex}`;
}

const ISO_BASE = '2026-04-22T10:00:00Z';

export const REQUIREMENTS: Requirement[] = [
  {
    id: reqUuid(1),
    projectId: RET_ID,
    key: 'RET-001',
    title: 'Implement refund API for failed orders',
    description:
      'Build the /refunds POST endpoint so the support team can issue refunds without DB access. Idempotent on Stripe charge id.',
    epicKey: 'RET-100',
    priority: 'P0',
    status: 'active',
    sprint: 'Sprint 42',
    source: 'jira',
    sourceRef: 'RET-001',
    createdById: AKSHAY_ID,
    createdAt: ISO_BASE,
    updatedAt: '2026-04-29T14:22:00Z',
    testCaseCount: 8,
    tags: ['payments', 'stripe', 'api'],
  },
  {
    id: reqUuid(2),
    projectId: RET_ID,
    key: 'RET-002',
    title: 'Return policy UI copy needs legal review',
    description:
      'Run the new /returns landing copy past Legal before the May 15 launch. 4 paragraphs + 2 CTAs.',
    epicKey: null,
    priority: 'P1',
    status: 'draft',
    sprint: 'Sprint 42',
    source: 'manual',
    sourceRef: null,
    createdById: YOGESH_ID,
    createdAt: ISO_BASE,
    updatedAt: '2026-04-30T09:15:00Z',
    testCaseCount: 0,
    tags: ['copy', 'legal', 'landing'],
  },
  {
    id: reqUuid(3),
    projectId: RET_ID,
    key: 'RET-003',
    title: 'Refund webhook retry telemetry',
    description: 'Add OpenTelemetry spans around the Stripe webhook retry loop.',
    epicKey: 'RET-100',
    priority: 'P2',
    status: 'active',
    sprint: 'Sprint 42',
    source: 'jira',
    sourceRef: 'RET-003',
    createdById: KISHOR_ID,
    createdAt: ISO_BASE,
    updatedAt: '2026-04-30T16:40:00Z',
    testCaseCount: 12,
    tags: ['observability', 'stripe'],
  },
  {
    id: reqUuid(4),
    projectId: RET_ID,
    key: 'RET-004',
    title: 'Multi-currency refund support (EUR, GBP, INR)',
    description: 'Extend the refund flow to handle non-USD storefronts. Round-trip via Stripe FX.',
    epicKey: 'RET-100',
    priority: 'P1',
    status: 'active',
    sprint: 'Sprint 43',
    source: 'jira',
    sourceRef: 'RET-004',
    createdById: AKSHAY_ID,
    createdAt: ISO_BASE,
    updatedAt: '2026-04-28T11:00:00Z',
    testCaseCount: 3,
    tags: ['payments', 'i18n', 'stripe'],
  },
  {
    id: reqUuid(5),
    projectId: RET_ID,
    key: 'RET-005',
    title: '30-day refund window for physical goods',
    description:
      'Lock the refund eligibility window to 30 days from order delivery, per policy v2.',
    epicKey: null,
    priority: 'P2',
    status: 'active',
    sprint: 'Sprint 41',
    source: 'manual',
    sourceRef: null,
    createdById: YOGESH_ID,
    createdAt: ISO_BASE,
    updatedAt: '2026-04-21T13:25:00Z',
    testCaseCount: 5,
    tags: ['policy', 'refund-window'],
  },
  {
    id: reqUuid(6),
    projectId: RET_ID,
    key: 'RET-006',
    title: 'Return shipping label auto-generation',
    description: 'Auto-generate a USPS pre-paid return label when a refund is approved.',
    epicKey: 'RET-200',
    priority: 'P1',
    status: 'active',
    sprint: 'Sprint 42',
    source: 'jira',
    sourceRef: 'RET-006',
    createdById: NITIN_ID,
    createdAt: ISO_BASE,
    updatedAt: '2026-04-29T17:50:00Z',
    testCaseCount: 4,
    tags: ['shipping', 'usps'],
  },
  {
    id: reqUuid(7),
    projectId: RET_ID,
    key: 'RET-007',
    title: 'Refund reason categorization (6 categories)',
    description:
      'Customer must pick one of: damaged, wrong item, late, changed mind, sizing, other.',
    epicKey: null,
    priority: 'P2',
    status: 'done',
    sprint: 'Sprint 41',
    source: 'jira',
    sourceRef: 'RET-007',
    createdById: AKSHAY_ID,
    createdAt: ISO_BASE,
    updatedAt: '2026-04-18T10:00:00Z',
    testCaseCount: 6,
    tags: ['ux', 'reason-codes'],
  },
  {
    id: reqUuid(8),
    projectId: RET_ID,
    key: 'RET-008',
    title: 'Bulk refund CSV export for finance ops',
    description: 'Finance needs daily CSV of refund.id, charge_id, amount, currency, reason.',
    epicKey: null,
    priority: 'P3',
    status: 'draft',
    sprint: null,
    source: 'manual',
    sourceRef: null,
    createdById: GOVIND_ID,
    createdAt: ISO_BASE,
    updatedAt: '2026-04-25T08:30:00Z',
    testCaseCount: 0,
    tags: ['ops', 'export', 'finance'],
  },
  {
    id: reqUuid(9),
    projectId: RET_ID,
    key: 'RET-009',
    title: 'Customer-facing refund status page',
    description: 'Public /refund/:id page that surfaces "Issued / Pending / Failed" without auth.',
    epicKey: 'RET-200',
    priority: 'P1',
    status: 'active',
    sprint: 'Sprint 43',
    source: 'jira',
    sourceRef: 'RET-009',
    createdById: NADIM_ID,
    createdAt: ISO_BASE,
    updatedAt: '2026-04-30T12:00:00Z',
    testCaseCount: 2,
    tags: ['ux', 'public-page'],
  },
  {
    id: reqUuid(10),
    projectId: RET_ID,
    key: 'RET-010',
    title: 'PCI scope reduction for refund flow',
    description:
      'Move refund-form input direct-to-Stripe Elements; never let card PAN touch our box.',
    epicKey: 'RET-300',
    priority: 'P0',
    status: 'active',
    sprint: 'Sprint 42',
    source: 'jira',
    sourceRef: 'RET-010',
    createdById: AKSHAY_ID,
    createdAt: ISO_BASE,
    updatedAt: '2026-04-30T15:10:00Z',
    testCaseCount: 11,
    tags: ['security', 'pci', 'stripe'],
  },
  {
    id: reqUuid(11),
    projectId: RET_ID,
    key: 'RET-011',
    title: 'Email notification on refund issued',
    description:
      'Trigger a Resend email "Your refund of $X has been processed" — template id rfd_v2.',
    epicKey: null,
    priority: 'P2',
    status: 'done',
    sprint: 'Sprint 41',
    source: 'manual',
    sourceRef: null,
    createdById: KISHOR_ID,
    createdAt: ISO_BASE,
    updatedAt: '2026-04-19T14:00:00Z',
    testCaseCount: 3,
    tags: ['email', 'resend'],
  },
  {
    id: reqUuid(12),
    projectId: RET_ID,
    key: 'RET-012',
    title: 'Partial refund flow for multi-item orders',
    description:
      'Support refunding 2 of 3 items in an order. Stripe partial refund API + line-item math.',
    epicKey: 'RET-100',
    priority: 'P1',
    status: 'active',
    sprint: 'Sprint 42',
    source: 'jira',
    sourceRef: 'RET-012',
    createdById: AKSHAY_ID,
    createdAt: ISO_BASE,
    updatedAt: '2026-04-29T11:45:00Z',
    testCaseCount: 7,
    tags: ['payments', 'stripe'],
  },
  {
    id: reqUuid(13),
    projectId: RET_ID,
    key: 'RET-013',
    title: 'Refund SLA: process within 5 business days',
    description: 'Add a `due_at` column on refund table and cron-alert on overdue.',
    epicKey: null,
    priority: 'P3',
    status: 'draft',
    sprint: 'Sprint 43',
    source: 'manual',
    sourceRef: null,
    createdById: MOHANRAJ_ID,
    createdAt: ISO_BASE,
    updatedAt: '2026-04-30T10:00:00Z',
    testCaseCount: 0,
    tags: ['sla', 'cron'],
  },
  {
    id: reqUuid(14),
    projectId: RET_ID,
    key: 'RET-014',
    title: 'Audit log entry on every refund mutation',
    description:
      'Hook into the audit_log HMAC chain (PM1_ERD §3.13) — actor, target, before/after diff.',
    epicKey: 'RET-300',
    priority: 'P1',
    status: 'active',
    sprint: 'Sprint 42',
    source: 'jira',
    sourceRef: 'RET-014',
    createdById: YOGESH_ID,
    createdAt: ISO_BASE,
    updatedAt: '2026-04-30T17:30:00Z',
    testCaseCount: 5,
    tags: ['security', 'audit-log'],
  },
  {
    id: reqUuid(15),
    projectId: RET_ID,
    key: 'RET-015',
    title: 'Disallow refunds older than 90 days from charge date',
    description: 'Hard cap matches Stripe`s own dispute window; fail with a clear error message.',
    epicKey: null,
    priority: 'P2',
    status: 'done',
    sprint: 'Sprint 41',
    source: 'jira',
    sourceRef: 'RET-015',
    createdById: SAGAR_ID,
    createdAt: ISO_BASE,
    updatedAt: '2026-04-17T09:30:00Z',
    testCaseCount: 4,
    tags: ['policy', 'stripe'],
  },
  {
    id: reqUuid(16),
    projectId: RET_ID,
    key: 'RET-016',
    title: 'Migrate legacy refund records to new schema',
    description:
      '12k pre-2026 records need backfill: reason_code from free-text, currency=USD by default.',
    epicKey: 'RET-400',
    priority: 'P3',
    status: 'archived',
    sprint: null,
    source: 'upload',
    sourceRef: 'legacy_refund_test_cases.csv',
    createdById: GOVIND_ID,
    createdAt: ISO_BASE,
    updatedAt: '2026-04-15T12:00:00Z',
    testCaseCount: 0,
    tags: ['migration', 'data'],
  },
  {
    id: reqUuid(17),
    projectId: RET_ID,
    key: 'RET-017',
    title: 'Refund analytics dashboard for finance',
    description: 'Daily / weekly / monthly volume + reason-code breakdown. Read-only.',
    epicKey: null,
    priority: 'P2',
    status: 'active',
    sprint: 'Sprint 43',
    source: 'manual',
    sourceRef: null,
    createdById: NITIN_ID,
    createdAt: ISO_BASE,
    updatedAt: '2026-04-29T16:00:00Z',
    testCaseCount: 1,
    tags: ['analytics', 'dashboard'],
  },
  {
    id: reqUuid(18),
    projectId: RET_ID,
    key: 'RET-018',
    title: 'Refund webhook signature verification',
    description: 'Verify Stripe webhook secret on every callback; reject + alert on mismatch.',
    epicKey: 'RET-300',
    priority: 'P0',
    status: 'active',
    sprint: 'Sprint 41',
    source: 'jira',
    sourceRef: 'RET-018',
    createdById: AKSHAY_ID,
    createdAt: ISO_BASE,
    updatedAt: '2026-04-22T11:00:00Z',
    testCaseCount: 9,
    tags: ['security', 'stripe'],
  },
  {
    id: reqUuid(19),
    projectId: RET_ID,
    key: 'RET-019',
    title: 'Restocking-fee deduction (2% on changed-mind returns)',
    description: 'Pull deduction config from feature_flags; render breakdown in customer email.',
    epicKey: null,
    priority: 'P2',
    status: 'active',
    sprint: 'Sprint 42',
    source: 'jira',
    sourceRef: 'RET-019',
    createdById: KISHOR_ID,
    createdAt: ISO_BASE,
    updatedAt: '2026-04-30T13:20:00Z',
    testCaseCount: 2,
    tags: ['policy', 'fees'],
  },
  {
    id: reqUuid(20),
    projectId: RET_ID,
    key: 'RET-020',
    title: 'Revoke duplicate-key uploaded requirements',
    description: 'When a Jira-sync overwrites an upload entry, archive the upload row.',
    epicKey: 'RET-400',
    priority: 'P3',
    status: 'archived',
    sprint: null,
    source: 'upload',
    sourceRef: 'return_policy_v2.xlsx',
    createdById: GOVIND_ID,
    createdAt: ISO_BASE,
    updatedAt: '2026-04-16T10:00:00Z',
    testCaseCount: 0,
    tags: ['data', 'migration'],
  },
  {
    id: reqUuid(21),
    projectId: RET_ID,
    key: 'RET-021',
    title: 'A/B test: 1-click refund vs. confirm-flow',
    description: 'Run 50/50 split for 14 days; instrument refund-completion rate + CSAT.',
    epicKey: null,
    priority: 'P3',
    status: 'draft',
    sprint: 'Sprint 43',
    source: 'manual',
    sourceRef: null,
    createdById: MOHANRAJ_ID,
    createdAt: ISO_BASE,
    updatedAt: '2026-04-30T08:00:00Z',
    testCaseCount: 0,
    tags: ['experiment', 'ab-test'],
  },
  {
    id: reqUuid(22),
    projectId: RET_ID,
    key: 'RET-022',
    title: 'Customer support deep-link from Zendesk to refund detail',
    description:
      'Build a /refund?charge_id=xyz redirect so support links work from Zendesk macros.',
    epicKey: null,
    priority: 'P2',
    status: 'done',
    sprint: 'Sprint 41',
    source: 'jira',
    sourceRef: 'RET-022',
    createdById: SAGAR_ID,
    createdAt: ISO_BASE,
    updatedAt: '2026-04-20T15:00:00Z',
    testCaseCount: 2,
    tags: ['support', 'zendesk'],
  },
  {
    id: reqUuid(23),
    projectId: RET_ID,
    key: 'RET-023',
    title: 'Backfill epic_key on legacy refund records',
    description: 'Pull epic_key from Jira via the sync loop; update audit_log with diff.',
    epicKey: 'RET-100',
    priority: 'P3',
    status: 'done',
    sprint: 'Sprint 41',
    source: 'jira',
    sourceRef: 'RET-023',
    createdById: NADIM_ID,
    createdAt: ISO_BASE,
    updatedAt: '2026-04-21T11:00:00Z',
    testCaseCount: 1,
    tags: ['data', 'jira'],
  },
  {
    id: reqUuid(24),
    projectId: RET_ID,
    key: 'RET-024',
    title: 'Rate-limit refund webhook to 50 RPS',
    description: 'Stripe sends bursts; cap intake + queue overflow to prevent dyno pressure.',
    epicKey: 'RET-300',
    priority: 'P1',
    status: 'active',
    sprint: 'Sprint 42',
    source: 'jira',
    sourceRef: 'RET-024',
    createdById: AKSHAY_ID,
    createdAt: ISO_BASE,
    updatedAt: '2026-04-30T18:00:00Z',
    testCaseCount: 4,
    tags: ['rate-limit', 'reliability'],
  },
];

// ---------------------------------------------------------------------------
// Read-only hook (Pattern A — no fetch, no mutation surface)
//
// Real `/api/projects/:slug/requirements` GET wires at MS0-T030.5+.
// ---------------------------------------------------------------------------

export function useRequirements(projectId?: string): Requirement[] {
  return useMemo(() => {
    if (!projectId) return REQUIREMENTS;
    return REQUIREMENTS.filter((r) => r.projectId === projectId);
  }, [projectId]);
}

// ---------------------------------------------------------------------------
// Pure filter helper — used by F14 list page + filter chip wiring.
// Takes the full list + a partial filter object and returns the
// filtered subset. Status/priority/sprint/source are exact-match;
// `search` does case-insensitive match on key + title + description.
// ---------------------------------------------------------------------------

export interface RequirementFilter {
  status?: RequirementStatus | 'all';
  priority?: RequirementPriority | 'all';
  sprint?: string | 'all';
  source?: RequirementSource | 'all';
  search?: string;
}

export function filterRequirements(list: Requirement[], f: RequirementFilter): Requirement[] {
  let out = list;
  if (f.status && f.status !== 'all') out = out.filter((r) => r.status === f.status);
  if (f.priority && f.priority !== 'all') out = out.filter((r) => r.priority === f.priority);
  if (f.sprint && f.sprint !== 'all') out = out.filter((r) => r.sprint === f.sprint);
  if (f.source && f.source !== 'all') out = out.filter((r) => r.source === f.source);
  const q = (f.search ?? '').trim().toLowerCase();
  if (q) {
    out = out.filter(
      (r) =>
        r.key.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q),
    );
  }
  return out;
}

// ---------------------------------------------------------------------------
// Stat counts — for the source-filter tabs in F14's page header.
// All / Jira / Uploaded / Manual + a "coverage gaps" derived stat (rows
// with testCaseCount === 0).
// ---------------------------------------------------------------------------

export interface RequirementCounts {
  all: number;
  jira: number;
  uploaded: number;
  manual: number;
  coverageGaps: number;
}

export function countRequirements(list: Requirement[]): RequirementCounts {
  return {
    all: list.length,
    jira: list.filter((r) => r.source === 'jira').length,
    uploaded: list.filter((r) => r.source === 'upload').length,
    manual: list.filter((r) => r.source === 'manual').length,
    coverageGaps: list.filter((r) => r.testCaseCount === 0).length,
  };
}

// ---------------------------------------------------------------------------
// Available sprints — derived from the seed list, plus an "all" sentinel
// for the chip filter. Sprint names match the locked HTML's Sprint 42
// reference + the user-canon Sprint 41/43.
// ---------------------------------------------------------------------------

export function listSprints(list: Requirement[]): string[] {
  const set = new Set<string>();
  for (const r of list) {
    if (r.sprint) set.add(r.sprint);
  }
  return Array.from(set).sort();
}

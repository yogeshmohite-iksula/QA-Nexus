// View-only fixtures for F08a Home (QA Engineer).
//
// FOLLOWUP (i) — seed-centralization (ADR-006):
// - Entity identity (signed-in user, active project) MOVED to context
//   hooks: `useCurrentUser()` + `useActiveProject()` from
//   `@/lib/contexts/{CurrentUser,Project}Context`.
// - This file now holds only VIEW-FIXTURE data (HERO copy, queue rows,
//   evidence chips, etc.) — copy-stub data that does NOT represent
//   identifiable users / projects in the workspace seed.
// - Pattern A still applies: NO fetch / useMutation / axios anywhere.
// - Names referenced inside QUEUE_ROWS / EVIDENCE_THREAD (e.g., "Priya S",
//   "Neha D") are FICTIONAL collaborator placeholders from the locked
//   frame, not pilot-roster users. They stay until the locked source is
//   re-cut against the canonical roster.
//
// Real backend wiring lands in MS0-T030.5+ once T021 BetterAuth + the
// home queries are ready.

// Sprint metadata kept inline by consumers (per runbook step 4); HERO
// copy below references the sprint number directly so the view stays
// authoritative for greeting copy without re-importing.
const SPRINT_NUMBER = 42;

export const HERO = {
  heading: 'What needs your attention right now?',
  subFragments: [
    { text: '3 AI drafts to review', tone: 'neutral' as const },
    { text: '1 run in flight', tone: 'neutral' as const },
    { text: '2 defects triaging', tone: 'neutral' as const },
    { text: `Sprint ${SPRINT_NUMBER} is on track`, tone: 'pass' as const },
  ],
  // Friday 2026-04-28 09:14 IST
  nowDate: 'Tue · 2026-04-28 · 09:14 IST',
};

// ---------------------------------------------------------------------------
// Region 2 — Outcome board
// ---------------------------------------------------------------------------

export interface ActionQueueSummary {
  itemCount: number;
  delta: number;
  caption: string;
  spark: number[]; // 7 bars, 0-100 normalized for sparkline heights
}

export const ACTION_QUEUE: ActionQueueSummary = {
  itemCount: 6,
  delta: 2,
  caption: '3 AI reviews · 2 clarifications · 1 defect triage',
  spark: [22, 38, 54, 30, 70, 86, 100],
};

export interface ActiveRun {
  id: string;
  suite: string;
  passed: number;
  flaky: number;
  failed: number;
  remaining: number;
  total: number;
  percent: number;
}

export const ACTIVE_RUNS: ActiveRun = {
  id: 'R-2026-04-28-A',
  suite: 'Returns refund regression suite',
  passed: 14,
  flaky: 1,
  failed: 0,
  remaining: 4,
  total: 19,
  percent: Math.round((14 / 19) * 100),
};

export interface ReleaseRisk {
  severity: 'amber' | 'red' | 'pass';
  release: string;
  shipsInDays: number;
  rows: Array<{ id: string; label: string; severity: 'flaky' | 'failing' }>;
}

export const RELEASE_RISK: ReleaseRisk = {
  severity: 'amber',
  release: 'R-2026-04-PaymentV2',
  shipsInDays: 5,
  rows: [
    { id: 'TC-RET-002', label: 'Inventory reconciliation flaky', severity: 'flaky' },
    { id: 'TC-RET-003', label: 'Customer notification blocked', severity: 'failing' },
  ],
};

export interface AiNarrative {
  agents: Array<'A1' | 'A2' | 'A4'>;
  body: string;
  sub: string;
  routeTarget: string;
}

export const AI_NARRATIVE: AiNarrative = {
  agents: ['A1', 'A2', 'A4'],
  body: 'A1 drafted 8 cases from RET-137',
  sub: 'Ready for your review · 0.91 avg confidence · 2 marked likely dupes by A2',
  routeTarget: 'F17-test-case-library-a1-drafts',
};

// ---------------------------------------------------------------------------
// Region 3 — Your queue (6 rows)
// ---------------------------------------------------------------------------

export type QueueLane = 'ai' | 'med' | 'high' | 'plain';
export type QueueTab = 'all' | 'ai-reviews' | 'clarifications' | 'defect-triage';

export interface QueueRow {
  id: string;
  lane: QueueLane;
  tab: Exclude<QueueTab, 'all'>;
  glyph: 'ai' | 'amber' | 'red-tri' | 'amber-diamond' | 'teal-square';
  title: string;
  agentChip?: { id: 'A1' | 'A2' | 'A4'; conf: number; tone: 'pass' | 'amber' };
  meta: string;
  freshness: string;
  extra?: string;
  primary: { label: string; routeTarget: string };
  secondary?: { label: string; routeTarget: string };
  collaborator?: { initials: string; tone: 'amber' | 'info' };
}

export const QUEUE_ROWS: QueueRow[] = [
  {
    id: 'q1',
    lane: 'ai',
    tab: 'ai-reviews',
    glyph: 'ai',
    title: "Review 8 A1-drafted cases for RET-137 'Refund eligibility for partial returns'",
    agentChip: { id: 'A1', conf: 92, tone: 'pass' },
    meta: 'Iksula Returns / Refunds / Eligibility',
    freshness: 'drafted 18 min ago',
    extra: '0 duplicates flagged',
    primary: { label: 'Accept all', routeTarget: 'F17-accept-all-a1-drafts' },
    secondary: { label: 'Open Review', routeTarget: 'F17-test-case-library-a1-drafts' },
  },
  {
    id: 'q2',
    lane: 'med',
    tab: 'clarifications',
    glyph: 'amber',
    title: "A1 has 2 clarification questions on TC-RET-002 'Inventory reconciliation'",
    agentChip: { id: 'A1', conf: 74, tone: 'amber' },
    meta: 'Iksula Returns / Inventory / Reconciliation',
    freshness: 'asked 1h ago',
    extra: 'awaiting your answer · 2 questions',
    primary: { label: 'Answer questions', routeTarget: 'F18a-clarifications-modal' },
    secondary: { label: 'Dismiss', routeTarget: 'F18a-clarifications-dismiss' },
  },
  {
    id: 'q3',
    lane: 'plain',
    tab: 'defect-triage',
    glyph: 'red-tri',
    title: 'DEF-001 Refund off by 1 cent on multi-item returns — A4 classified as App Bug',
    agentChip: { id: 'A4', conf: 87, tone: 'pass' },
    meta: 'P1 · open · Sprint 42',
    freshness: 'assigned 6h ago',
    extra: 'Priya S assigned',
    primary: { label: 'Review RCA', routeTarget: 'F25-defect-detail-DEF-001' },
    secondary: { label: 'Add comment', routeTarget: 'F25-defect-comment-DEF-001' },
    collaborator: { initials: 'PS', tone: 'amber' },
  },
  {
    id: 'q4',
    lane: 'ai',
    tab: 'ai-reviews',
    glyph: 'ai',
    title: 'Review 3 A2-flagged duplicate cases in Refund Eligibility module',
    agentChip: { id: 'A2', conf: 88, tone: 'pass' },
    meta: 'Iksula Returns / Refunds / Eligibility',
    freshness: 'flagged 32 min ago',
    extra: '3 dupes found · threshold ≥ 0.82',
    primary: { label: 'Review dupes', routeTarget: 'F17-duplicate-review' },
    secondary: { label: 'Not dupe', routeTarget: 'F17-mark-not-dupe' },
  },
  {
    id: 'q5',
    lane: 'plain',
    tab: 'ai-reviews',
    glyph: 'teal-square',
    title: 'Run Refund regression suite for PR #1847 (revert)',
    meta: '42 cases · staging · Sprint 42',
    freshness: 'assigned 2h ago by YM Yogesh M.',
    primary: { label: 'Start run', routeTarget: 'F19-run-console-start' },
    secondary: { label: 'Reassign', routeTarget: 'F19-run-reassign' },
  },
  {
    id: 'q6',
    lane: 'med',
    tab: 'clarifications',
    glyph: 'amber-diamond',
    title: 'Neha D requested peer-review on 12 new Cart API cases',
    meta: 'Iksula Returns / Cart API · manual cases',
    freshness: 'submitted 45 min ago',
    extra: 'draft review',
    primary: { label: 'Review', routeTarget: 'F17-peer-review' },
    secondary: { label: 'Reassign', routeTarget: 'F17-reassign' },
    collaborator: { initials: 'ND', tone: 'info' },
  },
];

export const QUEUE_TABS: Array<{ id: QueueTab; label: string; count: number }> = [
  { id: 'all', label: 'All', count: 6 },
  { id: 'ai-reviews', label: 'AI reviews', count: 3 },
  { id: 'clarifications', label: 'Clarifications', count: 2 },
  { id: 'defect-triage', label: 'Defect triage', count: 1 },
];

// ---------------------------------------------------------------------------
// Region 4 — Right rail (Evidence thread + Suggested next + Pinned)
// ---------------------------------------------------------------------------

export interface EvidenceEntry {
  agent: 'A1' | 'A2' | 'A4';
  body: string;
  conf?: { value: number; tone: 'pass' | 'amber' };
  freshness: string;
  chips: string[];
  awaiting?: boolean;
}

export const EVIDENCE_THREAD: EvidenceEntry[] = [
  {
    agent: 'A1',
    body: 'Drafted 8 cases for RET-137',
    conf: { value: 0.91, tone: 'pass' },
    freshness: '18 min ago',
    chips: ['confluence/RET-137', '2 negative-path variants'],
  },
  {
    agent: 'A2',
    body: 'Flagged 3 dupes in Refund Eligibility module',
    conf: { value: 0.82, tone: 'pass' },
    freshness: '32 min ago',
    chips: ['TC-RET-001 ≈ 014 ≈ 022'],
  },
  {
    agent: 'A4',
    body: "RCA'd failure cluster → DEF-001",
    conf: { value: 0.87, tone: 'pass' },
    freshness: '6h ago · assigned to Priya',
    chips: ['6 runs', '2 stacks', 'RefundCalculator.ts:147'],
  },
  {
    agent: 'A1',
    body: 'Asked 2 clarification questions on TC-RET-002',
    freshness: 'awaiting reply · 1h ago',
    chips: [],
    awaiting: true,
  },
];

export const SUGGESTED_NEXT = {
  body: "Start with A1's 8 drafted cases for RET-137 — confidence is high (0.91), 0 dupes flagged, should clear in ~5 minutes.",
  primary: { label: 'Open review', routeTarget: 'F17-suggested-review' },
  secondary: { label: 'Something else', routeTarget: 'F17-suggested-skip' },
};

export interface PinnedRef {
  title: string;
  status: 'approved' | 'reference';
  meta: string;
}

export const PINNED_REFS: PinnedRef[] = [
  { title: 'Returns refund runbook', status: 'approved', meta: 'v3 · updated 4d ago' },
  { title: 'A1 prompt style guide', status: 'reference', meta: 'reference doc · v2.3' },
];

// ---------------------------------------------------------------------------
// Recent runs (referenced from CHAT 2 brief — kept for the right-rail tooltip
// or future "Runs" card if needed; not currently rendered in the locked frame).
// ---------------------------------------------------------------------------

export const RECENT_RUNS = [
  {
    id: 'R-2026-04-27-001',
    summary: '12 passed / 1 failed / 0 skipped',
    duration: '4 min 32 sec',
    when: '12 hrs ago',
  },
  {
    id: 'R-2026-04-26-003',
    summary: '13 passed / 0 failed / 0 skipped',
    duration: '4 min 18 sec',
    when: 'yesterday',
  },
  {
    id: 'R-2026-04-25-002',
    summary: '10 passed / 2 failed / 1 skipped',
    duration: '5 min 02 sec',
    when: '2 days ago',
  },
];

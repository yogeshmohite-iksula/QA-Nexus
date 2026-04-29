// View-only fixtures for F08b Home Dashboard (QA Lead).
//
// FOLLOWUP (i) — seed-centralization (ADR-006):
// - Entity identity (signed-in user, active project) MOVED to context
//   hooks: `useCurrentUser()` + `useActiveProject()`.
// - The page wraps the tree in `<CurrentUserProvider initialUserId=
//   {SEED_IDS.users.akshay}>` so the active user is Akshay Panchal
//   (the canonical QA Lead per CLAUDE.md). The locked HTML used Yogesh M.
//   — but the runbook explicitly aligns identity with the seed roster,
//   so name/initials change YM→AP. Role pill ("QA Lead") preserved
//   (Akshay's organizationalLabel matches).
// - This file now holds only VIEW-FIXTURE data (HERO copy, KPIs, approval
//   queue rows, etc.) — stub data that does NOT represent identifiable
//   workspace users / projects.
// - Pattern A still applies: NO fetch / useMutation / axios anywhere.

export const HERO = {
  heading: 'How is the team doing, and what needs approval?',
  sub: 'Sprint 42 Day 9 of 14 · 3 approvals pending · 2 A4 findings worth triaging today.',
  nowDate: 'Tue · 2026-04-28 · 09:14 IST',
  releaseShipDate: '2026-05-03',
};

// ---------------------------------------------------------------------------
// AI Value KPI strip — 4 cards
// ---------------------------------------------------------------------------

export interface KpiCard {
  id: string;
  label: string;
  value: string;
  delta?: { text: string; tone: 'pass' | 'warn' | 'neutral' };
  formula: string;
}

export const KPI_CARDS: KpiCard[] = [
  {
    id: 'time-saved',
    label: 'Time saved',
    value: '184h',
    delta: { text: '+23 h vs last sprint', tone: 'pass' },
    formula: '= Σ(621 A1 × 18 min) + (412 A2 × 5 min) + (89 A4 × 25 min). Calibration 2026-03-15.',
  },
  {
    id: 'cost-avoided',
    label: 'Cost avoided',
    value: '₹14.2L',
    delta: { text: '+8% · ≈ $17K', tone: 'pass' },
    formula: '= Σ(defects_caught × stage_mult). 21 pre-prod × 45 + 2 staging × 200 @ ₹8K/hr.',
  },
  {
    id: 'defects-caught',
    label: 'Defects caught early',
    value: '23',
    delta: { text: '+5 vs previous · 0 prod escapes', tone: 'pass' },
    formula: 'A4-classified as pre-prod. 21 at PR review, 2 in staging, 0 escaped to prod.',
  },
  {
    id: 'roi',
    label: 'ROI this quarter',
    value: '342%',
    delta: { text: '90-day window', tone: 'neutral' },
    formula: '= (184 h × ₹8,000/hr) ÷ ₹4.32 L infra cost. Calibration 2026-03-15.',
  },
];

// ---------------------------------------------------------------------------
// Secondary outcome board — 4 small cards
// ---------------------------------------------------------------------------

export interface OutcomeCard {
  id: string;
  label: string;
  value: string;
  delta?: { text: string; tone: 'pass' | 'warn' | 'fail' | 'neutral' };
  rag?: 'green' | 'amber' | 'red';
  meta: string;
}

export const OUTCOME_CARDS: OutcomeCard[] = [
  {
    id: 'pass-rate',
    label: 'Team pass rate',
    value: '87%',
    delta: { text: '▲ 1.8 pp vs Sprint 41', tone: 'pass' },
    meta: '7d window',
  },
  {
    id: 'defect-trend',
    label: 'Defect trend',
    value: '47 open',
    delta: { text: '▼ 4 from last week', tone: 'pass' },
    meta: '3 P1 · 12 P2',
  },
  {
    id: 'release-risk',
    label: 'Release risk',
    value: '5 days to ship',
    rag: 'amber',
    meta: '3 P1 open · Exit gate 3/5 passed',
  },
  {
    id: 'approvals',
    label: 'Approvals on you',
    value: '3 pending',
    delta: { text: 'Next deadline Fri EOD', tone: 'warn' },
    meta: 'me',
  },
];

// ---------------------------------------------------------------------------
// Per-project cockpit tiles — 3 tiles
// ---------------------------------------------------------------------------

export interface ProjectTile {
  glyph: string;
  name: string;
  branch: string;
  branchTone: 'pass' | 'warn' | 'fail' | 'neutral';
  sprint: string;
  passRate: string;
  open: string;
  rag: 'green' | 'amber' | 'red';
}

export const PROJECT_TILES: ProjectTile[] = [
  {
    glyph: 'IR',
    name: 'Iksula Returns',
    branch: 'main',
    branchTone: 'neutral',
    sprint: 'Sprint 42',
    passRate: '87% pass',
    open: '6 open',
    rag: 'amber',
  },
  {
    glyph: 'IC',
    name: 'Iksula Commerce',
    branch: 'main',
    branchTone: 'neutral',
    sprint: 'Sprint 42',
    passRate: '91% pass',
    open: '6 open',
    rag: 'green',
  },
  {
    glyph: 'IP',
    name: 'Iksula Payments',
    branch: 'staging',
    branchTone: 'warn',
    sprint: 'Sprint 42',
    passRate: '82% pass',
    open: '3 open',
    rag: 'amber',
  },
];

// ---------------------------------------------------------------------------
// Approvals queue — Iksula-canon-flavored, 3 pending rows (matches KPI count)
// ---------------------------------------------------------------------------

export type ApprovalLane = 'high' | 'med' | 'low' | 'plain';
export type ApprovalTab = 'all' | 'strategies' | 'reports' | 'rtm-changes' | 'defect-triage';

export interface ApprovalRow {
  id: string;
  lane: ApprovalLane;
  tab: Exclude<ApprovalTab, 'all'>;
  title: string;
  agentChip?: { id: 'A1' | 'A2' | 'A4'; conf: number };
  meta: string;
  freshness: string;
  badge?: { label: string; tone: 'warn' | 'fail' | 'pass' | 'ai' };
  actions: Array<{
    label: string;
    variant: 'primary' | 'secondary' | 'danger';
    routeTarget: string;
  }>;
}

export const APPROVAL_ROWS: ApprovalRow[] = [
  {
    id: 'a1-strategy-RET-137',
    lane: 'high',
    tab: 'strategies',
    title: 'Test Strategy for RET-137 — Refund eligibility for partial returns',
    agentChip: { id: 'A1', conf: 92 },
    meta: 'Kishor K. requested · Iksula Returns · A1-assisted draft · 14 cases',
    freshness: 'submitted 2h ago',
    actions: [
      { label: 'Approve', variant: 'primary', routeTarget: 'F25-strategy-approve-RET-137' },
      {
        label: 'Request changes',
        variant: 'secondary',
        routeTarget: 'F25-strategy-changes-RET-137',
      },
    ],
  },
  {
    id: 'a2-dedup-refund',
    lane: 'high',
    tab: 'rtm-changes',
    title: 'A2 flagged 3 likely duplicates in Refund Eligibility module',
    agentChip: { id: 'A2', conf: 88 },
    meta: 'TC-RET-001 ≈ 014 ≈ 022 · Iksula Returns · threshold ≥ 0.82',
    freshness: 'flagged 32 min ago',
    actions: [
      { label: 'Approve merges', variant: 'primary', routeTarget: 'F17-dedup-approve' },
      { label: 'Not duplicates', variant: 'secondary', routeTarget: 'F17-dedup-reject' },
    ],
  },
  {
    id: 'a4-rca-DEF-001',
    lane: 'high',
    tab: 'defect-triage',
    title: 'A4 RCA on DEF-001 — Refund off by 1 cent on multi-item returns',
    agentChip: { id: 'A4', conf: 87 },
    meta: 'P1 · App Bug · Iksula Returns · source nightly R-2026-04-28-A · 6 runs · 2 stacks · RefundCalculator.ts:147',
    freshness: 'flagged 6h ago',
    badge: { label: 'needs Lead triage', tone: 'fail' },
    actions: [
      { label: 'Open RCA', variant: 'primary', routeTarget: 'F25-defect-detail-DEF-001' },
      { label: 'Assign', variant: 'secondary', routeTarget: 'F25-defect-assign-DEF-001' },
    ],
  },
];

export const APPROVAL_TABS: Array<{ id: ApprovalTab; label: string; count: number }> = [
  { id: 'all', label: 'All', count: 3 },
  { id: 'strategies', label: 'Strategies', count: 1 },
  { id: 'rtm-changes', label: 'RTM changes', count: 1 },
  { id: 'defect-triage', label: 'Defect triage', count: 1 },
];

// ---------------------------------------------------------------------------
// Right rail — evidence thread + suggested next + pinned references
// ---------------------------------------------------------------------------

export interface EvidenceEntry {
  agent: 'A1' | 'A2' | 'A4';
  body: string;
  conf?: { value: number; tone: 'pass' | 'warn' };
  freshness: string;
  chips: string[];
  awaiting?: boolean;
}

export const EVIDENCE_THREAD: EvidenceEntry[] = [
  {
    agent: 'A4',
    body: "RCA'd failure cluster → DEF-001",
    conf: { value: 0.87, tone: 'pass' },
    freshness: '8 min ago',
    chips: ['6 runs', '2 stacks', 'RefundCalculator.ts:147'],
  },
  {
    agent: 'A1',
    body: 'Generated 8 test cases from PRD RET-137',
    conf: { value: 0.91, tone: 'pass' },
    freshness: '18 min ago · awaiting Kishor review',
    chips: ['confluence/RET-137', '2 negative-path variants'],
  },
  {
    agent: 'A2',
    body: 'Flagged 3 likely duplicates in Refund Eligibility',
    conf: { value: 0.72, tone: 'warn' },
    freshness: '32 min ago · needs HITL',
    chips: ['TC-RET-001 ≈ 014 ≈ 022'],
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
  body: "Review A4's RCA on DEF-001 first — it blocks the refund regression, confidence is 0.87, and triage takes under 5 minutes.",
  primary: { label: 'Open RCA', routeTarget: 'F25-suggested-DEF-001' },
  secondary: { label: 'Later', routeTarget: 'F08b-suggested-snooze' },
};

export interface PinnedRef {
  title: string;
  status: 'approved' | 'gates';
  meta: string;
}

export const PINNED_REFS: PinnedRef[] = [
  { title: 'Returns refund runbook', status: 'approved', meta: 'v3 · updated 4d ago' },
  { title: 'Sprint 42 exit criteria', status: 'gates', meta: '3 / 5 gates · 2 open' },
];

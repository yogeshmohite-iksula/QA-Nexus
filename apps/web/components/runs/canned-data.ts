// F19 Run Console — Pattern A canned data + types.
//
// All payloads are static fixtures used while the BE WebSocket
// Gateway is still being built (Day-18 BE+1 task). Day-18 swap point:
// replace with real subscription to /runs/:runId topic via Gateway.
//
// Iksula canon (verbatim from PM1_UI_v2/Redesign Frame by claude
// design/F19 Run Console v2.html):
//   - Run: RUN-RET-2026-04-25-002 · Refund Flow — Sprint 42
//   - Active case: TC-RET-0247 (split-tender refund)
//   - Failed case: TC-RET-0342 (refund webhook retry exhausted)
//   - Curator dedup target: TC-RET-0211
//   - Sherlock: A4 · v1.4 · 87% confidence
//   - Order: #ORD-8841 · Refund ref: RFD-2645

export type CaseStatus = 'pass' | 'fail' | 'flaky' | 'queued' | 'running';
export type StepStatus = 'done' | 'current' | 'queued';
export type SegmentKey = 'pass' | 'fail' | 'flaky' | 'running' | 'queued';

// ───────── Run meta ─────────

export interface RunMeta {
  title: string;
  runId: string;
  env: string; // 'staging' | 'production' | etc.
  sprint: string;
  runner: string;
  startedAt: string;
  elapsed: string;
  eta: string;
  isLive: boolean;
}

export const RUN_META: RunMeta = {
  title: 'Refund Flow — Sprint 42',
  runId: 'RUN-RET-2026-04-25-002',
  env: 'staging',
  sprint: 'Sprint 42',
  runner: 'manual · Yogesh',
  startedAt: '14:38 UTC',
  elapsed: '26m 42s',
  eta: '~14m',
  isLive: true,
};

// ───────── Run meter ─────────

export interface RunMeterSegment {
  key: SegmentKey;
  count: number;
  widthPct: number; // 0-100
}

export const RUN_METER: { total: number; current: number; segments: RunMeterSegment[] } = {
  total: 218,
  current: 166,
  segments: [
    { key: 'pass', count: 142, widthPct: 65.1 },
    { key: 'fail', count: 18, widthPct: 8.3 },
    { key: 'flaky', count: 6, widthPct: 2.8 },
    { key: 'running', count: 1, widthPct: 0.5 },
    { key: 'queued', count: 51, widthPct: 23.3 },
  ],
};

// ───────── Pane 1 — Case list ─────────

export interface CaseRow {
  id: string; // 'TC-RET-0339'
  seq: string; // '139/218'
  title: string;
  titleMonoToken?: string; // optional inline-mono snippet
  status: CaseStatus;
  isActive?: boolean; // exactly one row should be active at a time
}

export const CASE_ROWS: CaseRow[] = [
  {
    id: 'TC-RET-0339',
    seq: '139/218',
    title: 'Empty cart redirects to product list',
    status: 'pass',
  },
  {
    id: 'TC-RET-0340',
    seq: '140/218',
    title: 'Initiate refund from order detail page',
    status: 'pass',
  },
  {
    id: 'TC-RET-0341',
    seq: '141/218',
    title: 'Partial refund splits original tender correctly',
    status: 'pass',
  },
  {
    id: 'TC-RET-0342',
    seq: '142/218',
    title: 'Refund webhook receives event',
    titleMonoToken: 'refund.retry.exhausted',
    status: 'fail',
  },
  {
    id: 'TC-RET-0343',
    seq: '143/218',
    title: 'Refund eligibility check on perishables',
    status: 'flaky',
  },
  {
    id: 'TC-RET-0344',
    seq: '144/218',
    title: 'Apply restocking fee on returned electronics',
    status: 'pass',
  },
  {
    id: 'TC-RET-0247',
    seq: '145/218',
    title: 'Process refund with split tender — gift card + credit card',
    status: 'running',
    isActive: true,
  },
  {
    id: 'TC-RET-0345',
    seq: '146/218',
    title: 'Multi-currency refund · INR → USD conversion',
    status: 'queued',
  },
  {
    id: 'TC-RET-0346',
    seq: '147/218',
    title: '3DS challenge invocation on refund reversal',
    status: 'queued',
  },
  {
    id: 'TC-RET-0347',
    seq: '148/218',
    title: 'Refund confirmation email content match',
    status: 'queued',
  },
  {
    id: 'TC-RET-0348',
    seq: '149/218',
    title: 'Recovery on payment processor 5xx',
    status: 'queued',
  },
  {
    id: 'TC-RET-0349',
    seq: '150/218',
    title: 'Apply promo refund credit (₹500 cap)',
    status: 'queued',
  },
];

export const CASE_COUNTS = {
  pass: 142,
  fail: 18,
  flaky: 6,
  running: 1,
};

// ───────── Pane 2 — Current case ─────────

export interface BddStep {
  num: number;
  status: StepStatus;
  keyword: 'Given' | 'When' | 'And' | 'Then';
  text: string;
  monoToken?: string;
  meta?: string; // "Completed in 1.2s" | "Executing · 4.7s elapsed"
  isExecuting?: boolean; // when true, meta wraps in live-tag
}

export interface CurrentCase {
  eyebrowLabel: string; // 'Now running'
  seqLabel: string; // '145 of 218'
  title: string;
  id: string;
  tags: { label: string; dim?: boolean }[];
  agent: { code: string; version: string }; // Composer v2.3
  owner: string;
  curatorDedupTargetId: string; // TC-RET-0211
  stepsHeadLabel: string; // 'Steps'
  stepsProgress: string; // '3 of 5 · BDD format'
  steps: BddStep[];
}

export const CURRENT_CASE: CurrentCase = {
  eyebrowLabel: 'Now running',
  seqLabel: '145 of 218',
  title: 'Process refund with split tender — gift card + credit card remainder',
  id: 'TC-RET-0247',
  tags: [{ label: 'Returns Core' }, { label: 'P1 · BDD', dim: true }],
  agent: { code: 'Composer', version: 'v2.3' },
  owner: 'Owner · Priya S.',
  curatorDedupTargetId: 'TC-RET-0211',
  stepsHeadLabel: 'Steps',
  stepsProgress: '3 of 5 · BDD format',
  steps: [
    {
      num: 1,
      status: 'done',
      keyword: 'Given',
      text: 'a customer has 1 active gift card with balance ₹500 on order #ORD-8841',
      meta: 'Completed in 1.2s · setup confirmed via API',
    },
    {
      num: 2,
      status: 'done',
      keyword: 'When',
      text: 'they request a full refund of ₹1,200 from the order detail page',
      meta: 'Completed in 0.8s · refund draft created',
    },
    {
      num: 3,
      status: 'current',
      keyword: 'And',
      text: 'the system splits the refund — ₹500 to gift card, ₹700 to original credit card',
      meta: 'Executing · 4.7s elapsed',
      isExecuting: true,
    },
    {
      num: 4,
      status: 'queued',
      keyword: 'Then',
      text: 'the gift card balance returns to ₹500 within 2s',
    },
    {
      num: 5,
      status: 'queued',
      keyword: 'And',
      text: 'the credit card receives ₹700 with refund reference',
      monoToken: 'RFD-2645',
    },
  ],
};

// ───────── Pane 3 — Evidence rail ─────────

export interface EvTab {
  key: 'last-failure' | 'screenshots' | 'console' | 'network' | 'dom';
  label: string;
  count?: number;
}

export const EV_TABS: EvTab[] = [
  { key: 'last-failure', label: 'Last failure', count: 1 },
  { key: 'screenshots', label: 'Screenshots', count: 3 },
  { key: 'console', label: 'Console' },
  { key: 'network', label: 'Network' },
  { key: 'dom', label: 'DOM' },
];

export interface CaptureRow {
  status: 'done' | 'streaming';
  label: string;
  time: string;
}

export const FAIL_CARD = {
  caseId: 'TC-RET-0342',
  statusLabel: 'Failed',
  title: 'Refund webhook',
  monoTitle: 'refund.retry.exhausted',
  timeAgo: '2m ago',
  captures: [
    { status: 'done' as const, label: 'Screenshot captured', time: '+0.3s' },
    { status: 'done' as const, label: 'Console logs · 47 entries', time: '+0.8s' },
    { status: 'done' as const, label: 'HAR file saved · 312 KB', time: '+1.4s' },
    { status: 'streaming' as const, label: 'Snapshotting environment…', time: '+2.1s' },
  ] satisfies CaptureRow[],
  screenshots: [
    { id: 'shot1', label: '01 · 1280×800', alt: 'Failure screen 01' },
    { id: 'shot2', label: '02 · 1280×800', alt: 'Failure screen 02' },
  ],
  consoleLines: [
    {
      ts: '14:51:23',
      tokens: [
        { k: '[webhook]', kind: 'key' },
        { k: ' received ', kind: 'plain' },
        { k: 'refund.retry.exhausted', kind: 'key' },
        { k: ' for ', kind: 'plain' },
        { k: 'order_8841', kind: 'key' },
      ],
    },
    {
      ts: '14:51:23',
      tokens: [
        { k: '[error]', kind: 'err' },
        { k: ' Expected status ', kind: 'plain' },
        { k: '200', kind: 'key' },
        { k: ', got ', kind: 'plain' },
        { k: '408 Timeout', kind: 'err' },
      ],
    },
    {
      ts: '14:51:24',
      tokens: [
        { k: 'AssertionError:', kind: 'err' },
        { k: ' webhook handler did not acknowledge within ', kind: 'plain' },
        { k: '5000ms', kind: 'key' },
      ],
    },
  ] as { ts: string; tokens: { k: string; kind: 'plain' | 'key' | 'err' | 'dim' }[] }[],
  envChips: ['Firefox 124', 'macOS 14.6', 'staging-iksula', 'build #4218'],
};

export interface SherlockLayer {
  name: string;
  pct: number;
}

export const SHERLOCK = {
  agentName: 'Sherlock',
  handle: 'A4 · v1.4',
  confidencePct: 87,
  likelyRootCause:
    'webhook handler timeout under retry storm — 5s threshold exceeded when ≥3 retries queue concurrently.',
  clusterNote: 'matches 2 prior incidents from 2026-03-14.',
  ctaLabel: 'Create defect from Sherlock RCA',
  layers: [
    { name: 'Stack', pct: 90 },
    { name: 'Env', pct: 80 },
    { name: 'Config', pct: 60 },
    { name: 'Code', pct: 50 },
    { name: 'Data', pct: 40 },
  ] satisfies SherlockLayer[],
};

// Keyboard hint footer
export const EV_KBD_HINTS: { key: string; label: string }[] = [
  { key: 'P', label: 'Pass' },
  { key: 'F', label: 'Fail' },
  { key: 'B', label: 'Block' },
  { key: 'S', label: 'Skip' },
  { key: 'N', label: 'Next' },
  { key: '⌘J', label: 'Toggle rail' },
];

// F22 Defect Detail — canned data extracted VERBATIM from
// PM1_UI_v2/Redesign Frame by claude design/F22 Defect Detail v2.html.
// Iksula Returns / RET project · DEF-RET-2104 · P0 incident.
//
// Hard Rule 17: every user-visible string in component files MUST trace
// back to this file (and ultimately to the v2 HTML). Do NOT invent data
// or "improve" wording. Re-source via scripts/extract-canned-data.mjs
// if you need to refresh from canonical.

import type {
  ProjectAnchor,
  Defect,
  ConfBarSegment,
  SherlockSummary,
  RcaLayer,
  SuggestedFix,
  EvidenceTab,
  EvidenceCard,
  SimilarDefect,
  DiscussionComment,
  RightRailMeta,
} from './types';

// -----------------------------------------------------------------------------
// Project anchor — Iksula data canon (CLAUDE.md: "Iksula Returns / key=RET")
// -----------------------------------------------------------------------------

export const projectAnchor: ProjectAnchor = {
  name: 'Iksula Returns',
  slug: 'iksula-returns',
  key: 'RET',
};

// -----------------------------------------------------------------------------
// Defect header — DEF-RET-2104 (canonical v2 L564-593)
// -----------------------------------------------------------------------------

export const defect: Defect = {
  id: 'DEF-RET-2104',
  title:
    'Refund > ₹10K stuck on PROCESSING — webhook timeout on payments-svc when partner-bank gateway exceeds 30s SLA',
  description:
    'P0 incident. Five customer-affecting refunds stalled in PROCESSING state for >6 hours. Why is the partner-bank callback not flushing through, and what restores the SLA?',
  followup:
    'Seen on 5 of last 12 refunds >₹10K (CITI-IN gateway). 0 of 47 on smaller refunds. SLA breach started after partner-bank pushed config change at 2026-04-25 03:14 IST.',
  severity: 'P0',
  status: 'In progress',
  statusTone: 'in-progress',
  filed: '4h ago',
  age: '04:18:32',
  jiraKey: 'RET-3392',
  jiraSynced: true,
  assignee: { name: 'Nitin G.', initials: 'NG' },
  reporter: { name: 'Nadim S.', initials: 'NS' },
  sourceRun: 'RUN-RET-2026-04-25-002',
  testCase: 'TC-RET-1043',
};

// -----------------------------------------------------------------------------
// Sherlock RCA — overall confidence + bar segments + summary hypothesis
// (canonical v2 L596-635)
// -----------------------------------------------------------------------------

export const overallConfidence = 0.94;

export const confidenceBar: ConfBarSegment[] = [
  { label: 'Network', pct: 14 },
  { label: 'Service', pct: 78 },
  { label: 'Data', pct: 6 },
  { label: 'UI', pct: 2 },
];

export const sherlockSummary: SherlockSummary = {
  generated: 'generated 18m ago',
  body: 'The partner-bank gateway is exceeding its 30s SLA on refunds >₹10K, and payments-svc::PartnerCallbackController times out at 5000ms waiting for a callback. The webhook ack never reaches our queue, so the refund row is stuck in PROCESSING until manual intervention.',
  followup:
    'Seen on 5 of last 12 refunds >₹10K (CITI-IN gateway). 0 of 47 on smaller refunds. SLA breach started after partner-bank pushed config change at 2026-04-25 03:14 IST.',
  evidence: [
    '5 affected refunds',
    '3 stack traces',
    'RefundService.ts:241',
    'PartnerCallbackController.kt',
  ],
};

// -----------------------------------------------------------------------------
// 5 RCA layers (canonical v2 L637-773)
// -----------------------------------------------------------------------------

export const rcaLayers: RcaLayer[] = [
  {
    id: 'stack',
    num: '01',
    icon: 'terminal',
    title: 'Stack',
    conf: 92,
    confTone: 'high',
    confLabel: 'HIGH',
    hint: '3 traces · variant A (5×)',
    defaultExpanded: true,
    payload: {
      kind: 'stack',
      variant: 'variant A (5×)',
      lines: [
        { raw: 'TimeoutException: webhook handler ack expected within 5000ms, got no response' },
        { raw: '  at RefundService.ts:241:18  ← Sherlock root-cause candidate', candidate: true },
        { raw: '  at PartnerCallbackController.handleAck (PartnerCallbackController.kt:88)' },
        { raw: '  at WebhookDispatcher.dispatch (WebhookDispatcher.kt:34)' },
        { raw: '  at PaymentsSvc.processRefund (PaymentsSvc.kt:412)' },
        { raw: '  at scheduler.tick (Scheduler.kt:117)' },
      ],
    },
    sherlockBox: {
      kind: 'HYPOTHESIS',
      body: "The 5-second timeout in RefundService.ts:241 is too tight for refunds >₹10K. Partner-bank averages 28s on these; our handler ack times out before the bank's webhook is dispatched.",
    },
  },
  {
    id: 'environment',
    num: '02',
    icon: 'public',
    title: 'Environment',
    conf: 85,
    confTone: 'high',
    confLabel: 'HIGH',
    hint: 'gateway + region + latency',
    defaultExpanded: true,
    payload: {
      kind: 'env',
      rows: [
        { k: 'partner_bank', v: 'CITI-IN refund gateway v3.4', note: '⚠ config push 03:14 IST' },
        { k: 'region', v: 'ap-south-1 (Mumbai) · payments-svc-blue' },
        { k: 'callback_p95', v: '28,420ms', note: '⚠ 5.6× baseline (5,080ms)' },
        { k: 'amount_filter', v: '> ₹10,000 (5 of 5 affected)' },
        { k: 'queue_depth', v: 'refund-pending: 142 rows (baseline 8)' },
        { k: 'cluster', v: 'payments-svc-blue · 4 replicas · k8s-prod-mum' },
      ],
    },
    sherlockBox: {
      kind: 'FINDING',
      body: "CITI-IN's config change at 03:14 IST tripled refund-callback latency. Our 5s handler timeout was sized for the old SLA. Gateway-internal change, not ours — but our timeout sizing is brittle.",
    },
  },
  {
    id: 'config',
    num: '03',
    icon: 'tune',
    title: 'Config',
    conf: 62,
    confTone: 'med',
    confLabel: 'MEDIUM',
    hint: 'timeouts + flags',
    defaultExpanded: true,
    payload: {
      kind: 'config',
      rows: [
        {
          k: 'refund.handler_timeout_ms',
          v: '5000',
          note: '← undersized; partner SLA is 30,000ms',
        },
        { k: 'refund.retry_strategy', v: 'exponential · max 3 · base 1000ms' },
        {
          k: 'flag.partner_callback_async',
          v: 'false',
          note: '← sync mode amplifies the timeout problem',
        },
        { k: 'flag.refund_circuit_breaker', v: 'true · trip threshold 50%' },
        { k: 'env.PAYMENTS_PARTNER_BANK', v: 'CITI-IN' },
      ],
    },
    sherlockBox: {
      kind: 'RECOMMENDATION',
      body: 'Bump handler_timeout_ms to 35,000 to cover partner SLA + 5s buffer, and flip partner_callback_async on — async mode survives gateway slowness without blocking the queue.',
    },
  },
  {
    id: 'code',
    num: '04',
    icon: 'code',
    title: 'Code',
    conf: 54,
    confTone: 'med',
    confLabel: 'MEDIUM',
    hint: '2 commits · lines 220–260',
    defaultExpanded: true,
    payload: {
      kind: 'code',
      commits: [
        {
          hash: '7c2e1f9',
          author: { name: 'Nitin G.', initials: 'NG' },
          date: '2026-04-22',
          message: '"Tighten refund handler timeout to 5s for SLA"',
          prNumber: 'PR #2104',
        },
        {
          hash: '3a91b04',
          author: { name: 'Deepak R.', initials: 'DR' },
          date: '2026-04-19',
          message: '"Refactor PartnerCallbackController for new gateway"',
          prNumber: 'PR #2087',
        },
      ],
      affectedLines: { file: 'RefundService.ts', range: '220–260' },
    },
    sherlockBox: {
      kind: 'HYPOTHESIS',
      body: "PR #2104 tightened the handler timeout for SLA reasons but didn't account for partner-bank's 30s ceiling on large refunds. Suggest revert + parameterize by amount.",
    },
  },
  {
    id: 'data',
    num: '05',
    icon: 'database',
    title: 'Data',
    conf: 32,
    confTone: 'low',
    confLabel: 'LOW',
    hint: 'HITL required',
    defaultExpanded: true,
    hitlRequired: true,
    payload: {
      kind: 'data',
      flag: 'HITL required',
      rows: [
        { k: 'affected_refunds', v: '5 rows · all amounts > ₹10,000 · CITI-IN gateway' },
        { k: 'cumulative_value', v: '₹68,420 (avg ₹13,684)' },
        { k: 'oldest_stuck_age', v: '06:14:22 · refund_id REF-9821' },
        { k: 'data_anomalies', v: 'none detected · row contents valid' },
      ],
    },
    sherlockBox: {
      kind: 'NOTE',
      body: 'Data layer is clean — no malformed payloads or schema drift. Included for completeness. HITL flag set because customer money is in flight; an operator must validate state before any restart.',
    },
  },
];

// -----------------------------------------------------------------------------
// Suggested fix (canonical v2 L776-787)
// -----------------------------------------------------------------------------

export const suggestedFix: SuggestedFix = {
  heading: 'Bump refund.handler_timeout_ms from 5,000 → 35,000 and enable async partner callback',
  body: "Two-line config change. Aligns timeout with partner-bank's 30s SLA + 5s buffer; async mode prevents the queue from blocking on slow gateways. View patch · Linked TC-RET-1043 exercises the new path.",
  applyLabel: 'Apply & re-run TC-RET-1043',
  linkedTestCase: 'TC-RET-1043',
};

// -----------------------------------------------------------------------------
// Evidence — tabs + 3 mini-cards (canonical v2 L791-844)
// -----------------------------------------------------------------------------

export const evidenceMeta = {
  source: 'RUN-RET-2026-04-25-002',
  capturedAutomatically: 'captured automatically',
};

export const evidenceTabs: EvidenceTab[] = [
  { id: 'console', icon: 'terminal', label: 'Console', count: 142, active: true },
  { id: 'screenshots', icon: 'image', label: 'Screenshots', count: 3 },
  { id: 'har', icon: 'lan', label: 'HAR network', count: 88 },
  { id: 'env', icon: 'computer', label: 'Env' },
  { id: 'activity', icon: 'history', label: 'Activity' },
  { id: 'comments', icon: 'forum', label: 'Comments', count: 3 },
];

export const evidenceCards: EvidenceCard[] = [
  {
    kind: 'log',
    title: 'refund-handler.log · trace REF-9821',
    logLines: [
      {
        tone: 'err',
        ts: '04:18:32',
        src: 'RefundService.ts:241',
        body: 'TimeoutException: webhook handler ack…',
      },
      { tone: 'info', ts: '', src: '', body: 'expected within 5000ms, got no response' },
      { tone: 'warn', ts: '04:18:33', src: 'PartnerCallback…', body: 'retry 1/3 · backoff 1000ms' },
      { tone: 'err', ts: '04:18:38', src: '', body: 'retry exhausted' },
    ],
  },
  {
    kind: 'chart-latency',
    title: 'partner_callback latency · 24h',
    latencyCaption: '03:14 config push',
  },
  {
    kind: 'chart-queue',
    title: 'refund-pending.dump · 04:18 UTC',
    queueRows: '142 rows',
    queueBaseline: 'baseline 8 · since 03:14 IST',
  },
];

// -----------------------------------------------------------------------------
// Curator — similar defects (canonical v2 L848-887)
// -----------------------------------------------------------------------------

export const similarDefects: SimilarDefect[] = [
  {
    similarity: 92,
    id: 'DEF-RET-1842',
    statusPill: { label: 'Closed 2026-02-08', tone: 'closed' },
    title:
      'Older webhook timeout on refund > ₹5K — resolved by raising handler_timeout_ms 3s → 5s in PR #1721',
    actions: [
      { label: 'View original' },
      { label: 'Link as related', primary: true },
      { label: 'Not a dup' },
    ],
  },
  {
    similarity: 79,
    id: 'DEF-RET-1979',
    statusPill: { label: 'In QA', tone: 'in-qa' },
    title: 'Refund stuck PROCESSING on retry path — owner Deepak R., currently in test on staging',
    actions: [{ label: 'View' }, { label: 'Not a dup' }],
  },
  {
    similarity: 71,
    id: 'DEF-RET-2031',
    statusPill: { label: 'Open', tone: 'open' },
    title: 'Long-running PG callback in load-balancer — adjacent symptom (LB-side, not handler)',
    actions: [{ label: 'View' }, { label: 'Not a dup' }],
  },
];

// -----------------------------------------------------------------------------
// Discussion thread — 3 comments + two-way Jira sync (canonical v2 L890-924)
// -----------------------------------------------------------------------------

export const discussionMeta = {
  count: 3,
  jiraKey: 'RET-3392',
  syncedAgo: '2m ago',
};

export const discussion: DiscussionComment[] = [
  {
    id: 'c1',
    author: { name: 'Nadim S.', initials: 'NS' },
    role: 'QA Nexus',
    ts: '· 4h ago · 04:22 UTC',
    body: 'Caught by nightly. Five refunds stuck in PROCESSING — all > ₹10K, all CITI-IN gateway. Customer money is in flight; treating as P0. Pinging Nitin.',
  },
  {
    id: 'c2',
    author: { name: 'Nitin G.', initials: 'NG' },
    role: 'Jira',
    ts: '· 3h ago · 05:14 UTC',
    body: "Owning. Sherlock's read tracks with what I see in PR #2104 — I tightened the handler timeout to 5s for SLA reasons but didn't anticipate CITI-IN's gateway change. Reverting to 30s with an amount-based ceiling on a branch.",
    jiraSync: true,
  },
  {
    id: 'c3',
    author: { name: 'Yogesh M', initials: 'YM' },
    role: 'QA LEAD',
    ts: '· 1h ago · 07:08 UTC',
    body: "Tagging this regression against Sprint 14. Block release until Nitin's fix lands and TC-RET-1043 goes green on staging. Composer already drafted a regression case for amount-based timeouts — auto-attached.",
    tags: [{ label: 'regression', tone: 'fail' }],
  },
];

// -----------------------------------------------------------------------------
// Right rail (canonical v2 L930-988)
// -----------------------------------------------------------------------------

export const rightRail: RightRailMeta = {
  defect: [
    { k: 'id', v: 'DEF-RET-2104' },
    { k: 'priority', v: 'P0', tone: 'fail' },
    { k: 'status', v: 'In progress', tone: 'warn' },
    { k: 'severity', v: 'customer-money-in-flight' },
    { k: 'filed', v: '2026-04-25 04:22 UTC · auto' },
    { k: 'age', v: '04:18:32', tone: 'warn' },
  ],
  people: {
    assigned: { name: 'Nitin G.', initials: 'NG' },
    reported: { name: 'Nadim S.', initials: 'NS' },
    watching: 'Yogesh M, Deepak R, +3',
  },
  linkage: [
    { k: 'source run', v: 'RUN-RET-2026-04-25-002' },
    { k: 'test case', v: 'TC-RET-1043' },
    { k: 'jira', v: 'RET-3392 ✓ synced', tone: 'pass' },
    { k: 'component', v: 'payments-svc::PartnerCallbackController' },
    { k: 'release', v: 'Sprint 14 · v3.4.2' },
  ],
  layerScores: [
    { num: '01', name: 'Stack', pct: 92, tone: 'high' },
    { num: '02', name: 'Environment', pct: 85, tone: 'high' },
    { num: '03', name: 'Config', pct: 62, tone: 'med' },
    { num: '04', name: 'Code', pct: 54, tone: 'med' },
    { num: '05', name: 'Data', pct: 32, tone: 'low' },
  ],
  recentActivity: [
    { actor: 'Yogesh M', text: 'tagged regression, blocked release', when: '1h ago', tag: 'warn' },
    { actor: 'Composer', text: 'drafted regression test TC-RET-1044', when: '1h ago', tag: 'ai' },
    {
      actor: 'Nitin G.',
      text: 'opened branch fix/refund-timeout-amount-aware',
      when: '2h ago',
      tag: 'now',
    },
    {
      actor: 'Sherlock',
      text: 'raised classification 87% → 94% after L2 evidence',
      when: '2h ago',
      tag: 'ai',
    },
    { actor: 'Nadim S.', text: 'assigned to Nitin G.', when: '3h ago' },
    {
      actor: 'Curator',
      text: 'flagged 3 similar defects (92 / 79 / 71%)',
      when: '3h ago',
      tag: 'ai',
    },
    { actor: 'Jira RET-3392', text: 'created & cross-linked', when: '4h ago', tag: 'ok' },
    {
      actor: 'Sherlock',
      text: 'filed defect from RUN-RET-2026-04-25-002',
      when: '4h ago',
      tag: 'ai',
    },
  ],
};

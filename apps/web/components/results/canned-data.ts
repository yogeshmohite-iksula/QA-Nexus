// F20 Run Results — Pattern A canonical-verbatim data per Hard Rule 17.
//
// EVERY string in this file traces directly to the canonical
// `PM1_UI_v2/Redesign Frame by claude design/F20 Run Results v2.html`.
// No invention permitted. When the HTML changes, this file is the
// ONLY place Pattern A content updates need to land — components
// consume from here.
//
// Hard Rule 17 (NEW Day-18, codified after F20 visual-gate FAIL):
// Open canonical HTML in Chrome as file://, copy semantic strings
// verbatim into this module, then build React components that
// CONSUME these constants. No hardcoded user-visible text in
// component files.

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type CaseStatus = 'pass' | 'fail' | 'flaky' | 'block' | 'skip';

export type ClusterConfidenceVariant = 'high' | 'med' | 'mixed';
export type ClusterClassKind = 'appbug' | 'env' | 'mixed';

export interface ResultsCaseRow {
  id: string; // e.g. "TC-RET-0247"
  title: string;
  status: CaseStatus;
  durationLabel: string; // pre-formatted, e.g. "12.4s"
  /** "2 defects" / "1 defect" / null (no badge when zero). */
  defectsLabel: string | null;
  isSelected?: boolean;
}

export interface ResultsSuite {
  name: string;
  counts: { total: number; pass: number; fail: number; flaky: number };
  rows: ResultsCaseRow[];
}

export interface ResultsCluster {
  /** "1" / "2" / "3" (num-dot value). */
  num: string;
  /** Used for stable React key + aria id. */
  id: string;
  title: string;
  /** "8/ 23" — split into the count + " / 23" rendering. */
  countN: number; // 8 / 4 / 11
  countOf: number; // 23 in every case (this run)
  /** Pre-formatted confidence label, e.g. "87% confidence",
   *  "91% env-category", "40–75% mixed". Used inside cl-conf pill. */
  confidenceLabel: string;
  confidenceVariant: ClusterConfidenceVariant;
  /** cl-class chip label: "App Bug" / "Env Issue" / "Mixed". */
  classLabel: string;
  classKind: ClusterClassKind;
  /** Multi-segment narrative — array of inline runs. `bold` and `code`
   *  segments map to <b>/<span class="code">. Keeps verbatim
   *  preservation possible while supporting inline emphasis. */
  narrative: NarrativeSegment[];
  /** 4 KPI tiles in cl-metric-strip. */
  metrics: { label: string; value: string }[];
}

export type NarrativeSegment =
  | { kind: 'text'; value: string }
  | { kind: 'bold'; value: string }
  | { kind: 'code'; value: string };

export interface SherlockSummaryHead {
  version: string; // "v1.4"
  badgeLabel: string; // "5-Layer RCA"
  analysisTimeLabel: string;
}

export interface SherlockHeadlineSegment {
  kind: 'text' | 'bold';
  value: string;
}

export interface SherlockConfPill {
  variant: 'high' | 'med' | 'low';
  label: string;
}

export type EvRailTabId = 'case' | 'shots' | 'console' | 'har' | 'env' | 'related';

export interface EvRailTab {
  id: EvRailTabId;
  label: string;
  /** Numeric badge next to label (Case "1", Shots "3", etc.); null
   *  for Env + Related per canonical. */
  badge: string | null;
}

export interface SelectedCasePanel {
  id: string; // "TC-RET-0342"
  title: TitleSegment[];
  errorHeadline: ErrorHeadlineSegment[];
  stackLines: StackLine[];
}

export type TitleSegment = { kind: 'text'; value: string } | { kind: 'mono'; value: string };

export type ErrorHeadlineSegment =
  | { kind: 'err'; value: string }
  | { kind: 'text'; value: string }
  | { kind: 'key'; value: string };

export interface StackLine {
  /** Always "  at" prefix per canonical, rendered dim. */
  atPrefix: string;
  symbol: string; // "RefundService.processRefund"
  location: string; // "(RefundService.ts:241:18)"
}

export interface StackTraceBlock {
  /** Section label, e.g. "Top stack trace · RefundService.ts:241". */
  label: string;
  errorLine: ErrorHeadlineSegment[];
  frames: StackLine[];
  /** Footer dim line, e.g. "  · 4 frames hidden ·". */
  hiddenFooter: string;
}

export interface EnvDiffRow {
  key: string; // "Browser" / "Payment SDK" / "Build"
  from: string;
  to: string;
}

export interface RelatedDefectRow {
  id: string; // "DEF-RET-1302"
  similarity: string; // "87%"
  status: string; // "Closed" / "Review"
  statusVariant: 'closed' | 'review';
}

export interface EvRailActionBtn {
  label: string;
  /** primary (--primary teal), violet (--secondary), secondary (raised border). */
  variant: 'primary' | 'violet' | 'secondary';
}

// -----------------------------------------------------------------------------
// Canonical content — verbatim from F20 v2.html
// -----------------------------------------------------------------------------

// L713-735 — run summary bar
export const F20_RUN_SUMMARY = {
  title: 'Refund Flow — Sprint 42',
  runId: 'RUN-RET-2026-04-25-002',
  donePillLabel: 'Done',
  totals: { total: 218, pass: 187, fail: 23, flaky: 8, block: 0, skip: 0 },
  pcts: { pass: '85.8%', fail: '10.6%', flaky: '3.7%' },
  startedRelative: '2h 14m ago',
  startedBy: 'Yogesh M.',
  durationLabel: '42m 18s',
  envPillLabel: 'staging-v3',
} as const;

// L740-808 — Sherlock RCA block header + headline + per-cluster confidence pills
export const F20_SHERLOCK_HEAD: SherlockSummaryHead = {
  version: 'v1.4',
  badgeLabel: '5-Layer RCA',
  analysisTimeLabel: 'Analysis ran in 9.2s · 3 clusters formed',
};

// L744 — sb-headline (with inline <b> emphasis preserved)
export const F20_SHERLOCK_HEADLINE: SherlockHeadlineSegment[] = [
  { kind: 'bold', value: '23 failures' },
  { kind: 'text', value: ' clustered into ' },
  { kind: 'bold', value: '3 root-cause groups' },
  { kind: 'text', value: '. Highest-confidence cluster has ' },
  { kind: 'bold', value: '8 cases' },
  { kind: 'text', value: ' pointing to the same upstream issue.' },
];

// L803-807 — sb-conf-row per-cluster confidence pills
export const F20_SHERLOCK_CONF_PILLS: SherlockConfPill[] = [
  { variant: 'high', label: 'Cluster 1 · 87%' },
  { variant: 'med', label: 'Cluster 2 · 91% env' },
  { variant: 'low', label: 'Cluster 3 · 40–75% mixed' },
];

export const F20_SHERLOCK_CONF_ROW_LABEL = 'Per-cluster confidence';

// L771-810 — Cluster 1 (high conf, app bug)
// L811-850 — Cluster 2 (med conf, env-bug)
// L851-???  — Cluster 3 (low/mixed conf)
export const F20_CLUSTERS: ResultsCluster[] = [
  {
    num: '1',
    id: 'cl1',
    title: 'Payment gateway 503 timeout — race on retry',
    countN: 8,
    countOf: 23,
    confidenceLabel: '87% confidence',
    confidenceVariant: 'high',
    classLabel: 'App Bug',
    classKind: 'appbug',
    narrative: [
      { kind: 'bold', value: 'Webhook handler timeout' },
      { kind: 'text', value: ' in ' },
      { kind: 'code', value: 'RefundService.processRefund:241' },
      {
        kind: 'text',
        value:
          ' when the payment gateway returns 503 and the system queues ≥3 retries concurrently. Reproducible on ',
      },
      { kind: 'bold', value: 'Firefox 124+' },
      { kind: 'text', value: '; matches ' },
      { kind: 'bold', value: '2 prior incidents' },
      { kind: 'text', value: ' from ' },
      { kind: 'code', value: '2026-03-14' },
      { kind: 'text', value: '.' },
    ],
    metrics: [
      { label: 'First fail', value: '8m 14s' },
      { label: 'Last fail', value: '31m 02s' },
      { label: 'Window', value: '22m 48s' },
      { label: 'Cases hit', value: '8 / 23' },
    ],
  },
  {
    num: '2',
    id: 'cl2',
    title: 'Calendar timezone drift — refund eligibility window',
    countN: 4,
    countOf: 23,
    confidenceLabel: '91% env-category',
    confidenceVariant: 'med',
    classLabel: 'Env Issue',
    classKind: 'env',
    narrative: [
      { kind: 'bold', value: 'Server timezone drift' },
      {
        kind: 'text',
        value:
          ' on staging-v3 — clock 11 minutes behind UTC. Cases asserting "refund within 30 days" cross the threshold incorrectly. Probable existing defect ',
      },
      { kind: 'code', value: 'DEF-RET-0089' },
      { kind: 'text', value: '.' },
    ],
    metrics: [
      { label: 'First fail', value: '14m 30s' },
      { label: 'Last fail', value: '28m 11s' },
      { label: 'Window', value: '13m 41s' },
      { label: 'Cases hit', value: '4 / 23' },
    ],
  },
  {
    num: '3',
    id: 'cl3',
    title: 'Distinct failures · 1 flagged flaky, 10 require triage',
    countN: 11,
    countOf: 23,
    confidenceLabel: '40–75% mixed',
    confidenceVariant: 'mixed',
    classLabel: 'Mixed',
    classKind: 'mixed',
    narrative: [
      { kind: 'bold', value: '11 unique failures' },
      {
        kind: 'text',
        value:
          ' across different features and env conditions. No clustering pattern detected. Sherlock has surfaced individual confidence scores below — ',
      },
      { kind: 'bold', value: 'requires manual triage' },
      { kind: 'text', value: '.' },
    ],
    // Cluster 3 has no metric strip per canonical (no clustering = no
    // window/first/last/hit stats); render an empty array.
    metrics: [],
  },
];

// Per-cluster action button row (canonical — same labels for all 3):
//   - Open defect (Sherlock-prefilled)  (btn-violet)
//   - Mark flaky                          (btn-cluster-secondary)
//   - Re-run case                         (btn-cluster-secondary)
//   - "View in Run Console →"             (btn-cluster-secondary link)
export const F20_CLUSTER_ACTIONS: { label: string; variant: EvRailActionBtn['variant'] }[] = [
  { label: 'Open defect (Sherlock-prefilled)', variant: 'violet' },
  { label: 'Mark flaky', variant: 'secondary' },
  { label: 'Re-run case', variant: 'secondary' },
];
export const F20_CLUSTER_RUN_CONSOLE_LINK = 'View in Run Console →';

// L920-1040 — three suite groups
export const F20_RESULTS_SUITES: ResultsSuite[] = [
  {
    name: 'Refund Core',
    counts: { total: 68, pass: 52, fail: 12, flaky: 4 },
    rows: [
      {
        id: 'TC-RET-0247',
        title: 'Process refund with split tender — gift card + credit card remainder',
        status: 'fail',
        durationLabel: '12.4s',
        defectsLabel: '2 defects',
      },
      {
        id: 'TC-RET-0342',
        title: 'Refund webhook receives refund.retry.exhausted — handler timeout',
        status: 'fail',
        durationLabel: '11.1s',
        defectsLabel: '1 defect',
        isSelected: true,
      },
      {
        id: 'TC-RET-0345',
        title: 'Refund exceeding order total — eligibility guard',
        status: 'fail',
        durationLabel: '10.8s',
        defectsLabel: '1 defect',
      },
    ],
  },
  {
    name: 'Auth & Session',
    counts: { total: 42, pass: 39, fail: 2, flaky: 1 },
    rows: [
      {
        id: 'TC-AUT-0089',
        title: 'Session refresh after refund-page idle > 15min',
        status: 'fail',
        durationLabel: '18.6s',
        defectsLabel: '1 defect',
      },
      {
        id: 'TC-AUT-0094',
        title: 'Re-auth challenge on refund completion above $5000',
        status: 'fail',
        durationLabel: '14.2s',
        defectsLabel: '1 defect',
      },
      {
        id: 'TC-AUT-0102',
        title: 'Session persistence across tab close + reopen',
        status: 'flaky',
        durationLabel: '9.7s',
        defectsLabel: null,
      },
    ],
  },
  {
    name: 'Payments & Tender',
    counts: { total: 54, pass: 45, fail: 7, flaky: 2 },
    rows: [
      {
        id: 'TC-PAY-0211',
        title: 'Refund-to-original-source on UPI mandate',
        status: 'fail',
        durationLabel: '9.4s',
        defectsLabel: '1 defect',
      },
      {
        id: 'TC-PAY-0218',
        title: 'Multi-currency reversal — INR cart, USD refund link',
        status: 'fail',
        durationLabel: '11.8s',
        defectsLabel: '1 defect',
      },
      {
        id: 'TC-PAY-0224',
        title: 'Refund callback receives gateway-required field',
        status: 'pass',
        durationLabel: '7.8s',
        defectsLabel: null,
      },
    ],
  },
];

// Results table filter pills + sort
export const F20_RESULTS_FILTER_TABS = ['All', 'Failures', 'Flaky', 'Regressions'] as const;
export const F20_RESULTS_SORT_LABEL = 'Sort: Suite';

// L1067-1200 — Ev-rail
export const F20_EV_RAIL_HEAD = {
  title: 'Evidence',
  contextLabel: 'Selected · ',
  contextName: 'TC-RET-0342',
  closeAriaLabel: 'Close evidence rail',
} as const;

// L1077-1086 — 6 tabs, badges where present
export const F20_EV_RAIL_TABS: EvRailTab[] = [
  { id: 'case', label: 'Case', badge: '1' },
  { id: 'shots', label: 'Shots', badge: '3' },
  { id: 'console', label: 'Console', badge: '2' },
  { id: 'har', label: 'HAR', badge: '6' },
  { id: 'env', label: 'Env', badge: null },
  { id: 'related', label: 'Related', badge: null },
];

// L1088-1121 — Selected case panel
export const F20_SELECTED_CASE: SelectedCasePanel = {
  id: 'TC-RET-0342',
  title: [
    { kind: 'text', value: 'Refund webhook receives ' },
    { kind: 'mono', value: 'refund.retry.exhausted' },
    { kind: 'text', value: ' — handler timeout' },
  ],
  errorHeadline: [
    { kind: 'err', value: 'AssertionError:' },
    { kind: 'text', value: ' webhook handler did not acknowledge within ' },
    { kind: 'key', value: '5000ms' },
  ],
  stackLines: [
    {
      atPrefix: '  at',
      symbol: 'RefundService.processRefund',
      location: '(RefundService.ts:241:18)',
    },
    {
      atPrefix: '  at',
      symbol: 'WebhookHandler.dispatch',
      location: '(WebhookHandler.ts:88:12)',
    },
  ],
};

// L1132-1143 — Top stack trace
export const F20_STACK_TRACE: StackTraceBlock = {
  label: 'Top stack trace · RefundService.ts:241',
  errorLine: [
    { kind: 'err', value: 'TimeoutError' },
    { kind: 'text', value: ': webhook ack expected within ' },
    { kind: 'key', value: '5000ms' },
    { kind: 'text', value: ', got ' },
    { kind: 'err', value: 'no response' },
  ],
  frames: [
    {
      atPrefix: '  at',
      symbol: 'RefundService.processRefund',
      location: '(RefundService.ts:241:18)',
    },
    {
      atPrefix: '  at',
      symbol: 'WebhookHandler.dispatch',
      location: '(WebhookHandler.ts:88:12)',
    },
    {
      atPrefix: '  at',
      symbol: 'RefundFlow.complete',
      location: '(RefundFlow.ts:412:6)',
    },
  ],
  hiddenFooter: '  · 4 frames hidden ·',
};

// L1144-1156 — Environment diff section
export const F20_ENV_DIFF = {
  sectionLabel: 'Environment diff (vs last green run)',
  rows: [
    { key: 'Browser', from: 'Firefox 120', to: 'Firefox 124' },
    { key: 'Payment SDK', from: 'v3.2.1', to: 'v3.4.0' },
    { key: 'Build', from: '#4203', to: '#4218' },
  ] as EnvDiffRow[],
};

// L1157-1180 — Related defects (Curator)
export const F20_RELATED_DEFECTS = {
  sectionLabel: 'Related defects · Curator',
  rows: [
    { id: 'DEF-RET-1302', similarity: '87%', status: 'Closed', statusVariant: 'closed' },
    { id: 'DEF-RET-1298', similarity: '63%', status: 'Review', statusVariant: 'review' },
  ] as RelatedDefectRow[],
};

// L1181-1199 — Run-level sticky action footer in ev-rail
export const F20_EV_RAIL_ACTIONS: EvRailActionBtn[] = [
  { label: 'Open defect (Sherlock-prefilled)', variant: 'violet' },
  { label: 'Mark flaky', variant: 'secondary' },
  { label: 'Re-run case', variant: 'secondary' },
];
export const F20_EV_RAIL_VIEW_RUN_CONSOLE = 'View in Run Console →';

// L580-640 — Run-level sticky footer (center pane bottom)
export const F20_RUN_LEVEL_ACTIONS = {
  exportLabel: 'Export results (CSV)',
  rerunFailedLabel: 'Re-run failed only',
  shareLabel: 'Share this run',
} as const;

// Page-level eyebrow above clusters
export const F20_FAILURE_CLUSTERS_EYEBROW = 'Failure clusters';
export const F20_FAILURE_CLUSTERS_INTRO =
  '3 distinct failure modes detected by Sherlock RCA. Open a defect from any cluster (Sherlock pre-fills the description).';

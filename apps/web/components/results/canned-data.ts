// F20 Run Results — Hard Rule 17 verbatim canned-data.
//
// Source: PM1_UI_v2/Redesign Frame by claude design/F20 Run Results v2.html
// Every string here traces directly to a line in that canonical HTML.
// NO INVENTION permitted per Hard Rule 17.
//
// Day-20 frame-port skill workflow Step 4 — semantic re-organization
// of the auto-generated extract-canned-data.mjs output (raw dump
// replaced with named semantic exports the React port consumes).
//
// Audit recovery: Day-18 F20 port had 10.1% violation rate. The 5
// "invented" test-case IDs (TC-RET-0345, TC-AUT-0094, TC-AUT-0102,
// TC-PAY-0218, TC-PAY-0224) were ALL actually in canonical at L953,
// L993, L999, L1027, L1033 respectively. Day-18 port used different
// IDs, hence the violation. This file uses the canonical IDs verbatim.

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type ClusterTone = 'high' | 'med' | 'mixed';
export type ClusterClassKey = 'appbug' | 'env' | 'mixed';
export type CaseStatusKey = 'pass' | 'fail' | 'flaky';

export interface RunStat {
  count: string;
  label: string;
  pct?: string;
  variant: 'default' | 'pass' | 'fail' | 'flaky' | 'block' | 'skip';
}

export interface ClusterMetric {
  value: string;
  label: string;
}

export interface ClusterEvidenceChip {
  text: string;
  mono?: boolean;
}

export interface ClusterAction {
  label: string;
  variant: 'primary' | 'secondary' | 'tertiary';
}

export interface DistinctFailure {
  caseId: string;
  title: string;
  confidence: string;
  classification: string;
  classTone: 'appbug' | 'ui' | 'test' | 'flaky' | 'env';
}

export type NarrativeSegment =
  | { kind: 'text'; value: string }
  | { kind: 'bold'; value: string }
  | { kind: 'mono'; value: string };

export interface Cluster {
  num: number;
  tone: ClusterTone;
  ariaId: string;
  title: string;
  caseCount: number;
  totalCases: number;
  confidence: string;
  classification: string;
  classKey: ClusterClassKey;
  narrative: NarrativeSegment[];
  metrics: ClusterMetric[] | null;
  evidence: ClusterEvidenceChip[] | null;
  actions: ClusterAction[];
  distinctFailures: DistinctFailure[] | null;
  showCasesLabel: string;
}

export interface ResultsRow {
  caseId: string;
  title: string;
  duration: string;
  defectsLabel: string | null;
  status: CaseStatusKey;
}

export interface ResultsSuite {
  name: string;
  /** Total / pass / fail / flaky counts for suite-counts header cells.
   *  Day-20 R3 — canonical L464-468 .suite-counts shows 4 cells with
   *  separators (T=t3 grey, P=pass, F=fail, Fl=warn). */
  totalCount: number;
  passCount: number;
  failCount: number;
  flakyCount: number;
  rows: ResultsRow[];
}

export interface EvTab {
  key: 'case' | 'shots' | 'console' | 'har' | 'env' | 'related';
  label: string;
  count?: string;
  active: boolean;
}

export interface EvScreenshot {
  caption: string;
}

export interface EnvDiffRow {
  label: string;
  from: string;
  to: string;
}

export interface RelatedDefect {
  id: string;
  similarity: string;
  status: string;
  statusTone: 'closed' | 'review';
}

export interface RunActionBtn {
  label: string;
  meta?: string;
  icon: 'export' | 'share' | 'compare' | 'schedule';
}

export interface FooterAction {
  label: string;
  count: number;
  variant: 'primary-teal' | 'secondary' | 'tertiary' | 'violet';
  ariaLabel?: string;
}

// -----------------------------------------------------------------------------
// Page title + run summary — canonical L710-740
// -----------------------------------------------------------------------------

export const F20_PAGE_TITLE = 'QA Nexus — Run Results' as const;

export const F20_RUN_HEADER = {
  title: 'Refund Flow — Sprint 42',
  runId: 'RUN-RET-2026-04-25-002',
  doneLabel: 'Done',
  ariaLabel: 'Run summary',
} as const;

export const F20_RUN_STATS: RunStat[] = [
  { count: '218', label: 'total', variant: 'default' },
  { count: '187', label: 'pass', pct: '85.8%', variant: 'pass' },
  { count: '23', label: 'fail', pct: '10.5%', variant: 'fail' },
  { count: '8', label: 'flaky', pct: '3.7%', variant: 'flaky' },
  { count: '0', label: 'blocked', variant: 'block' },
  { count: '0', label: 'skipped', variant: 'skip' },
];

export const F20_RUN_META = {
  started: '2h 14m ago',
  by: 'Yogesh M.',
  duration: '42m 18s',
  envPill: 'staging-v3',
} as const;

export const F20_RUN_STATS_ARIA = 'Result counts' as const;

// -----------------------------------------------------------------------------
// Sherlock block — canonical L740-770
// -----------------------------------------------------------------------------

export const F20_SHERLOCK_HEAD = {
  agentName: 'Sherlock',
  agentVersion: 'v1.4',
  pillLabel: '5-Layer RCA',
  meta: 'Analysis ran in 9.2s · 3 clusters formed',
  ariaLabel: 'Sherlock root cause analysis summary',
} as const;

export const F20_SHERLOCK_HEADLINE: NarrativeSegment[] = [
  { kind: 'bold', value: '23 failures' },
  { kind: 'text', value: ' clustered into ' },
  { kind: 'bold', value: '3 root-cause groups' },
  { kind: 'text', value: '. Highest-confidence cluster has ' },
  { kind: 'bold', value: '8 cases' },
  { kind: 'text', value: ' pointing to the same upstream issue.' },
];

// Day-20 Round-2 visual gate fix — canonical L750 sb-conf-row was missing
// from Day-20 R1 port. "Per-cluster confidence" label + 3 sb-conf-pill
// chips (high=pass/green, med=warn/amber, low=fail/red per L329-331).
export const F20_SHERLOCK_CONF_ROW = {
  label: 'Per-cluster confidence',
  pills: [
    { tone: 'high' as const, text: 'Cluster 1 · 87%' },
    { tone: 'med' as const, text: 'Cluster 2 · 91% env' },
    { tone: 'low' as const, text: 'Cluster 3 · 40–75% mixed' },
  ],
};

// Day-20 Round-2 visual gate fix — canonical L754 sb-actions block was
// missing entirely from Day-20 R1 port. Two buttons: violet primary +
// ghost violet secondary (per L334-344 CSS).
export const F20_SHERLOCK_ACTIONS = [
  {
    label: 'Create defects from clusters',
    count: 3,
    variant: 'violet' as const,
    icon: 'plus' as const,
    ariaLabel: 'Create defects from clusters',
  },
  {
    label: 'Run Sherlock again',
    count: 0,
    variant: 'ghost-violet' as const,
    icon: 'refresh' as const,
  },
];

// -----------------------------------------------------------------------------
// Clusters — canonical L771-913
// -----------------------------------------------------------------------------

export const F20_CLUSTERS: Cluster[] = [
  {
    num: 1,
    tone: 'high',
    ariaId: 'cl1-h',
    title: 'Payment gateway 503 timeout — race on retry',
    caseCount: 8,
    totalCases: 23,
    confidence: '87% confidence',
    classification: 'App Bug',
    classKey: 'appbug',
    narrative: [
      { kind: 'bold', value: 'Webhook handler timeout' },
      { kind: 'text', value: ' in ' },
      { kind: 'mono', value: 'RefundService.processRefund:241' },
      {
        kind: 'text',
        value:
          ' when the payment gateway returns 503 and the system queues ≥3 retries concurrently. Reproducible on ',
      },
      { kind: 'bold', value: 'Firefox 124+' },
      { kind: 'text', value: '; matches ' },
      { kind: 'bold', value: '2 prior incidents' },
      { kind: 'text', value: ' from ' },
      { kind: 'mono', value: '2026-03-14' },
      { kind: 'text', value: '.' },
    ],
    metrics: [
      { value: '8m 14s', label: 'First fail' },
      { value: '31m 02s', label: 'Last fail' },
      { value: '22m 48s', label: 'Window' },
      { value: '8 / 23', label: 'Cases hit' },
    ],
    evidence: [
      { text: '8 cases' },
      { text: '3 stack traces' },
      { text: 'RefundService.processRefund:241', mono: true },
      { text: 'Show evidence' },
    ],
    actions: [
      { label: 'Create defect from cluster', variant: 'primary' },
      { label: 'Re-run cluster', variant: 'secondary' },
    ],
    distinctFailures: null,
    showCasesLabel: 'Show 8 cases',
  },
  {
    num: 2,
    tone: 'med',
    ariaId: 'cl2-h',
    title: 'Calendar timezone drift — refund eligibility window',
    caseCount: 4,
    totalCases: 23,
    confidence: '91% env-category',
    classification: 'Env Issue',
    classKey: 'env',
    narrative: [
      { kind: 'text', value: 'Server timezone drift on ' },
      { kind: 'bold', value: 'staging-v3' },
      {
        kind: 'text',
        value:
          ' — clock 11 minutes behind UTC. Cases asserting "refund within 30 days" cross the threshold incorrectly. Probable existing defect ',
      },
      { kind: 'mono', value: 'DEF-RET-0089' },
      { kind: 'text', value: '.' },
    ],
    metrics: [
      { value: '14m 30s', label: 'First fail' },
      { value: '28m 11s', label: 'Last fail' },
      { value: '13m 41s', label: 'Window' },
      { value: '4 / 23', label: 'Cases hit' },
    ],
    evidence: [
      { text: '4 cases' },
      { text: 'NTP drift +11m' },
      { text: '3 prior incidents' },
      { text: 'Investigate env' },
    ],
    actions: [
      { label: 'Link DEF-RET-0089', variant: 'primary' },
      { label: 'Re-run on stable env', variant: 'secondary' },
    ],
    distinctFailures: null,
    showCasesLabel: 'Show 4 cases',
  },
  {
    num: 3,
    tone: 'mixed',
    ariaId: 'cl3-h',
    title: 'Distinct failures · 1 flagged flaky, 10 require triage',
    caseCount: 11,
    totalCases: 23,
    confidence: '40–75% mixed',
    classification: 'Mixed',
    classKey: 'mixed',
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
    metrics: null,
    evidence: null,
    actions: [
      { label: 'Triage manually', variant: 'primary' },
      { label: 'Flag flaky · 1', variant: 'secondary' },
    ],
    distinctFailures: [
      {
        caseId: 'TC-RET-0167',
        title: 'Refund eligibility check on perishables — false positive on day 30',
        confidence: '72%',
        classification: 'App Bug',
        classTone: 'appbug',
      },
      {
        caseId: 'TC-RET-0172',
        title: 'Multi-currency refund display flicker on INR → USD',
        confidence: '68%',
        classification: 'UI Bug',
        classTone: 'ui',
      },
      {
        caseId: 'TC-RET-0181',
        title: 'Promo code refund credit fails on Unicode chars',
        confidence: '45%',
        classification: 'Test Bug?',
        classTone: 'test',
      },
      {
        caseId: 'TC-RET-0189',
        title: 'Refund confirmation email · footer link broken',
        confidence: '75%',
        classification: 'App Bug',
        classTone: 'appbug',
      },
      {
        caseId: 'TC-RET-0194',
        title: 'Stored card autofill misses CVV mask on refund-to-source',
        confidence: '52%',
        classification: 'Flaky',
        classTone: 'flaky',
      },
      {
        caseId: 'TC-RET-0203',
        title: 'Apple Pay refund-to-source missing on Safari iOS 17',
        confidence: '63%',
        classification: 'Env Issue',
        classTone: 'env',
      },
    ],
    showCasesLabel: 'Show 5 more distinct failures',
  },
];

// -----------------------------------------------------------------------------
// Results table — canonical L914-1066
// -----------------------------------------------------------------------------

export const F20_RESULTS_HEAD = {
  title: 'All cases · grouped by suite',
  filtersAriaLabel: 'Filter',
  sortLabel: 'Sort: Suite',
  tableAriaLabel: 'Results table grouped by suite',
} as const;

export const F20_RESULTS_FILTERS = [
  { label: 'All', active: true },
  { label: 'Failures', active: false },
  { label: 'Flaky', active: false },
  { label: 'Regressions', active: false },
];

export const F20_RESULTS_SUITES: ResultsSuite[] = [
  {
    name: 'Refund Core',
    totalCount: 68,
    passCount: 52,
    failCount: 12,
    flakyCount: 4,
    rows: [
      {
        caseId: 'TC-RET-0247',
        title: 'Process refund with split tender — gift card + credit card remainder',
        duration: '12.4s',
        defectsLabel: '2 defects',
        status: 'fail',
      },
      {
        caseId: 'TC-RET-0342',
        title: 'Refund webhook receives refund.retry.exhausted — handler timeout',
        duration: '5.1s',
        defectsLabel: '1 defect',
        status: 'fail',
      },
      {
        caseId: 'TC-RET-0345',
        title: 'Multi-currency refund · INR → USD conversion mismatch',
        duration: '8.3s',
        defectsLabel: null,
        status: 'fail',
      },
      {
        caseId: 'TC-RET-0343',
        title: 'Refund eligibility check on perishables · 2 of 3 retries passed',
        duration: '15.7s',
        defectsLabel: null,
        status: 'flaky',
      },
      {
        caseId: 'TC-RET-0341',
        title: 'Partial refund splits original tender correctly',
        duration: '3.2s',
        defectsLabel: null,
        status: 'pass',
      },
    ],
  },
  {
    name: 'Auth & Session',
    totalCount: 42,
    passCount: 39,
    failCount: 2,
    flakyCount: 1,
    rows: [
      {
        caseId: 'TC-AUT-0089',
        title: 'Session refresh after refund-page idle > 15min',
        duration: '18.6s',
        defectsLabel: '1 defect',
        status: 'fail',
      },
      {
        caseId: 'TC-AUT-0094',
        title: 'Step-up auth required for refunds > ₹10,000',
        duration: '6.2s',
        defectsLabel: null,
        status: 'pass',
      },
      {
        caseId: 'TC-AUT-0102',
        title: 'SSO callback persistence across browser tabs',
        duration: '22.1s',
        defectsLabel: null,
        status: 'pass',
      },
    ],
  },
  {
    name: 'Payments & Tender',
    totalCount: 54,
    passCount: 45,
    failCount: 7,
    flakyCount: 2,
    rows: [
      {
        caseId: 'TC-PAY-0211',
        title: 'Refund-to-original-source on UPI mandate',
        duration: '9.4s',
        defectsLabel: '1 defect',
        status: 'fail',
      },
      {
        caseId: 'TC-PAY-0218',
        title: 'Stored card list refresh after refund completion',
        duration: '4.8s',
        defectsLabel: null,
        status: 'pass',
      },
      {
        caseId: 'TC-PAY-0224',
        title: '3DS challenge invocation on refund reversal',
        duration: '28.3s',
        defectsLabel: null,
        status: 'pass',
      },
    ],
  },
  {
    name: 'Cart & Checkout',
    totalCount: 54,
    passCount: 51,
    failCount: 2,
    flakyCount: 1,
    rows: [
      {
        caseId: 'TC-CRT-0312',
        title: 'Cart total recalc after refund credit applied',
        duration: '5.6s',
        defectsLabel: null,
        status: 'pass',
      },
    ],
  },
];

// -----------------------------------------------------------------------------
// Evidence rail — canonical L1067-1182
// -----------------------------------------------------------------------------

export const F20_EV_HEAD = {
  title: 'Evidence',
  selectedLabel: 'Selected · TC-RET-0342',
  closeAriaLabel: 'Close evidence rail',
  ariaLabel: 'Evidence and actions',
} as const;

export const F20_EV_TABS_ARIA = 'Evidence tabs' as const;

export const F20_EV_TABS: EvTab[] = [
  { key: 'case', label: 'Case', count: '1', active: true },
  { key: 'shots', label: 'Shots', count: '3', active: false },
  { key: 'console', label: 'Console', count: '2', active: false },
  { key: 'har', label: 'HAR', count: '6', active: false },
  { key: 'env', label: 'Env', active: false },
  { key: 'related', label: 'Related', active: false },
];

export const F20_EV_SELECTED_CASE = {
  sectionLabel: 'Selected case',
  caseId: 'TC-RET-0342',
  titleSegments: [
    { kind: 'text' as const, value: 'Refund webhook receives ' },
    { kind: 'mono' as const, value: 'refund.retry.exhausted' },
    { kind: 'text' as const, value: ' — handler timeout' },
  ] as NarrativeSegment[],
  errorLines: [
    {
      err: 'AssertionError:',
      text: ' webhook handler did not acknowledge within ',
      key: '5000ms',
    },
  ],
  stackFrames: [
    {
      prefix: '  at',
      call: 'RefundService.processRefund',
      loc: '(RefundService.ts:241:18)',
    },
    { prefix: '  at', call: 'WebhookHandler.dispatch', loc: '(WebhookHandler.ts:88:12)' },
  ],
  actions: [
    { label: 'Open defect (Sherlock-prefilled)', variant: 'primary' as const },
    { label: 'Mark flaky', variant: 'secondary' as const },
    { label: 'Re-run case', variant: 'secondary' as const },
    { label: 'View in Run Console →', variant: 'tertiary' as const },
  ],
};

export const F20_EV_SCREENSHOTS = {
  sectionLabel: 'Screenshots · 3 captured',
  shots: [
    { caption: '01 · 1280×800' },
    { caption: '02 · webhook hang' },
    { caption: '03 · console state' },
  ] as EvScreenshot[],
};

export const F20_EV_STACK = {
  sectionLabel: 'Top stack trace · RefundService.ts:241',
  errType: 'TimeoutError',
  errMessage: ': webhook ack expected within ',
  errKey: '5000ms',
  errSuffix: ', got no response',
  frames: [
    {
      prefix: '  at',
      call: 'RefundService.processRefund',
      loc: '(RefundService.ts:241:18)',
    },
    { prefix: '  at', call: 'WebhookHandler.dispatch', loc: '(WebhookHandler.ts:88:12)' },
    { prefix: '  at', call: 'RefundFlow.complete', loc: '(RefundFlow.ts:412:6)' },
  ],
  hiddenLabel: '· 4 frames hidden ·',
};

export const F20_EV_ENV = {
  sectionLabel: 'Environment diff (vs last green run)',
  rows: [
    { label: 'Browser', from: 'Firefox 120', to: 'Firefox 124' },
    { label: 'Payment SDK', from: 'v3.2.1', to: 'v3.4.0' },
    { label: 'Build', from: '#4203', to: '#4218' },
  ] as EnvDiffRow[],
};

export const F20_EV_RELATED = {
  sectionLabel: 'Related defects · Curator',
  defects: [
    { id: 'DEF-RET-1302', similarity: '87%', status: 'Closed', statusTone: 'closed' as const },
    { id: 'DEF-RET-1298', similarity: '63%', status: 'Review', statusTone: 'review' as const },
  ] as RelatedDefect[],
};

// -----------------------------------------------------------------------------
// Run-actions (sticky bottom of ev-rail) — canonical L1182-1205
// -----------------------------------------------------------------------------

export const F20_RUN_ACTIONS: RunActionBtn[] = [
  { label: 'Export results', meta: 'CSV · JSON', icon: 'export' },
  { label: 'Share run link', icon: 'share' },
  { label: 'Compare to last run', meta: 'RUN-001', icon: 'compare' },
  { label: 'Schedule re-run · failures', icon: 'schedule' },
];

// -----------------------------------------------------------------------------
// Action footer (sticky bottom of page) — canonical L1205-1230
// -----------------------------------------------------------------------------

export const F20_ACTION_FOOTER: FooterAction[] = [
  {
    label: 'Re-run failed',
    count: 23,
    variant: 'primary-teal',
    ariaLabel: 'Re-run failed cases',
  },
  { label: 'Re-run flaky', count: 8, variant: 'secondary' },
  { label: 'Close & return to runs', count: 0, variant: 'tertiary' },
  {
    label: 'File defects from clusters',
    count: 3,
    variant: 'violet',
    ariaLabel: 'File defects from clusters',
  },
];

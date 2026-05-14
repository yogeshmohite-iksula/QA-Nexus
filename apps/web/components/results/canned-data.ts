// F20 Run Results — Pattern A canned data (M4 Day-18, PR #147).
//
// Iksula canon per CLAUDE.md §"Iksula data canon":
//   - Project: Iksula Returns (key: RET) · Sprint 42 Day 9 of 14
//   - Anchor run: RUN-RET-2026-04-25-002 "Refund Flow — Sprint 42"
//   - Env: staging-v3 · started 2h 14m ago · duration 42m 18s
//   - Total: 218 cases · 187 pass / 23 fail (10.6%) / 8 flaky (3.7%)
//     / 0 blocked / 0 skipped
//   - 3 suites: Refund Core (68) · Refund Policy Edge Cases (96) ·
//     Payments (54)
//   - 3 Sherlock RCA clusters formed in 9.2s
//
// Pattern B will swap to:
//   - GET /api/runs/:runId/summary (counts + meta)
//   - GET /api/runs/:runId/suites (grouped cases)
//   - GET /api/runs/:runId/clusters (Sherlock RCA cluster cards)
//   - GET /api/runs/:runId/cases/:caseId/evidence (right rail)

export type CaseStatus = 'pass' | 'fail' | 'flaky' | 'block' | 'skip';

export interface ResultsCaseRow {
  id: string;
  title: string;
  status: CaseStatus;
  durationLabel: string; // "12.4s" / "9.4s" — pre-formatted for display
  defectCount: number; // 0 = no defects
  isSelected?: boolean;
}

export interface ResultsSuite {
  name: string;
  counts: { total: number; pass: number; fail: number; flaky: number };
  rows: ResultsCaseRow[];
}

export type ClusterConfidence = 'high' | 'med' | 'low';

export interface ResultsCluster {
  id: string;
  title: string;
  className: string; // canonical .cl-class — e.g. "RefundService.processRefund"
  confidence: ClusterConfidence;
  confidenceLabel: string; // "Conf · 87% · high" — pre-formatted
  caseCount: number; // "Show 8 cases"
  narrative: string; // multi-sentence root-cause summary
  metrics: { label: string; value: string }[]; // metric strip KPIs
}

export interface RunResultsMeta {
  runId: string;
  title: string;
  startedRelative: string; // "2h 14m ago"
  startedBy: string; // "Yogesh M."
  durationLabel: string; // "42m 18s"
  envLabel: string; // "staging-v3"
  totals: { total: number; pass: number; fail: number; flaky: number; block: number; skip: number };
  totalPct: { pass: number; fail: number; flaky: number }; // 85.8 / 10.6 / 3.7
}

export interface SherlockSummary {
  version: string; // "v1.4"
  badgeLabel: string; // "5-Layer RCA"
  analysisTimeLabel: string; // "Analysis ran in 9.2s · 3 clusters formed"
}

export interface EvidenceRailContext {
  selectedCaseId: string;
  selectedCaseTitle: string;
  selectedSuiteName: string;
  evidence: { label: string; value: string }[]; // simple kv pairs for the rail
  actions: { label: string; tone: 'primary' | 'secondary' | 'fail' | 'warn' }[];
}

// -----------------------------------------------------------------------------
// Fixtures
// -----------------------------------------------------------------------------

export const RESULTS_META: RunResultsMeta = {
  runId: 'RUN-RET-2026-04-25-002',
  title: 'Refund Flow — Sprint 42',
  startedRelative: '2h 14m ago',
  startedBy: 'Yogesh M.',
  durationLabel: '42m 18s',
  envLabel: 'staging-v3',
  totals: { total: 218, pass: 187, fail: 23, flaky: 8, block: 0, skip: 0 },
  totalPct: { pass: 85.8, fail: 10.6, flaky: 3.7 },
};

export const SHERLOCK_SUMMARY: SherlockSummary = {
  version: 'v1.4',
  badgeLabel: '5-Layer RCA',
  analysisTimeLabel: 'Analysis ran in 9.2s · 3 clusters formed',
};

export const RESULTS_CLUSTERS: ResultsCluster[] = [
  {
    id: 'cl-1',
    title: 'Split-tender refund leaves gift card untouched',
    className: 'RefundService.processRefund',
    confidence: 'high',
    confidenceLabel: 'Conf · 87% · high',
    caseCount: 8,
    narrative:
      'RefundService.processRefund credits the credit-card remainder first, then exits early before the gift-card branch fires. Affects 8 cases in Refund Core suite; identical stack trace at split-tender invocation site.',
    metrics: [
      { label: 'cases', value: '8' },
      { label: 'span', value: 'Refund Core' },
      { label: 'first seen', value: '12m ago' },
      { label: 'duration p50', value: '11.8s' },
    ],
  },
  {
    id: 'cl-2',
    title: 'Webhook handler exhausts retries on policy-edge refunds',
    className: 'WebhookHandler.dispatch',
    confidence: 'med',
    confidenceLabel: 'Conf · 64% · med',
    caseCount: 7,
    narrative:
      'WebhookHandler.dispatch receives 503 from downstream eligibility service within 5000ms timeout; exhausts 3 retries before failing. Cluster span: Refund Policy Edge Cases.',
    metrics: [
      { label: 'cases', value: '7' },
      { label: 'span', value: 'Refund Policy Edge' },
      { label: 'first seen', value: '24m ago' },
      { label: 'avg retries', value: '3.0' },
    ],
  },
  {
    id: 'cl-3',
    title: 'UPI mandate refunds miss original-source check',
    className: 'PaymentService.refundToOriginalSource',
    confidence: 'low',
    confidenceLabel: 'Conf · 41% · low',
    caseCount: 5,
    narrative:
      'Refund-to-original-source on UPI mandate returns 422 without consulting the original payment instrument. Affects 5 cases across Payments suite; needs human review (low confidence).',
    metrics: [
      { label: 'cases', value: '5' },
      { label: 'span', value: 'Payments' },
      { label: 'first seen', value: '38m ago' },
      { label: 'http status', value: '422' },
    ],
  },
];

// 3 suites — case rows are representative samples per canonical (the
// full 218 matrix is BE-side; we render 4-6 cases per suite + tail
// "+ 62 more in this suite" affordance to match the canonical density).
export const RESULTS_SUITES: ResultsSuite[] = [
  {
    name: 'Refund Core',
    counts: { total: 68, pass: 52, fail: 12, flaky: 4 },
    rows: [
      {
        id: 'TC-RET-0247',
        title: 'Process refund with split tender — gift card + credit card remainder',
        status: 'fail',
        durationLabel: '12.4s',
        defectCount: 2,
      },
      {
        id: 'TC-RET-0342',
        title: 'Refund exceeding order total — eligibility guard',
        status: 'fail',
        durationLabel: '11.1s',
        defectCount: 1,
        isSelected: true,
      },
      {
        id: 'TC-RET-0345',
        title: 'Partial refund triggers gift-card remainder calculation',
        status: 'fail',
        durationLabel: '10.8s',
        defectCount: 1,
      },
      {
        id: 'TC-RET-0188',
        title: 'Full refund within 7-day return window — happy path',
        status: 'pass',
        durationLabel: '4.2s',
        defectCount: 0,
      },
      {
        id: 'TC-RET-0203',
        title: 'Refund recompute when discount code applied at checkout',
        status: 'flaky',
        durationLabel: '8.7s',
        defectCount: 0,
      },
    ],
  },
  {
    name: 'Refund Policy Edge Cases',
    counts: { total: 96, pass: 90, fail: 4, flaky: 2 },
    rows: [
      {
        id: 'TC-RET-0418',
        title: 'Refund attempted after return window — eligibility blocks',
        status: 'fail',
        durationLabel: '6.9s',
        defectCount: 1,
      },
      {
        id: 'TC-RET-0421',
        title: 'Webhook retry exhausted on 503 from eligibility service',
        status: 'fail',
        durationLabel: '15.3s',
        defectCount: 1,
      },
      {
        id: 'TC-RET-0431',
        title: 'Refund for cancelled order — no-op confirm',
        status: 'pass',
        durationLabel: '3.5s',
        defectCount: 0,
      },
      {
        id: 'TC-RET-0445',
        title: 'Policy override by Lead role — audit-log appended',
        status: 'pass',
        durationLabel: '5.1s',
        defectCount: 0,
      },
    ],
  },
  {
    name: 'Payments',
    counts: { total: 54, pass: 45, fail: 7, flaky: 2 },
    rows: [
      {
        id: 'TC-PAY-0211',
        title: 'Refund-to-original-source on UPI mandate',
        status: 'fail',
        durationLabel: '9.4s',
        defectCount: 1,
      },
      {
        id: 'TC-PAY-0218',
        title: 'Refund to expired credit card — fallback to wallet',
        status: 'fail',
        durationLabel: '11.0s',
        defectCount: 1,
      },
      {
        id: 'TC-PAY-0224',
        title: 'Refund to new bank-account-on-file — KYC re-check',
        status: 'pass',
        durationLabel: '7.8s',
        defectCount: 0,
      },
      {
        id: 'TC-PAY-0231',
        title: 'Tokenised card refund — Stripe wire roundtrip',
        status: 'pass',
        durationLabel: '4.6s',
        defectCount: 0,
      },
    ],
  },
];

export const EVIDENCE_RAIL_DEFAULT: EvidenceRailContext = {
  selectedCaseId: 'TC-RET-0342',
  selectedCaseTitle: 'Refund exceeding order total — eligibility guard',
  selectedSuiteName: 'Refund Core',
  evidence: [
    { label: 'Status', value: 'fail · 11.1s' },
    { label: 'Suite', value: 'Refund Core' },
    { label: 'Run', value: 'RUN-RET-2026-04-25-002' },
    { label: 'Started', value: '2h 14m ago' },
    { label: 'Cluster', value: 'cl-1 · Split-tender refund' },
    { label: 'Env', value: 'staging-v3' },
    { label: 'Browser', value: 'Chrome 124 · headless' },
    { label: 'Defects', value: '1 linked' },
  ],
  actions: [
    { label: 'Create defect from cluster RCA', tone: 'secondary' },
    { label: 'Re-run case', tone: 'primary' },
    { label: 'Mark flaky', tone: 'warn' },
    { label: 'Mark blocked', tone: 'fail' },
  ],
};

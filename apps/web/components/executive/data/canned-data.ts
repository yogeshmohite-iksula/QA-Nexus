/**
 * F25 Executive Dashboard — Canned demo data
 *
 * Iksula Returns canon, R-2026-04-PaymentV2 release, Sprint 42 Day 13/14.
 * All values mirror the verbatim strings in
 * `PM1_UI_v2/Redesign Frame by claude design/F25 Executive Dashboard v2.html`.
 *
 * Source of truth — when in doubt, the HTML wins. This file is generated
 * for FE+1 to swap in API-driven values later.
 */

export const f25Demo = {
  // ─── ExecutiveHeader ──────────────────────────────────────────────────
  release: {
    title: 'R-2026-04-PaymentV2 · Iksula Returns',
    sprintName: 'Sprint 42',
    sprintDay: 13,
    sprintLength: 14,
    targetShipDate: 'Apr 28, 2026',
    daysRemaining: 5,
    decision: 'GO' as 'GO' | 'NO_GO',
    updatedAt: '2026-05-18 09:42 IST',
  },

  timeframes: ['Sprint', 'Last 7d', 'Last 30d', 'Last 90d'] as const,
  activeTimeframe: 'Sprint' as const,

  scope: {
    tickets: 89,
    testCases: 156,
    storiesDone: 23,
    storiesTotal: 28,
    velocityPct: 82,
    last50RunsPassPct: 87,
    openP0: 2,
    openP1: 8,
    p1DeltaThisWeek: -3, // negative = resolved
  },

  // ─── RoiValueTile ─────────────────────────────────────────────────────
  roi: {
    headlinePct: 342,
    conservativePct: 242,
    formula: {
      timeSavedHours: 184,
      timeSavedHumanDays: 23,
      blendedQaRateInr: 8000,
      timeValueInrLakh: 14.72,
      timeValueUsd: 18000,
      defectsCaught: 23,
      defectsPreProd: 21,
      defectsStaging: 2,
      stageMultiplier: 50,
      costAvoidedInrLakh: 9.2,
      totalQaValueInrLakh: 23.92,
      totalQaValueUsd: 29500,
      aiInfraCostInrLakh: 7,
      netBenefitInrLakh: 16.92,
      netBenefitUsd: 20800,
      indirectBenefitsInrLakh: 8.92,
    },
    ctoQuote: {
      text: 'AI-generated test cases cut authoring time by 50%, caught 23 shipping defects pre-release. Justifies AI investment 3× over.',
      attribution: 'Sherlock narrative · approved by Akshay Panchal (QA Lead)',
    },
  },

  // ─── QualityPostureGrid (3 cards) ─────────────────────────────────────
  quality: {
    passRate: {
      value: 87.2,
      unit: '%',
      trend: '▲ 2% sprint',
      trendDirection: 'up' as const,
      sub: '187 / 218 cases passed last 24h',
      severityBreakdown: [
        { label: 'Smoke', pct: 95 },
        { label: 'Regression', pct: 91 },
        { label: 'Feature', pct: 79 },
      ],
    },
    coverage: {
      value: 74,
      unit: '%',
      trend: '▲ 3% sprint',
      trendDirection: 'up' as const,
      sub: 'Automated coverage across 156 cases',
      breakdown: {
        automated: 74,
        manual: 21,
        untested: 5,
      },
    },
    defectDensity: {
      value: 2.3,
      unit: '/ 1k LOC',
      trend: '▼ 0.8 vs prior',
      trendDirection: 'down-good' as const,
      sub: 'Healthy zone · trending down',
      benchmark: 'Industry: 1–5 per 1k LOC · in healthy zone',
    },
  },

  // ─── RiskPostureGrid (2 cards) ────────────────────────────────────────
  risk: {
    openDefects: {
      counts: { p0: 2, p1: 8, p2: 18, p3: 13 },
      trend: '▼ 3 P1s resolved this week',
      target: { p0Max: 0, p1Max: 3 },
      drillLinkHref: '#F21',
      drillLinkLabel: 'View P0/P1 list',
    },
    readinessGates: {
      passed: 5,
      total: 5,
      gates: [
        { name: 'Core e2e tested', detail: 'Payment · Settlement · Reporting' },
        { name: 'Jira sync healthy', detail: '2-way · 0 orphaned' },
        { name: 'AI rails active', detail: 'Composer · Curator · Sherlock > 80% conf' },
        { name: 'Weekly report queued', detail: 'Exec report · Apr 27' },
        { name: 'QA Value dashboard live', detail: 'F24 ready' },
      ],
    },
  },

  // ─── TrendsRow (4-week, 3 mini-charts) ────────────────────────────────
  trends: {
    defects: {
      label: 'Defect trend',
      trend: '▼ healthy',
      trendDirection: 'down-good' as const,
      first: 28,
      last: 9,
      sub: 'Resolution outpacing findings',
      series: [
        { week: 'W1', value: 28 },
        { week: 'W2', value: 22 },
        { week: 'W3', value: 14 },
        { week: 'W4', value: 9 },
      ],
      annotation: 'Downward trend — resolution outpaces new findings.',
    },
    passRate: {
      label: 'Pass rate trend',
      trend: '▲ stable',
      trendDirection: 'up' as const,
      first: 82,
      last: 87,
      sub: 'Suite reliable, improving',
      series: [
        { week: 'W1', value: 82 },
        { week: 'W2', value: 85 },
        { week: 'W3', value: 87 },
        { week: 'W4', value: 87 },
      ],
      annotation: 'Stable and improving — test suite reliable.',
    },
    velocity: {
      label: 'Velocity trend',
      trend: 'expected taper',
      trendDirection: 'flat' as const,
      first: 156,
      last: 89,
      sub: 'Stabilization phase',
      series: [
        { week: 'W1', value: 140 },
        { week: 'W2', value: 156 },
        { week: 'W3', value: 134 },
        { week: 'W4', value: 89 },
      ],
      annotation: 'Velocity ramping down — expected as release stabilizes.',
    },
  },

  // ─── RecommendationsPanel (Sherlock) ──────────────────────────────────
  recommendations: {
    agent: 'Sherlock' as const,
    version: 'v1.4',
    items: [
      {
        positive: false,
        body: 'Flaky test stabilization complete. Flake rate 7% → 2%. payment_retry and checkout_timeout now use 8-second timeout. No further action.',
      },
      {
        positive: false,
        body: 'P1 admin_cache_clear occasionally hangs. Root cause: stale cache in environment. Recommendation: clear test env cache 1 hour before smoke test Apr 28. Patch ready for v2.1.',
      },
      {
        positive: false,
        body: 'Coverage gap. 5% untested (legacy error handlers). Risk low. Recommendation: add coverage in v2.1 sprint. Does not block release.',
      },
      {
        positive: true,
        body: 'Curator caught 24 duplicate test cases, preventing 12 hours of redundant test runs. Recommend expanding Curator across projects.',
      },
    ],
  },

  // ─── ApprovalSignOff ──────────────────────────────────────────────────
  approvals: [
    {
      label: 'QA Lead approval',
      name: 'Akshay Panchal',
      initials: 'AP',
      role: 'QA Lead · Iksula Returns',
      status: 'approved' as const,
      statusDate: '2026-05-17',
      avatarTone: 'green' as const,
    },
    {
      label: 'Engineering sign-off',
      name: 'Yogesh Mohite',
      initials: 'YM',
      role: 'Sr QA / Admin · Iksula',
      status: 'approved' as const,
      statusDate: '2026-05-17',
      avatarTone: 'green' as const,
    },
    {
      label: 'Product owner',
      name: 'Riya Nair',
      initials: 'RN',
      role: 'Backend Dev · Payment Squad',
      status: 'pending' as const,
      statusDate: 'awaiting review',
      avatarTone: 'amber' as const,
    },
  ],

  // ─── FooterBand ───────────────────────────────────────────────────────
  footer: {
    lastUpdatedAt: '2026-05-18 09:42 IST',
    permalink: { href: '#F20', label: 'Permalink · Run Results →' },
  },
};

export type F25Demo = typeof f25Demo;

// Agent tooltips (Hard Rule 15)
export const AGENT_TOOLTIPS = {
  Sherlock: 'Defect Intelligence agent (5-layer Root Cause Analysis)',
  Curator: 'Duplicate Detection agent',
  Composer: 'Test Case Generator agent',
} as const;

export type AgentName = keyof typeof AGENT_TOOLTIPS;

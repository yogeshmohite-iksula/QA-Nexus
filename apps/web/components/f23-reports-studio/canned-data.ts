// F23 Reports Studio — canned data
// All user-visible strings from the v4 design, verbatim.
// FE+1 imports this directly; never hard-code these values in TSX.
//
// 8-user roster only. Iksula Returns / Sprint 42 / R-2026-04-PaymentV2.

export const f23CannedData = {
  // ─── Page header ──────────────────────────────────────────────────
  page: {
    title: 'Reports Studio',
    sub: 'Configure a report, run it, save it as a template, schedule it. Iksula Returns · Sprint 42 · Day 9 of 14.',
  },

  // ─── Report kinds (6 canonical) ───────────────────────────────────
  report_kinds: [
    { key: 'cycle', label: 'Cycle Pass-Rate', icon: 'TrendingUp', chart: 'stacked-area' },
    { key: 'defect', label: 'Defect Age', icon: 'Bug', chart: 'stacked-bar' },
    { key: 'agent', label: 'Agent Cost', icon: 'Cpu', chart: 'line+stacked-area' },
    { key: 'sprint', label: 'Sprint Progress', icon: 'Activity', chart: 'burndown' },
    { key: 'coverage', label: 'Test Coverage', icon: 'BarChart3', chart: 'horizontal-bar' },
    { key: 'reqcov', label: 'Requirement Coverage', icon: 'CheckSquare', chart: 'horizontal-bar' },
  ],

  // ─── Time range pills ─────────────────────────────────────────────
  time_ranges: ['Sprint', '7d', '30d', '90d', 'Custom…'],
  time_range_default: 'Sprint',

  // ─── Per-kind optional filters ────────────────────────────────────
  per_kind_filters: {
    cycle: [
      { label: 'Environment', value: 'staging + prod' },
      { label: 'Suite', value: 'All' },
      { label: 'Group by', value: 'sprint week' },
    ],
    defect: [
      { label: 'Severity', value: 'P1 · P2 · P3 · P4' },
      { label: 'Assignee', value: 'All' },
      { label: 'Bucket size', value: '0-3d · 4-7d · 8-14d · 15-30d · 30+d' },
    ],
    agent: [
      { label: 'Agent', value: 'Composer · Curator · Sherlock' },
      { label: 'Model', value: 'Groq + Gemini' },
    ],
    sprint: [
      { label: 'Sprint', value: 'S42' },
      { label: 'Series', value: 'burndown + scope-change' },
    ],
    coverage: [{ label: 'By', value: 'module' }],
    reqcov: [
      { label: 'By', value: 'epic' },
      { label: 'State', value: 'active' },
    ],
  },

  // ─── Action buttons ───────────────────────────────────────────────
  actions: {
    primary: { label: 'Run report', icon: 'Play' },
    save: { label: 'Save as template', icon: 'Save' },
    schedule: { label: 'Schedule…', icon: 'Calendar' },
    export: { label: 'Export', icon: 'Download', split: true },
    last_run: 'last run · 12 min ago',
  },

  // ─── Canvas state copy ────────────────────────────────────────────
  states: {
    empty: {
      title: 'Configure a report above and click Run',
      copy: 'Pick a report kind, set filters, hit Run report. Or jump straight in with one of these:',
      starters: ['Sprint 42 Cycle Pass-Rate', 'P0/P1 Defect Age', 'Agent Cost · 30d'],
    },
    loading: {
      hint: 'Aggregating Sprint 42 · est ~1.2s',
    },
    nodata: {
      title: 'No runs in the selected window',
      copy: 'Try expanding the time range or check your filters — 3 filters currently applied.',
      actions: ['Expand to 90d', 'Reset filters'],
    },
    error: {
      title: "Couldn't run report",
      copy: 'Query failed — connection to runs DB timed out after 8s. The query plan would have scanned 4.2M rows; consider tighter filters before retrying.',
      actions: ['Retry', 'Adjust filters', 'Report issue'],
    },
  },

  // ─── Result state (canonical: Cycle Pass-Rate) ────────────────────
  result: {
    title: {
      cycle: 'Cycle Pass-Rate · Sprint 42',
      defect: 'Defect Age · Sprint 42',
      agent: 'Agent Cost · Last 30d',
      sprint: 'Sprint Progress · S42',
      coverage: 'Test Coverage by module',
      reqcov: 'Requirement Coverage · Sprint 42',
    },
    run_attribution: 'Run by Yogesh M.',
    run_timestamp: '2026-05-19 10:30 IST',
    run_time_ms: '312 ms',
  },

  // ─── KPI cards per kind ───────────────────────────────────────────
  kpis: {
    cycle: [
      { lbl: 'Total runs', v: '247', delta: 'Sprint 42', delta_tone: 'flat' },
      { lbl: 'Pass', v: '218', u: '(88.3%)', delta: '▲ 2.1pp vs S41', delta_tone: 'pass' },
      { lbl: 'Fail', v: '21', u: '(8.5%)', delta: '▲ 0.4pp', delta_tone: 'fail' },
      { lbl: 'Blocked', v: '8', u: '(3.2%)', delta: '▲ 2', delta_tone: 'fail' },
      { lbl: 'Pass-rate', v: '88.3', u: '%', delta: '▲ 2.1pp', delta_tone: 'pass' },
      { lbl: 'Δ vs S41', v: '+2.1', u: 'pp', delta: 'Improving', delta_tone: 'pass' },
    ],
    defect: [
      { lbl: 'Total open', v: '62', delta: '▲ 4 wk', delta_tone: 'fail' },
      { lbl: 'Median age', v: '5.2', u: 'd', delta: 'stable', delta_tone: 'flat' },
      { lbl: 'Oldest', v: '38', u: 'd', delta: 'DEF-RET-1908', delta_tone: 'fail' },
      { lbl: '30+d (aging out)', v: '3', delta: 'SLA risk', delta_tone: 'fail' },
      { lbl: 'Closed (7d)', v: '14', delta: '▲ 5 wk', delta_tone: 'pass' },
      { lbl: 'MTTR', v: '4.7', u: 'd', delta: '▼ 0.6d', delta_tone: 'pass' },
    ],
    agent: [
      { lbl: 'Total tokens', v: '5.04', u: 'M', delta: '▲ 8% vs prior 30d', delta_tone: 'flat' },
      { lbl: 'Total cost', v: '$0.00', delta: 'free-tier', delta_tone: 'pass' },
      { lbl: 'Calls', v: '643', delta: '▼ 12 vs prior', delta_tone: 'flat' },
      { lbl: 'Avg latency', v: '1.4', u: 's', delta: 'stable', delta_tone: 'flat' },
      { lbl: 'Top-cost agent', v: 'Composer', delta: '76% share', delta_tone: 'flat' },
    ],
    sprint: [
      { lbl: 'Scope', v: '62', u: 'pts', delta: '▲ 4 added', delta_tone: 'fail' },
      { lbl: 'Completed', v: '41', u: 'pts', delta: '▲ 6 today', delta_tone: 'pass' },
      { lbl: 'Remaining', v: '21', u: 'pts', delta: '5 days left', delta_tone: 'warn' },
      { lbl: 'Burndown', v: 'On track', delta: '−2pts ahead', delta_tone: 'pass' },
    ],
    coverage: [
      { lbl: 'Total requirements', v: '342' },
      { lbl: 'Covered', v: '289', u: '(85%)', delta_tone: 'pass' },
      { lbl: 'Coverage %', v: '84.5', u: '%', delta: '▲ 1.2pp', delta_tone: 'pass' },
      { lbl: 'Uncovered', v: '53', delta: 'high risk', delta_tone: 'fail' },
    ],
    reqcov: [
      { lbl: 'Passing %', v: '78.4', u: '%', delta_tone: 'pass' },
      { lbl: 'Failing %', v: '9.6', u: '%', delta_tone: 'fail' },
      { lbl: 'Untested %', v: '12.0', u: '%', delta_tone: 'warn' },
      { lbl: 'Reqs scanned', v: '342' },
    ],
  },

  // ─── Chart data (Cycle Pass-Rate · Sprint 42, day 1 → today) ─────
  chart: {
    cycle: {
      x_axis: ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10', 'D11', 'D12'],
      series: [
        {
          key: 'pass',
          label: 'Pass',
          color: 'var(--pass)',
          values: [26, 24, 22, 25, 27, 24, 28, 26, 16],
        },
        { key: 'fail', label: 'Fail', color: 'var(--fail)', values: [2, 3, 4, 2, 1, 3, 2, 2, 2] },
        {
          key: 'blocked',
          label: 'Blocked',
          color: 'var(--warn)',
          values: [0, 1, 2, 1, 0, 1, 1, 1, 1],
        },
      ],
      today_index: 8, // Day 9 (0-based 8)
    },
  },

  // ─── Data table (Cycle kind, internal scroll, 12 rows) ────────────
  table: {
    cycle: {
      columns: ['Cycle ID', 'Suite', 'Pass', 'Fail', 'Blocked', 'Pass-rate', 'Owner', 'Status', ''],
      rows: [
        {
          id: 'CY-RET-2026-W3',
          suite: 'Refund flow regression',
          pass: 52,
          fail: 3,
          blocked: 1,
          pct: '93%',
          owner: 'Nadim Siddiqui',
          status: 'complete',
        },
        {
          id: 'CY-RET-2026-W3-2',
          suite: 'Webhook idempotency',
          pass: 28,
          fail: 4,
          blocked: 2,
          pct: '82%',
          owner: 'Kishor Kadam',
          status: 'running',
        },
        {
          id: 'CY-RET-2026-W3-3',
          suite: 'Payment provider 503',
          pass: 31,
          fail: 7,
          blocked: 2,
          pct: '78%',
          owner: 'Nitin Gomle',
          status: 'complete',
        },
        {
          id: 'CY-RET-2026-W2',
          suite: 'Admin portal smoke',
          pass: 42,
          fail: 2,
          blocked: 1,
          pct: '93%',
          owner: 'Govind Daware',
          status: 'complete',
        },
        {
          id: 'CY-RET-2026-W1',
          suite: 'Refund-flow sanity',
          pass: 34,
          fail: 7,
          blocked: 2,
          pct: '79%',
          owner: 'Mohanraj K.',
          status: 'closed',
        },
        {
          id: 'CY-RET-2026-W2-2',
          suite: 'Holiday calendar exceptions',
          pass: 31,
          fail: 2,
          blocked: 0,
          pct: '94%',
          owner: 'Sagar Todankar',
          status: 'complete',
        },
        {
          id: 'CY-RET-2026-W1-2',
          suite: 'Idempotency-key collision',
          pass: 26,
          fail: 5,
          blocked: 1,
          pct: '81%',
          owner: 'Kishor Kadam',
          status: 'closed',
        },
        {
          id: 'CY-RET-2026-W1-3',
          suite: 'Partial-shipment refund',
          pass: 38,
          fail: 2,
          blocked: 1,
          pct: '93%',
          owner: 'Govind Daware',
          status: 'closed',
        },
        {
          id: 'CY-RET-2026-S41-D14',
          suite: 'Bulk RMA approval flow',
          pass: 44,
          fail: 3,
          blocked: 2,
          pct: '90%',
          owner: 'Yogesh Mohite',
          status: 'closed',
        },
        {
          id: 'CY-RET-2026-S41-D12',
          suite: 'Customer notifications',
          pass: 22,
          fail: 1,
          blocked: 0,
          pct: '96%',
          owner: 'Nitin Gomle',
          status: 'closed',
        },
        {
          id: 'CY-RET-2026-S41-D10',
          suite: 'Webhook signature retry',
          pass: 19,
          fail: 6,
          blocked: 3,
          pct: '68%',
          owner: 'Mohanraj K.',
          status: 'closed',
        },
        {
          id: 'CY-RET-2026-S41-D08',
          suite: 'RMA shipment-zone label',
          pass: 17,
          fail: 2,
          blocked: 0,
          pct: '89%',
          owner: 'Sagar Todankar',
          status: 'closed',
        },
      ],
    },
  },

  // ─── Saved reports ────────────────────────────────────────────────
  saved_reports: [
    {
      id: 'new',
      kind: 'blank',
      title: '+ New from blank',
      owner: null,
      owner_initials: null,
      schedule: null,
      is_new: true,
    },
    {
      id: 'wkly-cpr',
      kind: 'cycle',
      title: 'Weekly Cycle Pass-Rate',
      owner: 'Akshay Panchal',
      owner_initials: 'AP',
      schedule: 'Mon 09:00 IST',
      draft: true,
    },
    {
      id: 'daily-da',
      kind: 'defect',
      title: 'Daily Defect Age',
      owner: 'Kishor Kadam',
      owner_initials: 'KK',
      schedule: 'Daily 09:00',
      draft: false,
    },
    {
      id: 's42-ac',
      kind: 'agent',
      title: 'Sprint 42 Agent Cost',
      owner: 'Yogesh Mohite',
      owner_initials: 'YM',
      schedule: 'Manual',
      draft: false,
    },
    {
      id: 'cov-mod',
      kind: 'coverage',
      title: 'Test Coverage by Module',
      owner: 'Nadim Siddiqui',
      owner_initials: 'NS',
      schedule: 'Mon 17:00',
      draft: false,
    },
    {
      id: 's42-bd',
      kind: 'sprint',
      title: 'Sprint 42 Burndown · live',
      owner: 'Akshay Panchal',
      owner_initials: 'AP',
      schedule: 'Live',
      draft: false,
    },
    {
      id: 'rcov-ret',
      kind: 'reqcov',
      title: 'Requirement Coverage · RET',
      owner: 'Govind Daware',
      owner_initials: 'GD',
      schedule: 'Manual',
      draft: false,
    },
    {
      id: 'rfp',
      kind: 'cycle',
      title: 'Refund-flow Pass-Rate',
      owner: 'Sagar Todankar',
      owner_initials: 'ST',
      schedule: 'Manual',
      draft: false,
    },
    {
      id: 'p01-da',
      kind: 'defect',
      title: 'P0/P1 Defect Age',
      owner: 'Nitin Gomle',
      owner_initials: 'NG',
      schedule: 'Daily 11:00',
      draft: false,
    },
    {
      id: 'wkly-ac',
      kind: 'agent',
      title: 'Weekly Agent Cost · 30d',
      owner: 'Yogesh Mohite',
      owner_initials: 'YM',
      schedule: 'Mon 07:15',
      draft: false,
    },
    {
      id: 'daily-sp',
      kind: 'sprint',
      title: 'Daily Sprint Progress',
      owner: 'Kishor Kadam',
      owner_initials: 'KK',
      schedule: 'Daily 06:30',
      draft: false,
    },
    {
      id: 'cov-aut',
      kind: 'coverage',
      title: 'Coverage by author',
      owner: 'Mohanraj K.',
      owner_initials: 'MK',
      schedule: 'Manual',
      draft: false,
    },
  ],

  // ─── Scheduled & recurring ────────────────────────────────────────
  scheduled: [
    {
      id: 'sch-1',
      cron: '0 9 * * 1',
      title: 'Weekly Cycle Pass-Rate',
      recipients: 'akshay.panchal, qa-leads@iksula',
      status: 'Delivered · 2d',
      status_tone: 'pass',
      actions: ['Pause', 'Edit'],
    },
    {
      id: 'sch-2',
      cron: '0 9 * * *',
      title: 'Daily Defect Age',
      recipients: 'kishor.kadam, akshay.panchal',
      status: 'Delivered · 1h',
      status_tone: 'pass',
      actions: ['Pause', 'Edit'],
    },
    {
      id: 'sch-3',
      cron: '*/15 7-19 * * 1-5',
      title: 'Sprint Burndown · live',
      recipients: 'qa-team@iksula',
      status: 'Paused · 1d',
      status_tone: 'warn',
      actions: ['Resume', 'Edit'],
    },
    {
      id: 'sch-4',
      cron: '0 17 * * 5',
      title: 'Friday Agent Cost',
      recipients: 'yogesh.mohite, finance@iksula',
      status: 'Failed · retry queued',
      status_tone: 'fail',
      actions: ['View log', 'Edit'],
    },
  ],

  // ─── Status pill vocabulary (Scheduled rows) ──────────────────────
  status_vocab: {
    pass: 'Delivered',
    warn: 'Paused',
    fail: 'Failed',
  },

  // ─── AI savings tile (above Region 3) ─────────────────────────────
  ai_savings: {
    label: 'AI saved 312h YTD',
    detail: 'across Composer + Sherlock + Curator',
  },

  // ─── Save-as-template modal ───────────────────────────────────────
  modal: {
    title: 'Save as template',
    sub: 'Schedule cadence and recipients are managed in the Scheduled rail below.',
    fields: {
      name: {
        label: 'Template name',
        helper: 'Shown in the Saved reports rail and the Manage view.',
        default: 'Weekly Cycle Pass-Rate · Sprint 42',
      },
      description: {
        label: 'Description (optional)',
        default:
          'Weekly snapshot for Sprint 42 review — Pass/Fail/Blocked grouped by sprint week, staging + prod environments.',
      },
      scope: {
        label: 'Share scope',
        options: [
          { key: 'just-me', label: 'Just me', sub: 'Private template' },
          { key: 'project', label: 'Project', sub: 'Iksula Returns members', default: true },
          { key: 'org', label: 'Org-wide', sub: 'All QA Nexus projects' },
        ],
      },
    },
    footer_buttons: ['Cancel', 'Save template'],
  },

  // ─── Prove mode (snapshot) ────────────────────────────────────────
  prove: {
    ribbon: {
      label: 'Snapshot',
      taken_by: 'Yogesh Mohite',
      taken_at: '2026-05-19 10:30 IST',
      copy: 'frozen at run-time — re-run only from source config',
      hash: 'SHA-256 · abc123def456ghi789jkl012mno345pq…',
    },
    watermark: 'SNAPSHOT',
    watermark_opacity: 0.08,
    audit_foot: {
      snapshot_id: 'SS-RET-2026-05-19-10:30',
      source_config: 'cfg-cycle-pass-rate-s42-v3',
      retention: '7y',
    },
  },

  // ─── Iksula data canon (DO NOT CHANGE) ────────────────────────────
  context: {
    project: 'Iksula Returns',
    project_key: 'RET',
    sprint: 'Sprint 42',
    sprint_day: 9,
    sprint_length: 14,
    release: 'R-2026-04-PaymentV2',
    roster: [
      { initials: 'AP', name: 'Akshay Panchal', role: 'QA Lead' },
      { initials: 'YM', name: 'Yogesh Mohite', role: 'Sr QA · Admin' },
      { initials: 'KK', name: 'Kishor Kadam', role: 'QA Engineer' },
      { initials: 'NG', name: 'Nitin Gomle', role: 'QA Engineer' },
      { initials: 'NS', name: 'Nadim Siddiqui', role: 'QA Engineer' },
      { initials: 'GD', name: 'Govind Daware', role: 'QA Engineer' },
      { initials: 'MK', name: 'Mohanraj K.', role: 'QA Engineer' },
      { initials: 'ST', name: 'Sagar Todankar', role: 'QA Engineer' },
    ],
  },
} as const;

export type F23CannedData = typeof f23CannedData;

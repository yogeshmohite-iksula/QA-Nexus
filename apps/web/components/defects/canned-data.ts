// F21 Defects Hub — Pattern A canonical-verbatim data per Hard Rule 17.
//
// EVERY string in this file traces directly to the canonical
// `PM1_UI_v2/Redesign Frame by claude design/F21 Defects Hub v2.html`.
// No invention permitted.
//
// Hard Rule 17 applied from START (not fix-forward): extract from
// HTML first, then build React components that CONSUME the constants.

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type DefectPriority = 'p0' | 'p1' | 'p2' | 'p3';
export type DefectStatusKey = 'open' | 'progress' | 'qa' | 'fixed' | 'closed';
export type DefectTypeKey = 'appbug' | 'env' | 'ui' | 'flaky' | 'test';
export type DefectAgentKey = 'sherlock' | 'curator' | 'composer';

export interface DefectRow {
  id: string; // e.g. "D-2104"
  priority: DefectPriority;
  title: string;
  /** Type chip key + display label */
  typeKey: DefectTypeKey;
  typeLabel: string;
  /** Status chip key + display label */
  statusKey: DefectStatusKey;
  statusLabel: string;
  /** Agent attribution pill (Sherlock / Curator / Composer); null if none */
  agentKey: DefectAgentKey | null;
  /** Inline metadata segments (RCA confidence, similar count, JIRA ref, etc.) */
  metaSegments: DefectMetaSegment[];
  /** Test-case or JIRA reference badge ("TC-987" / "JIRA RET-3392"); null if none */
  ref: string | null;
  /** Impact tiles, e.g. ["22", "×5"] */
  impact: string[] | null;
  /** Assignee — avatar initials + display name. Null assignee uses initials "—" + "Unassigned" */
  assignee: { initials: string; name: string; avatarTone: 'amber' | 'violet' | 'teal' | 'none' };
  /** Age display, e.g. "2d ago" */
  age: string;
  /** Hover/secondary age, e.g. "opened 9d" */
  opened: string;
  /** Stale chip ("↺ 11d stale") when present */
  staleLabel: string | null;
}

export type DefectMetaSegment = { kind: 'text'; value: string } | { kind: 'bold'; value: string };

export interface PriorityChip {
  priority: DefectPriority;
  label: string; // "P0" / "P1" / "P2" / "P3"
  count: number;
  active: boolean;
}

export interface FilterSelect {
  label: string; // "Status" / "Type" / "Sprint"
  value: string; // current value, e.g. "Open + In progress" / "All" / "Sprint 42"
}

export interface ToolbarGroupBy {
  label: string;
  active: boolean;
}

export interface CommentItem {
  authorName: string;
  authorInitials: string;
  authorAvatarTone: 'violet' | 'amber' | 'teal';
  when: string;
  text: string;
}

export interface ActivityRow {
  iconKind: 'comment' | 'status' | 'assign';
  /** Render-time content as segments — supports bold inline. */
  segments: DefectMetaSegment[];
  when: string;
}

export interface SimilarDefectRow {
  id: string;
  title: string;
  status: DefectStatusKey;
  statusLabel: string;
  similarityPct: string; // e.g. "92%"
}

export interface ReproStep {
  num: number;
  text: ReproSegment[];
}
export type ReproSegment =
  | { kind: 'text'; value: string }
  | { kind: 'mono'; value: string }
  | { kind: 'fail'; value: string };

// -----------------------------------------------------------------------------
// Filter strip — canonical L758-794
// -----------------------------------------------------------------------------

export const F21_PRIORITY_CHIPS: PriorityChip[] = [
  { priority: 'p0', label: 'P0', count: 23, active: true },
  { priority: 'p1', label: 'P1', count: 41, active: true },
  { priority: 'p2', label: 'P2', count: 68, active: false },
  { priority: 'p3', label: 'P3', count: 55, active: false },
];

export const F21_PRIORITY_LABEL = 'Priority';

export const F21_FILTER_SELECTS: FilterSelect[] = [
  { label: 'Status', value: 'Open + In progress' },
  { label: 'Type', value: 'All' },
  { label: 'Sprint', value: 'Sprint 42' },
];

export const F21_SEARCH_PLACEHOLDER = 'Search defects, IDs, JIRA, comments…';

// -----------------------------------------------------------------------------
// Toolbar — canonical L794-812
// -----------------------------------------------------------------------------

export const F21_TOOLBAR = {
  groupByLabel: 'Group by',
  groupByOptions: [
    { label: 'Priority', active: true },
    { label: 'Status', active: false },
    { label: 'Assignee', active: false },
    { label: 'Sprint', active: false },
    { label: 'None', active: false },
  ] as ToolbarGroupBy[],
  shownCount: 64,
  totalCount: 187,
  sortLabel: 'Sort',
  sortValue: 'Priority ↓ · Updated',
} as const;

// -----------------------------------------------------------------------------
// Type + status chip color tokens — derived from 01_SYSTEM.md
// -----------------------------------------------------------------------------

export const F21_TYPE_CHIP_LABELS: Record<DefectTypeKey, string> = {
  appbug: 'App bug',
  env: 'Env / Data',
  ui: 'UI / Visual',
  flaky: 'Flaky',
  test: 'Test data',
};

export const F21_STATUS_CHIP_LABELS: Record<DefectStatusKey, string> = {
  open: 'Open',
  progress: 'In progress',
  qa: 'In QA',
  fixed: 'Fixed',
  closed: "Won't fix",
};

// -----------------------------------------------------------------------------
// Defect rows — 10 verbatim from canonical L820-1129
// -----------------------------------------------------------------------------

export const F21_DEFECTS: DefectRow[] = [
  {
    id: 'D-2104',
    priority: 'p0',
    title: 'Refund > ₹10K stuck on PROCESSING — webhook timeout on payments-svc',
    typeKey: 'appbug',
    typeLabel: F21_TYPE_CHIP_LABELS.appbug,
    statusKey: 'progress',
    statusLabel: F21_STATUS_CHIP_LABELS.progress,
    agentKey: 'sherlock',
    metaSegments: [
      { kind: 'text', value: 'RCA confidence ' },
      { kind: 'bold', value: '94%' },
    ],
    ref: 'TC-1043',
    impact: null,
    assignee: { initials: 'SP', name: 'Suresh P.', avatarTone: 'violet' },
    age: '2d ago',
    opened: 'opened 9d',
    staleLabel: null,
  },
  {
    id: 'D-2087',
    priority: 'p0',
    title: 'Idempotency-key collision causes duplicate refund credit on retry',
    typeKey: 'appbug',
    typeLabel: F21_TYPE_CHIP_LABELS.appbug,
    statusKey: 'open',
    statusLabel: F21_STATUS_CHIP_LABELS.open,
    agentKey: 'curator',
    metaSegments: [
      { kind: 'text', value: 'linked to ' },
      { kind: 'bold', value: '3 similar' },
    ],
    ref: 'TC-987',
    impact: ['22', '×5'],
    assignee: { initials: '—', name: 'Unassigned', avatarTone: 'none' },
    age: '11d ago',
    opened: 'opened 11d',
    staleLabel: '↺ 11d stale',
  },
  {
    id: 'D-2076',
    priority: 'p0',
    title: 'Reauth modal swallows 401s when partner-token expires mid-checkout',
    typeKey: 'appbug',
    typeLabel: F21_TYPE_CHIP_LABELS.appbug,
    statusKey: 'qa',
    statusLabel: F21_STATUS_CHIP_LABELS.qa,
    agentKey: 'sherlock',
    metaSegments: [
      { kind: 'text', value: 'RCA confidence ' },
      { kind: 'bold', value: '94%' },
    ],
    ref: 'JIRA RET-3392',
    impact: ['8', '×2'],
    assignee: { initials: 'PA', name: 'Priya A.', avatarTone: 'amber' },
    age: '5h ago',
    opened: 'opened 4d',
    staleLabel: null,
  },
  {
    id: 'D-2058',
    priority: 'p0',
    title: 'FX rate cached 24h — rupee refund off by 1.4% on cross-border purchase',
    typeKey: 'env',
    typeLabel: F21_TYPE_CHIP_LABELS.env,
    statusKey: 'fixed',
    statusLabel: F21_STATUS_CHIP_LABELS.fixed,
    agentKey: 'sherlock',
    metaSegments: [],
    ref: null,
    impact: ['4', '×1'],
    assignee: { initials: 'YM', name: 'Yogesh M.', avatarTone: 'teal' },
    age: '12h ago',
    opened: 'opened 6d',
    staleLabel: null,
  },
  {
    id: 'D-2103',
    priority: 'p1',
    title: 'Refund email template uses old logo on partner channel (post-rebrand)',
    typeKey: 'ui',
    typeLabel: F21_TYPE_CHIP_LABELS.ui,
    statusKey: 'progress',
    statusLabel: F21_STATUS_CHIP_LABELS.progress,
    agentKey: 'composer',
    metaSegments: [],
    ref: 'TC-1012',
    impact: ['6', '×1'],
    assignee: { initials: 'RB', name: 'Ritu B.', avatarTone: 'violet' },
    age: '3h ago',
    opened: 'opened 1d',
    staleLabel: null,
  },
  {
    id: 'D-2098',
    priority: 'p1',
    title: 'Pagination skips last page when total ≡ 0 (mod 25) on returns dashboard',
    typeKey: 'appbug',
    typeLabel: F21_TYPE_CHIP_LABELS.appbug,
    statusKey: 'open',
    statusLabel: F21_STATUS_CHIP_LABELS.open,
    agentKey: 'sherlock',
    metaSegments: [],
    ref: 'JIRA RET-3401',
    impact: ['3', '×1'],
    assignee: { initials: 'AK', name: 'Arjun K.', avatarTone: 'amber' },
    age: '1d ago',
    opened: 'opened 2d',
    staleLabel: null,
  },
  {
    id: 'D-2091',
    priority: 'p1',
    title: 'Suite occasionally times out at PG redirect — flake rate 12% in last 7 runs',
    typeKey: 'flaky',
    typeLabel: F21_TYPE_CHIP_LABELS.flaky,
    statusKey: 'open',
    statusLabel: F21_STATUS_CHIP_LABELS.open,
    agentKey: 'sherlock',
    metaSegments: [],
    ref: null,
    impact: ['7', '×4'],
    assignee: { initials: 'YM', name: 'Yogesh M.', avatarTone: 'teal' },
    age: '6h ago',
    opened: 'opened 3d',
    staleLabel: null,
  },
  {
    id: 'D-2080',
    priority: 'p1',
    title: 'Refund-status webhook delivers events out of order under burst load',
    typeKey: 'appbug',
    typeLabel: F21_TYPE_CHIP_LABELS.appbug,
    statusKey: 'qa',
    statusLabel: F21_STATUS_CHIP_LABELS.qa,
    agentKey: 'curator',
    metaSegments: [],
    ref: null,
    impact: ['5', '×2'],
    assignee: { initials: 'SP', name: 'Suresh P.', avatarTone: 'violet' },
    age: '8h ago',
    opened: 'opened 5d',
    staleLabel: null,
  },
  {
    id: 'D-2074',
    priority: 'p2',
    title: 'Tooltip on "Refund eligibility" shows raw markdown asterisks',
    typeKey: 'ui',
    typeLabel: F21_TYPE_CHIP_LABELS.ui,
    statusKey: 'open',
    statusLabel: F21_STATUS_CHIP_LABELS.open,
    agentKey: 'composer',
    metaSegments: [],
    ref: null,
    impact: ['2', '×1'],
    assignee: { initials: 'RB', name: 'Ritu B.', avatarTone: 'violet' },
    age: '3d ago',
    opened: 'opened 7d',
    staleLabel: null,
  },
  {
    id: 'D-2069',
    priority: 'p2',
    title: 'Date-range filter on returns report excludes the end-date day',
    typeKey: 'test',
    typeLabel: F21_TYPE_CHIP_LABELS.test,
    statusKey: 'closed',
    statusLabel: F21_STATUS_CHIP_LABELS.closed,
    agentKey: null,
    metaSegments: [],
    ref: 'TC-901',
    impact: ['1', '×1'],
    assignee: { initials: 'AK', name: 'Arjun K.', avatarTone: 'amber' },
    age: '5d ago',
    opened: 'opened 9d',
    staleLabel: null,
  },
];

// -----------------------------------------------------------------------------
// Side detail rail (sd-rail) — canonical L1129-1302
// Selected defect = D-2104 (the first row in the list)
// -----------------------------------------------------------------------------

export const F21_SD_HEAD = {
  id: 'D-2104',
  priority: 'P0',
  status: 'In progress',
  title:
    'Refund > ₹10K stuck on PROCESSING — webhook timeout on payments-svc when partner-bank gateway exceeds 30s SLA.',
  closeAriaLabel: 'Close detail',
};

export const F21_SD_ACTIONS = [
  { label: 'Mark fixed', variant: 'primary' as const },
  { label: 'Reassign', variant: 'secondary' as const },
  { label: 'Change priority', variant: 'secondary' as const },
  { label: "Won't fix", variant: 'secondary' as const },
  { label: 'JIRA', variant: 'secondary' as const },
];

// Summary section
export const F21_SUMMARY = {
  label: 'Summary',
  bodySegments: [
    { kind: 'text', value: 'Refunds > ₹10K from partner-bank channel are stuck on ' },
    { kind: 'mono', value: 'PROCESSING' },
    {
      kind: 'text',
      value:
        ' when the partner gateway exceeds the 30 s webhook SLA. The retry pipeline marks them as failed but does not surface the error to the merchant.',
    },
  ] as ReproSegment[],
  reproSteps: [
    { num: 1, text: [{ kind: 'text', value: 'Initiate refund > ₹10K via partner channel' }] },
    { num: 2, text: [{ kind: 'text', value: 'Wait for webhook timeout (≥30 s)' }] },
    {
      num: 3,
      text: [
        { kind: 'text', value: 'Refresh — status remains ' },
        { kind: 'fail', value: 'PROCESSING' },
      ],
    },
  ] as ReproStep[],
  linkedRefs: [
    { kind: 'tc' as const, label: 'TC-1043' },
    { kind: 'run' as const, label: 'RUN-…002' },
    { kind: 'jira' as const, label: 'RET-3392' },
  ],
};

// Sherlock RCA section
export const F21_SHERLOCK_RCA = {
  label: 'Root cause · Sherlock',
  name: 'Sherlock',
  confidenceLabel: '94% confidence',
  text: [
    { kind: 'text', value: 'Webhook handler in ' },
    { kind: 'mono', value: 'payments-svc::PartnerCallbackController' },
    {
      kind: 'text',
      value:
        ' sets a 30 s read-timeout on the inbound socket. When the partner-bank gateway holds the connection longer (observed P95 = 41 s last week), the handler returns 504 to the merchant SDK while the gateway eventually commits the refund — leaving the database in PROCESSING while the customer sees failure.',
    },
  ] as ReproSegment[],
};

// Curator similar section
export const F21_CURATOR_SIMILAR = {
  label: 'Similar defects · Curator',
  agentLabel: 'Curator',
  agentVersion: 'v1.4',
  matchesLabel: '3 matches',
  rows: [
    {
      id: 'D-1842',
      title: 'Webhook timeout on partner-bank flow (Sprint 38)',
      status: 'closed',
      statusLabel: 'Closed',
      similarityPct: '92%',
    },
    {
      id: 'D-1979',
      title: 'Refund stuck PROCESSING on retry — idempotency mismatch',
      status: 'qa',
      statusLabel: 'In QA',
      similarityPct: '79%',
    },
    {
      id: 'D-2031',
      title: 'Long-running PG callback lost in load-balancer keepalive cycle',
      status: 'open',
      statusLabel: 'Open',
      similarityPct: '68%',
    },
  ] as SimilarDefectRow[],
};

// Activity timeline
export const F21_ACTIVITY = {
  label: 'Recent activity',
  rows: [
    {
      iconKind: 'comment',
      segments: [
        { kind: 'bold', value: 'Suresh P.' },
        {
          kind: 'text',
          value: ' commented — "Reproduced on staging-v3 with delay-injection at 35 s."',
        },
      ],
      when: '2h',
    },
    {
      iconKind: 'status',
      segments: [
        { kind: 'text', value: 'Status changed ' },
        { kind: 'bold', value: 'Open → In progress' },
        { kind: 'text', value: ' by ' },
        { kind: 'bold', value: 'Suresh P.' },
      ],
      when: '5h',
    },
    {
      iconKind: 'assign',
      segments: [
        { kind: 'text', value: 'Assigned to ' },
        { kind: 'bold', value: 'Suresh P.' },
        { kind: 'text', value: ' by ' },
        { kind: 'bold', value: 'Yogesh M.' },
      ],
      when: '1d',
    },
  ] as ActivityRow[],
};

// Comments
export const F21_COMMENTS = {
  label: 'Comments',
  items: [
    {
      authorName: 'Suresh P.',
      authorInitials: 'SP',
      authorAvatarTone: 'violet',
      when: '2h ago',
      text: "Confirmed gateway P95 is 41 s in last week. We should bump the webhook deadline AND add a poller as fallback — Sherlock's plan looks right.",
    },
    {
      authorName: 'Priya A.',
      authorInitials: 'PA',
      authorAvatarTone: 'amber',
      when: '1d ago',
      text: 'Two merchants raised this on Friday. Marking P0 — ship-blocker for Sprint 42.',
    },
  ] as CommentItem[],
  inputPlaceholder: 'Comment as Yogesh M. — Markdown supported, @mention to notify',
};

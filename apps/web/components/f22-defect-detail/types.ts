// Types for F22 Defect Detail canned data — derived verbatim from
// PM1_UI_v2/Redesign Frame by claude design/F22 Defect Detail v2.html.
// Hard Rule 17: any user-visible string in TSX must trace back to
// canned-data.ts (which is itself extracted from this v2 HTML).

export type Severity = 'P0' | 'P1' | 'P2' | 'P3';
export type Environment = 'local' | 'staging' | 'prod';
export type AgentCode = 'composer' | 'curator' | 'sherlock';

// -----------------------------------------------------------------------------
// Defect header (DEF-RET-2104 in canonical)
// -----------------------------------------------------------------------------

export interface Defect {
  id: string; // "DEF-RET-2104"
  title: string; // long-form one-line title
  description: string; // P0 incident summary (paragraph)
  followup: string; // "Seen on 5 of last 12 refunds…" paragraph
  severity: Severity;
  status: string; // "In progress"
  statusTone: 'open' | 'in-progress' | 'closed' | 'won-fix';
  filed: string; // "4h ago"
  age: string; // "04:18:32"
  jiraKey: string; // "RET-3392"
  jiraSynced: boolean;
  assignee: { name: string; initials: string };
  reporter: { name: string; initials: string };
  sourceRun: string; // "RUN-RET-2026-04-25-002"
  testCase: string; // "TC-RET-1043"
}

// -----------------------------------------------------------------------------
// Sherlock RCA (5 layers + summary hypothesis + confidence bar)
// -----------------------------------------------------------------------------

export type ConfTone = 'high' | 'med' | 'low';

export interface ConfBarSegment {
  label: 'Network' | 'Service' | 'Data' | 'UI';
  pct: number; // 14, 78, 6, 2
}

export interface SherlockSummary {
  generated: string; // "generated 18m ago"
  body: string; // hypothesis prose
  followup: string; // "Seen on 5 of last 12…"
  evidence: string[]; // ["5 affected refunds","3 stack traces",
  //  "RefundService.ts:241","PartnerCallbackController.kt"]
}

export type SherlockBoxKind = 'HYPOTHESIS' | 'FINDING' | 'RECOMMENDATION' | 'NOTE';

export interface SherlockBox {
  kind: SherlockBoxKind;
  body: string;
}

// One per RCA layer; each layer carries a structured payload by kind.
export type LayerPayload =
  | { kind: 'stack'; variant: string; lines: StackTraceLine[] }
  | { kind: 'env'; rows: { k: string; v: string; note?: string }[] }
  | { kind: 'config'; rows: { k: string; v: string; note?: string }[] }
  | { kind: 'code'; commits: CodeCommit[]; affectedLines: { file: string; range: string } }
  | { kind: 'data'; flag: string; rows: { k: string; v: string }[] };

export interface StackTraceLine {
  raw: string; // e.g. "TimeoutException: webhook handler ack…"
  candidate?: boolean; // root-cause candidate marker
}

export interface CodeCommit {
  hash: string; // "7c2e1f9"
  author: { name: string; initials: string };
  date: string; // "2026-04-22"
  message: string; // quoted commit message
  prNumber: string; // "PR #2104"
}

export interface RcaLayer {
  id: string; // "stack" | "environment" | "config" | "code" | "data"
  num: '01' | '02' | '03' | '04' | '05';
  icon: 'terminal' | 'public' | 'tune' | 'code' | 'database';
  title: string; // "Stack" | "Environment" | ...
  conf: number; // 0..100
  confTone: ConfTone;
  confLabel: 'HIGH' | 'MEDIUM' | 'LOW';
  hint: string; // "3 traces · variant A (5×)" etc.
  defaultExpanded: boolean;
  payload: LayerPayload;
  sherlockBox: SherlockBox; // typed Sherlock comment for this layer
  hitlRequired?: boolean; // Layer 5 only
}

// -----------------------------------------------------------------------------
// Suggested fix (between RCA and Evidence)
// -----------------------------------------------------------------------------

export interface SuggestedFix {
  heading: string; // "Bump refund.handler_timeout_ms from 5,000 → 35,000…"
  body: string; // "Two-line config change. Aligns timeout with partner-bank's 30s SLA…"
  applyLabel: string; // "Apply & re-run TC-RET-1043"
  linkedTestCase: string; // "TC-RET-1043"
}

// -----------------------------------------------------------------------------
// Evidence (tabs + 3 mini-cards)
// -----------------------------------------------------------------------------

export interface EvidenceTab {
  id: string;
  icon: string; // material-icon name from canonical
  label: string; // "Console", "Screenshots", etc.
  count?: number; // 142, 3, 88, 3
  active?: boolean;
}

export interface EvidenceCard {
  kind: 'log' | 'chart-latency' | 'chart-queue';
  title: string; // "refund-handler.log · trace REF-9821" etc.
  // For log cards: lines of log output.
  logLines?: { tone: 'err' | 'warn' | 'info'; ts: string; src: string; body: string }[];
  // For latency chart: caption + spike annotation.
  latencyCaption?: string; // "03:14 config push", "p95 spike 5.6×"
  // For queue chart: rows + baseline.
  queueRows?: string; // "142 rows"
  queueBaseline?: string; // "baseline 8 · since 03:14 IST"
}

// -----------------------------------------------------------------------------
// Curator — similar defects
// -----------------------------------------------------------------------------

export interface SimilarDefect {
  similarity: number; // 92, 79, 71 (whole percent)
  id: string; // "DEF-RET-1842"
  statusPill: { label: string; tone: 'closed' | 'in-qa' | 'open' };
  closedDate?: string; // "Closed 2026-02-08" annotation
  title: string;
  actions: { label: string; primary?: boolean }[];
}

// -----------------------------------------------------------------------------
// Discussion thread (Jira two-way sync)
// -----------------------------------------------------------------------------

export interface DiscussionComment {
  id: string;
  author: { name: string; initials: string };
  role: 'QA Nexus' | 'Jira' | 'QA LEAD';
  ts: string; // "4h ago · 04:22 UTC"
  body: string;
  jiraSync?: boolean; // open-in-new icon for jira-synced
  tags?: { label: string; tone: 'fail' | 'warn' | 'pass' | 'info' | 'secondary' }[];
}

// -----------------------------------------------------------------------------
// Right rail (5 cards)
// -----------------------------------------------------------------------------

export interface RailKvRow {
  k: string;
  v: string;
  note?: string;
  tone?: 'fail' | 'warn' | 'pass' | 'info';
}
export interface RailLayerScore {
  num: string;
  name: string;
  pct: number;
  tone: ConfTone;
}
export interface RailActivityEvent {
  actor: string;
  text: string;
  when: string;
  tag?: string;
}

export interface RightRailMeta {
  defect: RailKvRow[]; // id, priority, status, severity, filed, age
  people: {
    assigned: { name: string; initials: string };
    reported: { name: string; initials: string };
    watching: string; // "Yogesh M, Deepak R, +3"
  };
  linkage: RailKvRow[]; // source run, test case, jira, component, release
  layerScores: RailLayerScore[];
  recentActivity: RailActivityEvent[];
}

// -----------------------------------------------------------------------------
// Page-level
// -----------------------------------------------------------------------------

export interface ProjectAnchor {
  name: string; // "Iksula Returns"
  slug: string; // "iksula-returns"
  key: string; // "RET"
}

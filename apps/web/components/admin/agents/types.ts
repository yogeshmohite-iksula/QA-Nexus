// F26 Agents — semantic prop shapes for sub-components.
//
// Derived from F26.spec.json constraints:
//   - dataAttrs.agent = ['composer', 'curator', 'sherlock'] → 3 agents
//   - headings.h2 includes "Agents 3" / "Permissions 3 × 4" /
//     "Recent activity last 20" / "Recent decisions last 12"
//   - dataAttrs.outcome = ['acc', 'edit', 'rej']
//   - dataAttrs.level = ['1', '2', '3']
//   - dataAttrs.tab = ['autonomy', 'guardrails', 'model']
//   - dataAttrs.tone = ['home', 'info', 'primary', 'pass', 'warn',
//     'secondary', 'fail', 'violet']
//
// These shapes will be filled by semantic exports added to
// agents-page.canned-data.ts (per Hard Rule 17 verbatim from F26 v2 HTML).
//
// Until canned-data extension lands, components accept `data?: T`
// (optional) and render Phase-1 placeholder when absent — so Phase-1
// scaffold stays typecheck-clean.

import type { AgentCode } from '@/components/ui/agent-name';

// ---------------------------------------------------------------------------
// 1. StatsStrip — the 5 chips in phead
// ---------------------------------------------------------------------------
export interface F26StatChip {
  /** Verbatim chip text (e.g. "3 agents active"). */
  text: string;
  /** Optional tone for visual styling per --pass/--warn/--info CSS var. */
  tone?: 'pass' | 'warn' | 'info' | 'primary' | 'secondary' | 'fail' | 'home';
}
export type F26StatsData = ReadonlyArray<F26StatChip>;

// ---------------------------------------------------------------------------
// 2. LLMProviderPanel — provider name + health + rows of config
// ---------------------------------------------------------------------------
export interface F26ProviderRow {
  label: string;
  value: string;
  tone?: F26StatChip['tone'];
}
export interface F26LLMProviderData {
  providerName: string;
  health: 'healthy' | 'degraded' | 'offline';
  healthLabel: string;
  rows: ReadonlyArray<F26ProviderRow>;
}

// ---------------------------------------------------------------------------
// 3. AgentCardsGrid — 3 cards Composer / Curator / Sherlock
// ---------------------------------------------------------------------------
export interface F26AgentMetric {
  label: string;
  value: string;
  tone?: F26StatChip['tone'];
}
export interface F26AgentCard {
  /** AgentName code prop — drives <AgentName code={...} />. */
  code: Extract<AgentCode, 'composer' | 'curator' | 'sherlock'>;
  /** One-line role description (verbatim from F26 v2 HTML). */
  description: string;
  /** Autonomy level 1-3 per dataAttrs.level. */
  autonomyLevel: 1 | 2 | 3;
  autonomyLabel: string;
  /** 3-6 metric chips per card (decisions today, accept rate, latency, cost). */
  metrics: ReadonlyArray<F26AgentMetric>;
}
export type F26AgentsData = ReadonlyArray<F26AgentCard>;

// ---------------------------------------------------------------------------
// 4. PermissionsMatrix — 3 agents × 4 capability rows
// ---------------------------------------------------------------------------
export type F26PermLevel = 'full' | 'review' | 'none';
export interface F26PermissionsRow {
  /** Capability name (verbatim — e.g. "Create test cases"). */
  capability: string;
  /** Map agent code → permission level. */
  composer: F26PermLevel;
  curator: F26PermLevel;
  sherlock: F26PermLevel;
}
export interface F26PermissionsMatrixData {
  /** Column headers: agent codes (always 3 — composer/curator/sherlock). */
  agents: ReadonlyArray<Extract<AgentCode, 'composer' | 'curator' | 'sherlock'>>;
  rows: ReadonlyArray<F26PermissionsRow>;
}

// ---------------------------------------------------------------------------
// 5. RecentActivity — 20 entries
// ---------------------------------------------------------------------------
export interface F26ActivityEntry {
  /** ISO-ish timestamp string (verbatim from canonical). */
  time: string;
  /** Which agent took the action. */
  agent: Extract<AgentCode, 'composer' | 'curator' | 'sherlock'>;
  /** Verbatim action description. */
  action: string;
  /** Linked entity id (e.g. "TC-RET-1043" or "RET-247"). */
  refId?: string;
  /** Optional outcome chip per dataAttrs.outcome. */
  outcome?: 'acc' | 'edit' | 'rej';
}
export type F26RecentActivityData = ReadonlyArray<F26ActivityEntry>;

// ---------------------------------------------------------------------------
// 6. RecentDecisions — 12 entries
// ---------------------------------------------------------------------------
export interface F26DecisionEntry {
  time: string;
  agent: Extract<AgentCode, 'composer' | 'curator' | 'sherlock'>;
  decision: string;
  refId?: string;
  outcome: 'acc' | 'edit' | 'rej';
  /** Optional confidence score for Sherlock RCA decisions. */
  confidence?: number;
}
export type F26RecentDecisionsData = ReadonlyArray<F26DecisionEntry>;

// ---------------------------------------------------------------------------
// 7. EvalHarness — eval runs, MUST include AC042 2026-05-27 verbatim row
// ---------------------------------------------------------------------------
export interface F26EvalRow {
  date: string; // e.g. "2026-05-27"
  scenario: string; // e.g. "AC042 Sherlock top-2 hit-rate"
  /** Top-N hit rate as a decimal (0.64 = 64%). */
  topNRate: number;
  topN: 1 | 2 | 3;
  /** Calibration score (0..1). 1.00 = perfect. */
  calibration: number;
  status: 'pass' | 'warn' | 'fail';
  /** Optional note / link to the run report. */
  note?: string;
}
export interface F26EvalHarnessData {
  /** Latest eval run rows (most-recent first). */
  rows: ReadonlyArray<F26EvalRow>;
  /** Autonomy ladder mapping per dataAttrs.level. */
  autonomyLadder: ReadonlyArray<{ level: 1 | 2 | 3; label: string; description: string }>;
}

// ---------------------------------------------------------------------------
// 8. GuardrailEvents — 6 rules per spec heading "Guardrail configuration 6 rules"
// ---------------------------------------------------------------------------
export interface F26GuardrailRule {
  ruleName: string;
  /** Verbatim rule description. */
  description: string;
  /** Which agents this rule applies to (subset). */
  appliesTo: ReadonlyArray<Extract<AgentCode, 'composer' | 'curator' | 'sherlock'>>;
  /** Current state — enforced / monitored / disabled. */
  state: 'enforced' | 'monitored' | 'disabled';
  /** Optional last-triggered timestamp. */
  lastTriggered?: string;
}
export interface F26GuardrailEventsData {
  rules: ReadonlyArray<F26GuardrailRule>;
  /** Recent events log (most-recent first). */
  events: ReadonlyArray<{
    time: string;
    ruleName: string;
    agent: Extract<AgentCode, 'composer' | 'curator' | 'sherlock'>;
    action: 'blocked' | 'flagged' | 'allowed';
    refId?: string;
  }>;
}

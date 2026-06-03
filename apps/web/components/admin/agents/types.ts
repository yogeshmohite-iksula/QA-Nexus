// F26 Agents — semantic prop shapes for sub-components.
//
// Phase-2: types derived via `typeof X` from agents-page.canned-data
// exports — zero drift, single source of truth (the canned-data file).
//
// This replaces the Phase-1 sketch shapes once MAIN's actual canned-data
// extension landed (commit da3f41d). The shape is now whatever
// canned-data ships; if MAIN regenerates with a different shape, types
// auto-track.

import type {
  F26_STATS,
  F26_SNAPSHOT,
  F26_LLM_PROVIDER,
  F26_AGENTS,
  F26_PERMISSIONS_MATRIX,
  F26_RECENT_ACTIVITY,
  F26_RECENT_DECISIONS,
  F26_DECISION_SUMMARY,
  F26_EVAL_HARNESS,
  F26_GUARDRAIL_EVENTS,
  F26_AUTONOMY_LADDER,
} from '@/components/admin/agents-page.canned-data';

export type F26StatsData = typeof F26_STATS;
export type F26SnapshotData = typeof F26_SNAPSHOT;
export type F26LLMProviderData = typeof F26_LLM_PROVIDER;
export type F26AgentsData = typeof F26_AGENTS;
export type F26AgentCard = F26AgentsData[number];
export type F26PermissionsMatrixData = typeof F26_PERMISSIONS_MATRIX;
export type F26RecentActivityData = typeof F26_RECENT_ACTIVITY;
export type F26ActivityEntry = F26RecentActivityData[number];
export type F26RecentDecisionsData = typeof F26_RECENT_DECISIONS;
export type F26DecisionEntry = F26RecentDecisionsData[number];
export type F26DecisionSummary = typeof F26_DECISION_SUMMARY;
export type F26EvalHarnessData = typeof F26_EVAL_HARNESS;
export type F26EvalRow = F26EvalHarnessData['rows'][number];
export type F26GuardrailEventsData = typeof F26_GUARDRAIL_EVENTS;
export type F26GuardrailEvent = F26GuardrailEventsData[number];
export type F26AutonomyLadderData = typeof F26_AUTONOMY_LADDER;

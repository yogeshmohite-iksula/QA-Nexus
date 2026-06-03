// F26 Agents page composer · Hard Rule 18-compliant scaffold from
// spec.json + agents-page.canned-data.ts.
//
// Phase-1: section bodies render placeholders.
// Phase-2: semantic exports (F26_STATS, F26_LLM_PROVIDER, F26_AGENTS,
// F26_PERMISSIONS_MATRIX, F26_RECENT_ACTIVITY, F26_RECENT_DECISIONS,
// F26_EVAL_HARNESS, F26_GUARDRAIL_EVENTS) will be added to
// agents-page.canned-data.ts and imported below. Wire-up is mechanical:
// uncomment imports + pass to component data prop.

'use client';

import { AdminShell } from '@/components/admin/admin-shell';
import { F26_RAW } from '@/components/admin/agents-page.canned-data';
// Phase-2 semantic exports (added by canned-data extension):
// import {
//   F26_STATS, F26_LLM_PROVIDER, F26_AGENTS, F26_PERMISSIONS_MATRIX,
//   F26_RECENT_ACTIVITY, F26_RECENT_DECISIONS, F26_EVAL_HARNESS,
//   F26_GUARDRAIL_EVENTS,
// } from '@/components/admin/agents-page.canned-data';

import { StatsStrip } from '@/components/admin/agents/StatsStrip';
import { LLMProviderPanel } from '@/components/admin/agents/LLMProviderPanel';
import { AgentCardsGrid } from '@/components/admin/agents/AgentCardsGrid';
import { PermissionsMatrix } from '@/components/admin/agents/PermissionsMatrix';
import { RecentActivity } from '@/components/admin/agents/RecentActivity';
import { RecentDecisions } from '@/components/admin/agents/RecentDecisions';
import { EvalHarness } from '@/components/admin/agents/EvalHarness';
import { GuardrailEvents } from '@/components/admin/agents/GuardrailEvents';

const H1 = F26_RAW.headings.h1[0];
const PROVE_RIBBON = F26_RAW.textByTag.span.find((s) => s.startsWith('Frozen by')) ?? '';
const SNAPSHOT_LABEL = F26_RAW.textByTag.span.find((s) => s === 'Snapshot') ?? 'Snapshot';

export function AgentsPage() {
  return (
    <AdminShell active="agents">
      <main className="center" aria-label="Agents page">
        <nav className="crumb" aria-label="Breadcrumb">
          <span>Admin</span>
          <span aria-hidden="true">›</span>
          <span aria-current="page">Agents</span>
        </nav>

        <header className="phead">
          <h1>{H1}</h1>
          <StatsStrip /* Phase-2: data={F26_STATS} */ />
        </header>

        <div className="prove-ribbon" role="status" aria-label="Snapshot mode">
          <strong>{SNAPSHOT_LABEL}</strong>
          <span>{PROVE_RIBBON}</span>
        </div>

        <LLMProviderPanel /* Phase-2: data={F26_LLM_PROVIDER} */ />
        <AgentCardsGrid /* Phase-2: data={F26_AGENTS} */ />
        <PermissionsMatrix /* Phase-2: data={F26_PERMISSIONS_MATRIX} */ />
        <RecentActivity /* Phase-2: data={F26_RECENT_ACTIVITY} */ />
        <RecentDecisions /* Phase-2: data={F26_RECENT_DECISIONS} */ />
        <EvalHarness /* Phase-2: data={F26_EVAL_HARNESS} */ />
        <GuardrailEvents /* Phase-2: data={F26_GUARDRAIL_EVENTS} */ />
      </main>
    </AdminShell>
  );
}

// F26 Agents page composer — Phase-2 wired.
//
// Hard Rule 17: all text comes from agents-page.canned-data exports
// (F26_RAW for fallback / shell text; F26_* semantic exports for
// section bodies). Zero invented strings.

'use client';

import { AdminShell } from '@/components/admin/admin-shell';
import {
  F26_RAW,
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

import { StatsStrip } from '@/components/admin/agents/StatsStrip';
import { LLMProviderPanel } from '@/components/admin/agents/LLMProviderPanel';
import { AgentCardsGrid } from '@/components/admin/agents/AgentCardsGrid';
import { PermissionsMatrix } from '@/components/admin/agents/PermissionsMatrix';
import { RecentActivity } from '@/components/admin/agents/RecentActivity';
import { RecentDecisions } from '@/components/admin/agents/RecentDecisions';
import { EvalHarness } from '@/components/admin/agents/EvalHarness';
import { GuardrailEvents } from '@/components/admin/agents/GuardrailEvents';

const H1 = F26_RAW.headings.h1[0];
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
          <StatsStrip data={F26_STATS} />
        </header>

        <div className="prove-ribbon" role="status" aria-label="Snapshot mode" data-tone="info">
          <strong>{SNAPSHOT_LABEL}</strong>
          <span>
            Frozen by {F26_SNAPSHOT.frozenBy} · {F26_SNAPSHOT.frozenAt} · {F26_SNAPSHOT.description}
          </span>
          <code className="prove-sha">{F26_SNAPSHOT.sha256}</code>
        </div>

        <LLMProviderPanel data={F26_LLM_PROVIDER} />
        <AgentCardsGrid data={F26_AGENTS} />
        <PermissionsMatrix data={F26_PERMISSIONS_MATRIX} />
        <RecentActivity data={F26_RECENT_ACTIVITY} />
        <RecentDecisions data={F26_RECENT_DECISIONS} summary={F26_DECISION_SUMMARY} />
        <EvalHarness data={F26_EVAL_HARNESS} autonomyLadder={F26_AUTONOMY_LADDER} />
        <GuardrailEvents data={F26_GUARDRAIL_EVENTS} />
      </main>
    </AdminShell>
  );
}

// F26 Agents page composer — markup mirrors canonical F26 v2 HTML
// (Hard Rule 15) + text from canned-data (Hard Rule 17).

'use client';

import './agents-page.css';

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

export function AgentsPage() {
  return (
    <AdminShell active="agents">
      <main className="main">
        <div className="center">
          {/* breadcrumb */}
          <nav className="crumb" aria-label="Breadcrumb">
            <a href="#">Home</a>
            <span className="sep">›</span>
            <a href="#">Govern</a>
            <span className="sep">›</span>
            <span className="now">Agents</span>
          </nav>

          {/* Page header */}
          <div className="phead">
            <div className="lead">
              <h1>{H1}</h1>
              <StatsStrip data={F26_STATS} />
            </div>
          </div>

          {/* Prove-mode ribbon */}
          <div className="prove-ribbon" role="status" aria-label="Snapshot mode">
            <span className="lbl">Snapshot</span>
            <span className="meta">
              Frozen by <b>{F26_SNAPSHOT.frozenBy}</b> · <b>{F26_SNAPSHOT.frozenAt}</b> ·{' '}
              {F26_SNAPSHOT.description}
            </span>
            <span className="hash">SHA-256 · {F26_SNAPSHOT.sha256}</span>
          </div>

          <LLMProviderPanel data={F26_LLM_PROVIDER} />
          <AgentCardsGrid data={F26_AGENTS} />
          <PermissionsMatrix data={F26_PERMISSIONS_MATRIX} />
          <RecentActivity data={F26_RECENT_ACTIVITY} />
          <RecentDecisions data={F26_RECENT_DECISIONS} summary={F26_DECISION_SUMMARY} />
          <EvalHarness data={F26_EVAL_HARNESS} autonomyLadder={F26_AUTONOMY_LADDER} />
          <GuardrailEvents data={F26_GUARDRAIL_EVENTS} />
        </div>
      </main>
    </AdminShell>
  );
}

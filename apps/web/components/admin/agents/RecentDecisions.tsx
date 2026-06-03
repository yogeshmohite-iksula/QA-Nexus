// F26 RecentDecisions — list with outcome chip + confidence + summary.

'use client';

import { F26_RAW } from '@/components/admin/agents-page.canned-data';
import type { F26RecentDecisionsData, F26DecisionSummary } from '@/components/admin/agents/types';
import { AgentName } from '@/components/ui/agent-name';

const HEADING =
  F26_RAW.headings.h2.find((h) => h.startsWith('Recent decisions')) ?? 'Recent decisions';

interface Props {
  data: F26RecentDecisionsData;
  summary: F26DecisionSummary;
}

function outcomeTone(o: 'acc' | 'edit' | 'rej'): 'pass' | 'warn' | 'fail' {
  if (o === 'acc') return 'pass';
  if (o === 'edit') return 'warn';
  return 'fail';
}
function outcomeLabel(o: 'acc' | 'edit' | 'rej'): string {
  if (o === 'acc') return 'Accepted';
  if (o === 'edit') return 'Edited';
  return 'Rejected';
}

export function RecentDecisions({ data, summary }: Props) {
  return (
    <section id="decisions" aria-labelledby="dec-h">
      <header className="section-head">
        <h2 id="dec-h">{HEADING}</h2>
        <div className="dec-summary text-muted" aria-label="Decisions summary">
          <span data-tone="pass">{summary.accepted} accepted</span>
          <span aria-hidden="true">·</span>
          <span data-tone="warn">{summary.edited} edited</span>
          <span aria-hidden="true">·</span>
          <span data-tone="fail">{summary.rejected} rejected</span>
          <span aria-hidden="true">·</span>
          <span>{summary.acceptanceRate}</span>
        </div>
      </header>
      <div className="section-body">
        <ol className="decision-list" aria-label="Recent decisions">
          {data.map((entry, i) => (
            <li
              key={i}
              className="decision-row"
              data-agent={entry.agent}
              data-outcome={entry.outcome}
            >
              <span className="decision-time text-muted">{entry.time}</span>
              <span className="decision-agent">
                <AgentName code={entry.agent} noIcon />
              </span>
              <span className="decision-ref text-muted">{entry.ref}</span>
              <p className="decision-desc">{entry.description}</p>
              <span className="decision-actor text-muted">{entry.actor}</span>
              <span
                className="decision-outcome"
                data-tone={outcomeTone(entry.outcome)}
                aria-label={`Outcome ${outcomeLabel(entry.outcome)}`}
              >
                {outcomeLabel(entry.outcome)}
              </span>
              <span className="decision-conf text-muted">conf {entry.confidence.toFixed(2)}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

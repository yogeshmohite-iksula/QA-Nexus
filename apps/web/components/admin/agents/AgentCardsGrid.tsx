// F26 AgentCardsGrid — 3 cards: Composer / Curator / Sherlock.
// Hard Rule 14 agent naming canon: <AgentName code={...} />.

'use client';

import { F26_RAW } from '@/components/admin/agents-page.canned-data';
import type { F26AgentsData } from '@/components/admin/agents/types';
import { AgentName } from '@/components/ui/agent-name';

const HEADING = F26_RAW.headings.h2.find((h) => h.startsWith('Agents 3')) ?? 'Agents';

interface Props {
  data: F26AgentsData;
}

export function AgentCardsGrid({ data }: Props) {
  return (
    <section aria-labelledby="agents-h">
      <header className="section-head">
        <h2 id="agents-h">{HEADING}</h2>
      </header>
      <div className="agents-grid">
        {data.map((agent) => (
          <article
            key={agent.code}
            className="agent-card"
            data-agent={agent.code}
            aria-labelledby={`agent-${agent.code}-name`}
          >
            <header className="agent-card-head">
              <h3 id={`agent-${agent.code}-name`} className="agent-card-name">
                <AgentName code={agent.code} />
              </h3>
              <span className="agent-card-id text-muted">{agent.agentId}</span>
            </header>
            <p className="agent-card-role">{agent.role}</p>
            <p className="agent-card-desc">{agent.description}</p>
            <dl className="agent-card-stats">
              <div>
                <dt className="text-muted">{agent.stats.primaryLabel}</dt>
                <dd className="stat-primary">{agent.stats.primary}</dd>
              </div>
              <div>
                <dt className="text-muted">saved</dt>
                <dd>{agent.stats.saved}</dd>
              </div>
              <div>
                <dt className="text-muted">activity</dt>
                <dd>{agent.stats.recent}</dd>
              </div>
            </dl>
            <div className="agent-card-chart text-muted">
              <span>{agent.chart}</span>
              <span>·</span>
              <span>{agent.chartDetail}</span>
            </div>
            <footer className="agent-card-foot">
              <span className="autonomy-pill" data-level="2">
                {agent.autonomy}
              </span>
            </footer>
          </article>
        ))}
      </div>
    </section>
  );
}

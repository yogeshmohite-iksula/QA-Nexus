// F26 RecentActivity — verbatim activity feed.

'use client';

import { F26_RAW } from '@/components/admin/agents-page.canned-data';
import type { F26RecentActivityData } from '@/components/admin/agents/types';
import { AgentName } from '@/components/ui/agent-name';

const HEADING =
  F26_RAW.headings.h2.find((h) => h.startsWith('Recent activity')) ?? 'Recent activity';

interface Props {
  data: F26RecentActivityData;
}

export function RecentActivity({ data }: Props) {
  return (
    <section id="activity" aria-labelledby="act-h">
      <header className="section-head">
        <h2 id="act-h">{HEADING}</h2>
      </header>
      <div className="section-body">
        <ol className="activity-list" aria-label="Recent activity entries">
          {data.map((entry, i) => (
            <li key={i} className="activity-row" data-agent={entry.agent}>
              <span className="activity-time text-muted">{entry.time}</span>
              <span className="activity-agent">
                <AgentName code={entry.agent} noIcon />
              </span>
              <span className="activity-action">{entry.action}</span>
              <span className="activity-target">{entry.target}</span>
              {entry.actor && <span className="activity-actor text-muted">· {entry.actor}</span>}
              <span className="activity-perf text-muted">· {entry.perf}</span>
              {'detail' in entry && entry.detail && (
                <span className="activity-detail text-muted">· {entry.detail}</span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

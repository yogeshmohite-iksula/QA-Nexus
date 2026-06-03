// F26 RecentActivity — canonical .act-card with filter chips + entries.

'use client';

import type { F26RecentActivityData, F26ActivityEntry } from '@/components/admin/agents/types';

function AgentBadge({ code }: { code: F26ActivityEntry['agent'] }) {
  if (code === 'composer') {
    return (
      <span className="act-badge composer">
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M8 2l1.4 3.5L13 7l-3.6 1.5L8 12l-1.4-3.5L3 7l3.6-1.5z" />
        </svg>
        Composer
      </span>
    );
  }
  if (code === 'curator') {
    return (
      <span className="act-badge curator">
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="6" cy="6" r="4" />
          <circle cx="11" cy="11" r="4" />
        </svg>
        Curator
      </span>
    );
  }
  return (
    <span className="act-badge sherlock">
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="7" cy="7" r="4" />
        <path d="M10 10l4 4" />
      </svg>
      Sherlock
    </span>
  );
}

interface Props {
  data: F26RecentActivityData;
}

export function RecentActivity({ data }: Props) {
  const composerCount = data.filter((d) => d.agent === 'composer').length;
  const curatorCount = data.filter((d) => d.agent === 'curator').length;
  const sherlockCount = data.filter((d) => d.agent === 'sherlock').length;
  return (
    <section id="activity" aria-labelledby="act-h">
      <div className="sec-h" style={{ marginBottom: 10 }}>
        <h2 id="act-h">
          Recent activity <span className="ct">last 20</span>
        </h2>
        <span className="meta">
          across <b>Composer · Curator · Sherlock</b>
        </span>
      </div>
      <div className="act-card">
        <div className="act-filters" role="tablist" aria-label="Activity filter">
          <button className="act-chip on" data-filt="all" type="button">
            All <span className="ct">{data.length}</span>
          </button>
          <button className="act-chip" data-filt="composer" type="button">
            <span className="pip violet"></span>Composer <span className="ct">{composerCount}</span>
          </button>
          <button className="act-chip" data-filt="curator" type="button">
            <span className="pip info"></span>Curator <span className="ct">{curatorCount}</span>
          </button>
          <button className="act-chip" data-filt="sherlock" type="button">
            <span className="pip fail"></span>Sherlock <span className="ct">{sherlockCount}</span>
          </button>
          <span style={{ flex: 1 }}></span>
          <button className="act-chip on" data-time="24h" type="button">
            Last 24h
          </button>
          <button className="act-chip" data-time="7d" type="button">
            Last 7d
          </button>
        </div>
        <div className="act-list" id="actList">
          {data.map((entry, i) => (
            <div key={i} className="act-row" data-agent={entry.agent}>
              <AgentBadge code={entry.agent} />
              <span className="act-line">
                <span className="what">{entry.action}</span> for{' '}
                <span className="target">{entry.target}</span>
                {entry.actor && <span className="by"> · {entry.actor}</span>}
                {'detail' in entry && entry.detail && <span className="by"> · {entry.detail}</span>}
              </span>
              <span className="act-meta">
                <span className="ts">{entry.time}</span>
                <span className="cost">{entry.perf}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

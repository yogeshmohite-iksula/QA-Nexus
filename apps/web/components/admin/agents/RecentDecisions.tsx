// F26 RecentDecisions — canonical .dec-card structure with .dec-filters
// (filt-chip), .dec-row > .badge + .what > .id + .conf + .outcome + .ts.

'use client';

import type {
  F26RecentDecisionsData,
  F26DecisionSummary,
  F26DecisionEntry,
} from '@/components/admin/agents/types';

function BadgeFor({ code }: { code: F26DecisionEntry['agent'] }) {
  const cls = code === 'composer' ? 'composer' : code === 'curator' ? 'curator' : 'sherlock';
  const Display = code.charAt(0).toUpperCase() + code.slice(1);
  return <span className={`badge ${cls}`}>{Display}</span>;
}

function OutcomeBadge({ outcome }: { outcome: F26DecisionEntry['outcome'] }) {
  if (outcome === 'acc') {
    return (
      <span className="outcome acc">
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <path d="M3 8l3 3 7-7" />
        </svg>
        Accepted
      </span>
    );
  }
  if (outcome === 'edit') {
    return (
      <span className="outcome edit">
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M11 3l3 3-8 8H3v-3z" />
        </svg>
        Edited
      </span>
    );
  }
  return (
    <span className="outcome rej">
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      >
        <path d="M4 4l8 8M12 4l-8 8" />
      </svg>
      Rejected
    </span>
  );
}

interface Props {
  data: F26RecentDecisionsData;
  summary: F26DecisionSummary;
}

export function RecentDecisions({ data, summary }: Props) {
  const composerCount = data.filter((d) => d.agent === 'composer').length;
  const curatorCount = data.filter((d) => d.agent === 'curator').length;
  const sherlockCount = data.filter((d) => d.agent === 'sherlock').length;
  return (
    <section id="decisions" aria-labelledby="dec-h">
      <div className="sec-h" style={{ marginBottom: 10 }}>
        <h2 id="dec-h">
          Recent decisions <span className="ct">last 12</span>
        </h2>
        <span className="meta">
          human accept / edit / reject per agent output · <b>quality signal</b>
        </span>
      </div>
      <div className="dec-card">
        <div className="dec-filters" role="tablist" aria-label="Decisions filter">
          <button className="filt-chip on" data-decfilt="all" type="button">
            All <span className="ct">{data.length}</span>
          </button>
          <button className="filt-chip" data-decfilt="composer" type="button">
            Composer <span className="ct">{composerCount}</span>
          </button>
          <button className="filt-chip" data-decfilt="curator" type="button">
            Curator <span className="ct">{curatorCount}</span>
          </button>
          <button className="filt-chip" data-decfilt="sherlock" type="button">
            Sherlock <span className="ct">{sherlockCount}</span>
          </button>
          <span style={{ flex: 1 }}></span>
          <button className="filt-chip" data-decout="acc" type="button">
            <svg
              width="10"
              height="10"
              viewBox="0 0 16 16"
              fill="none"
              stroke="var(--pass)"
              strokeWidth="2.4"
              strokeLinecap="round"
            >
              <path d="M3 8l3 3 7-7" />
            </svg>
            Accepted
          </button>
          <button className="filt-chip" data-decout="edit" type="button">
            <svg
              width="10"
              height="10"
              viewBox="0 0 16 16"
              fill="none"
              stroke="var(--warn)"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M11 3l3 3-8 8H3v-3z" />
            </svg>
            Edited
          </button>
          <button className="filt-chip" data-decout="rej" type="button">
            <svg
              width="10"
              height="10"
              viewBox="0 0 16 16"
              fill="none"
              stroke="var(--fail)"
              strokeWidth="2.4"
              strokeLinecap="round"
            >
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
            Rejected
          </button>
        </div>
        <div className="dec-list" id="decList">
          {data.map((entry, i) => (
            <div key={i} className="dec-row" data-agent={entry.agent} data-outcome={entry.outcome}>
              <BadgeFor code={entry.agent} />
              <span className="what">
                <span className="id">{entry.ref}</span>
                {entry.description}
                {entry.actor && <span className="by"> · {entry.actor}</span>}
              </span>
              <span className="conf">
                {entry.agent === 'curator' ? 'sim' : 'conf'} <b>{entry.confidence.toFixed(2)}</b>
              </span>
              <OutcomeBadge outcome={entry.outcome} />
              <span className="ts">{entry.time}</span>
            </div>
          ))}
        </div>
        <div className="dec-foot perm-foot">
          <span className="note">
            <b>{summary.accepted}</b> accepted · <b>{summary.edited}</b> edited ·{' '}
            <b>{summary.rejected}</b> rejected · acceptance rate <b>{summary.acceptanceRate}</b> ·
            last 12 decisions
          </span>
          <a href="#" className="ghost details-link">
            Open quality report ›
          </a>
        </div>
      </div>
    </section>
  );
}

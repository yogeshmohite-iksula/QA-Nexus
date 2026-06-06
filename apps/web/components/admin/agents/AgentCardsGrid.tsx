// F26 AgentCardsGrid — canonical agent cards with sparklines + buttons.
// "Configure" links to F26m2 model-assignment modal: /admin/agents/model-assignment?agent={code}

'use client';

import Link from 'next/link';
import type { F26AgentsData } from '@/components/admin/agents/types';

// Per-agent SVG glyph (verbatim from canonical F26 v2 HTML).
function AgentGlyph({ code }: { code: string }) {
  if (code === 'composer') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3l2.09 5.26L19 10l-4.91 1.74L12 17l-2.09-5.26L5 10l4.91-1.74z" />
        <path d="M19 4v3M20.5 5.5h-3M5 17v3M6.5 18.5h-3" />
      </svg>
    );
  }
  if (code === 'curator') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2.5C8 7 6 10 6 13a6 6 0 0 0 12 0c0-3-2-6-6-10.5z" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="6" />
      <path d="M16 16l5 5" />
    </svg>
  );
}

const TONES: Record<string, 'violet' | 'info' | 'fail'> = {
  composer: 'violet',
  curator: 'info',
  sherlock: 'fail',
};
const SPARK_CLASS: Record<string, 'spark' | 'histo' | 'confdist'> = {
  composer: 'spark',
  curator: 'histo',
  sherlock: 'confdist',
};
// Sparkline heights — verbatim from canonical inline styles.
const BARS: Record<string, ReadonlyArray<{ h: number; hi?: boolean }>> = {
  composer: [{ h: 38 }, { h: 54 }, { h: 42 }, { h: 71 }, { h: 64 }, { h: 88 }, { h: 96 }],
  curator: [
    { h: 18 },
    { h: 24 },
    { h: 36 },
    { h: 54 },
    { h: 78 },
    { h: 96 },
    { h: 78 },
    { h: 54 },
    { h: 36 },
    { h: 22 },
    { h: 14 },
  ],
  sherlock: [
    { h: 14 },
    { h: 22 },
    { h: 36 },
    { h: 54, hi: true },
    { h: 78, hi: true },
    { h: 88, hi: true },
    { h: 94, hi: true },
    { h: 72, hi: true },
    { h: 46, hi: true },
  ],
};

interface Props {
  data: F26AgentsData;
}

export function AgentCardsGrid({ data }: Props) {
  return (
    <section aria-labelledby="agents-h">
      <div className="sec-h" style={{ marginBottom: 14 }}>
        <h2 id="agents-h">
          Agents <span className="ct">{data.length}</span>
        </h2>
        <span className="meta">
          All agents <b>active</b> · last evaluation <b>2026-05-27</b>
        </span>
      </div>
      <div className="agents">
        {data.map((a) => {
          const tone = TONES[a.code];
          const sparkClass = SPARK_CLASS[a.code];
          const bars = BARS[a.code];
          return (
            <article key={a.code} className="agent-card" data-tone={tone}>
              <div className="ag-head">
                <span className="ag-glyph" aria-hidden="true">
                  <AgentGlyph code={a.code} />
                </span>
                <div className="ag-id">
                  <span className="ag-name">
                    {a.name}
                    <span className="info" title={a.description}>
                      ⓘ
                    </span>
                    <span className="code">{a.agentId}</span>
                  </span>
                  <span className="ag-sub">{a.role}</span>
                </div>
                <span className="ag-status ok">
                  <span className="dot"></span>Active
                </span>
              </div>
              <p className="ag-desc">{a.description}</p>
              <div className="ag-stats">
                <span>
                  <span className="v">{a.stats.primary}</span> {a.stats.primaryLabel}
                </span>
                <span className="sep">·</span>
                <span>
                  <span className="v">{a.stats.saved}</span> saved
                </span>
                <span className="sep">·</span>
                <span>{a.stats.recent}</span>
              </div>
              <div className="ag-chart">
                <span className="lbl">
                  <span>{a.chart}</span>
                  <b>{a.chartDetail}</b>
                </span>
                <div className={sparkClass} aria-hidden="true">
                  {bars.map((bar, i) => (
                    <span
                      key={i}
                      className={bar.hi ? 'b hi' : 'b'}
                      style={{ height: `${bar.h}%` }}
                    />
                  ))}
                </div>
              </div>
              <div className="ag-foot">
                <Link
                  className="btn-primary configure-btn"
                  href={`/admin/agents/model-assignment?agent=${a.code}`}
                  data-agent={a.code}
                >
                  <svg
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="8" cy="8" r="2" />
                    <path d="M8 1v1.5M8 13.5V15M2.5 4.5l1 1M12.5 10.5l1 1M1 8h1.5M13.5 8H15M2.5 11.5l1-1M12.5 5.5l1-1" />
                  </svg>
                  Configure
                </Link>
                <button
                  className="ghost details-link details-btn"
                  type="button"
                  data-agent={a.code}
                  style={{
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    height: 32,
                    padding: '0 10px',
                    borderRadius: 6,
                    color: 'var(--t2)',
                    fontFamily: 'inherit',
                    fontSize: '11.5px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  Details{' '}
                  <svg
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  >
                    <path d="M5 3l5 5-5 5" />
                  </svg>
                </button>
                <span
                  className={a.code === 'curator' ? 'auto-badge mon' : 'auto-badge'}
                  title="Autonomy level — click Configure to change"
                >
                  <svg
                    className="lock-glyph"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="3" y="7" width="10" height="7" rx="1.5" />
                    <path d="M5 7V5a3 3 0 0 1 6 0v2" />
                  </svg>
                  {a.autonomy}
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

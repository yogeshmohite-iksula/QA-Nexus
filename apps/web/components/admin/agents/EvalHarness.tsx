// F26 EvalHarness — canonical collapsible eval-grid (4 tiles).

'use client';

import type {
  F26EvalHarnessData,
  F26EvalRow,
  F26AutonomyLadderData,
} from '@/components/admin/agents/types';

function trendClass(trend: string): string {
  if (trend.includes('PASS') || trend.includes('Improved')) return 'trend up';
  if (trend.includes('Declined')) return 'trend down';
  return 'trend flat';
}
// Canonical .med modifier is gated on trend ("Declined" only), NOT on raw score.
// AC042 at 64% has trend "✓ PASS" → green pct + green bar + RED fails background.
// v2.2 at 88% has trend "▼ Declined" → amber pct + amber bar + amber fails.
function isMed(trend: string): boolean {
  return trend.includes('Declined');
}
function pctClass(trend: string): string {
  return isMed(trend) ? 'pct med' : 'pct';
}
function tileClass(trend: string): string {
  return isMed(trend) ? 'eval-tile med' : 'eval-tile';
}

interface Props {
  data: F26EvalHarnessData;
  autonomyLadder: F26AutonomyLadderData;
}

export function EvalHarness({ data, autonomyLadder: _ladder }: Props) {
  return (
    <section aria-labelledby="eval-h">
      <details className="disclose" open>
        <summary id="eval-h">
          <span className="chev">
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <path d="M6 4l4 4-4 4" />
            </svg>
          </span>
          Evaluation harness
          <span className="meta">Last {data.rows.length} runs · 50 cases each</span>
        </summary>
        <div className="disclose-body">
          <div className="eval-grid">
            {data.rows.map((row: F26EvalRow, i) => (
              <div key={i} className={tileClass(row.trend)}>
                <span className="date">
                  {row.date} · {row.label}
                </span>
                <span className={pctClass(row.trend)}>
                  {row.scorePct}
                  <span style={{ fontSize: 14, color: 'var(--t3)' }}>%</span>
                </span>
                <span className={trendClass(row.trend)}>{row.trend}</span>
                <div className="bar">
                  <i style={{ width: `${row.scorePct}%` }}></i>
                </div>
                <span className="sub">
                  <b>{row.detail.split(' · ')[0]}</b>
                  {' · '}
                  {row.detail.split(' · ').slice(1).join(' · ')}
                </span>
                <span className="fails">
                  <svg
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M8 2L1 14h14L8 2z" />
                    <path d="M8 6v4M8 12.5v.01" />
                  </svg>
                  <span>
                    <b>{row.failCount} fails:</b>{' '}
                    {row.fails
                      .map((f, j) => (
                        <span key={j} className="tag">
                          {f}
                        </span>
                      ))
                      .reduce<React.ReactNode[]>(
                        (acc, el, idx) => (idx === 0 ? [el] : [...acc, ' ', el]),
                        [],
                      )}
                  </span>
                </span>
              </div>
            ))}
          </div>
          <div
            className="eval-foot"
            style={{
              marginTop: 12,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 11.5,
              color: 'var(--t3)',
            }}
          >
            <span>
              Suite: <b style={{ color: 'var(--t2)' }}>{data.suite}</b> · {data.suiteDescription}
            </span>
            <a href="#" className="ghost details-link">
              View detailed report ›
            </a>
          </div>
        </div>
      </details>
    </section>
  );
}

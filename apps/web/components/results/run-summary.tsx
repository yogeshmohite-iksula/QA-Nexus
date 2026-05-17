// F20 Run summary header — canonical L710-740.
// Hard Rule 17: every string from canned-data.ts.

'use client';

import { Check } from 'lucide-react';
import {
  F20_RUN_HEADER,
  F20_RUN_META,
  F20_RUN_STATS,
  F20_RUN_STATS_ARIA,
  type RunStat,
} from './canned-data';

const STAT_COLOR: Record<RunStat['variant'], string> = {
  default: 'var(--t1)',
  pass: 'var(--pass)',
  fail: 'var(--fail)',
  flaky: 'var(--warn)',
  block: 'var(--t3)',
  skip: 'var(--t3)',
};

export function RunSummary() {
  return (
    // Day-20 R3 visual gate fix: canonical L238 .run-summary{display:flex;
    // flex-wrap:wrap;align-items:center;gap:10px 14px;padding:12px 16px}
    // — compact single-line horizontal strip. All children inline; wraps
    // only at narrow viewports.
    <div
      role="region"
      aria-label={F20_RUN_HEADER.ariaLabel}
      className="flex flex-wrap items-center gap-x-3.5 gap-y-2 border-b px-4 py-3 sm:px-5 lg:px-7"
      style={{ background: 'var(--base)', borderColor: 'var(--border)' }}
    >
      {/* rs-left inline: title + run id + done pill */}
      <h1
        className="m-0 text-[17px] font-semibold leading-[22px]"
        style={{
          color: 'var(--t1)',
          fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
        }}
      >
        {F20_RUN_HEADER.title}
      </h1>
      <span
        className="font-mono text-[11px]"
        style={{
          color: 'var(--t3)',
          background: 'var(--canvas)',
          padding: '2px 7px',
          borderRadius: '4px',
          border: '1px solid var(--border)',
        }}
      >
        {F20_RUN_HEADER.runId}
      </span>
      <span
        className="inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.04em]"
        style={{
          background: 'var(--pass-soft)',
          borderColor: 'var(--pass-line)',
          color: 'var(--pass)',
        }}
      >
        <Check size={10} aria-hidden="true" strokeWidth={2.6} />
        {F20_RUN_HEADER.doneLabel}
      </span>

      {/* rs-stats inline — 6 numeric cells, baseline-aligned */}
      <span
        aria-label={F20_RUN_STATS_ARIA}
        className="inline-flex flex-wrap items-baseline gap-x-2.5 gap-y-1"
      >
        {F20_RUN_STATS.map((stat) => (
          <span key={stat.label} className="inline-flex items-baseline gap-1 whitespace-nowrap">
            <b
              className="text-[15px] font-bold leading-[18px]"
              style={{ color: STAT_COLOR[stat.variant] }}
            >
              {stat.count}
            </b>
            <span
              className="text-[10px] uppercase tracking-[0.06em]"
              style={{ color: 'var(--t3)' }}
            >
              {stat.label}
            </span>
            {stat.pct && (
              <span className="font-mono text-[10px]" style={{ color: 'var(--t4)' }}>
                {stat.pct}
              </span>
            )}
          </span>
        ))}
      </span>

      {/* rs-meta inline: Started X · by Y · duration Z · env-pill */}
      <span
        className="ml-auto inline-flex flex-wrap items-center gap-1.5 text-[11px]"
        style={{ color: 'var(--t3)' }}
      >
        <span className="hidden whitespace-nowrap sm:inline">
          Started <b style={{ color: 'var(--t2)' }}>{F20_RUN_META.started}</b>
          <span className="mx-1" style={{ color: 'var(--border-strong)' }}>
            ·
          </span>
          by <b style={{ color: 'var(--t2)' }}>{F20_RUN_META.by}</b>
          <span className="mx-1" style={{ color: 'var(--border-strong)' }}>
            ·
          </span>
          duration <b style={{ color: 'var(--t2)' }}>{F20_RUN_META.duration}</b>
        </span>
        <span
          className="inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.04em]"
          style={{
            background: 'var(--canvas)',
            borderColor: 'var(--border-strong)',
            color: 'var(--t2)',
          }}
        >
          {F20_RUN_META.envPill}
        </span>
      </span>
    </div>
  );
}

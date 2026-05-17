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
    <div
      role="region"
      aria-label={F20_RUN_HEADER.ariaLabel}
      className="flex flex-col gap-y-3 border-b px-4 py-4 sm:px-5 md:flex-row md:flex-wrap md:items-center md:gap-x-5 lg:px-7"
      style={{ background: 'var(--base)', borderColor: 'var(--border)' }}
    >
      {/* rs-left: title + run id + done pill */}
      <div className="flex w-full min-w-0 flex-col gap-1 md:w-auto">
        <div className="flex flex-wrap items-center gap-2">
          <h1
            className="m-0 text-[18px] font-semibold leading-[24px]"
            style={{
              color: 'var(--t1)',
              fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
            }}
          >
            {F20_RUN_HEADER.title}
          </h1>
          <span
            className="inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em]"
            style={{
              background: 'var(--pass-soft)',
              borderColor: 'var(--pass-line)',
              color: 'var(--pass)',
            }}
          >
            <Check size={10} aria-hidden="true" strokeWidth={2.6} />
            {F20_RUN_HEADER.doneLabel}
          </span>
        </div>
        <span className="font-mono text-[11px]" style={{ color: 'var(--t3)' }}>
          {F20_RUN_HEADER.runId}
        </span>
      </div>

      {/* rs-stats — 6 numeric cells */}
      <div
        aria-label={F20_RUN_STATS_ARIA}
        className="flex flex-wrap items-center gap-x-3 gap-y-1 md:ml-2"
      >
        {F20_RUN_STATS.map((stat) => (
          <span key={stat.label} className="inline-flex items-baseline gap-1 whitespace-nowrap">
            <b
              className="text-[16px] font-bold leading-[20px]"
              style={{ color: STAT_COLOR[stat.variant] }}
            >
              {stat.count}
            </b>
            <span
              className="text-[10.5px] uppercase tracking-[0.06em]"
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
      </div>

      {/* rs-meta: Started X by Y duration Z + env-pill */}
      <span
        className="flex flex-wrap items-center gap-1.5 text-[11px] md:ml-auto"
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
          className="inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[10px]"
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

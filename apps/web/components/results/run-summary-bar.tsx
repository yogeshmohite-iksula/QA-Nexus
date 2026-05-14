// F20 Run summary bar — canonical L237-300 (CSS) + L713-735 (markup).
// Hard Rule 17: every string consumed from canned-data.ts.

'use client';

import { Check } from 'lucide-react';
import { F20_RUN_SUMMARY } from './canned-data';

export function RunSummaryBar() {
  const s = F20_RUN_SUMMARY;
  return (
    <div
      role="region"
      aria-label="Run summary"
      className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b px-4 py-3 sm:px-5 lg:px-7"
      style={{ background: 'var(--base)', borderColor: 'var(--border)' }}
    >
      {/* rs-left — title + run-id + done pill */}
      <div
        className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5"
        style={{ flex: '1 1 auto', minWidth: 0 }}
      >
        <h1
          className="m-0 text-[15px] font-semibold leading-[22px]"
          style={{ color: 'var(--t1)', fontFamily: 'var(--font-dm-sans), system-ui, sans-serif' }}
        >
          {s.title}
        </h1>
        <span
          className="rounded border px-1.5 py-0.5 font-mono text-[10.5px] font-bold"
          style={{ background: 'var(--canvas)', borderColor: 'var(--border)', color: 'var(--t3)' }}
        >
          {s.runId}
        </span>
        <span
          className="inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.04em]"
          style={{
            background: 'var(--pass-soft)',
            borderColor: 'var(--pass-line)',
            color: 'var(--pass)',
          }}
        >
          <Check size={11} strokeWidth={3.6} aria-hidden="true" />
          {s.donePillLabel}
        </span>
      </div>

      {/* rs-stats — 6 stat tiles */}
      <div
        aria-label="Result counts"
        className="flex flex-wrap items-center gap-x-2 gap-y-1.5"
        style={{ flex: 'none' }}
      >
        <Stat label="total" value={s.totals.total} tone="t1" />
        <Stat label="pass" value={s.totals.pass} pct={s.pcts.pass} tone="pass" />
        <Stat label="fail" value={s.totals.fail} pct={s.pcts.fail} tone="fail" />
        <Stat label="flaky" value={s.totals.flaky} pct={s.pcts.flaky} tone="warn" />
        <Stat label="blocked" value={s.totals.block} tone="t3" />
        <Stat label="skipped" value={s.totals.skip} tone="t3" />
      </div>

      {/* rs-meta — started/by/duration + env-pill */}
      <div
        className="flex flex-wrap items-center gap-2.5"
        style={{ marginLeft: 'auto', flex: 'none' }}
      >
        <span className="hidden text-[12px] sm:inline" style={{ color: 'var(--t3)' }}>
          Started <b style={{ color: 'var(--t2)' }}>{s.startedRelative}</b>
          <span className="mx-1.5" style={{ color: 'var(--border-strong)' }}>
            ·
          </span>
          by <b style={{ color: 'var(--t2)' }}>{s.startedBy}</b>
          <span className="mx-1.5" style={{ color: 'var(--border-strong)' }}>
            ·
          </span>
          duration <b style={{ color: 'var(--t2)' }}>{s.durationLabel}</b>
        </span>
        <span
          className="inline-flex items-center rounded border px-2 py-0.5 font-mono text-[10.5px] font-semibold"
          style={{
            background: 'var(--info-soft)',
            borderColor: 'var(--info-line)',
            color: 'var(--info)',
          }}
        >
          {s.envPillLabel}
        </span>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  pct,
  tone,
}: {
  label: string;
  value: number;
  pct?: string;
  tone: 't1' | 't3' | 'pass' | 'fail' | 'warn';
}) {
  const colorMap = {
    t1: 'var(--t1)',
    t3: 'var(--t3)',
    pass: 'var(--pass)',
    fail: 'var(--fail)',
    warn: 'var(--warn)',
  } as const;
  return (
    <span className="inline-flex items-baseline gap-1 font-mono text-[11px]">
      <span className="text-[13px] font-bold" style={{ color: colorMap[tone] }}>
        {value}
      </span>
      <span className="uppercase tracking-[0.04em]" style={{ color: 'var(--t3)' }}>
        {label}
      </span>
      {pct && <span style={{ color: 'var(--t4)' }}>{pct}</span>}
    </span>
  );
}

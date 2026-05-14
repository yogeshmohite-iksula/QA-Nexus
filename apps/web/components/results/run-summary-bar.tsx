// F20 Run summary bar — canonical lines L237-300 (CSS) + L704-800 (markup).
//
// Layout: flex row with wrap. Left: title + run-id + "Done" check pill.
// Middle: 5 stat tiles (total / pass / fail / flaky / blocked / skipped).
// Right: started/duration meta + env-pill.

'use client';

import { Check } from 'lucide-react';
import type { RunResultsMeta } from './canned-data';

interface Props {
  meta: RunResultsMeta;
}

export function RunSummaryBar({ meta }: Props) {
  const t = meta.totals;
  const pct = meta.totalPct;
  return (
    <div
      role="region"
      aria-label="Run summary"
      className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b px-4 py-3 sm:px-5 lg:px-7"
      style={{ background: 'var(--base)', borderColor: 'var(--border)' }}
    >
      {/* LEFT — title + run-id + done pill */}
      <div
        className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5"
        style={{ flex: '1 1 auto', minWidth: 0 }}
      >
        <h1
          className="m-0 text-[15px] font-semibold leading-[22px]"
          style={{ color: 'var(--t1)', fontFamily: 'var(--font-dm-sans), system-ui, sans-serif' }}
        >
          {meta.title}
        </h1>
        <span
          className="rounded border px-1.5 py-0.5 font-mono text-[10.5px] font-bold"
          style={{ background: 'var(--canvas)', borderColor: 'var(--border)', color: 'var(--t3)' }}
        >
          {meta.runId}
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
          Done
        </span>
      </div>

      {/* MIDDLE — stat tiles */}
      <div
        aria-label="Result counts"
        className="flex flex-wrap items-center gap-x-2 gap-y-1.5"
        style={{ flex: 'none' }}
      >
        <Stat label="total" value={t.total} tone="t1" />
        <Stat label="pass" value={t.pass} pct={pct.pass} tone="pass" />
        <Stat label="fail" value={t.fail} pct={pct.fail} tone="fail" />
        <Stat label="flaky" value={t.flaky} pct={pct.flaky} tone="warn" />
        <Stat label="blocked" value={t.block} tone="t3" />
        <Stat label="skipped" value={t.skip} tone="t3" />
      </div>

      {/* RIGHT — meta + env pill */}
      <div
        className="flex flex-wrap items-center gap-2.5"
        style={{ marginLeft: 'auto', flex: 'none' }}
      >
        <span className="hidden text-[12px] sm:inline" style={{ color: 'var(--t3)' }}>
          Started <b style={{ color: 'var(--t2)' }}>{meta.startedRelative}</b>
          <span className="mx-1.5" style={{ color: 'var(--border-strong)' }}>
            ·
          </span>
          by <b style={{ color: 'var(--t2)' }}>{meta.startedBy}</b>
          <span className="mx-1.5" style={{ color: 'var(--border-strong)' }}>
            ·
          </span>
          duration <b style={{ color: 'var(--t2)' }}>{meta.durationLabel}</b>
        </span>
        <span
          className="inline-flex items-center rounded border px-2 py-0.5 font-mono text-[10.5px] font-semibold"
          style={{
            background: 'var(--info-soft)',
            borderColor: 'var(--info-line)',
            color: 'var(--info)',
          }}
        >
          {meta.envLabel}
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
  pct?: number;
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
      {pct !== undefined && <span style={{ color: 'var(--t4)' }}>{pct}%</span>}
    </span>
  );
}

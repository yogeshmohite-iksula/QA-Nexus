// F20 Sherlock RCA block — canonical L740-807.
//
// Hard Rule 17: every string comes from canned-data.ts. Structure:
//   <section class="sherlock-block">
//     <div class="sb-head">                  — Sherlock i v1.4 + 5-Layer RCA + analysis time
//     <h2 class="sb-headline">               — "23 failures clustered into..." (bold inline)
//     <div class="sb-conf-row">              — Per-cluster confidence pills (high/med/low)

'use client';

import { Search } from 'lucide-react';
import {
  F20_SHERLOCK_CONF_PILLS,
  F20_SHERLOCK_CONF_ROW_LABEL,
  F20_SHERLOCK_HEAD,
  F20_SHERLOCK_HEADLINE,
  type SherlockConfPill,
  type SherlockHeadlineSegment,
} from './canned-data';

const PILL_STYLE: Record<SherlockConfPill['variant'], { bg: string; bd: string; fg: string }> = {
  high: { bg: 'var(--pass-soft)', bd: 'var(--pass-line)', fg: 'var(--pass)' },
  med: { bg: 'var(--warn-soft)', bd: 'var(--warn-line)', fg: 'var(--warn)' },
  low: { bg: 'var(--fail-soft)', bd: 'var(--fail-line)', fg: 'var(--fail)' },
};

export function SherlockRcaBlock() {
  return (
    <section
      aria-label="Sherlock root cause analysis summary"
      className="flex flex-col gap-3 rounded-md border p-3.5"
      style={{ background: 'var(--ai-soft)', borderColor: 'var(--ai-line)' }}
    >
      {/* sb-head */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span
          aria-hidden="true"
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
          style={{
            background: 'rgba(167,139,250,0.18)',
            color: 'var(--secondary)',
            border: '1px solid var(--ai-line)',
          }}
        >
          <Search size={15} strokeWidth={1.8} aria-hidden="true" />
        </span>
        <span
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold"
          style={{ color: 'var(--t1)' }}
        >
          Sherlock
          <span
            aria-hidden="true"
            className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full font-mono text-[9px] font-bold"
            style={{ background: 'var(--ai-line)', color: 'var(--secondary-ink)' }}
          >
            i
          </span>
          <span className="ml-1 font-mono text-[10.5px] font-medium" style={{ color: 'var(--t3)' }}>
            {F20_SHERLOCK_HEAD.version}
          </span>
        </span>
        <span
          className="inline-flex items-center rounded border px-1.5 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.04em]"
          style={{
            background: 'var(--ai-soft)',
            borderColor: 'var(--ai-line)',
            color: 'var(--ai-accent)',
          }}
        >
          {F20_SHERLOCK_HEAD.badgeLabel}
        </span>
        <span className="text-[12px]" style={{ color: 'var(--t3)' }}>
          {F20_SHERLOCK_HEAD.analysisTimeLabel}
        </span>
      </div>

      {/* sb-headline — verbatim with inline <b> emphasis */}
      <h2
        className="m-0 text-[15px] leading-[22px]"
        style={{
          color: 'var(--t2)',
          fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
          fontWeight: 400,
        }}
      >
        {F20_SHERLOCK_HEADLINE.map((seg, i) => (
          <HeadlineSpan key={i} segment={seg} />
        ))}
      </h2>

      {/* sb-conf-row — per-cluster confidence pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.06em]"
          style={{ color: 'var(--t3)' }}
        >
          {F20_SHERLOCK_CONF_ROW_LABEL}
        </span>
        {F20_SHERLOCK_CONF_PILLS.map((pill) => {
          const t = PILL_STYLE[pill.variant];
          return (
            <span
              key={pill.label}
              className="inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[10.5px] font-bold uppercase tracking-[0.04em]"
              style={{ background: t.bg, borderColor: t.bd, color: t.fg }}
            >
              {pill.label}
            </span>
          );
        })}
      </div>
    </section>
  );
}

function HeadlineSpan({ segment }: { segment: SherlockHeadlineSegment }) {
  if (segment.kind === 'bold')
    return <b style={{ color: 'var(--t1)', fontWeight: 700 }}>{segment.value}</b>;
  return <>{segment.value}</>;
}

// F20 Sherlock RCA block — canonical L301-345 (CSS) + L800-850 (markup).
//
// Page-level RCA summary card. Sits above the cluster cards. Uses AI
// surface tokens (--ai-soft / --ai-line / --secondary text per
// 01_SYSTEM.md §3.1 VIOLET=AI rule).

'use client';

import { Search } from 'lucide-react';
import type { SherlockSummary } from './canned-data';

interface Props {
  summary: SherlockSummary;
}

export function SherlockRcaBlock({ summary }: Props) {
  return (
    <section
      aria-label="Sherlock root cause analysis summary"
      className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-md border p-3 sm:p-4"
      style={{ background: 'var(--ai-soft)', borderColor: 'var(--ai-line)' }}
    >
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
        className="inline-flex items-center gap-1 text-[13px] font-semibold"
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
          {summary.version}
        </span>
      </span>
      <span
        className="inline-flex items-center rounded border px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.04em]"
        style={{
          background: 'var(--ai-soft)',
          borderColor: 'var(--ai-line)',
          color: 'var(--ai-accent)',
        }}
      >
        {summary.badgeLabel}
      </span>
      <span className="text-[12px]" style={{ color: 'var(--t3)' }}>
        {summary.analysisTimeLabel}
      </span>
    </section>
  );
}

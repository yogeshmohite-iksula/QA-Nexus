// F20 Sherlock block — canonical L740-770.
// Hard Rule 17: every string from canned-data.ts.

'use client';

import { Search } from 'lucide-react';
import { F20_SHERLOCK_HEAD, F20_SHERLOCK_HEADLINE, type NarrativeSegment } from './canned-data';

export function SherlockBlock() {
  return (
    <section
      aria-label={F20_SHERLOCK_HEAD.ariaLabel}
      data-canonical-section="sherlock-block"
      className="flex flex-col gap-2.5 border-b px-4 py-4 sm:px-5 lg:px-7"
      style={{ background: 'var(--ai-soft)', borderColor: 'var(--ai-line)' }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          aria-hidden="true"
          className="inline-flex h-6 w-6 items-center justify-center rounded-md"
          style={{
            background: 'rgba(167,139,250,0.18)',
            color: 'var(--secondary)',
            border: '1px solid var(--ai-line)',
          }}
        >
          <Search size={13} aria-hidden="true" strokeWidth={1.8} />
        </span>
        <span
          className="inline-flex items-center gap-1 text-[12.5px] font-semibold"
          style={{ color: 'var(--t1)' }}
        >
          {F20_SHERLOCK_HEAD.agentName}
          <span
            aria-hidden="true"
            className="inline-flex h-3 w-3 items-center justify-center rounded-full font-mono text-[8px] font-bold"
            style={{ background: 'var(--ai-line)', color: 'var(--secondary-ink)' }}
          >
            i
          </span>
          <span className="ml-1 font-mono text-[10px] font-medium" style={{ color: 'var(--t3)' }}>
            {F20_SHERLOCK_HEAD.agentVersion}
          </span>
        </span>
        <span
          className="inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.04em]"
          style={{
            background: 'var(--ai-soft)',
            borderColor: 'var(--ai-line)',
            color: 'var(--ai-accent)',
          }}
        >
          {F20_SHERLOCK_HEAD.pillLabel}
        </span>
        <span className="ml-auto text-[10.5px]" style={{ color: 'var(--t3)' }}>
          {F20_SHERLOCK_HEAD.meta}
        </span>
      </div>
      <h2 className="m-0 text-[13.5px] font-normal leading-[20px]" style={{ color: 'var(--t1)' }}>
        {F20_SHERLOCK_HEADLINE.map((seg, i) => (
          <NarrativeSpan key={i} seg={seg} />
        ))}
      </h2>
    </section>
  );
}

function NarrativeSpan({ seg }: { seg: NarrativeSegment }) {
  if (seg.kind === 'bold') return <b style={{ color: 'var(--t1)' }}>{seg.value}</b>;
  if (seg.kind === 'mono')
    return (
      <code
        className="rounded px-1 font-mono text-[11px]"
        style={{ background: 'var(--canvas)', color: 'var(--ai-accent)' }}
      >
        {seg.value}
      </code>
    );
  return <>{seg.value}</>;
}

// F20 Sherlock block — canonical L740-770.
// Hard Rule 17: every string from canned-data.ts.

'use client';

import { Plus, RefreshCw, Search } from 'lucide-react';
import {
  F20_SHERLOCK_ACTIONS,
  F20_SHERLOCK_CONF_ROW,
  F20_SHERLOCK_HEAD,
  F20_SHERLOCK_HEADLINE,
  type NarrativeSegment,
} from './canned-data';

const CONF_PILL: Record<'high' | 'med' | 'low', { bg: string; bd: string; fg: string }> = {
  high: { bg: 'var(--pass-soft)', bd: 'var(--pass-line)', fg: 'var(--pass)' },
  med: { bg: 'var(--warn-soft)', bd: 'var(--warn-line)', fg: 'var(--warn)' },
  low: { bg: 'var(--fail-soft)', bd: 'var(--fail-line)', fg: 'var(--fail)' },
};

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

      {/* sb-conf-row — Day-20 R2 fix, canonical L750.
       * "Per-cluster confidence" label + 3 conf pills (high/med/low). */}
      <div
        data-canonical-section="sb-conf-row"
        className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5"
      >
        <span
          className="text-[10.5px] font-bold uppercase tracking-[0.08em]"
          style={{ color: 'var(--t3)' }}
        >
          {F20_SHERLOCK_CONF_ROW.label}
        </span>
        {F20_SHERLOCK_CONF_ROW.pills.map((pill) => {
          const style = CONF_PILL[pill.tone];
          return (
            <span
              key={pill.text}
              className="inline-flex items-center rounded border px-2 py-0.5 font-mono text-[10.5px] font-semibold"
              style={{ background: style.bg, borderColor: style.bd, color: style.fg }}
            >
              {pill.text}
            </span>
          );
        })}
      </div>

      {/* sb-actions — Day-20 R2 fix, canonical L754.
       * "Create defects from clusters [3]" violet + "Run Sherlock again" ghost. */}
      <div data-canonical-section="sb-actions" className="flex flex-wrap items-center gap-2 pt-0.5">
        {F20_SHERLOCK_ACTIONS.map((a) => {
          const Icon = a.icon === 'plus' ? Plus : RefreshCw;
          const isViolet = a.variant === 'violet';
          return (
            <button
              key={a.label}
              type="button"
              aria-label={a.ariaLabel}
              onClick={() =>
                console.info('pattern-a:deferred:f20:sherlock-action', { action: a.label })
              }
              className="inline-flex h-9 items-center gap-1.5 rounded-md border px-3.5 text-[12px] font-semibold transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
              style={
                isViolet
                  ? {
                      background: 'var(--secondary)',
                      borderColor: 'var(--secondary)',
                      color: 'var(--secondary-ink)',
                    }
                  : {
                      background: 'transparent',
                      borderColor: 'var(--ai-line)',
                      color: 'var(--secondary)',
                    }
              }
            >
              <Icon size={12} aria-hidden="true" strokeWidth={2.2} />
              {a.label}
              {a.count > 0 && (
                <span
                  className="ml-0.5 inline-flex h-4 min-w-[18px] items-center justify-center rounded font-mono text-[10px] font-bold"
                  style={{
                    background: 'rgba(46,16,101,0.22)',
                    color: 'currentColor',
                    padding: '1px 5px',
                  }}
                >
                  {a.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
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

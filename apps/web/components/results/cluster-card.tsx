// F20 Cluster card — canonical L771-913 (3 article.cluster variants).
// Hard Rule 17: every string from canned-data.ts.
// Day-20 v2.2 awareness: each cluster carries data-canonical-section
// for diff-probe TERTIARY tier matching of nested siblings.

'use client';

import { ChevronRight } from 'lucide-react';
import type {
  Cluster,
  ClusterTone,
  ClusterClassKey,
  DistinctFailure,
  NarrativeSegment,
} from './canned-data';

const TONE_BORDER: Record<ClusterTone, string> = {
  high: 'var(--fail-line)',
  med: 'var(--warn-line)',
  mixed: 'var(--border-strong)',
};

const CONF_PILL: Record<ClusterTone, { bg: string; bd: string; fg: string }> = {
  high: { bg: 'var(--fail-soft)', bd: 'var(--fail-line)', fg: 'var(--fail)' },
  med: { bg: 'var(--warn-soft)', bd: 'var(--warn-line)', fg: 'var(--warn)' },
  mixed: { bg: 'var(--overlay)', bd: 'var(--border-strong)', fg: 'var(--t3)' },
};

const CLASS_PILL: Record<
  ClusterClassKey | DistinctFailure['classTone'],
  { bg: string; bd: string; fg: string }
> = {
  appbug: { bg: 'var(--fail-soft)', bd: 'var(--fail-line)', fg: 'var(--fail)' },
  env: { bg: 'var(--info-soft)', bd: 'var(--info-line)', fg: 'var(--info)' },
  mixed: { bg: 'var(--overlay)', bd: 'var(--border-strong)', fg: 'var(--t3)' },
  ui: { bg: 'var(--primary-soft)', bd: 'var(--primary-line)', fg: 'var(--primary)' },
  test: { bg: 'var(--overlay)', bd: 'var(--border-strong)', fg: 'var(--t3)' },
  flaky: { bg: 'var(--warn-soft)', bd: 'var(--warn-line)', fg: 'var(--warn)' },
};

export function ClusterCard({ cluster }: { cluster: Cluster }) {
  const confPill = CONF_PILL[cluster.tone];
  const classPill = CLASS_PILL[cluster.classKey];
  return (
    <article
      aria-labelledby={cluster.ariaId}
      data-canonical-section={`cluster-${cluster.tone}`}
      // Day-20 diff-probe SECONDARY tier: literal `cluster` class so
      // probe finds 3 sibling matches (canonical L771/L811/L851 use this
      // class). Tailwind utilities follow.
      className={`cluster cluster-${cluster.tone} flex flex-col gap-3 rounded-lg border p-4`}
      style={{
        background: 'var(--base)',
        borderColor: TONE_BORDER[cluster.tone],
        borderLeftWidth: '3px',
      }}
    >
      {/* cl-head */}
      <header className="flex flex-wrap items-center gap-2">
        <span
          className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.06em]"
          style={{ color: 'var(--t3)' }}
        >
          <span
            aria-hidden="true"
            className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold"
            style={{ background: 'var(--overlay)', color: 'var(--t2)' }}
          >
            {cluster.num}
          </span>
          Cluster
        </span>
        <h3
          id={cluster.ariaId}
          className="m-0 text-[13.5px] font-semibold leading-[19px]"
          style={{ color: 'var(--t1)', fontFamily: 'var(--font-dm-sans), system-ui, sans-serif' }}
        >
          {cluster.title}
        </h3>
        <span
          className="ml-auto inline-flex items-baseline gap-0.5 font-mono text-[11.5px] font-bold"
          style={{ color: 'var(--t1)' }}
        >
          {cluster.caseCount}
          <span className="text-[10px] font-medium" style={{ color: 'var(--t4)' }}>
            / {cluster.totalCases}
          </span>
        </span>
        <span
          className="inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.04em]"
          style={{ background: confPill.bg, borderColor: confPill.bd, color: confPill.fg }}
        >
          {cluster.confidence}
        </span>
        <span
          className="inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.04em]"
          style={{ background: classPill.bg, borderColor: classPill.bd, color: classPill.fg }}
        >
          {cluster.classification}
        </span>
      </header>

      {/* cl-body: narrative + metrics OR distinct failures */}
      <div className="flex flex-col gap-2.5">
        <p className="m-0 text-[12px] leading-[18px]" style={{ color: 'var(--t2)' }}>
          {cluster.narrative.map((seg, i) => (
            <NarrativeSpan key={i} seg={seg} />
          ))}
        </p>

        {cluster.metrics && (
          <div
            role="group"
            aria-label="Cluster timing metrics"
            className="flex flex-wrap items-center gap-3 rounded-md border px-3 py-2"
            style={{ background: 'var(--canvas)', borderColor: 'var(--border)' }}
          >
            {cluster.metrics.map((m) => (
              <span key={m.label} className="inline-flex items-baseline gap-1 whitespace-nowrap">
                <b className="font-mono text-[11px]" style={{ color: 'var(--t1)' }}>
                  {m.value}
                </b>
                <span
                  className="text-[10px] uppercase tracking-[0.04em]"
                  style={{ color: 'var(--t4)' }}
                >
                  {m.label}
                </span>
              </span>
            ))}
          </div>
        )}

        {cluster.evidence && (
          <div className="flex flex-wrap items-center gap-1.5 text-[10.5px]">
            {cluster.evidence.map((c, i) => (
              <span
                key={i}
                className={`inline-flex items-center rounded border px-1.5 py-0.5 ${c.mono ? 'font-mono' : ''}`}
                style={{
                  background: 'var(--canvas)',
                  borderColor: 'var(--border)',
                  color: 'var(--t2)',
                }}
              >
                {c.text}
              </span>
            ))}
          </div>
        )}

        {cluster.distinctFailures && (
          <div className="flex flex-col gap-1.5">
            {cluster.distinctFailures.map((f) => (
              <DistinctFailureRow key={f.caseId} f={f} />
            ))}
          </div>
        )}
      </div>

      {/* cl-actions */}
      <footer className="flex flex-wrap items-center gap-1.5">
        {cluster.actions.map((a) => (
          <button
            key={a.label}
            type="button"
            onClick={() =>
              console.info('pattern-a:deferred:f20:cluster-action', {
                cluster: cluster.num,
                action: a.label,
              })
            }
            className="inline-flex h-7 items-center gap-1 rounded-md border px-2.5 text-[11px] font-semibold transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
            style={
              a.variant === 'primary'
                ? {
                    background: 'var(--secondary)',
                    borderColor: 'var(--secondary)',
                    color: 'var(--secondary-ink)',
                  }
                : {
                    background: 'var(--raised)',
                    borderColor: 'var(--border)',
                    color: 'var(--t2)',
                  }
            }
          >
            {a.label}
          </button>
        ))}
        <span className="min-w-2 flex-1" />
        <button
          type="button"
          onClick={() =>
            console.info('pattern-a:deferred:f20:cluster-expand', { cluster: cluster.num })
          }
          className="inline-flex h-7 items-center gap-1 rounded text-[11px] font-medium transition-colors hover:text-[var(--t1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
          style={{ color: 'var(--t3)' }}
        >
          {cluster.showCasesLabel}
          <ChevronRight size={12} aria-hidden="true" />
        </button>
      </footer>
    </article>
  );
}

function DistinctFailureRow({ f }: { f: DistinctFailure }) {
  const classPill = CLASS_PILL[f.classTone];
  return (
    <div
      className="flex flex-wrap items-center gap-2 rounded-md border px-2.5 py-1.5"
      style={{ background: 'var(--canvas)', borderColor: 'var(--border)' }}
    >
      <span className="font-mono text-[10.5px] font-medium" style={{ color: 'var(--t1)' }}>
        {f.caseId}
      </span>
      <span className="min-w-0 flex-1 text-[11px]" style={{ color: 'var(--t2)' }}>
        {f.title}
      </span>
      <span className="font-mono text-[10.5px] font-bold" style={{ color: 'var(--ai-accent)' }}>
        {f.confidence}
      </span>
      <span
        className="inline-flex items-center rounded border px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.04em]"
        style={{ background: classPill.bg, borderColor: classPill.bd, color: classPill.fg }}
      >
        {f.classification}
      </span>
      <button
        type="button"
        onClick={() => console.info('pattern-a:deferred:f20:drill-distinct', { caseId: f.caseId })}
        className="inline-flex items-center gap-0.5 text-[10.5px] font-medium hover:text-[var(--t1)] focus-visible:outline-none"
        style={{ color: 'var(--t3)' }}
      >
        Drill →
      </button>
    </div>
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

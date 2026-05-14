// F20 Cluster card — canonical L346-440 (CSS) + L800-920 (markup).
//
// `.distinct-card` with `.med` / `.low` / (default high) confidence
// variants. Each card has:
//   - Header: cluster title + className mono + confidence chip
//   - Metric strip (cl-metric-strip): 4 KPIs
//   - Narrative paragraph
//   - Action row: violet "Open defect (Sherlock-prefilled)" CTA +
//     Mark flaky / Re-run case secondary buttons +
//     "Show N cases" expand link

'use client';

import { AlertTriangle, ChevronDown, FileBarChart, Plus, RefreshCw } from 'lucide-react';
import type { ResultsCluster } from './canned-data';

interface Props {
  cluster: ResultsCluster;
}

// Confidence chip color map per 01_SYSTEM.md:
//   high → pass (green)  ·  med → warn (amber)  ·  low → fail (red)
const CONF_COLOR: Record<ResultsCluster['confidence'], { bg: string; bd: string; fg: string }> = {
  high: { bg: 'var(--pass-soft)', bd: 'var(--pass-line)', fg: 'var(--pass)' },
  med: { bg: 'var(--warn-soft)', bd: 'var(--warn-line)', fg: 'var(--warn)' },
  low: { bg: 'var(--fail-soft)', bd: 'var(--fail-line)', fg: 'var(--fail)' },
};

export function ClusterCard({ cluster }: Props) {
  const conf = CONF_COLOR[cluster.confidence];
  return (
    <article
      aria-labelledby={`cl-${cluster.id}-title`}
      className="flex flex-col gap-2.5 rounded-md border p-3.5"
      style={{ background: 'var(--base)', borderColor: 'var(--border)' }}
    >
      {/* Header */}
      <header className="flex flex-wrap items-start gap-x-2 gap-y-1">
        <h3
          id={`cl-${cluster.id}-title`}
          className="m-0 flex-1 text-[13.5px] font-semibold leading-[20px]"
          style={{ color: 'var(--t1)' }}
        >
          {cluster.title}
        </h3>
        <span
          className="inline-flex items-center rounded border px-1.5 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.04em]"
          style={{ background: conf.bg, borderColor: conf.bd, color: conf.fg }}
        >
          {cluster.confidenceLabel}
        </span>
      </header>
      <code className="font-mono text-[11px]" style={{ color: 'var(--ai-accent)' }}>
        {cluster.className}
      </code>

      {/* Metric strip */}
      <div
        className="flex flex-wrap items-center overflow-hidden rounded-md border"
        style={{ background: 'var(--canvas)', borderColor: 'var(--border)' }}
      >
        {cluster.metrics.map((m, i) => (
          <span
            key={m.label}
            className="inline-flex flex-1 items-baseline gap-1.5 px-2.5 py-1.5 font-mono text-[10.5px]"
            style={{
              color: 'var(--t3)',
              borderRight: i < cluster.metrics.length - 1 ? '1px solid var(--border)' : 'none',
              minWidth: 110,
            }}
          >
            <span className="text-[11.5px] font-semibold" style={{ color: 'var(--t1)' }}>
              {m.value}
            </span>
            <span
              className="text-[9.5px] font-semibold uppercase tracking-[0.04em]"
              style={{ color: 'var(--t3)' }}
            >
              {m.label}
            </span>
          </span>
        ))}
      </div>

      {/* Narrative */}
      <p className="m-0 text-[12.5px] leading-[18px]" style={{ color: 'var(--t2)' }}>
        {cluster.narrative}
      </p>

      {/* Actions */}
      <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          onClick={() =>
            console.info('pattern-a:deferred:f20:create-defect', { clusterId: cluster.id })
          }
          className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md border px-3 text-[12.5px] font-semibold transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
          style={{
            background: 'var(--secondary)',
            borderColor: 'var(--ai-line)',
            color: 'var(--secondary-ink)',
          }}
        >
          <Plus size={14} aria-hidden="true" />
          Open defect (Sherlock-prefilled)
        </button>
        <button
          type="button"
          onClick={() =>
            console.info('pattern-a:deferred:f20:mark-flaky', { clusterId: cluster.id })
          }
          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border px-3 text-[12px] font-medium transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
          style={{
            background: 'var(--raised)',
            borderColor: 'var(--border)',
            color: 'var(--t2)',
          }}
        >
          <AlertTriangle size={13} aria-hidden="true" />
          Mark flaky
        </button>
        <button
          type="button"
          onClick={() =>
            console.info('pattern-a:deferred:f20:re-run-cluster', { clusterId: cluster.id })
          }
          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border px-3 text-[12px] font-medium transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
          style={{
            background: 'var(--raised)',
            borderColor: 'var(--border)',
            color: 'var(--t2)',
          }}
        >
          <RefreshCw size={13} aria-hidden="true" />
          Re-run cluster
        </button>
        <button
          type="button"
          aria-expanded="false"
          onClick={() =>
            console.info('pattern-a:deferred:f20:expand-cluster', { clusterId: cluster.id })
          }
          className="inline-flex h-8 items-center justify-center gap-1.5 px-3 text-[12px] font-medium transition-colors hover:text-[var(--t1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
          style={{ color: 'var(--t3)' }}
        >
          <FileBarChart size={13} aria-hidden="true" />
          Show {cluster.caseCount} cases
          <ChevronDown size={11} aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}

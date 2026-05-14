// F20 Cluster card — canonical L771-915 markup (3 cluster articles).
//
// Hard Rule 17: every user-visible string comes from canned-data.ts.
// No invention. Renders inline `<b>` + `<code>` spans within the
// narrative paragraph per canonical.
//
// Canonical structure:
//   <article class="cluster {variant}">
//     <header class="cl-head">
//       <span class="cl-num"><span class="num-dot">N</span>Cluster</span>
//       <h3 class="cl-title">{title}</h3>
//       <span class="cl-count">N<span class="of">/ 23</span></span>
//       <span class="cl-conf {variant}">{confidenceLabel}</span>
//       <span class="cl-class {classKind}">{classLabel}</span>
//     </header>
//     <div class="cl-body">
//       <p class="cl-narrative">{narrative segments}</p>
//       <div class="cl-metric-strip">{metric tiles}</div>
//       <div class="cl-actions">{btn-violet + secondary + view-console}</div>
//     </div>
//   </article>

'use client';

import type {
  ClusterClassKind,
  ClusterConfidenceVariant,
  NarrativeSegment,
  ResultsCluster,
} from './canned-data';
import { F20_CLUSTER_ACTIONS, F20_CLUSTER_RUN_CONSOLE_LINK } from './canned-data';

interface Props {
  cluster: ResultsCluster;
}

// Confidence chip token map per 01_SYSTEM.md §3.1 + canonical markup:
//   high  → pass green   (--pass-soft / --pass-line / --pass)
//   med   → warn amber   (--warn-soft / --warn-line / --warn)
//   mixed → fail red     (--fail-soft / --fail-line / --fail)
const CONF_STYLE: Record<
  ClusterConfidenceVariant,
  { bg: string; bd: string; fg: string; cardBorder: string }
> = {
  high: {
    bg: 'var(--pass-soft)',
    bd: 'var(--pass-line)',
    fg: 'var(--pass)',
    cardBorder: 'var(--pass-line)',
  },
  med: {
    bg: 'var(--warn-soft)',
    bd: 'var(--warn-line)',
    fg: 'var(--warn)',
    cardBorder: 'var(--warn-line)',
  },
  mixed: {
    bg: 'var(--fail-soft)',
    bd: 'var(--fail-line)',
    fg: 'var(--fail)',
    cardBorder: 'var(--fail-line)',
  },
};

// cl-class chip variant tokens — App Bug / Env Issue / Mixed.
//   appbug → fail-soft red (app-level fault per canonical)
//   env    → info-soft blue
//   mixed  → overlay grey
const CLASS_STYLE: Record<ClusterClassKind, { bg: string; bd: string; fg: string }> = {
  appbug: { bg: 'var(--fail-soft)', bd: 'var(--fail-line)', fg: 'var(--fail)' },
  env: { bg: 'var(--info-soft)', bd: 'var(--info-line)', fg: 'var(--info)' },
  mixed: { bg: 'var(--overlay)', bd: 'var(--border-strong)', fg: 'var(--t2)' },
};

const ACTION_STYLE: Record<
  'violet' | 'secondary' | 'primary',
  { bg: string; bd: string; fg: string }
> = {
  violet: {
    bg: 'var(--secondary)',
    bd: 'var(--ai-line)',
    fg: 'var(--secondary-ink)',
  },
  secondary: {
    bg: 'var(--raised)',
    bd: 'var(--border)',
    fg: 'var(--t2)',
  },
  primary: {
    bg: 'var(--primary)',
    bd: 'var(--primary-line)',
    fg: 'var(--primary-ink)',
  },
};

export function ClusterCard({ cluster }: Props) {
  const conf = CONF_STYLE[cluster.confidenceVariant];
  const cls = CLASS_STYLE[cluster.classKind];
  return (
    <article
      aria-labelledby={`${cluster.id}-h`}
      className="flex flex-col rounded-md border"
      style={{ background: 'var(--base)', borderColor: conf.cardBorder }}
    >
      <header
        className="flex flex-wrap items-start gap-x-2 gap-y-1.5 border-b px-3.5 py-3"
        style={{ borderColor: 'var(--border)' }}
      >
        {/* cl-num — "N Cluster" with circular num-dot */}
        <span
          className="inline-flex items-center gap-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.06em]"
          style={{ color: 'var(--t3)' }}
        >
          <span
            aria-hidden="true"
            className="inline-flex h-4 w-4 items-center justify-center rounded-full font-mono text-[10px] font-bold"
            style={{
              background: conf.bg,
              borderColor: conf.bd,
              color: conf.fg,
              border: '1px solid',
            }}
          >
            {cluster.num}
          </span>
          Cluster
        </span>

        {/* cl-title — flex-1 between badges */}
        <h3
          id={`${cluster.id}-h`}
          className="m-0 flex-1 text-[13.5px] font-semibold leading-[20px]"
          style={{ color: 'var(--t1)' }}
        >
          {cluster.title}
        </h3>

        {/* cl-count — "N / 23" */}
        <span
          className="inline-flex items-baseline gap-0.5 font-mono text-[12px] font-bold"
          style={{ color: 'var(--t1)' }}
        >
          {cluster.countN}
          <span className="text-[10.5px] font-medium" style={{ color: 'var(--t3)' }}>
            / {cluster.countOf}
          </span>
        </span>

        {/* cl-conf chip */}
        <span
          className="inline-flex items-center rounded border px-1.5 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.04em]"
          style={{ background: conf.bg, borderColor: conf.bd, color: conf.fg }}
        >
          {cluster.confidenceLabel}
        </span>

        {/* cl-class chip */}
        <span
          className="inline-flex items-center rounded border px-1.5 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.04em]"
          style={{ background: cls.bg, borderColor: cls.bd, color: cls.fg }}
        >
          {cluster.classLabel}
        </span>
      </header>

      {/* cl-body */}
      <div className="flex flex-col gap-2.5 px-3.5 py-3">
        {/* cl-narrative */}
        <p className="m-0 text-[12.5px] leading-[18px]" style={{ color: 'var(--t2)' }}>
          {cluster.narrative.map((seg, i) => (
            <NarrativeSpan key={i} segment={seg} />
          ))}
        </p>

        {/* cl-metric-strip — empty for Cluster 3 (no clustering pattern) */}
        {cluster.metrics.length > 0 && (
          <div
            role="group"
            aria-label="Cluster timing metrics"
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
        )}

        {/* cl-actions — verbatim labels from canned-data */}
        <div className="flex flex-col gap-1.5">
          {/* Violet primary CTA full-width */}
          <ClusterActionButton
            label={F20_CLUSTER_ACTIONS[0].label}
            variant={F20_CLUSTER_ACTIONS[0].variant}
            onClick={() =>
              console.info('pattern-a:deferred:f20:create-defect', { clusterId: cluster.id })
            }
            fullWidth
          />
          {/* Two-up grid: Mark flaky + Re-run case */}
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            <ClusterActionButton
              label={F20_CLUSTER_ACTIONS[1].label}
              variant={F20_CLUSTER_ACTIONS[1].variant}
              onClick={() =>
                console.info('pattern-a:deferred:f20:mark-flaky', { clusterId: cluster.id })
              }
            />
            <ClusterActionButton
              label={F20_CLUSTER_ACTIONS[2].label}
              variant={F20_CLUSTER_ACTIONS[2].variant}
              onClick={() =>
                console.info('pattern-a:deferred:f20:re-run-case', { clusterId: cluster.id })
              }
            />
          </div>
          {/* "View in Run Console →" link */}
          <button
            type="button"
            onClick={() =>
              console.info('pattern-a:deferred:f20:view-run-console', { clusterId: cluster.id })
            }
            className="inline-flex h-8 items-center justify-center text-[12px] font-medium transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
            style={{ color: 'var(--primary)', background: 'transparent', border: 0 }}
          >
            {F20_CLUSTER_RUN_CONSOLE_LINK}
          </button>
        </div>
      </div>
    </article>
  );
}

function NarrativeSpan({ segment }: { segment: NarrativeSegment }) {
  if (segment.kind === 'bold')
    return <b style={{ color: 'var(--t1)', fontWeight: 600 }}>{segment.value}</b>;
  if (segment.kind === 'code')
    return (
      <code
        className="rounded px-1 font-mono text-[11px]"
        style={{ background: 'var(--canvas)', color: 'var(--ai-accent)' }}
      >
        {segment.value}
      </code>
    );
  return <>{segment.value}</>;
}

function ClusterActionButton({
  label,
  variant,
  onClick,
  fullWidth,
}: {
  label: string;
  variant: 'violet' | 'secondary' | 'primary';
  onClick: () => void;
  fullWidth?: boolean;
}) {
  const tones = ACTION_STYLE[variant];
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'inline-flex items-center justify-center gap-1.5 rounded-md border px-3 text-[12px] font-semibold transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]',
        fullWidth ? 'h-9 w-full' : 'h-8',
      ].join(' ')}
      style={{ background: tones.bg, borderColor: tones.bd, color: tones.fg }}
    >
      {label}
    </button>
  );
}

'use client';
// Implements F22 Sherlock Root Cause Analysis section.
// Canonical: PM1_UI_v2/Redesign Frame by claude design/F22 Defect Detail v2.html L595-787.
// Includes: section header, confidence bar, summary hypothesis, 5-layer accordion,
// and suggested fix banner. All strings trace to canned-data.ts (Hard Rule 17).

import { useState } from 'react';
import {
  Paperclip,
  ArrowRight,
  RotateCw,
  ChevronDown,
  Play,
  Terminal,
  Globe,
  SlidersHorizontal,
  Code2,
  Database,
  Flag,
  Highlighter,
} from 'lucide-react';
import { AgentName } from './agents/AgentName';
import type {
  ConfBarSegment,
  SherlockSummary,
  RcaLayer,
  SuggestedFix,
  LayerPayload,
} from './types';

// -----------------------------------------------------------------------------
// Confidence row (94% pill + stacked bar + legend)
// -----------------------------------------------------------------------------

function ConfRow({ overall, segments }: { overall: number; segments: ConfBarSegment[] }) {
  const segColor = (label: ConfBarSegment['label']) =>
    label === 'Network'
      ? 'var(--info)'
      : label === 'Service'
        ? 'var(--secondary)'
        : label === 'Data'
          ? 'var(--warn)'
          : 'var(--t4)';

  return (
    <div data-canonical-section="conf-row" className="flex flex-wrap items-center gap-3 py-2">
      <span className="inline-flex items-center rounded-md border border-[color:var(--secondary-ink)] bg-[color:var(--secondary-soft)] px-2.5 py-1 font-mono text-[11px] font-semibold text-[color:var(--secondary)]">
        {Math.round(overall * 100)}% confidence
      </span>
      <div
        role="img"
        aria-label="Layer breakdown"
        className="flex h-2 min-w-[160px] flex-1 overflow-hidden rounded-full border border-[color:var(--border)]"
      >
        {segments.map((s) => (
          <span
            key={s.label}
            style={{ width: `${s.pct}%`, background: segColor(s.label) }}
            aria-hidden="true"
          />
        ))}
      </div>
      <div
        data-canonical-section="conf-legend"
        className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-[color:var(--t3)]"
      >
        {segments.map((s) => (
          <span key={s.label} className="inline-flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-sm"
              style={{ background: segColor(s.label) }}
              aria-hidden="true"
            />
            {s.label} <b className="font-semibold text-[color:var(--t1)]">{s.pct}%</b>
          </span>
        ))}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Sherlock Summary Hypothesis (violet box)
// -----------------------------------------------------------------------------

function SummaryBox({ summary }: { summary: SherlockSummary }) {
  return (
    <div
      data-canonical-section="sh-summary"
      role="region"
      aria-label="Sherlock summary hypothesis"
      className="rounded-[10px] border border-[color:var(--ai-line)] p-4"
      style={{
        background: 'color-mix(in srgb, var(--secondary) 6%, transparent)',
        borderLeftWidth: '3px',
        borderLeftColor: 'var(--secondary)',
      }}
    >
      <div className="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[color:var(--secondary)]">
          <AgentName code="sherlock" /> · summary hypothesis
        </span>
        <span className="font-mono text-[10px] text-[color:var(--t3)]">· {summary.generated}</span>
      </div>
      <p className="text-pretty text-[13.5px] leading-[1.55] text-[color:var(--t2)]">
        {summary.body}
      </p>
      <p className="mt-2 text-pretty text-[13.5px] leading-[1.55] text-[color:var(--t2)]">
        {summary.followup}
      </p>
      <div data-canonical-section="ev-row" className="mt-3 flex flex-wrap items-center gap-2">
        <Paperclip className="h-3.5 w-3.5 shrink-0 text-[color:var(--t3)]" aria-hidden="true" />
        {summary.evidence.map((chip) => (
          <span
            key={chip}
            className="inline-flex h-5 items-center rounded-sm border border-[color:var(--border)] bg-[color:var(--raised)] px-2 font-mono text-[10.5px] text-[color:var(--t2)]"
          >
            {chip}
          </span>
        ))}
        <button
          type="button"
          className="ml-auto inline-flex h-7 items-center gap-1.5 rounded-md border border-[color:var(--ai-line)] bg-transparent px-2.5 text-[11.5px] font-medium text-[color:var(--secondary)] hover:bg-[color:var(--ai-soft)]"
        >
          Show evidence
          <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// RCA layer card (one per layer, expand/collapse)
// -----------------------------------------------------------------------------

const TONE_CLASS = {
  high: {
    chipBg: 'var(--pass-soft)',
    chipBorder: 'var(--pass-line)',
    chipFg: 'var(--pass)',
    stripe: 'var(--pass)',
  },
  med: {
    chipBg: 'var(--warn-soft)',
    chipBorder: 'var(--warn-line)',
    chipFg: 'var(--warn)',
    stripe: 'var(--warn)',
  },
  low: {
    chipBg: 'var(--fail-soft)',
    chipBorder: 'var(--fail-line)',
    chipFg: 'var(--fail)',
    stripe: 'var(--fail)',
  },
};

const ICONS: Record<RcaLayer['icon'], typeof Terminal> = {
  terminal: Terminal,
  public: Globe,
  tune: SlidersHorizontal,
  code: Code2,
  database: Database,
};

function LayerPayloadRender({ payload }: { payload: LayerPayload }) {
  if (payload.kind === 'stack') {
    return (
      <pre className="max-h-[260px] overflow-x-auto overflow-y-auto rounded-md border border-[color:var(--border)] bg-[color:var(--canvas)] p-3 font-mono text-[11.5px] leading-[1.6] text-[color:var(--t2)]">
        {payload.lines.map((l, i) => (
          <div key={i}>
            {l.candidate ? (
              <span>
                {l.raw.replace('← Sherlock root-cause candidate', '')}
                <span className="text-[color:var(--secondary)]">
                  ← Sherlock root-cause candidate
                </span>
              </span>
            ) : l.raw.startsWith('TimeoutException:') ? (
              <span>
                <b className="text-[color:var(--fail)]">TimeoutException:</b>
                {l.raw.slice('TimeoutException:'.length)}
              </span>
            ) : (
              l.raw
            )}
          </div>
        ))}
      </pre>
    );
  }
  if (payload.kind === 'env' || payload.kind === 'config' || payload.kind === 'data') {
    // `data` rows lack `note`; widen via row-level `in` check.
    const rows = payload.rows as { k: string; v: string; note?: string }[];
    return (
      <dl className="grid grid-cols-[minmax(140px,200px)_1fr] gap-x-3 gap-y-1.5 text-[12.5px]">
        {rows.map((r) => (
          <div key={r.k} className="contents">
            <dt className="font-mono text-[11.5px] text-[color:var(--t3)]">{r.k}</dt>
            <dd className="text-[color:var(--t2)]">
              <span className="font-mono text-[color:var(--t1)]">{r.v}</span>
              {r.note ? <span className="ml-2 text-[color:var(--warn)]">{r.note}</span> : null}
            </dd>
          </div>
        ))}
      </dl>
    );
  }
  if (payload.kind === 'code') {
    return (
      <div className="flex min-w-0 flex-col gap-2">
        {payload.commits.map((c, i) => (
          <div
            key={c.hash}
            className="flex flex-wrap items-center gap-2 rounded-md border border-[color:var(--border)] bg-[color:var(--raised)] px-2.5 py-2"
          >
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ background: i === 0 ? 'var(--warn)' : 'var(--t4)' }}
              aria-hidden="true"
            />
            <span className="font-mono text-[11.5px] text-[color:var(--t2)]">{c.hash}</span>
            <span
              className="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full font-mono text-[8.5px] font-semibold text-[color:var(--canvas)]"
              style={{ background: i === 0 ? '#FBBF24' : '#60A5FA' }}
              aria-hidden="true"
            >
              {c.author.initials}
            </span>
            <span className="text-[12px] text-[color:var(--t1)]">{c.author.name}</span>
            <span className="font-mono text-[11px] text-[color:var(--t4)]">· {c.date}</span>
            <span className="min-w-[120px] flex-1 text-[12px] text-[color:var(--t2)]">
              {c.message}
            </span>
            <span className="inline-flex h-5 items-center rounded-sm border border-[color:var(--info-line)] bg-[color:var(--info-soft)] px-2 font-mono text-[10.5px] text-[color:var(--info)]">
              {c.prNumber}
            </span>
          </div>
        ))}
        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[color:var(--t3)]">
          <Highlighter className="h-3 w-3" aria-hidden="true" />
          Affected lines ·{' '}
          <span className="font-mono text-[color:var(--t2)]">
            {payload.affectedLines.file}
          </span> ·{' '}
          <span className="font-mono text-[color:var(--t2)]">{payload.affectedLines.range}</span>
        </div>
      </div>
    );
  }
  return null;
}

function LayerCard({ layer }: { layer: RcaLayer }) {
  const [open, setOpen] = useState(layer.defaultExpanded);
  const tone = TONE_CLASS[layer.confTone];
  const Icon = ICONS[layer.icon];
  const headerId = `rca-${layer.id}-head`;
  const panelId = `rca-${layer.id}-panel`;

  return (
    <article
      data-canonical-section={`rca-card-${layer.num}`}
      role="article"
      aria-label={`Sherlock RCA layer ${layer.num} — ${layer.title}`}
      className="overflow-hidden rounded-lg border border-[color:var(--border)] bg-[color:var(--base)]"
      style={{ borderLeftWidth: '3px', borderLeftColor: tone.stripe }}
    >
      <h4 className="m-0">
        <button
          id={headerId}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
          data-canonical-section="rca-head"
          className="flex min-h-[44px] w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-[color:var(--raised)]"
        >
          <span className="font-mono text-[10px] tabular-nums text-[color:var(--t3)]">
            {layer.num}
          </span>
          <Icon className="h-4 w-4 text-[color:var(--t3)]" aria-hidden="true" />
          <span className="font-display text-[14px] font-bold text-[color:var(--t1)]">
            {layer.title}
          </span>
          <span className="ml-auto inline-flex items-center gap-2">
            <span
              className="inline-flex h-5 items-center gap-1 rounded-sm border px-2 font-mono text-[10.5px] font-semibold"
              style={{ background: tone.chipBg, borderColor: tone.chipBorder, color: tone.chipFg }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: tone.chipFg }}
                aria-hidden="true"
              />
              {layer.conf}% · {layer.confLabel}
            </span>
            {layer.hitlRequired ? (
              <span className="inline-flex h-5 items-center gap-1 rounded-sm border border-[color:var(--fail-line)] bg-[color:var(--fail-soft)] px-2 font-mono text-[10.5px] font-semibold text-[color:var(--fail)]">
                <Flag className="h-3 w-3" aria-hidden="true" />
                HITL required
              </span>
            ) : (
              <span className="hidden text-[10.5px] text-[color:var(--t3)] md:inline">
                {layer.hint}
              </span>
            )}
          </span>
          <ChevronDown
            className="h-4 w-4 shrink-0 text-[color:var(--t3)] transition-transform"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
            aria-hidden="true"
          />
        </button>
      </h4>
      {open ? (
        <div
          id={panelId}
          role="region"
          aria-labelledby={headerId}
          className="grid gap-3 px-3 pb-3 pt-1 md:grid-cols-[minmax(0,1fr)_280px]"
        >
          <div className="min-w-0">
            <LayerPayloadRender payload={layer.payload} />
          </div>
          <aside className="rounded-md border border-[color:var(--ai-line)] bg-[color:var(--ai-soft)] p-3">
            <div className="mb-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-[color:var(--secondary)]">
              <AgentName code="sherlock" /> {layer.sherlockBox.kind.toLowerCase()}
            </div>
            <p className="text-pretty text-[12.5px] leading-[1.55] text-[color:var(--t2)]">
              {layer.sherlockBox.body}
            </p>
          </aside>
        </div>
      ) : null}
    </article>
  );
}

// -----------------------------------------------------------------------------
// Suggested-fix banner
// -----------------------------------------------------------------------------

function FixBanner({ fix }: { fix: SuggestedFix }) {
  return (
    <div
      data-canonical-section="fix-banner"
      role="region"
      aria-label="Sherlock suggested fix"
      className="rounded-[10px] border border-[color:var(--ai-line)] p-4 md:p-[18px] md:pl-[26px]"
      style={{
        background: 'color-mix(in srgb, var(--secondary) 8%, transparent)',
        borderLeftWidth: '3px',
        borderLeftColor: 'var(--secondary)',
      }}
    >
      <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.08em] text-[color:var(--secondary)]">
        <AgentName code="sherlock" /> · suggested fix
      </div>
      <h4 className="font-display mb-2 text-[15px] font-bold leading-snug text-[color:var(--t1)]">
        {fix.heading.split('refund.handler_timeout_ms').map((p, i, a) =>
          i < a.length - 1 ? (
            <span key={i}>
              {p}
              <span className="rounded-sm bg-[color:var(--raised)] px-1.5 py-0.5 font-mono text-[13px] text-[color:var(--t1)]">
                refund.handler_timeout_ms
              </span>
            </span>
          ) : (
            <span key={i}>{p}</span>
          ),
        )}
      </h4>
      <p className="mb-3 text-pretty text-[13.5px] leading-[1.55] text-[color:var(--t2)]">
        {fix.body}
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[color:var(--primary)] px-3 text-[12px] font-semibold text-[color:var(--primary-ink)] hover:opacity-90"
        >
          <Play className="h-3.5 w-3.5" aria-hidden="true" />
          {fix.applyLabel}
        </button>
        <button
          type="button"
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[color:var(--ai-line)] bg-transparent px-3 text-[12px] font-medium text-[color:var(--secondary)] hover:bg-[color:var(--ai-soft)]"
        >
          View patch diff
        </button>
        <button
          type="button"
          className="inline-flex h-7 items-center px-2.5 text-[11.5px] text-[color:var(--t3)] hover:text-[color:var(--t1)]"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Section composition
// -----------------------------------------------------------------------------

interface Props {
  overall: number;
  segments: ConfBarSegment[];
  summary: SherlockSummary;
  layers: RcaLayer[];
  fix: SuggestedFix;
}

export function SherlockRca({ overall, segments, summary, layers, fix }: Props) {
  return (
    <section
      role="region"
      aria-label="Sherlock Root Cause Analysis"
      data-canonical-section="section-sherlock"
      className="space-y-3"
    >
      {/* sec-head: title + chip + override + re-run */}
      <header data-canonical-section="sec-head" className="flex flex-wrap items-center gap-2">
        <h2 className="font-display text-[15px] font-bold text-[color:var(--t1)]">
          <AgentName code="sherlock" /> · Root Cause Analysis
        </h2>
        <span className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--ai-line)] bg-[color:var(--ai-soft)] px-2 py-0.5 text-[11px] font-semibold text-[color:var(--secondary)]">
          <span
            className="h-1.5 w-1.5 rounded-full bg-[color:var(--secondary)]"
            aria-hidden="true"
          />
          Service-layer regression · 94%
        </span>
        <button
          type="button"
          className="ml-auto inline-flex h-7 items-center gap-1.5 rounded-md border border-[color:var(--border)] bg-transparent px-2.5 text-[11.5px] text-[color:var(--t2)] hover:border-[color:var(--border-strong)] hover:text-[color:var(--t1)]"
        >
          Override
          <ChevronDown className="h-3 w-3" aria-hidden="true" />
        </button>
        <button
          type="button"
          className="inline-flex h-7 items-center gap-1.5 rounded-md border border-[color:var(--border)] bg-transparent px-2.5 text-[11.5px] text-[color:var(--t2)] hover:border-[color:var(--border-strong)] hover:text-[color:var(--t1)]"
        >
          <RotateCw className="h-3 w-3" aria-hidden="true" />
          Re-run
        </button>
      </header>

      <ConfRow overall={overall} segments={segments} />
      <SummaryBox summary={summary} />

      <div data-canonical-section="rca-cards" className="space-y-2">
        {layers.map((l) => (
          <LayerCard key={l.id} layer={l} />
        ))}
      </div>

      <FixBanner fix={fix} />
    </section>
  );
}

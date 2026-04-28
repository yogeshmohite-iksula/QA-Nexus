// F08b outcome board — three sections stacked:
//   A. AI Value KPI strip (4 large cards, mono formula footers)
//   B. Secondary outcome board (4 small cards: pass rate / defect trend /
//      release risk / approvals on you)
//   C. Per-project cockpit tiles (3 tiles with RAG indicators)

'use client';

import {
  KPI_CARDS,
  OUTCOME_CARDS,
  PROJECT_TILES,
  type KpiCard,
  type OutcomeCard,
  type ProjectTile,
} from './data';

export function OutcomeBoard() {
  return (
    <div className="flex w-full flex-col gap-8 lg:gap-10">
      <KpiStrip />
      <SecondaryOutcomes />
      <ProjectCockpit />
    </div>
  );
}

// ---------------------------------------------------------------------------
// A. KPI strip (4 large cards)
// ---------------------------------------------------------------------------

function KpiStrip() {
  return (
    <section aria-labelledby="kpi-head" className="flex flex-col gap-3">
      <header className="flex items-baseline justify-between">
        <h2
          id="kpi-head"
          className="font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--text-tertiary)]"
        >
          AI value (this sprint)
        </h2>
        <span className="text-[12px] text-[var(--text-tertiary)]">Calibrated 2026-03-15</span>
      </header>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
        {KPI_CARDS.map((c) => (
          <KpiCardBlock key={c.id} card={c} />
        ))}
      </div>
    </section>
  );
}

function KpiCardBlock({ card }: { card: KpiCard }) {
  const deltaClass = !card.delta
    ? ''
    : card.delta.tone === 'pass'
      ? 'text-[var(--pass)] bg-[var(--pass)]/10'
      : card.delta.tone === 'warn'
        ? 'text-[var(--warn)] bg-[var(--warn)]/10'
        : 'text-[var(--text-tertiary)] bg-[var(--overlay)]';
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--base)] p-5">
      <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
        {card.label}
      </span>
      <span className="font-display text-[32px] font-bold leading-none text-[var(--text-primary)]">
        {card.value}
      </span>
      {card.delta && (
        <span
          className={[
            'inline-flex w-fit items-center rounded-full px-2 py-0.5 font-mono text-[11px] font-bold',
            deltaClass,
          ].join(' ')}
        >
          {card.delta.text}
        </span>
      )}
      <p className="font-mono text-[11px] leading-[16px] text-[var(--text-disabled)]">
        {card.formula}
      </p>
    </article>
  );
}

// ---------------------------------------------------------------------------
// B. Secondary outcome board (4 small cards)
// ---------------------------------------------------------------------------

function SecondaryOutcomes() {
  return (
    <section aria-labelledby="secondary-head" className="flex flex-col gap-3">
      <h2
        id="secondary-head"
        className="font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--text-tertiary)]"
      >
        Quality & ship signals
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
        {OUTCOME_CARDS.map((c) => (
          <SecondaryCard key={c.id} card={c} />
        ))}
      </div>
    </section>
  );
}

function SecondaryCard({ card }: { card: OutcomeCard }) {
  const ragColor =
    card.rag === 'green'
      ? 'bg-[var(--pass)]'
      : card.rag === 'amber'
        ? 'bg-[var(--warn)]'
        : card.rag === 'red'
          ? 'bg-[var(--fail)]'
          : null;
  const deltaClass = !card.delta
    ? ''
    : card.delta.tone === 'pass'
      ? 'text-[var(--pass)]'
      : card.delta.tone === 'warn'
        ? 'text-[var(--warn)]'
        : card.delta.tone === 'fail'
          ? 'text-[var(--fail)]'
          : 'text-[var(--text-tertiary)]';
  return (
    <article className="flex flex-col gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--raised)] p-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
          {card.label}
        </span>
        {ragColor && (
          <span
            aria-label={`RAG ${card.rag}`}
            className={`inline-block h-2 w-2 rounded-full ${ragColor}`}
          />
        )}
      </div>
      <span className="font-display text-[18px] font-bold leading-tight text-[var(--text-primary)]">
        {card.value}
      </span>
      {card.delta && (
        <span className={`text-[11px] font-medium ${deltaClass}`}>{card.delta.text}</span>
      )}
      <span className="font-mono text-[10px] text-[var(--text-disabled)]">{card.meta}</span>
    </article>
  );
}

// ---------------------------------------------------------------------------
// C. Per-project cockpit tiles (3 tiles)
// ---------------------------------------------------------------------------

function ProjectCockpit() {
  return (
    <section aria-labelledby="cockpit-head" className="flex flex-col gap-3">
      <h2
        id="cockpit-head"
        className="font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--text-tertiary)]"
      >
        Per-project cockpit
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
        {PROJECT_TILES.map((t) => (
          <ProjectTileBlock key={t.glyph} tile={t} />
        ))}
      </div>
    </section>
  );
}

function ProjectTileBlock({ tile }: { tile: ProjectTile }) {
  const ragColor =
    tile.rag === 'green'
      ? 'bg-[var(--pass)]'
      : tile.rag === 'amber'
        ? 'bg-[var(--warn)]'
        : 'bg-[var(--fail)]';
  const branchTone =
    tile.branchTone === 'warn'
      ? 'text-[var(--warn)] bg-[var(--warn)]/10'
      : 'text-[var(--text-tertiary)] bg-[var(--overlay)]';
  return (
    <article className="flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--base)] p-3 sm:p-4">
      <span
        aria-hidden="true"
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md font-mono text-[12px] font-bold text-[var(--primary-ink)]"
        style={{ background: 'linear-gradient(135deg, #2DD4BF 0%, #A78BFA 120%)' }}
      >
        {tile.glyph}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-display truncate text-[14px] font-semibold text-[var(--text-primary)]">
            {tile.name}
          </span>
          <span className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-medium ${branchTone}`}>
            {tile.branch}
          </span>
        </div>
        <span className="font-mono text-[10px] text-[var(--text-tertiary)]">
          {tile.sprint} · {tile.passRate} · {tile.open}
        </span>
      </div>
      <span
        aria-label={`RAG ${tile.rag}`}
        className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${ragColor}`}
      />
    </article>
  );
}

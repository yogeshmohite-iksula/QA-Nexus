// Region 2 of F08a Home — 4-card outcome board.
// Mobile: 1-col stack. Tablet: 2-col grid. Desktop (lg+): 4-col grid.

'use client';

import { ACTION_QUEUE } from './data';
import { ComingSoon } from '@/components/admin/coming-soon';

interface OutcomeBoardProps {
  onRoute: (target: string) => void;
}

export function OutcomeBoard({ onRoute }: OutcomeBoardProps) {
  return (
    <section aria-labelledby="outcome-board-head" className="flex w-full flex-col gap-3">
      <h2
        id="outcome-board-head"
        className="font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--text-tertiary)]"
      >
        Outcome board
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
        <ActionQueueCard onRoute={onRoute} />
        <ActiveRunsCard onRoute={onRoute} />
        <ReleaseRiskCard onRoute={onRoute} />
        <AiNarrativeCard onRoute={onRoute} />
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Card 1 — Action queue
// ---------------------------------------------------------------------------

function ActionQueueCard({ onRoute }: { onRoute: (t: string) => void }) {
  return (
    <BoardCard tone="neutral">
      <CardHead label="Your action queue" />
      <div className="flex items-center justify-between">
        <span className="font-display text-[28px] font-bold leading-none text-[var(--text-primary)]">
          {ACTION_QUEUE.itemCount}{' '}
          <span className="text-[14px] font-medium text-[var(--text-tertiary)]">items</span>
        </span>
        <span
          className="bg-[var(--pass)]/15 inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[11px] font-bold text-[var(--pass)]"
          aria-label={`${ACTION_QUEUE.delta} more than yesterday`}
        >
          +{ACTION_QUEUE.delta}
        </span>
      </div>
      <Sparkline values={ACTION_QUEUE.spark} />
      <p className="text-[12px] leading-[18px] text-[var(--text-tertiary)]">
        {ACTION_QUEUE.caption}
      </p>
      <CardCta onClick={() => onRoute('F08a-action-queue-open')}>Work through queue →</CardCta>
    </BoardCard>
  );
}

function Sparkline({ values }: { values: number[] }) {
  return (
    <div aria-hidden="true" className="flex h-10 items-end gap-1">
      {values.map((v, i) => (
        <span
          key={i}
          className="bg-[var(--primary)]/40 flex-1 rounded-sm"
          style={{ height: `${Math.max(8, v)}%` }}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card 2 — Active runs (Fri WIRE Option C: BE has no GET /api/test-runs list
// endpoint — only @Patch(:id/start|result|abort). Falls back to ComingSoon
// rather than canned ACTIVE_RUNS. Reinstates as a live card once BE adds
// GET /api/test-runs (list).)
// ---------------------------------------------------------------------------

function ActiveRunsCard(_props: { onRoute: (t: string) => void }) {
  return (
    <ComingSoon
      label="Active runs"
      hint="Live run progress arrives once the run-list endpoint ships."
    />
  );
}

// ---------------------------------------------------------------------------
// Card 3 — Release risk
// ---------------------------------------------------------------------------

function ReleaseRiskCard(_props: { onRoute: (t: string) => void }) {
  // Fri WIRE batch 5: no release-tracking endpoint exists → ComingSoon affordance.
  return <ComingSoon label="Release risk" hint="Release tracking is coming in a future release." />;
}

// ---------------------------------------------------------------------------
// Card 4 — AI narrative (violet)
// ---------------------------------------------------------------------------

function AiNarrativeCard(_props: { onRoute: (t: string) => void }) {
  // Fri WIRE batch 5: no agent-narrative endpoint exists → ComingSoon.
  return (
    <ComingSoon
      label="AI narrative"
      hint="Agent-narrated highlights are coming in a future release."
    />
  );
}

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

function BoardCard({ children, tone }: { children: React.ReactNode; tone: 'neutral' | 'ai' }) {
  return (
    <article
      className={[
        'flex flex-col gap-3 rounded-2xl border p-4 sm:p-5',
        tone === 'ai'
          ? 'border-[var(--secondary)]/30 bg-[var(--secondary)]/5'
          : 'border-[var(--border-subtle)] bg-[var(--base)]',
      ].join(' ')}
    >
      {children}
    </article>
  );
}

function CardHead({ label, inline }: { label: string; inline?: boolean }) {
  return (
    <span
      className={[
        'font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]',
        inline ? '' : 'pb-1',
      ].join(' ')}
    >
      {label}
    </span>
  );
}

function CardCta({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-auto inline-flex h-9 min-h-11 items-center justify-start gap-1 self-start rounded text-[13px] font-medium text-[var(--primary)] transition-colors hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
    >
      {children}
    </button>
  );
}

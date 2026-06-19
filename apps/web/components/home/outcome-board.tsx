// Region 2 of F08a Home — 4-card outcome board.
// Mobile: 1-col stack. Tablet: 2-col grid. Desktop (lg+): 4-col grid.

'use client';

import { useEffect, useState } from 'react';
import { ACTION_QUEUE, ACTIVE_RUNS, RECENT_RUNS } from './data';
import { ComingSoon } from '@/components/admin/coming-soon';
import {
  fetchActiveRuns,
  fetchRecentRuns,
  testRunToActiveRow,
  testRunToRecentRow,
  type ActiveRunRow,
  type RecentRunRow,
} from '@/lib/api/test-runs-api';

interface OutcomeBoardProps {
  onRoute: (target: string) => void;
}

export function OutcomeBoard({ onRoute }: OutcomeBoardProps) {
  return (
    <div className="flex flex-col gap-6">
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
      <RecentRunsSection onRoute={onRoute} />
    </div>
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
// Card 2 — Active runs (Fri Option B post-#292: live via GET
// /api/test-runs?status=running. Top running row gets the card; "+N more"
// badge when total > 1. Null fetch → canned ACTIVE_RUNS via Option-B
// fallback. Empty list → honest "no active runs" state. `flaky` from the
// canned shape is dropped because BE has no flaky concept; render shrinks
// to pass / fail / left.)
// ---------------------------------------------------------------------------

function ActiveRunsCard({ onRoute }: { onRoute: (t: string) => void }) {
  const [live, setLive] = useState<{ rows: ActiveRunRow[]; total: number } | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let alive = true;
    void fetchActiveRuns(10).then((res) => {
      if (!alive) return;
      if (res) {
        setLive({
          rows: res.testRuns.map(testRunToActiveRow),
          total: res.pagination.total,
        });
      }
      setLoaded(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  // Empty + loaded = honest no-runs state.
  if (loaded && live && live.rows.length === 0) {
    return (
      <BoardCard tone="neutral">
        <div className="flex items-center justify-between">
          <CardHead label="Active runs" inline />
          <span className="inline-flex items-center rounded-full bg-[var(--overlay)] px-2 py-0.5 font-mono text-[10px] font-bold text-[var(--text-tertiary)]">
            IDLE
          </span>
        </div>
        <p className="mt-2 text-[13px] leading-[18px] text-[var(--text-tertiary)]">
          No active runs.
        </p>
        <p className="font-mono text-[11px] text-[var(--text-disabled)]">
          A running suite will surface here as soon as one starts.
        </p>
      </BoardCard>
    );
  }

  // Live first row OR (null fetch → canned shape adapted via local map).
  const r: ActiveRunRow =
    live && live.rows.length > 0
      ? live.rows[0]
      : {
          id: ACTIVE_RUNS.id,
          shortId: ACTIVE_RUNS.id,
          name: ACTIVE_RUNS.suite,
          projectKey: 'RET',
          passed: ACTIVE_RUNS.passed,
          failed: ACTIVE_RUNS.failed,
          total: ACTIVE_RUNS.total,
          remaining: ACTIVE_RUNS.remaining,
          percent: ACTIVE_RUNS.percent,
        };
  const moreCount = live && live.total > 1 ? live.total - 1 : 0;

  return (
    <BoardCard tone="neutral">
      <div className="flex items-center justify-between">
        <CardHead label="Active runs" inline />
        <span className="bg-[var(--pass)]/15 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold text-[var(--pass)]">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[var(--pass)]" />
          LIVE
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="font-mono text-[12px] text-[var(--text-tertiary)]">{r.shortId}</span>
        <span className="font-display text-[14px] font-semibold text-[var(--text-primary)]">
          {r.name}
        </span>
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] text-[var(--text-secondary)]">
          {r.passed + r.failed} / {r.total} cases
        </span>
        <span className="font-mono text-[12px] font-semibold text-[var(--primary)]">
          {r.percent}%
        </span>
      </div>
      <div
        aria-hidden="true"
        className="flex h-2 w-full overflow-hidden rounded-full bg-[var(--overlay)]"
      >
        <span
          className="bg-[var(--pass)]"
          style={{ width: r.total === 0 ? '0%' : `${(r.passed / r.total) * 100}%` }}
        />
        <span
          className="bg-[var(--fail)]"
          style={{ width: r.total === 0 ? '0%' : `${(r.failed / r.total) * 100}%` }}
        />
      </div>
      <p className="font-mono text-[11px] text-[var(--text-tertiary)]">
        {r.passed} pass · {r.failed} fail · {r.remaining} left
        {moreCount > 0 ? ` · +${moreCount} more running` : ''}
      </p>
      <CardCta onClick={() => onRoute('F19-run-console-' + r.id)}>Open Run Console →</CardCta>
    </BoardCard>
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
// Recent Runs section (Fri Option B post-#292: live via GET /api/test-runs
// default sort=started_at_desc. Lightweight horizontal list below the
// Outcome Board grid; canonical /home doesn't have a dedicated card slot
// for this, so we render as a stacked "Recent runs" section to avoid
// disrupting the 4-card grid layout.)
// ---------------------------------------------------------------------------

function RecentRunsSection({ onRoute }: { onRoute: (target: string) => void }) {
  const [live, setLive] = useState<RecentRunRow[] | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let alive = true;
    void fetchRecentRuns(5).then((res) => {
      if (!alive) return;
      if (res) {
        setLive(res.testRuns.map(testRunToRecentRow));
      }
      setLoaded(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  const fallback: RecentRunRow[] = RECENT_RUNS.map((r) => ({
    id: r.id,
    shortId: r.id,
    name: r.summary,
    projectKey: 'RET',
    status: 'passed' as const,
    summary: r.summary,
    whenIso: null,
    whenRelative: r.when,
    triggeredByName: '—',
  }));
  const rows = live ?? fallback;

  return (
    <section aria-labelledby="recent-runs-head" className="flex w-full flex-col gap-3">
      <h2
        id="recent-runs-head"
        className="font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--text-tertiary)]"
      >
        Recent runs
      </h2>
      {loaded && live && live.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--base)] p-4 sm:p-5">
          <p className="text-[13px] leading-[20px] text-[var(--text-tertiary)]">
            No runs yet. Recent run summaries surface here once the runner records test executions.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((r) => (
            <li
              key={r.id}
              className="flex flex-col gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--base)] p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-[var(--text-tertiary)]">
                    {r.shortId}
                  </span>
                  <RunStatusChip status={r.status} />
                </div>
                <span className="font-display truncate text-[13px] font-semibold text-[var(--text-primary)]">
                  {r.name}
                </span>
                <span className="font-mono text-[11px] text-[var(--text-tertiary)]">
                  {r.summary}
                </span>
              </div>
              <div className="flex shrink-0 items-center justify-between gap-3 sm:flex-col sm:items-end sm:gap-1">
                <span className="text-[12px] text-[var(--text-secondary)]">{r.whenRelative}</span>
                <button
                  type="button"
                  onClick={() => onRoute('F20-run-results-' + r.id)}
                  className="text-[12px] font-medium text-[var(--primary)] hover:text-[var(--text-primary)] focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
                >
                  View →
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function RunStatusChip({ status }: { status: RecentRunRow['status'] }) {
  const tone: Record<RecentRunRow['status'], { label: string; cls: string }> = {
    queued: {
      label: 'QUEUED',
      cls: 'bg-[var(--overlay)] text-[var(--text-tertiary)]',
    },
    running: {
      label: 'RUNNING',
      cls: 'bg-[var(--pass)]/15 text-[var(--pass)]',
    },
    passed: {
      label: 'PASSED',
      cls: 'bg-[var(--pass)]/15 text-[var(--pass)]',
    },
    failed: {
      label: 'FAILED',
      cls: 'bg-[var(--fail)]/15 text-[var(--fail)]',
    },
    blocked: {
      label: 'BLOCKED',
      cls: 'bg-[var(--warn)]/15 text-[var(--warn)]',
    },
    aborted: {
      label: 'ABORTED',
      cls: 'bg-[var(--overlay)] text-[var(--text-tertiary)]',
    },
  };
  const t = tone[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-1.5 py-0.5 font-mono text-[10px] font-bold ${t.cls}`}
    >
      {t.label}
    </span>
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

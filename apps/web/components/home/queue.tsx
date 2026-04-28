// Region 3 of F08a Home — Your queue.
// Tabs (All / AI reviews / Clarifications / Defect triage) + 6 rows.
// Each row has a left lane stripe (3px violet for AI rows / amber for
// clarifications / none for plain), a glyph, title, agent confidence chip,
// meta line, freshness, and 1-2 action buttons.

'use client';

import { useState } from 'react';
import { QUEUE_ROWS, QUEUE_TABS, type QueueRow, type QueueTab } from './data';

interface QueueProps {
  onRoute: (target: string, entityId?: string) => void;
}

export function Queue({ onRoute }: QueueProps) {
  const [activeTab, setActiveTab] = useState<QueueTab>('all');
  const visible = activeTab === 'all' ? QUEUE_ROWS : QUEUE_ROWS.filter((r) => r.tab === activeTab);

  return (
    <section aria-labelledby="queue-head" className="flex w-full flex-col gap-3">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="queue-head"
          className="font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--text-tertiary)]"
        >
          Your queue
        </h2>
        <span className="text-[12px] text-[var(--text-tertiary)]">
          {visible.length} of {QUEUE_ROWS.length} {visible.length === 1 ? 'item' : 'items'}
        </span>
      </header>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Queue filters"
        className="flex flex-wrap items-center gap-1 border-b border-[var(--border-subtle)]"
      >
        {QUEUE_TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={activeTab === t.id}
            onClick={() => setActiveTab(t.id)}
            className={[
              'inline-flex min-h-11 items-center gap-2 px-3 py-2 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]',
              activeTab === t.id
                ? 'border-b-2 border-[var(--primary)] text-[var(--text-primary)]'
                : 'border-b-2 border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-primary)]',
            ].join(' ')}
          >
            {t.label}
            <span
              className={[
                'rounded px-1.5 py-0.5 font-mono text-[10px] font-medium',
                activeTab === t.id
                  ? 'bg-[var(--primary)]/15 text-[var(--primary)]'
                  : 'bg-[var(--overlay)] text-[var(--text-tertiary)]',
              ].join(' ')}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Rows */}
      <ul className="flex flex-col gap-2">
        {visible.map((row) => (
          <QueueRowItem key={row.id} row={row} onRoute={onRoute} />
        ))}
      </ul>
    </section>
  );
}

function QueueRowItem({ row, onRoute }: { row: QueueRow; onRoute: QueueProps['onRoute'] }) {
  const laneColor =
    row.lane === 'ai'
      ? 'bg-[var(--secondary)]'
      : row.lane === 'med'
        ? 'bg-[var(--warn)]'
        : row.lane === 'high'
          ? 'bg-[var(--fail)]'
          : 'bg-transparent';

  return (
    <li className="relative flex flex-col gap-3 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--base)] p-4 sm:flex-row sm:items-center sm:gap-4">
      {/* Lane stripe (left edge) */}
      {row.lane !== 'plain' && (
        <span aria-hidden="true" className={`absolute left-0 top-0 h-full w-1 ${laneColor}`} />
      )}

      {/* Glyph */}
      <div className="flex shrink-0 items-start gap-3 sm:items-center">
        <Glyph kind={row.glyph} />
      </div>

      {/* Body */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[13px] font-medium leading-[20px] text-[var(--text-primary)]">
            {row.title}
          </p>
          {row.agentChip && <AgentChip {...row.agentChip} />}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px] leading-[16px] text-[var(--text-tertiary)]">
          <span>{row.meta}</span>
          <span aria-hidden="true">·</span>
          <span>{row.freshness}</span>
          {row.extra && (
            <>
              <span aria-hidden="true">·</span>
              <span className={row.lane === 'med' ? 'text-[var(--warn)]' : ''}>{row.extra}</span>
            </>
          )}
        </div>
      </div>

      {/* Collaborator avatar */}
      {row.collaborator && (
        <span
          aria-hidden="true"
          className={[
            'hidden h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-[var(--primary-ink)] sm:inline-flex',
            row.collaborator.tone === 'amber' ? 'bg-[var(--warn)]' : 'bg-[var(--info)]',
          ].join(' ')}
        >
          {row.collaborator.initials}
        </span>
      )}

      {/* Actions */}
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onRoute(row.primary.routeTarget, row.id)}
          className="inline-flex h-9 min-h-11 items-center justify-center rounded bg-[var(--primary)] px-3 text-[12px] font-semibold text-[var(--primary-ink)] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
        >
          {row.primary.label}
        </button>
        {row.secondary && (
          <button
            type="button"
            onClick={() => onRoute(row.secondary!.routeTarget, row.id)}
            className="inline-flex h-9 min-h-11 items-center justify-center rounded border border-[var(--border-subtle)] px-3 text-[12px] font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--raised)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
          >
            {row.secondary.label}
          </button>
        )}
      </div>
    </li>
  );
}

function AgentChip({
  id,
  conf,
  tone,
}: {
  id: 'A1' | 'A2' | 'A4';
  conf: number;
  tone: 'pass' | 'amber';
}) {
  const toneClass =
    tone === 'pass'
      ? 'text-[var(--pass)] bg-[var(--pass)]/10'
      : 'text-[var(--warn)] bg-[var(--warn)]/10';
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="border-[var(--secondary)]/30 bg-[var(--secondary)]/15 inline-flex h-5 items-center rounded border px-1.5 font-mono text-[10px] font-semibold text-[var(--secondary)]">
        {id}
      </span>
      <span
        className={`inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[10px] font-medium ${toneClass}`}
      >
        {conf}%
      </span>
    </span>
  );
}

function Glyph({ kind }: { kind: QueueRow['glyph'] }) {
  switch (kind) {
    case 'ai':
      return (
        <span className="border-[var(--secondary)]/20 bg-[var(--secondary)]/10 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-[var(--secondary)]">
          <SparkleIcon />
        </span>
      );
    case 'amber':
      return (
        <span className="border-[var(--warn)]/30 bg-[var(--warn)]/10 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-[var(--warn)]">
          <QuestionIcon />
        </span>
      );
    case 'red-tri':
      return (
        <span className="border-[var(--fail)]/30 bg-[var(--fail)]/10 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-[var(--fail)]">
          <TriangleIcon />
        </span>
      );
    case 'amber-diamond':
      return (
        <span className="border-[var(--warn)]/30 bg-[var(--warn)]/10 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-[var(--warn)]">
          <DiamondIcon />
        </span>
      );
    case 'teal-square':
    default:
      return (
        <span className="border-[var(--primary)]/30 bg-[var(--primary)]/10 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-[var(--primary)]">
          <PlayIcon />
        </span>
      );
  }
}

function SparkleIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3l2.09 5.26L19 10l-4.91 1.74L12 17l-2.09-5.26L5 10l4.91-1.74z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function QuestionIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 3.5M12 17v.01"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
function TriangleIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3l10 18H2L12 3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 10v4M12 17.5v.01"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
function DiamondIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3 22 12 12 21 2 12 12 3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function PlayIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 5l11 7-11 7V5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// F08b approvals queue — Lead's primary action surface (replaces F08a's
// test queue). Each row has a confidence lane stripe + agent chip + action
// buttons (Approve / Request changes / Reject). Pattern A: clicks log
// console.info markers only, no network mutations.

'use client';

import { useState } from 'react';
import { APPROVAL_ROWS, APPROVAL_TABS, type ApprovalRow, type ApprovalTab } from './data';

interface ApprovalsQueueProps {
  onAction: (action: string, entityId: string) => void;
  onRoute: (target: string) => void;
}

export function ApprovalsQueue({ onAction, onRoute }: ApprovalsQueueProps) {
  const [activeTab, setActiveTab] = useState<ApprovalTab>('all');
  const visible =
    activeTab === 'all' ? APPROVAL_ROWS : APPROVAL_ROWS.filter((r) => r.tab === activeTab);

  return (
    <section aria-labelledby="approvals-head" className="flex w-full flex-col gap-3">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2
            id="approvals-head"
            className="font-display text-[18px] font-semibold text-[var(--text-primary)]"
          >
            Approvals in your queue
          </h2>
          <span className="bg-[var(--primary)]/15 rounded-full px-2 py-0.5 font-mono text-[11px] font-bold text-[var(--primary)]">
            {APPROVAL_ROWS.length} pending
          </span>
        </div>
        <span className="text-[12px] text-[var(--text-tertiary)]">Sort: Deadline ▾</span>
      </header>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Approval filters"
        className="flex flex-wrap items-center gap-1 border-b border-[var(--border-subtle)]"
      >
        {APPROVAL_TABS.map((t) => (
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
          <ApprovalRowItem key={row.id} row={row} onAction={onAction} onRoute={onRoute} />
        ))}
      </ul>

      <footer className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-3 text-[11px] text-[var(--text-disabled)]">
        <span className="font-mono">updated 09:14 IST · auto-refresh 60s</span>
      </footer>
    </section>
  );
}

function ApprovalRowItem({
  row,
  onAction,
  onRoute,
}: {
  row: ApprovalRow;
  onAction: (action: string, entityId: string) => void;
  onRoute: (target: string) => void;
}) {
  const laneColor =
    row.lane === 'high'
      ? 'bg-[var(--pass)]'
      : row.lane === 'med'
        ? 'bg-[var(--warn)]'
        : row.lane === 'low'
          ? 'bg-[var(--fail)]'
          : 'bg-transparent';

  return (
    <li className="relative flex flex-col gap-3 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--base)] p-4 transition-colors hover:border-[var(--border-strong)] sm:flex-row sm:items-center sm:gap-4">
      {row.lane !== 'plain' && (
        <span aria-hidden="true" className={`absolute left-0 top-0 h-full w-1 ${laneColor}`} />
      )}

      {/* Body */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[13px] font-medium leading-[20px] text-[var(--text-primary)]">
            {row.title}
          </p>
          {row.agentChip && (
            <span className="inline-flex items-center gap-1.5">
              <span className="border-[var(--secondary)]/30 bg-[var(--secondary)]/15 inline-flex h-5 items-center rounded border px-1.5 font-mono text-[10px] font-semibold text-[var(--secondary)]">
                {row.agentChip.id}
              </span>
              <span className="bg-[var(--secondary)]/10 inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[10px] font-medium text-[var(--secondary)]">
                {row.agentChip.conf}%
              </span>
            </span>
          )}
          {row.badge && (
            <span
              className={[
                'inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.05em]',
                row.badge.tone === 'fail'
                  ? 'bg-[var(--fail)]/15 text-[var(--fail)]'
                  : row.badge.tone === 'warn'
                    ? 'bg-[var(--warn)]/15 text-[var(--warn)]'
                    : row.badge.tone === 'pass'
                      ? 'bg-[var(--pass)]/15 text-[var(--pass)]'
                      : 'bg-[var(--secondary)]/15 text-[var(--secondary)]',
              ].join(' ')}
            >
              {row.badge.label}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px] leading-[16px] text-[var(--text-tertiary)]">
          <span>{row.meta}</span>
          <span aria-hidden="true">·</span>
          <span>{row.freshness}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {row.actions.map((a) => {
          const variant =
            a.variant === 'primary'
              ? 'bg-[var(--primary)] text-[var(--primary-ink)] hover:opacity-90'
              : a.variant === 'danger'
                ? 'border border-[var(--fail)]/40 text-[var(--fail)] hover:bg-[var(--fail)]/10'
                : 'border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:bg-[var(--raised)] hover:text-[var(--text-primary)]';
          return (
            <button
              key={a.label}
              type="button"
              onClick={() => {
                onAction(a.label, row.id);
                onRoute(a.routeTarget);
              }}
              className={[
                'inline-flex h-9 min-h-11 items-center justify-center rounded px-3 text-[12px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]',
                variant,
              ].join(' ')}
            >
              {a.label}
            </button>
          );
        })}
      </div>
    </li>
  );
}

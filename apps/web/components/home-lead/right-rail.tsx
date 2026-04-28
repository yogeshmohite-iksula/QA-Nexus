// Right rail for F08b — recent team agent activity (evidence thread) +
// suggested next + pinned references. Lead-flavored copy (RCA / DEF-001 /
// awaiting Kishor review etc.) but same structure as F08a's right rail.

'use client';

import {
  EVIDENCE_THREAD,
  PINNED_REFS,
  SUGGESTED_NEXT,
  type EvidenceEntry,
  type PinnedRef,
} from './data';

interface RightRailProps {
  onRoute: (target: string) => void;
}

export function RightRail({ onRoute }: RightRailProps) {
  return (
    <aside
      aria-label="Recent team agent activity"
      className="flex w-full flex-col gap-5 lg:max-w-md xl:sticky xl:top-14 xl:h-[calc(100vh-3.5rem)] xl:w-[380px] xl:max-w-none xl:shrink-0 xl:overflow-y-auto xl:border-l xl:border-[var(--border-subtle)] xl:bg-[var(--canvas)] xl:p-5"
    >
      <header className="flex items-center justify-between">
        <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--text-tertiary)]">
          Recent team agent activity
        </h2>
        <kbd className="rounded border border-[var(--border-subtle)] bg-[var(--overlay)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-tertiary)]">
          ⌘J
        </kbd>
      </header>

      <ol className="flex flex-col">
        {EVIDENCE_THREAD.map((e, i) => (
          <EvidenceRow
            key={`${e.agent}-${i}`}
            entry={e}
            isLast={i === EVIDENCE_THREAD.length - 1}
          />
        ))}
      </ol>

      <section
        aria-label="Suggested next action"
        className="border-[var(--primary)]/30 bg-[var(--primary)]/5 relative overflow-hidden rounded-xl border p-4"
      >
        <span aria-hidden="true" className="absolute left-0 top-0 h-full w-1 bg-[var(--primary)]" />
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--primary)]">
          Suggested next
        </span>
        <p className="mt-2 text-[13px] leading-[20px] text-[var(--text-primary)]">
          {SUGGESTED_NEXT.body}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onRoute(SUGGESTED_NEXT.primary.routeTarget)}
            className="inline-flex h-9 min-h-11 items-center justify-center rounded bg-[var(--primary)] px-3 text-[12px] font-semibold text-[var(--primary-ink)] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
          >
            {SUGGESTED_NEXT.primary.label}
          </button>
          <button
            type="button"
            onClick={() => onRoute(SUGGESTED_NEXT.secondary.routeTarget)}
            className="inline-flex h-9 min-h-11 items-center justify-center rounded border border-[var(--border-subtle)] px-3 text-[12px] font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--raised)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
          >
            {SUGGESTED_NEXT.secondary.label}
          </button>
        </div>
      </section>

      <section aria-label="Pinned references" className="flex flex-col gap-2">
        <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
          Pinned references
        </h3>
        <ul className="flex flex-col gap-2">
          {PINNED_REFS.map((p) => (
            <PinnedCard key={p.title} pin={p} onRoute={onRoute} />
          ))}
        </ul>
      </section>

      <div className="mt-auto flex items-center justify-between border-t border-[var(--border-subtle)] pt-3 text-[11px] text-[var(--text-disabled)]">
        <span className="font-mono">evidence-mesh v1.0 · ⌘J toggle</span>
        <button
          type="button"
          onClick={() => onRoute('F26-evidence-mesh-all')}
          className="font-medium text-[var(--primary)] hover:text-[var(--text-primary)] focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
        >
          View all →
        </button>
      </div>
    </aside>
  );
}

function EvidenceRow({ entry, isLast }: { entry: EvidenceEntry; isLast: boolean }) {
  return (
    <li className="relative flex gap-3 pb-3 last:pb-0">
      <div className="flex shrink-0 flex-col items-center">
        <span
          aria-hidden="true"
          className="border-[var(--secondary)]/30 bg-[var(--secondary)]/15 inline-flex h-7 w-7 items-center justify-center rounded-md border font-mono text-[10px] font-bold text-[var(--secondary)]"
        >
          {entry.agent}
        </span>
        {!isLast && (
          <span aria-hidden="true" className="mt-1 w-px flex-1 bg-[var(--border-subtle)]" />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1 pt-0.5">
        <p className="text-[13px] leading-[18px] text-[var(--text-primary)]">{entry.body}</p>
        <div className="flex flex-wrap items-center gap-2 text-[11px] leading-[16px]">
          {entry.conf && (
            <span
              className={[
                'inline-flex items-center rounded px-1.5 py-0.5 font-mono font-medium',
                entry.conf.tone === 'pass'
                  ? 'bg-[var(--pass)]/10 text-[var(--pass)]'
                  : 'bg-[var(--warn)]/10 text-[var(--warn)]',
              ].join(' ')}
            >
              conf {entry.conf.value.toFixed(2)}
            </span>
          )}
          <span className={entry.awaiting ? 'text-[var(--warn)]' : 'text-[var(--text-tertiary)]'}>
            {entry.freshness}
          </span>
        </div>
        {entry.chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {entry.chips.map((c) => (
              <span
                key={c}
                className="inline-flex items-center rounded border border-[var(--border-subtle)] bg-[var(--raised)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-tertiary)]"
              >
                {c}
              </span>
            ))}
          </div>
        )}
      </div>
    </li>
  );
}

function PinnedCard({ pin, onRoute }: { pin: PinnedRef; onRoute: (t: string) => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onRoute('F26-pinned-' + pin.title.toLowerCase().replace(/\s+/g, '-'))}
        className="flex w-full flex-col gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--base)] p-3 text-left transition-colors hover:border-[var(--border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
      >
        <span className="text-[13px] font-medium text-[var(--text-primary)]">{pin.title}</span>
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          {pin.status === 'approved' ? (
            <span className="bg-[var(--pass)]/10 inline-flex items-center rounded px-1.5 py-0.5 font-mono font-medium text-[var(--pass)]">
              ● Approved
            </span>
          ) : (
            <span className="bg-[var(--warn)]/10 inline-flex items-center rounded px-1.5 py-0.5 font-mono font-medium text-[var(--warn)]">
              Gates
            </span>
          )}
          <span className="font-mono text-[var(--text-tertiary)]">{pin.meta}</span>
        </div>
      </button>
    </li>
  );
}

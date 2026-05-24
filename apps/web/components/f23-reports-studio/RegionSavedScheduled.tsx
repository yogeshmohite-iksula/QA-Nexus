// F23 Reports Studio — Region 3: AI savings tile + Saved reports + Scheduled.
// Source: handoff/F23/spec.json §sections[region-3-saved-and-scheduled].
//
// Only shown when canvas state == 'result' per spec §visibility.
// Tonight: structural skeleton + grid of saved cards + scheduled rows.

'use client';

import { f23CannedData } from './canned-data';

interface Props {
  onSavedClick: (id: string) => void;
  onNewBlank: () => void;
}

export function RegionSavedScheduled({ onSavedClick, onNewBlank }: Props) {
  return (
    <section
      role="region"
      aria-label="Saved reports and scheduled distributions"
      className="flex flex-none flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8"
      style={{ background: 'var(--canvas)', borderTop: '1px solid var(--border)' }}
    >
      {/* AI savings tile */}
      <div
        role="status"
        aria-label="AI-generation savings YTD"
        className="flex items-center gap-3 rounded-md border px-4 py-3"
        style={{ background: 'var(--ai-soft)', borderColor: 'var(--ai-line)' }}
      >
        <span
          aria-hidden="true"
          className="inline-flex h-7 w-7 flex-none items-center justify-center rounded-full text-[12px] font-bold"
          style={{ background: 'var(--secondary)', color: 'var(--secondary-ink)' }}
        >
          ✓
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-[13px] font-semibold" style={{ color: 'var(--secondary)' }}>
            {f23CannedData.ai_savings.label}
          </span>
          <span className="text-[11.5px]" style={{ color: 'var(--t3)' }}>
            {f23CannedData.ai_savings.detail}
          </span>
        </div>
      </div>

      {/* Saved reports grid */}
      <div role="region" aria-label="Saved report templates" className="flex flex-col gap-2">
        <h3
          className="m-0 text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: 'var(--t3)' }}
        >
          Saved reports
        </h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {f23CannedData.saved_reports.map((s) => (
            <SavedCard
              key={s.id}
              report={s}
              onClick={() => ('is_new' in s && s.is_new ? onNewBlank() : onSavedClick(s.id))}
            />
          ))}
        </div>
      </div>

      {/* Scheduled rail */}
      <div className="flex flex-col gap-2">
        <h3
          className="m-0 text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: 'var(--t3)' }}
        >
          Scheduled and recurring
        </h3>
        <div
          role="region"
          aria-label="Scheduled and recurring distributions"
          className="flex flex-col gap-2"
        >
          {f23CannedData.scheduled.map((s) => (
            <ScheduledRow key={s.id} row={s} />
          ))}
        </div>
      </div>
    </section>
  );
}

// Use the union from canned-data directly so readonly tuple shapes pass through.
type SavedReport = (typeof f23CannedData.saved_reports)[number];

function SavedCard({ report, onClick }: { report: SavedReport; onClick: () => void }) {
  const isNew = 'is_new' in report && report.is_new === true;
  const isDraft = 'draft' in report && report.draft === true;
  if (isNew) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex min-h-[88px] flex-col items-center justify-center gap-1 rounded-md border border-dashed p-3 text-center transition-colors hover:bg-[var(--overlay)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
        style={{
          background: 'var(--primary-soft)',
          borderColor: 'var(--primary-line)',
          color: 'var(--primary)',
        }}
      >
        <span aria-hidden="true" className="text-[18px] font-bold leading-none">
          +
        </span>
        <span className="text-[12px] font-semibold">New from blank</span>
      </button>
    );
  }
  return (
    <div
      className="flex min-h-[88px] flex-col gap-2 rounded-md border p-3 transition-colors hover:bg-[var(--overlay)]"
      style={{ background: 'var(--base)', borderColor: 'var(--border)' }}
    >
      <span className="line-clamp-2 text-[12.5px] font-semibold" style={{ color: 'var(--t1)' }}>
        {report.title}
      </span>
      <div className="flex items-center gap-1.5">
        {report.owner_initials && (
          <span
            aria-hidden="true"
            className="inline-flex h-5 w-5 flex-none items-center justify-center rounded-full font-mono text-[9px] font-bold"
            style={{
              background: 'var(--ai-soft)',
              color: 'var(--secondary)',
              border: '1px solid var(--ai-line)',
            }}
            title={report.owner ?? undefined}
          >
            {report.owner_initials}
          </span>
        )}
        <span className="truncate font-mono text-[10px]" style={{ color: 'var(--t4)' }}>
          {report.schedule}
        </span>
        {isDraft && (
          <span
            className="ml-auto rounded border px-1.5 py-0.5 font-mono text-[9.5px] font-semibold uppercase tracking-wider"
            style={{
              background: 'var(--warn-soft)',
              borderColor: 'var(--warn-line)',
              color: 'var(--warn)',
            }}
          >
            draft
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={onClick}
        className="mt-auto inline-flex min-h-[28px] items-center justify-center rounded border px-2 text-[10.5px] font-semibold transition-colors hover:bg-[var(--primary-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
        style={{
          background: 'var(--canvas)',
          borderColor: 'var(--primary-line)',
          color: 'var(--primary)',
        }}
      >
        Run
      </button>
    </div>
  );
}

type Scheduled = (typeof f23CannedData.scheduled)[number];

function ScheduledRow({ row }: { row: Scheduled }) {
  const toneBg =
    row.status_tone === 'pass'
      ? 'var(--pass-soft)'
      : row.status_tone === 'warn'
        ? 'var(--warn-soft)'
        : 'var(--fail-soft)';
  const toneFg =
    row.status_tone === 'pass'
      ? 'var(--pass)'
      : row.status_tone === 'warn'
        ? 'var(--warn)'
        : 'var(--fail)';
  return (
    <div
      className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:gap-3"
      style={{ background: 'var(--base)', borderColor: 'var(--border)' }}
    >
      <span
        className="inline-flex w-fit items-center rounded border px-2 py-1 font-mono text-[10px]"
        style={{
          background: 'var(--canvas)',
          borderColor: 'var(--border)',
          color: 'var(--t3)',
        }}
      >
        {row.cron}
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-[12.5px] font-semibold" style={{ color: 'var(--t1)' }}>
          {row.title}
        </span>
        <span className="truncate font-mono text-[10.5px]" style={{ color: 'var(--t4)' }}>
          → {row.recipients}
        </span>
      </div>
      <span
        className="inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
        style={{ background: toneBg, color: toneFg }}
      >
        {row.status}
      </span>
      <div className="flex flex-wrap gap-1">
        {row.actions.map((a) => (
          <button
            key={a}
            className="inline-flex min-h-[28px] items-center rounded border px-2 text-[10.5px] font-semibold transition-colors hover:bg-[var(--overlay)]"
            style={{
              background: 'var(--canvas)',
              borderColor: 'var(--border)',
              color: 'var(--t2)',
            }}
          >
            {a}
          </button>
        ))}
      </div>
    </div>
  );
}

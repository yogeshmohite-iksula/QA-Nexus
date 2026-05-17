// F20 Results table — canonical L914-1066.
// Hard Rule 17: every string from canned-data.ts.

'use client';

import { ChevronDown } from 'lucide-react';
import {
  F20_RESULTS_FILTERS,
  F20_RESULTS_HEAD,
  F20_RESULTS_SUITES,
  type CaseStatusKey,
  type ResultsRow,
} from './canned-data';

const STATUS_STYLE: Record<CaseStatusKey, { bg: string; bd: string; fg: string; label: string }> = {
  pass: {
    bg: 'var(--pass-soft)',
    bd: 'var(--pass-line)',
    fg: 'var(--pass)',
    label: 'Pass',
  },
  fail: {
    bg: 'var(--fail-soft)',
    bd: 'var(--fail-line)',
    fg: 'var(--fail)',
    label: 'Fail',
  },
  flaky: {
    bg: 'var(--warn-soft)',
    bd: 'var(--warn-line)',
    fg: 'var(--warn)',
    label: 'Flaky',
  },
};

export function ResultsTable() {
  return (
    <section
      aria-label={F20_RESULTS_HEAD.tableAriaLabel}
      data-canonical-section="results-block"
      className="flex flex-col border-b"
      style={{ borderColor: 'var(--border)' }}
    >
      {/* rb-head */}
      <header
        className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b px-4 py-3 sm:px-5 lg:px-7"
        style={{ background: 'var(--canvas)', borderColor: 'var(--border)' }}
      >
        <h2
          className="m-0 text-[13px] font-semibold"
          style={{
            color: 'var(--t1)',
            fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
          }}
        >
          {F20_RESULTS_HEAD.title}
        </h2>
        <div
          role="tablist"
          aria-label={F20_RESULTS_HEAD.filtersAriaLabel}
          className="inline-flex items-center gap-0.5 rounded-md border p-0.5"
          style={{ background: 'var(--raised)', borderColor: 'var(--border)' }}
        >
          {F20_RESULTS_FILTERS.map((f) => (
            <button
              key={f.label}
              type="button"
              role="tab"
              aria-selected={f.active ? 'true' : 'false'}
              onClick={() =>
                console.info('pattern-a:deferred:f20:results-filter', { filter: f.label })
              }
              className="inline-flex h-6 items-center px-2 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
              style={{
                borderRadius: '4px',
                background: f.active ? 'var(--overlay)' : 'transparent',
                color: f.active ? 'var(--t1)' : 'var(--t3)',
                fontWeight: f.active ? 600 : 500,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <span className="min-w-2 flex-1" />
        <button
          type="button"
          onClick={() => console.info('pattern-a:deferred:f20:results-sort')}
          className="inline-flex h-7 items-center gap-1 rounded-md border px-2.5 text-[11px] font-medium transition-colors hover:bg-[var(--raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
          style={{
            background: 'var(--canvas)',
            borderColor: 'var(--border)',
            color: 'var(--t2)',
          }}
        >
          {F20_RESULTS_HEAD.sortLabel}
          <ChevronDown size={11} aria-hidden="true" />
        </button>
      </header>

      {/* Suites */}
      <div className="flex flex-col">
        {F20_RESULTS_SUITES.map((suite) => (
          <div key={suite.name} className="flex flex-col">
            {/* rb-suite header */}
            <div
              className="flex items-center gap-2 border-b px-4 py-2 sm:px-5 lg:px-7"
              style={{ background: 'var(--base)', borderColor: 'var(--border)' }}
            >
              <span
                className="text-[10.5px] font-bold uppercase tracking-[0.06em]"
                style={{ color: 'var(--t3)' }}
              >
                {suite.name}
              </span>
            </div>
            {/* rows */}
            {suite.rows.map((row) => (
              <ResultRow key={row.caseId} row={row} />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

function ResultRow({ row }: { row: ResultsRow }) {
  const status = STATUS_STYLE[row.status];
  return (
    <button
      type="button"
      onClick={() => console.info('pattern-a:deferred:f20:select-case', { caseId: row.caseId })}
      className="flex w-full flex-wrap items-center gap-x-2.5 gap-y-1 border-b px-4 py-2.5 text-left transition-colors hover:bg-[var(--raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--secondary)] sm:px-5 md:flex-nowrap lg:px-7"
      style={{ borderColor: 'var(--border)' }}
    >
      <span
        className="inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em]"
        style={{ background: status.bg, borderColor: status.bd, color: status.fg }}
      >
        {status.label}
      </span>
      <span className="font-mono text-[10.5px] font-medium" style={{ color: 'var(--t3)' }}>
        {row.caseId}
      </span>
      <span
        className="order-last w-full min-w-0 basis-full text-[12px] md:order-none md:w-auto md:flex-1 md:basis-auto"
        style={{ color: 'var(--t1)' }}
      >
        {row.title}
      </span>
      <span className="ml-auto inline-flex shrink-0 items-center gap-2 md:contents">
        <span className="font-mono text-[10.5px]" style={{ color: 'var(--t2)' }}>
          {row.duration}
        </span>
        <span
          className="text-[10.5px]"
          style={{ color: row.defectsLabel ? 'var(--fail)' : 'var(--t4)' }}
        >
          {row.defectsLabel ?? '—'}
        </span>
      </span>
    </button>
  );
}

// F21 Toolbar (group-by + sort) — canonical L794-812.
// Hard Rule 17: every string from canned-data.ts.

'use client';

import { ChevronDown } from 'lucide-react';
import { F21_TOOLBAR } from './canned-data';

export function DefectsToolbar() {
  return (
    <div
      role="region"
      aria-label="Group and sort"
      className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b px-4 py-2 sm:px-5 lg:px-7"
      // Day-19 Round-4 bg fix per Yogesh visual gate: top control panel
      // (def-head + filter-strip + toolbar) consistently uses --base.
      style={{ background: 'var(--base)', borderColor: 'var(--border)' }}
    >
      <span
        className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.06em]"
        style={{ color: 'var(--t3)' }}
      >
        {F21_TOOLBAR.groupByLabel}
      </span>
      <div
        className="inline-flex items-center gap-0.5 rounded-md border p-0.5"
        style={{ background: 'var(--raised)', borderColor: 'var(--border)' }}
      >
        {F21_TOOLBAR.groupByOptions.map((opt) => (
          <button
            key={opt.label}
            type="button"
            onClick={() => console.info('pattern-a:deferred:f21:group-by', { groupBy: opt.label })}
            className="inline-flex h-6 items-center px-2 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
            style={{
              borderRadius: '4px',
              background: opt.active ? 'var(--overlay)' : 'transparent',
              color: opt.active ? 'var(--t1)' : 'var(--t3)',
              fontWeight: opt.active ? 600 : 500,
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <span className="text-[11.5px]" style={{ color: 'var(--t3)' }}>
        <b style={{ color: 'var(--t1)' }}>{F21_TOOLBAR.shownCount}</b> shown ·{' '}
        {F21_TOOLBAR.totalCount} total
      </span>
      <div className="min-w-2 flex-1" />
      <button
        type="button"
        onClick={() => console.info('pattern-a:deferred:f21:sort')}
        className="inline-flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-[11.5px] font-medium transition-colors hover:bg-[var(--raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
        style={{ background: 'var(--canvas)', borderColor: 'var(--border)', color: 'var(--t2)' }}
      >
        <span style={{ color: 'var(--t3)' }}>{F21_TOOLBAR.sortLabel}</span>
        <span style={{ color: 'var(--t1)' }}>{F21_TOOLBAR.sortValue}</span>
        <ChevronDown size={11} aria-hidden="true" />
      </button>
    </div>
  );
}

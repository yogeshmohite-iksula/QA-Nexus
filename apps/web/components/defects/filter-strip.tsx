// F21 Filter strip — canonical L758-794.
// Hard Rule 17: every string consumed from canned-data.ts.

'use client';

import { ChevronDown, Search } from 'lucide-react';
import {
  F21_FILTER_SELECTS,
  F21_PRIORITY_CHIPS,
  F21_PRIORITY_LABEL,
  F21_SEARCH_PLACEHOLDER,
  type DefectPriority,
  type PriorityChip,
} from './canned-data';

// Priority dot color map — derived from 01_SYSTEM.md per priority severity.
const PRI_DOT: Record<DefectPriority, string> = {
  p0: 'var(--fail)', // red — ship-blockers
  p1: 'var(--warn)', // amber
  p2: 'var(--info)', // blue
  p3: 'var(--t3)', // tertiary grey
};

export function FilterStrip() {
  return (
    <div
      role="region"
      aria-label="Filters"
      className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b px-4 py-2.5 sm:px-5 lg:px-7"
      // Day-19 Round-5 bg fix per Yogesh: "Priority section bg should be
      // black". --canvas (#0B0F17) is the black; isolates the filter chips/
      // dropdowns as a black band between --base def-head + --base toolbar.
      style={{ background: 'var(--canvas)', borderColor: 'var(--border)' }}
    >
      {/* Priority chip group */}
      <span
        className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.06em]"
        style={{ color: 'var(--t3)' }}
      >
        {F21_PRIORITY_LABEL}
      </span>
      <div className="flex flex-wrap items-center gap-1.5">
        {F21_PRIORITY_CHIPS.map((chip) => (
          <PriorityChipBtn key={chip.priority} chip={chip} />
        ))}
      </div>

      {/* Separator */}
      <div
        aria-hidden="true"
        className="hidden h-5 w-px sm:block"
        style={{ background: 'var(--border)' }}
      />

      {/* Status / Type / Assignee / Sprint selects */}
      <div className="flex flex-wrap items-center gap-1.5">
        {F21_FILTER_SELECTS.map((sel) => (
          <button
            key={sel.label}
            type="button"
            onClick={() =>
              console.info('pattern-a:deferred:f21:filter-select', { label: sel.label })
            }
            className="inline-flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-[11.5px] transition-colors hover:bg-[var(--raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
            style={{
              background: 'var(--canvas)',
              borderColor: 'var(--border)',
              color: 'var(--t2)',
            }}
          >
            <span style={{ color: 'var(--t3)' }}>{sel.label}</span>
            <span style={{ color: 'var(--t1)', fontWeight: 500 }}>{sel.value}</span>
            <ChevronDown size={11} aria-hidden="true" />
          </button>
        ))}
      </div>

      {/* Spacer */}
      <div className="min-w-2 flex-1" />

      {/* Search */}
      <div
        className="inline-flex h-7 min-w-[200px] flex-1 items-center gap-1.5 rounded-md border px-2.5 sm:max-w-[280px]"
        style={{ background: 'var(--canvas)', borderColor: 'var(--border)' }}
      >
        <Search size={12} aria-hidden="true" style={{ color: 'var(--t3)' }} />
        <input
          type="search"
          placeholder={F21_SEARCH_PLACEHOLDER}
          className="flex-1 bg-transparent text-[11.5px] outline-none focus:outline-none"
          style={{ color: 'var(--t1)' }}
          onChange={() => console.info('pattern-a:deferred:f21:search')}
        />
      </div>
    </div>
  );
}

function PriorityChipBtn({ chip }: { chip: PriorityChip }) {
  return (
    <button
      type="button"
      onClick={() =>
        console.info('pattern-a:deferred:f21:priority-toggle', { priority: chip.priority })
      }
      className="inline-flex h-7 items-center gap-1.5 rounded-md border px-2 text-[11.5px] font-semibold transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
      style={{
        background: chip.active ? 'var(--raised)' : 'var(--canvas)',
        borderColor: chip.active ? 'var(--border-strong)' : 'var(--border)',
        color: chip.active ? 'var(--t1)' : 'var(--t3)',
      }}
    >
      <span
        aria-hidden="true"
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ background: PRI_DOT[chip.priority] }}
      />
      <span>{chip.label}</span>
      <span
        className="font-mono text-[10.5px] font-bold"
        style={{ color: 'var(--t4)', marginLeft: 1 }}
      >
        {chip.count}
      </span>
    </button>
  );
}

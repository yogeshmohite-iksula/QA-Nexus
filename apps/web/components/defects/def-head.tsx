// F21 Def-head region — canonical L729-757.
// Hard Rule 17: every string consumed from canned-data.ts.
//
// Day-19 Step 4 addition: Day-18 F21 components missed this region
// entirely; diff-probe.mjs Finding B surfaced the gap. Wires in
// between AdminShell and FilterStrip per spec.json section tree
// (div.def-head role=region "Defects header").

'use client';

import { Download, ListChecks, Plus, ChevronDown } from 'lucide-react';
import { F21_DEF_HEAD, type DefHeadStat } from './canned-data';

const STAT_COLOR: Record<DefHeadStat['variant'], string> = {
  default: 'var(--t1)',
  p0: 'var(--fail)',
  p1: 'var(--warn)',
  stale: 'var(--warn)',
  rca: 'var(--ai-accent)',
  fix: 'var(--pass)',
};

export function DefHead() {
  return (
    <div
      role="region"
      aria-label={F21_DEF_HEAD.ariaLabel}
      className="flex flex-col gap-y-2 border-b px-4 py-3 sm:px-5 md:flex-row md:flex-wrap md:items-center md:gap-x-3 lg:px-7"
      // Day-19 Round-3 bg fix: canonical .def-head L239 defines no background
      // (inherits canvas). Was --base (too light/wrong shade vs canonical).
      style={{ borderColor: 'var(--border)' }}
    >
      {/* dh-left: title + stats line */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <h1
          className="m-0 text-[16px] font-semibold leading-[22px]"
          style={{ color: 'var(--t1)', fontFamily: 'var(--font-dm-sans), system-ui, sans-serif' }}
        >
          {F21_DEF_HEAD.title}
        </h1>
        <div
          className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] uppercase leading-[18px] tracking-[0.04em]"
          style={{ color: 'var(--t3)' }}
        >
          {F21_DEF_HEAD.stats.map((stat, i) => (
            <span key={stat.label} className="inline-flex items-center gap-1.5 whitespace-nowrap">
              {i > 0 && <span style={{ color: 'var(--border-strong)' }}>·</span>}
              <span className="whitespace-nowrap">
                <b style={{ color: STAT_COLOR[stat.variant], fontWeight: 600 }}>{stat.count}</b>{' '}
                {stat.label}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* dh-right: 3 buttons (Bulk, Export, New defect) — wraps below dh-left on mobile */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          aria-label={F21_DEF_HEAD.rightActions[0].ariaLabel}
          onClick={() => console.info('pattern-a:deferred:f21:bulk-actions')}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-[11.5px] font-medium transition-colors hover:bg-[var(--raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
          style={{ background: 'var(--canvas)', borderColor: 'var(--border)', color: 'var(--t2)' }}
        >
          <ListChecks size={11} aria-hidden="true" />
          {F21_DEF_HEAD.rightActions[0].label}
          <ChevronDown size={11} aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label={F21_DEF_HEAD.rightActions[1].ariaLabel}
          onClick={() => console.info('pattern-a:deferred:f21:export')}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-[11.5px] font-medium transition-colors hover:bg-[var(--raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
          style={{ background: 'var(--canvas)', borderColor: 'var(--border)', color: 'var(--t2)' }}
        >
          <Download size={11} aria-hidden="true" />
          {F21_DEF_HEAD.rightActions[1].label}
        </button>
        <button
          type="button"
          aria-label={F21_DEF_HEAD.rightActions[2].ariaLabel}
          onClick={() => console.info('pattern-a:deferred:f21:new-defect')}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-[11.5px] font-semibold transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
          style={{
            background: 'var(--primary)',
            borderColor: 'var(--primary-line)',
            color: 'var(--primary-ink)',
          }}
        >
          <Plus size={11} aria-hidden="true" strokeWidth={2.2} />
          {F21_DEF_HEAD.rightActions[2].label}
        </button>
      </div>
    </div>
  );
}

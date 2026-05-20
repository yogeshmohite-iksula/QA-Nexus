// Implements F22 Curator · Similar defects detected section.
// Canonical: PM1_UI_v2/Redesign Frame by claude design/F22 Defect Detail v2.html L847-887.
// Strings trace to canned-data.ts (Hard Rule 17).

import { SlidersHorizontal } from 'lucide-react';
import { AgentName } from './agents/AgentName';
import type { SimilarDefect } from './types';

const PILL_TONE = {
  closed: { bg: 'var(--pass-soft)', border: 'var(--pass-line)', fg: 'var(--pass)' },
  'in-qa': { bg: 'var(--warn-soft)', border: 'var(--warn-line)', fg: 'var(--warn)' },
  open: { bg: 'var(--info-soft)', border: 'var(--info-line)', fg: 'var(--info)' },
};

export function CuratorSimilarDefects({ defects }: { defects: SimilarDefect[] }) {
  return (
    <section
      role="region"
      aria-label="Curator similar defects detected"
      data-canonical-section="section-curator"
      className="relative space-y-3 rounded-[10px] border border-[color:var(--ai-line)] p-4 md:p-[16px] md:pl-[22px]"
      style={{ background: 'color-mix(in srgb, var(--secondary) 4%, transparent)' }}
    >
      <span
        className="absolute bottom-0 left-0 top-0 w-[3px] rounded-l-[3px]"
        style={{ background: 'var(--secondary)' }}
        aria-hidden="true"
      />
      <header data-canonical-section="sec-head" className="flex flex-wrap items-center gap-2">
        <h2 className="font-display text-[15px] font-bold text-[color:var(--t1)]">
          <AgentName code="curator" /> · Similar defects detected
        </h2>
        <span className="text-[11.5px] text-[color:var(--t3)]">
          semantic similarity · last 90 days
        </span>
        <button
          type="button"
          className="ml-auto inline-flex h-7 items-center gap-1.5 rounded-md border border-[color:var(--border)] bg-transparent px-2.5 text-[11.5px] text-[color:var(--t2)] hover:border-[color:var(--border-strong)] hover:text-[color:var(--t1)]"
        >
          Tune threshold
          <SlidersHorizontal className="h-3 w-3" aria-hidden="true" />
        </button>
      </header>

      <div data-canonical-section="cur-list" className="flex flex-col gap-2">
        {defects.map((d) => {
          const tone = PILL_TONE[d.statusPill.tone];
          // Canonical .cur-row: mobile 2-col (auto 1fr), desktop 5-col (auto auto auto 1fr auto)
          // text truncates with ellipsis at md+; acts justify-end no-wrap at md+
          return (
            <div
              key={d.id}
              data-canonical-section="cur-row"
              className="grid grid-cols-[auto_1fr] items-center gap-x-2.5 gap-y-2 rounded-md border border-[color:var(--border)] bg-[color:var(--base)] px-3 py-2.5 md:grid-cols-[auto_auto_auto_minmax(0,1fr)_auto]"
            >
              <span
                className="inline-flex h-[22px] items-center rounded border border-[color:var(--ai-line)] bg-[color:var(--ai-soft)] px-[7px] font-mono text-[11px] font-semibold text-[color:var(--secondary)]"
                style={{ opacity: d.similarity >= 92 ? 1 : d.similarity >= 79 ? 0.85 : 0.7 }}
              >
                {d.similarity}%
              </span>
              <span className="font-mono text-[11.5px] text-[color:var(--t2)]">{d.id}</span>
              <span
                className="inline-flex h-[22px] items-center gap-1 rounded-sm border px-2 font-mono text-[10.5px] font-semibold"
                style={{ background: tone.bg, borderColor: tone.border, color: tone.fg }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: tone.fg }}
                  aria-hidden="true"
                />
                {d.statusPill.label}
              </span>
              <span className="col-span-2 text-[12.5px] leading-[18px] text-[color:var(--t1)] md:col-span-1 md:min-w-0 md:overflow-hidden md:text-ellipsis md:whitespace-nowrap">
                {d.title}
              </span>
              <div className="col-span-2 flex flex-wrap gap-1.5 md:col-span-1 md:flex-nowrap md:justify-end">
                {d.actions.map((a) => (
                  <button
                    key={a.label}
                    type="button"
                    className={`inline-flex h-7 items-center rounded-md px-2.5 text-[11.5px] font-medium ${
                      a.primary
                        ? 'border border-[color:var(--ai-line)] bg-transparent text-[color:var(--secondary)] hover:bg-[color:var(--ai-soft)]'
                        : 'border border-[color:var(--border)] bg-transparent text-[color:var(--t2)] hover:border-[color:var(--border-strong)] hover:text-[color:var(--t1)]'
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

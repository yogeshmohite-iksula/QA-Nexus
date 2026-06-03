// Implements F22 title-row + tr-meta + tr-actions + meta-row.
// Canonical: PM1_UI_v2/Redesign Frame by claude design/F22 Defect Detail v2.html L561-590.
// All strings trace to canned-data.ts (Hard Rule 17).
//
// Yogesh visual-gate deviations from canonical (Rule 13 authority):
//  - Actions FLOAT top-right (sm+) instead of canonical `.title-block flex:1`,
//    so the title + description use the FULL width and flow UNDER the action
//    cluster (canonical confines them to the left column — dead space remained).
//  - All five action items share ONE height (24px) for a uniform row — canonical
//    differentiates chip 24px vs btn 32px; Yogesh wants Edit/More == the chips.
//  - WCAG 2.5.5 tap floor preserved on the real buttons via pointer-coarse → 44px.
// On mobile (<sm) the actions stack full-width at the top (no float); the title
// + description flow full-width below (BUG-005: no horizontal scroll @320px).

import { ExternalLink, MoreHorizontal, Pencil } from 'lucide-react';
import type { Defect } from './types';

function Avatar({ initials, bg }: { initials: string; bg: string }) {
  return (
    <span
      className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-semibold text-[color:var(--canvas)]"
      style={{ background: bg }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

export function DefectHeader({ defect }: { defect: Defect }) {
  return (
    <header data-canonical-section="defect-header">
      <div data-canonical-section="title-row">
        {/* Action cluster — floats top-right at sm+ so the title/description wrap
            under it; full-width block on mobile. All five boxes are 24px tall. */}
        <div
          data-canonical-section="tr-actions"
          role="toolbar"
          aria-label="Defect actions"
          className="mb-3 flex flex-wrap items-center gap-1.5 sm:float-right sm:mb-1 sm:ml-4"
        >
          <span className="inline-flex h-6 items-center gap-1.5 rounded-[5px] border border-[color:var(--fail-line)] bg-[color:var(--fail-soft)] px-2 text-[11px] font-medium text-[color:var(--fail)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--fail)]" aria-hidden="true" />
            {defect.severity}
          </span>
          <span className="inline-flex h-6 items-center gap-1.5 rounded-[5px] border border-[color:var(--warn-line)] bg-[color:var(--warn-soft)] px-2 text-[11px] font-medium text-[color:var(--warn)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--warn)]" aria-hidden="true" />
            {defect.status}
          </span>
          <a
            href={`https://iksula.atlassian.net/browse/${defect.jiraKey}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-6 items-center gap-1.5 rounded-[5px] border border-[color:var(--info-line)] bg-[color:var(--info-soft)] px-2 text-[11px] font-medium text-[color:var(--info)] hover:underline"
          >
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
            Jira <b className="ml-0.5 font-semibold text-[color:var(--t1)]">{defect.jiraKey}</b>
          </a>
          {/* Edit + More share the exact box — 24px tall, 1px border, radius 5px,
              transparent bg; only the border colour differs (Edit violet, More grey). */}
          <button
            type="button"
            className="pointer-coarse:h-auto pointer-coarse:min-h-11 pointer-coarse:py-2 inline-flex h-6 items-center gap-1.5 rounded-[5px] border border-[color:var(--ai-line)] bg-transparent px-2 text-[11px] font-medium text-[color:var(--secondary)] hover:bg-[color:var(--ai-soft)]"
          >
            <Pencil className="h-3 w-3" aria-hidden="true" />
            Edit
          </button>
          <button
            type="button"
            aria-label="More actions"
            className="pointer-coarse:h-11 pointer-coarse:w-11 inline-flex h-6 w-6 items-center justify-center rounded-[5px] border border-[color:var(--border)] bg-transparent text-[color:var(--t2)] hover:bg-[color:var(--raised)] hover:text-[color:var(--t1)]"
          >
            <MoreHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>

        {/* Title-block — plain block (NOT a BFC) so its text wraps left of, then
            UNDER, the floated actions. Uses full container width. */}
        <div data-canonical-section="title-block">
          <div
            data-canonical-section="tr-meta"
            className="flex flex-wrap items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-[color:var(--t3)]"
          >
            <span className="text-[13px] text-[color:var(--t1)]">{defect.id}</span>
            <span className="text-[color:var(--t4)]">·</span>
            <span>
              filed {defect.filed} · age {defect.age}
            </span>
          </div>
          <h1 className="font-display mt-1.5 text-pretty text-[18px] font-semibold leading-[24px] tracking-[-0.01em] text-[color:var(--t1)] md:text-[22px] md:leading-[28px]">
            {defect.title}
          </h1>
          <p className="mt-2 text-pretty text-[13px] leading-[20px] text-[color:var(--t2)]">
            {defect.description.split('PROCESSING').map((part, i, arr) =>
              i < arr.length - 1 ? (
                <span key={i}>
                  {part}
                  <span className="font-mono text-[color:var(--t1)]">PROCESSING</span>
                </span>
              ) : (
                <span key={i}>{part}</span>
              ),
            )}
          </p>
        </div>
      </div>

      {/* meta-row — Assigned / Reported / From run / Test case. clear-both drops
          it below the float (canonical mt:14px). */}
      <div
        data-canonical-section="meta-row"
        className="mt-3.5 flex flex-wrap items-center gap-x-3 gap-y-2 text-[12.5px] text-[color:var(--t2)] [clear:both]"
      >
        <span className="inline-flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[color:var(--t3)]">
            Assigned to
          </span>
          <Avatar initials={defect.assignee.initials} bg="#FBBF24" />
          <b className="font-semibold text-[color:var(--t1)]">{defect.assignee.name}</b>
        </span>
        <span className="text-[color:var(--t4)]">·</span>
        <span className="inline-flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[color:var(--t3)]">
            Reported by
          </span>
          <Avatar initials={defect.reporter.initials} bg="#60A5FA" />
          <b className="font-semibold text-[color:var(--t1)]">{defect.reporter.name}</b>
        </span>
        <span className="text-[color:var(--t4)]">·</span>
        <span className="inline-flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[color:var(--t3)]">
            From run
          </span>
          <a href="#" className="font-mono text-[12px] text-[color:var(--info)] hover:underline">
            {defect.sourceRun}
          </a>
        </span>
        <span className="text-[color:var(--t4)]">·</span>
        <span className="inline-flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[color:var(--t3)]">
            Test case
          </span>
          <a href="#" className="font-mono text-[12px] text-[color:var(--info)] hover:underline">
            {defect.testCase}
          </a>
        </span>
      </div>
    </header>
  );
}

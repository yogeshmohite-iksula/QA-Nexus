// Implements F22 title-row + tr-meta + tr-actions + meta-row.
// Canonical: PM1_UI_v2/Redesign Frame by claude design/F22 Defect Detail v2.html L567-593.
// All strings trace to canned-data.ts (Hard Rule 17).

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
    // Vertical stack: tr-meta+actions row | title | description | meta-row.
    // Title is its OWN full-width row — never shares a column with actions.
    <header data-canonical-section="title-row" className="flex flex-col gap-6">
      {/* Row 1: ID + filed/age on LEFT; pills + Edit/More on RIGHT. */}
      <div
        data-canonical-section="tr-meta-row"
        className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3"
      >
        <div
          data-canonical-section="tr-meta"
          className="flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-[color:var(--t3)]"
        >
          <span className="text-[color:var(--t1)]">{defect.id}</span>
          <span className="text-[color:var(--t4)]">·</span>
          <span>
            filed {defect.filed} · age {defect.age}
          </span>
        </div>

        <div
          data-canonical-section="tr-actions"
          role="toolbar"
          aria-label="Defect actions"
          className="flex shrink-0 flex-wrap items-center gap-2"
        >
          <span className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--fail-line)] bg-[color:var(--fail-soft)] px-2 py-1 text-[11px] font-semibold text-[color:var(--fail)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--fail)]" aria-hidden="true" />
            {defect.severity}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--warn-line)] bg-[color:var(--warn-soft)] px-2 py-1 text-[11px] font-semibold text-[color:var(--warn)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--warn)]" aria-hidden="true" />
            {defect.status}
          </span>
          <a
            href={`https://iksula.atlassian.net/browse/${defect.jiraKey}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--info-line)] bg-[color:var(--info-soft)] px-2 py-1 text-[11px] font-semibold text-[color:var(--info)] hover:underline"
          >
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
            Jira <b className="ml-0.5 font-semibold text-[color:var(--t1)]">{defect.jiraKey}</b>
          </a>
          <button
            type="button"
            className="inline-flex h-11 items-center gap-1.5 rounded-md border border-[color:var(--ai-line)] bg-[color:var(--ai-soft)] px-3 text-[12px] font-medium text-[color:var(--secondary)] hover:bg-[color:var(--secondary-soft)]"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            Edit
          </button>
          <button
            type="button"
            aria-label="More actions"
            className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-[color:var(--border)] bg-[color:var(--raised)] text-[color:var(--t2)] hover:text-[color:var(--t1)]"
          >
            <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Row 2: full-width title — never shares a column with actions. */}
      <div data-canonical-section="title-block" className="space-y-3">
        <h1 className="font-display text-balance text-[22px] font-bold leading-[1.3] tracking-tight text-[color:var(--t1)] md:text-[26px]">
          {defect.title}
        </h1>
        <p className="text-pretty text-[14px] leading-[1.55] text-[color:var(--t2)]">
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

      {/* Row 3: meta-row — Assigned / Reported / From run / Test case */}
      <div
        data-canonical-section="meta-row"
        className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[12.5px] text-[color:var(--t2)]"
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

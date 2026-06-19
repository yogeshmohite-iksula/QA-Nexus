// ComingSoon — shared "deferred surface" affordance (Fri WIRE sweep, 2026-06-19).
//
// Replaces canned fixture cards whose backing endpoint does not exist yet
// (release-risk, AI-narrative, pinned-refs, suggested-next on /home;
// reports/F23, executive/F25, agents-activity/F26 elsewhere).
//
// Design: keep the surface visible in nav + the page (Yogesh's "don't HIDE"
// rule). Greyed, NOT hidden; reads as "the slot exists, the data does not yet".
// Tokens only — `--t3` text, `--overlay` bg, `--border` border, `--canvas`
// inset. Reduced opacity + cursor-not-allowed signals non-interactive.
//
// Hard Rule 4 (token whitelist): no new hex; every color is an existing CSS
// variable from globals.css.
// Hard Rule 12 (RWD): mobile-first padding scales; 44px+ tap-target inert.
// Hard Rule 17: hint is generic; no fabricated counts or fake names.

'use client';

import type { ReactNode } from 'react';

interface ComingSoonProps {
  /** Section title (matches what the canned card showed). */
  label: string;
  /** Short subtitle — defaults to "Coming in next release". */
  hint?: string;
  /** Optional icon glyph (already-rendered SVG element). */
  icon?: ReactNode;
  /** Visual density: 'card' = full block (default) · 'inline' = list-row. */
  variant?: 'card' | 'inline';
  className?: string;
}

const DEFAULT_HINT = 'Coming in next release';

export function ComingSoon({
  label,
  hint = DEFAULT_HINT,
  icon,
  variant = 'card',
  className = '',
}: ComingSoonProps) {
  if (variant === 'inline') {
    return (
      <div
        aria-disabled="true"
        role="note"
        className={[
          'flex items-center gap-2 rounded-md border px-3 py-2 text-[12.5px]',
          'border-[var(--border)] bg-[var(--overlay)] text-[var(--t3)]',
          'cursor-not-allowed select-none opacity-70',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {icon ? <span aria-hidden="true">{icon}</span> : null}
        <span className="font-medium">{label}</span>
        <span className="font-mono text-[11px]">· {hint}</span>
      </div>
    );
  }
  return (
    <section
      aria-disabled="true"
      aria-label={`${label} — ${hint}`}
      className={[
        'relative flex min-h-[88px] flex-col gap-1 rounded-xl border p-4 sm:p-5',
        'border-[var(--border)] bg-[var(--overlay)] text-[var(--t3)]',
        'cursor-not-allowed select-none opacity-70',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <header className="flex items-center justify-between gap-3">
        <h3
          className={[
            'font-mono text-[11px] font-semibold uppercase tracking-[0.12em]',
            'text-[var(--t3)]',
          ].join(' ')}
        >
          {label}
        </h3>
        <span
          className={[
            'inline-flex items-center gap-1 rounded-md border px-2 py-0.5',
            'border-[var(--border-strong)] bg-[var(--canvas)] font-mono text-[10px] uppercase tracking-[0.06em]',
            'text-[var(--t4)]',
          ].join(' ')}
        >
          Soon
        </span>
      </header>
      <p className="text-[13px] leading-relaxed text-[var(--t3)]">{hint}</p>
    </section>
  );
}

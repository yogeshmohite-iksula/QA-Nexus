// EmptyState — guides the user when a surface has genuinely zero data.
//
// Source: Sun 2026-06-07 Phase 4 Section P. UX pattern per UserOnboard /
// Smashing Magazine — empty states GUIDE, not just inform: icon + title +
// description + a single primary CTA that tells the user the next action.
//
// All colors via canonical tokens (Hard Rule 4 — no hardcoded hex). Heading
// in DM Sans (var(--font-display) via h-tag), body in Inter, per handoff §1.

'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  /** Icon / illustration (e.g. a lucide icon at size 40-48). Rendered in
   *  a tinted circle chip. */
  icon: ReactNode;
  /** Short headline — "No requirements yet". */
  title: string;
  /** One or two sentences telling the user what this surface will hold and
   *  how to populate it. */
  description: string;
  /** Optional CTA label — "Add requirement". Omit for read-only surfaces. */
  ctaLabel?: string;
  /** Route the CTA links to. Used when onCtaClick is not provided. */
  ctaHref?: string;
  /** Click handler — takes precedence over ctaHref (e.g. open a modal). */
  onCtaClick?: () => void;
  /** Tone of the icon chip — defaults to neutral. */
  tone?: 'primary' | 'secondary' | 'info' | 'neutral';
  /** Compact mode — smaller vertical padding for in-card empty states
   *  (e.g. an empty section inside a populated page). Default false (full
   *  page-level breathing room). */
  compact?: boolean;
}

const TONE_CHIP: Record<NonNullable<EmptyStateProps['tone']>, { bg: string; fg: string }> = {
  primary: { bg: 'var(--primary-soft)', fg: 'var(--primary)' },
  secondary: { bg: 'var(--ai-soft)', fg: 'var(--secondary)' },
  info: { bg: 'var(--info-soft)', fg: 'var(--info)' },
  neutral: { bg: 'var(--raised)', fg: 'var(--text-tertiary)' },
};

export function EmptyState({
  icon,
  title,
  description,
  ctaLabel,
  ctaHref,
  onCtaClick,
  tone = 'neutral',
  compact = false,
}: EmptyStateProps) {
  const chip = TONE_CHIP[tone];
  const hasCta = Boolean(ctaLabel && (ctaHref || onCtaClick));

  return (
    <div
      className={
        'flex flex-col items-center justify-center text-center ' +
        (compact ? 'gap-3 px-6 py-10' : 'gap-4 px-6 py-20')
      }
      role="status"
    >
      <span
        aria-hidden="true"
        className="inline-flex items-center justify-center"
        style={{
          width: compact ? 48 : 72,
          height: compact ? 48 : 72,
          borderRadius: 'var(--radius-lg)',
          background: chip.bg,
          color: chip.fg,
        }}
      >
        {icon}
      </span>

      <h2
        className="font-display font-semibold text-[var(--text-primary)]"
        style={{ fontSize: compact ? 16 : 22, letterSpacing: '-0.01em' }}
      >
        {title}
      </h2>

      <p
        className="text-[var(--text-tertiary)]"
        style={{ fontSize: compact ? 13 : 15, lineHeight: 1.5, maxWidth: 460 }}
      >
        {description}
      </p>

      {hasCta &&
        (onCtaClick ? (
          <button
            type="button"
            onClick={onCtaClick}
            className="mt-1 inline-flex h-9 items-center gap-2 px-4 text-[13px] font-semibold text-[var(--primary-ink)] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
            style={{ background: 'var(--primary)', borderRadius: 'var(--radius-sm)' }}
          >
            {ctaLabel}
          </button>
        ) : (
          <Link
            href={ctaHref!}
            className="mt-1 inline-flex h-9 items-center gap-2 px-4 text-[13px] font-semibold text-[var(--primary-ink)] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
            style={{ background: 'var(--primary)', borderRadius: 'var(--radius-sm)' }}
          >
            {ctaLabel}
          </Link>
        ))}
    </div>
  );
}

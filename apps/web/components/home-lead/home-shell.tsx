// Top-bar shell for F08b Home (QA Lead) + page chrome.
// Lead variant: same 8-slot pattern as F08a + violet QA LEAD chip on the
// avatar pill (vs F08a's QA Engineer with no role chip).

'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useCurrentUser } from '@/lib/contexts/CurrentUserContext';
import { useActiveProject } from '@/lib/contexts/ProjectContext';

// View-specific stub — branch metadata isn't on the Project entity yet.
const ACTIVE_BRANCH = 'main';

function shortName(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[1][0]}.`;
}

function initialsOf(displayName: string): string {
  return displayName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function HomeShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--canvas)] text-[var(--text-primary)]">
      <TopBar />
      {children}
    </div>
  );
}

function TopBar() {
  const me = useCurrentUser();
  const project = useActiveProject();
  const meName = shortName(me.displayName);
  const meInitials = initialsOf(me.displayName);
  const meRole = me.organizationalLabel;
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-[var(--border-subtle)] bg-[var(--canvas)] px-3 sm:gap-4 sm:px-6">
      <Link
        href="/"
        className="flex shrink-0 items-center gap-2.5 focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
        aria-label="QA Nexus home"
      >
        <span
          aria-hidden="true"
          className="font-display inline-flex h-7 w-7 items-center justify-center rounded-md text-[14px] font-bold text-[var(--primary-ink)]"
          style={{ background: 'linear-gradient(135deg, #2DD4BF 0%, #A78BFA 120%)' }}
        >
          Q
        </span>
        <span className="font-display text-[15px] font-bold tracking-[-0.01em] text-[var(--text-primary)]">
          QA Nexus
        </span>
      </Link>

      <button
        type="button"
        aria-label="Switch project"
        className="hidden shrink-0 items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--raised)] py-1.5 pl-1.5 pr-3 text-[13px] text-[var(--text-primary)] transition-colors hover:border-[var(--border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] sm:inline-flex"
      >
        <span
          aria-hidden="true"
          className="inline-block h-5 w-5 rounded-md"
          style={{ background: 'linear-gradient(135deg, #2DD4BF 0%, #A78BFA 120%)' }}
        />
        <span className="font-medium">{project.name}</span>
        <span aria-hidden="true" className="text-[var(--text-tertiary)]">
          ·
        </span>
        <span className="font-mono text-[12px] text-[var(--text-tertiary)]">{ACTIVE_BRANCH}</span>
        <ChevronDownIcon />
      </button>

      <div className="hidden flex-1 items-center justify-center md:flex">
        <div className="flex w-full max-w-[520px] items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--raised)] px-4 py-2 text-[13px] text-[var(--text-tertiary)]">
          <SearchIcon />
          <span className="flex-1 truncate">Search cases, defects, runs, docs, agents…</span>
          <kbd className="rounded border border-[var(--border-subtle)] bg-[var(--overlay)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-tertiary)]">
            ⌘K
          </kbd>
        </div>
      </div>

      <div className="flex flex-1 md:flex-none" />

      <div
        role="tablist"
        aria-label="Mode"
        className="hidden shrink-0 items-center rounded-full border border-[var(--border-subtle)] bg-[var(--raised)] p-0.5 lg:inline-flex"
      >
        <ModeTab active>Operate</ModeTab>
        <ModeTab>Review</ModeTab>
        <ModeTab>Prove</ModeTab>
      </div>

      {/* Avatar pill with QA LEAD violet chip */}
      <button
        type="button"
        aria-label={`Signed in as ${meName}, ${meRole}`}
        className="flex shrink-0 items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--raised)] py-1.5 pl-1.5 pr-3 transition-colors hover:border-[var(--border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
      >
        <span
          aria-hidden="true"
          className="inline-flex h-6 w-6 items-center justify-center rounded-full font-mono text-[10px] font-bold text-[var(--primary-ink)]"
          style={{ background: 'linear-gradient(135deg, #2DD4BF 0%, #A78BFA 120%)' }}
        >
          {meInitials}
        </span>
        <span className="hidden text-[13px] font-medium text-[var(--text-primary)] sm:inline">
          {meName}
        </span>
        <span className="border-[var(--secondary)]/30 bg-[var(--secondary)]/15 hidden rounded border px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--secondary)] sm:inline">
          {meRole}
        </span>
        <ChevronDownIcon />
      </button>
    </header>
  );
}

function ModeTab({ children, active }: { children: ReactNode; active?: boolean }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active ? 'true' : 'false'}
      className={[
        'inline-flex items-center gap-1 rounded-full px-3 py-1 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]',
        active
          ? 'bg-[var(--primary)] text-[var(--primary-ink)]'
          : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function ChevronDownIcon() {
  return (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="m6 9 6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.6" />
      <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

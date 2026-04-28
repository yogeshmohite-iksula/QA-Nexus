// Top-bar shell for F08a Home (QA Engineer).
//
// The locked frame's 9-slot top bar (logo · project switcher · search · plus ·
// bell · theme · mode toggle · avatar) is collapsed for v1: project switcher
// + search + mode toggle + avatar are kept; the others (plus / bell / theme)
// land in subsequent batches. Mobile collapses to logo + project chip + avatar.

'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { ACTIVE_PROJECT, SIGNED_IN_USER } from './data';

export function HomeShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--canvas)] text-[var(--text-primary)]">
      <TopBar />
      {children}
    </div>
  );
}

function TopBar() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-[var(--border-subtle)] bg-[var(--canvas)] px-3 sm:gap-4 sm:px-6">
      {/* Brand mark */}
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

      {/* Project switcher */}
      <button
        type="button"
        aria-label="Switch project (deferred)"
        className="hidden shrink-0 items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--raised)] py-1.5 pl-1.5 pr-3 text-[13px] text-[var(--text-primary)] transition-colors hover:border-[var(--border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] sm:inline-flex"
      >
        <span
          aria-hidden="true"
          className="inline-block h-5 w-5 rounded-md"
          style={{ background: 'linear-gradient(135deg, #2DD4BF 0%, #A78BFA 120%)' }}
        />
        <span className="font-medium">{ACTIVE_PROJECT.name}</span>
        <span aria-hidden="true" className="text-[var(--text-tertiary)]">
          ·
        </span>
        <span className="font-mono text-[12px] text-[var(--text-tertiary)]">
          {ACTIVE_PROJECT.branch}
        </span>
        <ChevronDownIcon />
      </button>

      {/* Search */}
      <div className="hidden flex-1 items-center justify-center md:flex">
        <div className="flex w-full max-w-[520px] items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--raised)] px-4 py-2 text-[13px] text-[var(--text-tertiary)]">
          <SearchIcon />
          <span className="flex-1 truncate">Search cases, defects, runs, docs…</span>
          <kbd className="rounded border border-[var(--border-subtle)] bg-[var(--overlay)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-tertiary)]">
            ⌘K
          </kbd>
        </div>
      </div>

      <div className="flex flex-1 md:flex-none" />

      {/* Mode toggle (Operate / Review / Prove) */}
      <div
        role="tablist"
        aria-label="Mode"
        className="hidden shrink-0 items-center rounded-full border border-[var(--border-subtle)] bg-[var(--raised)] p-0.5 lg:inline-flex"
      >
        <ModeTab active>Operate</ModeTab>
        <ModeTab>Review</ModeTab>
        <ModeTab disabled>
          <LockIcon /> Prove
        </ModeTab>
      </div>

      {/* Avatar */}
      <button
        type="button"
        aria-label={`Signed in as ${SIGNED_IN_USER.name}`}
        className="flex shrink-0 items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--raised)] py-1.5 pl-1.5 pr-3 transition-colors hover:border-[var(--border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
      >
        <span
          aria-hidden="true"
          className="inline-flex h-6 w-6 items-center justify-center rounded-full font-mono text-[10px] font-bold text-[var(--primary-ink)]"
          style={{ background: 'linear-gradient(135deg, #2DD4BF 0%, #A78BFA 120%)' }}
        >
          {SIGNED_IN_USER.initials}
        </span>
        <span className="hidden text-[13px] font-medium text-[var(--text-primary)] sm:inline">
          {SIGNED_IN_USER.name}
        </span>
        <ChevronDownIcon />
      </button>
    </header>
  );
}

function ModeTab({
  children,
  active,
  disabled,
}: {
  children: ReactNode;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active ? 'true' : 'false'}
      disabled={disabled}
      className={[
        'inline-flex items-center gap-1 rounded-full px-3 py-1 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] disabled:opacity-50',
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

function LockIcon() {
  return (
    <svg width={10} height={10} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M8 11V8a4 4 0 0 1 8 0v3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

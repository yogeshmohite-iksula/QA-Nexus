// F07 onboarding shell: minimal top bar + main canvas + footer help.
// Mirrors the locked HTML header (56 px), main padding pattern, and bottom
// help link, translated to a fluid mobile-first layout.

'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

export function WizardShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--canvas)] text-[var(--text-primary)]">
      <TopBar />
      <main className="flex flex-1 flex-col items-center px-4 pb-24 pt-8 sm:px-6 sm:pt-12 lg:px-8 lg:pt-14">
        {children}
      </main>
      <FooterHelp />
    </div>
  );
}

function TopBar() {
  return (
    <header className="flex h-14 items-center border-b border-[var(--border-subtle)] bg-[var(--base)] px-4 sm:px-6">
      <Link
        href="/"
        className="flex shrink-0 items-center gap-2.5 focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
        aria-label="QA Nexus home"
      >
        <BeakerIcon />
        <span className="font-display text-[18px] font-bold text-[var(--primary)] sm:text-[20px]">
          QA Nexus
        </span>
      </Link>
      <div className="hidden flex-1 justify-center md:flex">
        <span className="text-[13px] text-[var(--text-tertiary)]">Setting up your workspace</span>
      </div>
      <div className="ml-auto flex items-center gap-3 sm:gap-4">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center text-[13px] text-[var(--text-tertiary)] hover:text-[var(--primary)] hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
        >
          Skip setup
        </Link>
        <span
          aria-label="Your avatar (Yogesh Mohite)"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-mono text-[12px] font-semibold text-[var(--primary-ink)] sm:h-8 sm:w-8"
          style={{ background: 'linear-gradient(135deg, #2DD4BF, #A78BFA)' }}
        >
          YM
        </span>
      </div>
    </header>
  );
}

function FooterHelp() {
  return (
    <footer className="flex h-12 items-center justify-center border-t border-[var(--border-subtle)] px-4">
      <span className="text-center text-[13px] text-[var(--text-tertiary)]">
        Need help setting up?{' '}
        <Link
          href="/help/onboarding"
          className="text-[var(--primary)] hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
        >
          Read the onboarding guide →
        </Link>
      </span>
    </footer>
  );
}

function BeakerIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true">
      <path
        d="M9 2.5h6M10.2 2.5v4.6L5.2 16.6a2.2 2.2 0 0 0 2 3.2h9.6a2.2 2.2 0 0 0 2-3.2L13.8 7.1V2.5"
        stroke="#2DD4BF"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10.6" cy="14.4" r="1" fill="#2DD4BF" />
      <circle cx="14.3" cy="16.8" r="0.8" fill="#2DD4BF" />
      <circle cx="12" cy="12" r="0.7" fill="#2DD4BF" />
    </svg>
  );
}

// Minimal top-bar shell for F11 Source Connect Jira (all 3 steps).
// Differs from the F09 shell — no left rail, no project switcher, just
// brand mark + breadcrumb + exit + signed-in avatar. Locked source does
// NOT include the workspace nav here because the user is mid-setup.

'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

interface ConnectJiraShellProps {
  projectName: string; // TODO: replace with useCurrentProject() once seed-centralization (Day-4 P1 followup i) lands
  projectSlug: string;
  userInitials: string; // TODO: replace with useCurrentUser() once seed-centralization (Day-4 P1 followup i) lands
  children: ReactNode;
}

export function ConnectJiraShell({
  projectName,
  projectSlug,
  userInitials,
  children,
}: ConnectJiraShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--canvas)] text-[var(--text-primary)]">
      <TopBar projectName={projectName} projectSlug={projectSlug} userInitials={userInitials} />
      <div className="flex-1">{children}</div>
      <HelpFooter />
    </div>
  );
}

function TopBar({
  projectName,
  projectSlug,
  userInitials,
}: {
  projectName: string;
  projectSlug: string;
  userInitials: string;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-[var(--border-subtle)] bg-[var(--canvas)] px-3 sm:px-5">
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
        <span className="font-display hidden text-[15px] font-bold tracking-[-0.01em] text-[var(--text-primary)] sm:inline">
          QA Nexus
        </span>
      </Link>

      <div className="flex min-w-0 flex-1 items-center justify-center gap-2 text-[12px] text-[var(--text-tertiary)] sm:text-[13px]">
        <Link
          href={`/projects/${projectSlug}`}
          className="truncate text-[var(--primary)] hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
        >
          {projectName}
        </Link>
        <span aria-hidden="true">·</span>
        <span className="hidden truncate sm:inline">Setting up Jira</span>
        <span className="truncate sm:hidden">Jira setup</span>
      </div>

      <Link
        href="/projects"
        className="hidden text-[13px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] sm:inline"
      >
        Exit setup
      </Link>

      <span
        aria-hidden="true"
        className="ml-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold text-[var(--primary-ink)] sm:ml-3"
        style={{ background: 'linear-gradient(135deg, #2DD4BF 0%, #A78BFA 120%)' }}
      >
        {userInitials}
      </span>
    </header>
  );
}

function HelpFooter() {
  return (
    <footer className="flex h-12 shrink-0 items-center justify-center px-4 text-center text-[12px] text-[var(--text-tertiary)] sm:text-[13px]">
      <span>
        Need help connecting Jira?{' '}
        <Link
          href="/docs/integrations/jira"
          className="text-[var(--primary)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
        >
          See the Jira integration guide →
        </Link>
      </span>
    </footer>
  );
}

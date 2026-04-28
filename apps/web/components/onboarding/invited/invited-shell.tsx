// Top bar + footer chrome for the F07b/c/d invited first-run flows.
// Differs from wizard-shell.tsx (founder onboarding) — no "Setting up your
// workspace" centered text, has user-pill instead of avatar+skip.
// Reused across F07b (QA Engineer), F07c (Stakeholder), F07d (Lead/Admin).

'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import type { InviteRole } from '@/components/onboarding/schemas';

interface InvitedShellProps {
  user: { name: string; initials: string; role: InviteRole | 'stakeholder' };
  children: ReactNode;
}

export function InvitedShell({ user, children }: InvitedShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--canvas)] text-[var(--text-primary)]">
      <TopBar user={user} />
      <main className="flex flex-1 flex-col items-center px-4 pb-16 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}

function TopBar({ user }: { user: InvitedShellProps['user'] }) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--canvas)] px-4 sm:px-6 lg:px-8">
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

      <div
        className="flex items-center gap-2.5 rounded-full border border-[var(--border-subtle)] bg-[var(--raised)] py-1.5 pl-1.5 pr-3"
        aria-label={`Signed in as ${user.name}`}
      >
        <UserAvatar role={user.role} initials={user.initials} />
        <span className="text-[13px] font-medium text-[var(--text-primary)]">{user.name}</span>
      </div>
    </header>
  );
}

function UserAvatar({ role, initials }: { role: InviteRole | 'stakeholder'; initials: string }) {
  // Lead / Admin → amber (warn token, whitelisted).
  // Stakeholder → info blue (whitelisted).
  // QA Engineer → violet (secondary, whitelisted).
  const isLead = role === 'lead';
  const isStakeholder = role === 'stakeholder';

  return (
    <span
      aria-hidden="true"
      className={[
        'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
        isLead
          ? 'bg-[var(--warn)] text-[var(--primary-ink)]'
          : isStakeholder
            ? 'bg-[var(--info)] text-[var(--primary-ink)]'
            : 'bg-[var(--secondary)] text-[var(--primary-ink)]',
      ].join(' ')}
    >
      {initials}
    </span>
  );
}

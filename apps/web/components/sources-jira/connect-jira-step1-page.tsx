// F11a Source Connect Jira · Step 1 — Authorize.
//
// Implements `PM1_UI_v2/frame  html view/F11 Source Connect Jira.html`.
// Locked source = OAuth-only; the brief mentioned an API-token alternate
// path but the locked frame doesn't show one. Per CLAUDE.md Rule 3
// (locked frames win) we ship OAuth-only here.
//
// Pattern A (PM1_PRD §F11):
// - Mount fires `pattern-a:deferred:jira-connect-step1-load`
//     { projectSlug, defaultUrl }.
// - Authorize click fires `pattern-a:deferred:jira-authorize`
//     { projectSlug, instanceUrl } and *simulates* a successful authorize
//     locally so the Continue button enables for visual gating. Real OAuth
//     redirect lands with MS0-T030.5+ (BetterAuth + Atlassian OAuth client).
// - Continue click fires `pattern-a:deferred:jira-connect-step1-continue`
//     { projectSlug, instanceUrl } and routes to step-2 (stub for today).
// - Cancel click fires `pattern-a:deferred:jira-connect-step1-cancel` and
//     routes back to /projects.
// - ZERO fetch / useMutation / axios.

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ConnectJiraShell } from './connect-jira-shell';
import { ConnectJiraStepper } from './connect-jira-stepper';

interface ConnectJiraStep1PageProps {
  projectSlug: string;
}

// Tactical placeholders until seed-centralization (Day-4 P1 followup i)
// lands the React context providers (`useCurrentUser`, `useCurrentProject`).
// Do NOT promote these to a shared data.ts — UI must accept ANY user/project
// an Admin creates via F27.
// TODO: replace with useCurrentUser() once seed-centralization (Day-4 P1 followup i) lands
const TODO_CURRENT_USER = { initials: 'YM', shortName: 'Yogesh M.' } as const;
// TODO: replace with useCurrentProject() once seed-centralization (Day-4 P1 followup i) lands
const TODO_PROJECT_DISPLAY: Record<string, string> = {
  'iksula-returns': 'Iksula Returns',
  ret: 'Iksula Returns',
};
const DEFAULT_JIRA_INSTANCE = 'iksula.atlassian.net';

function projectNameFromSlug(slug: string): string {
  const cached = TODO_PROJECT_DISPLAY[slug.toLowerCase()];
  if (cached) return cached;
  // Title-case the slug as a graceful fallback for any newly-created project
  // until the central context provider is wired.
  return slug
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ');
}

export function ConnectJiraStep1Page({ projectSlug }: ConnectJiraStep1PageProps) {
  const router = useRouter();
  const projectName = projectNameFromSlug(projectSlug);
  const [authorized, setAuthorized] = useState(false);
  const [authorizing, setAuthorizing] = useState(false);

  useEffect(() => {
    console.info('pattern-a:deferred:jira-connect-step1-load', {
      projectSlug,
      defaultUrl: `https://${DEFAULT_JIRA_INSTANCE}`,
    });
  }, [projectSlug]);

  function onAuthorize() {
    console.info('pattern-a:deferred:jira-authorize', {
      projectSlug,
      instanceUrl: `https://${DEFAULT_JIRA_INSTANCE}`,
    });
    setAuthorizing(true);
    // Pattern A: simulate the OAuth round-trip locally so Step 1 can be
    // exercised end-to-end without a real Atlassian client. ~900ms matches
    // the perceived latency of OAuth 2.0 3LO so the visual gate looks honest.
    window.setTimeout(() => {
      setAuthorizing(false);
      setAuthorized(true);
    }, 900);
  }

  function onContinue() {
    console.info('pattern-a:deferred:jira-connect-step1-continue', {
      projectSlug,
      instanceUrl: `https://${DEFAULT_JIRA_INSTANCE}`,
    });
    router.push(`/projects/${projectSlug}/sources/jira/step-2`);
  }

  function onCancel() {
    console.info('pattern-a:deferred:jira-connect-step1-cancel', { projectSlug });
    router.push('/projects');
  }

  return (
    <ConnectJiraShell
      projectName={projectName}
      projectSlug={projectSlug}
      userInitials={TODO_CURRENT_USER.initials}
    >
      <main className="mx-auto w-full max-w-[960px] px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
        <ConnectJiraStepper current={1} />

        <div className="mx-auto mt-10 w-full max-w-[820px] sm:mt-12">
          <h1 className="font-display text-[24px] font-semibold leading-tight tracking-[-0.01em] text-[var(--text-primary)] sm:text-[28px] lg:text-[32px] lg:leading-[40px]">
            Connect to your Atlassian workspace
          </h1>
          <p className="mt-3 max-w-[680px] text-[14px] leading-[22px] text-[var(--text-secondary)] sm:text-[15px] lg:text-[16px] lg:leading-[24px]">
            QA Nexus needs read + write access to fetch issues and sync test cases. You can scope
            access to specific projects in the next step.
          </p>

          <div className="mt-8 grid gap-6 lg:mt-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-8">
            <PermissionsCard />
            <AuthorizeCard
              instanceLabel={DEFAULT_JIRA_INSTANCE}
              authorized={authorized}
              authorizing={authorizing}
              onAuthorize={onAuthorize}
            />
          </div>

          <StepFooter authorized={authorized} onCancel={onCancel} onContinue={onContinue} />
        </div>
      </main>
    </ConnectJiraShell>
  );
}

// ---------------------------------------------------------------------------
// Permissions card (left column on desktop, top on mobile)
// ---------------------------------------------------------------------------

const PERMISSIONS = [
  {
    tone: 'allow' as const,
    text: 'Read issues, stories, epics, sprints, and custom fields from authorized Jira projects',
  },
  {
    tone: 'allow' as const,
    text: 'Link QA Nexus test cases and defects to Jira issues, create defects as Jira Bugs',
  },
  {
    tone: 'allow' as const,
    text: 'Post comments and status updates to linked issues',
    note: '(opt-in per project)',
  },
  {
    tone: 'deny' as const,
    label: 'Never:',
    text: 'delete issues, modify issue types, or change Jira project settings',
  },
];

function PermissionsCard() {
  return (
    <section
      aria-labelledby="perms-head"
      className="rounded-lg border border-[var(--border-subtle)] bg-[var(--base)] p-5 sm:p-6 lg:p-7"
    >
      <h2
        id="perms-head"
        className="font-display text-[15px] font-semibold tracking-[-0.005em] text-[var(--text-primary)] sm:text-[17px]"
      >
        What QA Nexus will access
      </h2>
      <ul className="mt-4 flex flex-col gap-3 text-[13px] leading-[20px] sm:mt-5 sm:gap-4 sm:text-[13.5px]">
        {PERMISSIONS.map((p, idx) => (
          <li key={idx} className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className={[
                'mt-[2px] inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
                p.tone === 'allow'
                  ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                  : 'border border-[var(--border-subtle)] bg-[var(--raised)] text-[var(--text-tertiary)]',
              ].join(' ')}
            >
              {p.tone === 'allow' ? (
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2.5 6.3l2.2 2.2L9.5 3.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M3 3l6 6M9 3l-6 6"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </span>
            <span
              className={
                p.tone === 'allow' ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'
              }
            >
              {p.label && (
                <span className="font-medium text-[var(--text-secondary)]">{p.label} </span>
              )}
              {p.text}
              {p.note && <span className="text-[var(--text-tertiary)]"> {p.note}</span>}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-5 border-t border-[var(--border-subtle)] pt-4 text-[12px] text-[var(--text-tertiary)] sm:mt-6">
        You can revoke this access anytime from{' '}
        <span className="text-[var(--text-secondary)]">Integrations → Jira → Disconnect</span>.
      </p>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Authorize CTA card (right column on desktop, below permissions on mobile)
// ---------------------------------------------------------------------------

interface AuthorizeCardProps {
  instanceLabel: string;
  authorized: boolean;
  authorizing: boolean;
  onAuthorize: () => void;
}

function AuthorizeCard({
  instanceLabel,
  authorized,
  authorizing,
  onAuthorize,
}: AuthorizeCardProps) {
  return (
    <section
      aria-labelledby="auth-head"
      className="border-[var(--primary)]/30 flex flex-col items-center rounded-lg border bg-[var(--base)] p-5 text-center shadow-[0_0_24px_rgba(45,212,191,0.06)] sm:p-6 lg:p-7"
    >
      <span
        aria-hidden="true"
        className="border-[var(--info)]/25 bg-[var(--info)]/10 mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl border text-[var(--info)] sm:mb-4 sm:h-14 sm:w-14"
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <path
            d="M22 11.5L12.5 2A5 5 0 0 0 13 8.8l5.5 5.5a5 5 0 0 0 3.5-2.8z"
            fill="currentColor"
            opacity="0.9"
          />
          <path
            d="M16 6L6.5 15.5a5 5 0 0 0 6.8.5l2.2-2.2A5 5 0 0 0 16 6z"
            fill="currentColor"
            opacity="0.55"
          />
          <path
            d="M12 12l-9.5 9.5A5 5 0 0 0 9.3 22L14 17.3A5 5 0 0 0 12 12z"
            fill="currentColor"
            opacity="0.3"
          />
        </svg>
      </span>
      <h3
        id="auth-head"
        className="font-display text-[15px] font-semibold tracking-[-0.005em] text-[var(--text-primary)] sm:text-[17px]"
      >
        Sign in with Atlassian
      </h3>
      <p className="mt-2 max-w-[280px] text-[12.5px] leading-[18px] text-[var(--text-secondary)]">
        You&apos;ll authorize QA Nexus on{' '}
        <span className="font-mono text-[var(--text-primary)]">{instanceLabel}</span> and be
        redirected back here automatically.
      </p>

      {authorized ? (
        <span
          role="status"
          className="border-[var(--pass)]/30 bg-[var(--pass)]/10 mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md border px-4 text-[14px] font-semibold text-[var(--pass)]"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M3 8l3.2 3.2L13 4.5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Authorized
        </span>
      ) : (
        <button
          type="button"
          onClick={onAuthorize}
          disabled={authorizing}
          aria-busy={authorizing}
          className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[var(--primary)] px-4 text-[14px] font-semibold text-[var(--primary-ink)] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] disabled:cursor-wait disabled:opacity-70 sm:text-[14.5px]"
        >
          {authorizing ? 'Redirecting to Atlassian…' : 'Authorize with Jira'}
          {!authorizing && (
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M6 3h7v7M13 3L5 11"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      )}

      <span className="mt-3 font-mono text-[10.5px] text-[var(--text-tertiary)]">
        Expected: 30s · Uses OAuth 2.0 3LO
      </span>
      <Link
        href="/docs/integrations/jira/admin"
        className="mt-3 text-[12px] text-[var(--primary)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
      >
        Having trouble? See the Atlassian admin guide →
      </Link>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Step footer (Cancel · Continue)
// ---------------------------------------------------------------------------

function StepFooter({
  authorized,
  onCancel,
  onContinue,
}: {
  authorized: boolean;
  onCancel: () => void;
  onContinue: () => void;
}) {
  return (
    <div className="mt-10 flex flex-col-reverse gap-4 border-t border-[var(--border-subtle)] pt-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4 lg:mt-12">
      <button
        type="button"
        onClick={onCancel}
        className="inline-flex h-10 items-center justify-center self-start rounded-md text-[13px] font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] sm:self-center sm:text-[14px]"
      >
        Cancel · Connect Jira later
      </button>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <span
          aria-live="polite"
          className="font-mono text-[11px] text-[var(--text-tertiary)] sm:text-right"
        >
          {authorized
            ? 'Authorization complete — ready for mapping'
            : 'Continue unlocks after authorization'}
        </span>
        <button
          type="button"
          onClick={onContinue}
          disabled={!authorized}
          className={[
            'inline-flex h-10 items-center justify-center gap-2 rounded-md px-5 text-[14px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]',
            authorized
              ? 'bg-[var(--primary)] text-[var(--primary-ink)] hover:opacity-90'
              : 'cursor-not-allowed border border-[var(--border-subtle)] bg-[var(--raised)] text-[var(--text-tertiary)]',
          ].join(' ')}
        >
          Continue to map
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M3 8h10M9 4l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

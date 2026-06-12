// F07d Invited Lead / Admin First-Run — main page component.
//
// 5 regions + 1: same as F07b plus a new Govern Access Strip between
// the AI agent tour and the first-action picker. Visual language:
//   - Violet ✨ sparkle hero icon (Lead/Admin operate AI agents)
//   - Violet Lead+ access pill (organizational scope chip)
//   - Teal QA Value pill (operational scope chip)
//   - Teal Govern shield + teal first-action CTAs
//   - Amber inviter avatar (Yogesh M. as Admin + QA Lead)
//   - Avatar pill in top bar uses amber (warn token, whitelisted)

'use client';

import { useEffect, useMemo } from 'react';
import { InvitedShell } from './invited-shell';

const INVITEE = {
  name: 'Kishor K.',
  initials: 'RK',
  role: 'lead' as const,
};

const INVITE_CONTEXT = {
  workspace: 'Iksula Services Pvt Ltd',
  inviter: { name: 'Yogesh M.', initials: 'YM', role: 'Admin + QA Lead' },
  projects: ['Iksula Returns', 'Iksula Commerce', 'Iksula Mobile App'],
  invitedAt: '2 min ago',
};

const AGENTS = [
  {
    id: 'A1',
    title: 'Test Case Generator',
    desc: 'Drafts test cases from requirements, Figma mocks, and Jira stories. Generates step-by-step instructions in BDD or traditional format.',
    youll: 'Review · Approve · Set policy for your team',
  },
  {
    id: 'A2',
    title: 'Duplicate Detection',
    desc: 'Scans test cases and flags semantic duplicates — even when wording differs. Prevents test bloat as your suite grows.',
    youll: 'Approve merges · Audit decisions · Override team actions',
  },
  {
    id: 'A4',
    title: 'Defect Intelligence',
    desc: '5-Layer Root Cause Analysis weighs stack trace, env, config, code, and data signals to pinpoint the real cause.',
    youll: 'Triage · Assign · Escalate to engineering',
  },
];

const GOVERN_SECTIONS = ['Agents', 'Integrations', 'Users & Roles', 'Settings & Audit'];

export function LeadAdminInvited() {
  const acceptPayload = useMemo(
    () => ({
      role: 'QA Lead',
      workspace: INVITE_CONTEXT.workspace,
      inviter: INVITE_CONTEXT.inviter.name,
      projects: INVITE_CONTEXT.projects,
      access: ['Lead+', 'QA Value'],
    }),
    [],
  );

  useEffect(() => {
    console.info('pattern-a:deferred:invited-lead-admin-accept', acceptPayload);
  }, [acceptPayload]);

  function logRoute(target: string) {
    console.info('pattern-a:deferred:invited-lead-admin-route', { target });
  }

  return (
    <InvitedShell user={INVITEE}>
      <div className="flex w-full max-w-[1344px] flex-col items-center gap-10 pt-10 sm:gap-12 sm:pt-12">
        {/* REGION 1 — Welcome Hero */}
        <section
          className="flex flex-col items-center gap-3.5 text-center"
          aria-labelledby="welcome-title"
        >
          <span
            aria-hidden="true"
            className="border-[var(--secondary)]/20 bg-[var(--secondary)]/10 mb-1 inline-flex h-16 w-16 items-center justify-center rounded-2xl border text-[var(--secondary)]"
          >
            <SparkleIcon size={32} />
          </span>
          <h1
            id="welcome-title"
            className="font-display text-[26px] font-bold leading-tight tracking-[-0.02em] text-[var(--text-primary)] sm:text-[30px] lg:text-[34px]"
          >
            Welcome to QA Nexus,{' '}
            <span className="text-[var(--primary)]">{INVITEE.name.replace(' K.', '')}!</span>
          </h1>
          <p className="text-[14px] leading-[22px] text-[var(--text-tertiary)] sm:text-[15px]">
            You&apos;re a <span className="font-semibold text-[var(--text-primary)]">QA Lead</span>{' '}
            on{' '}
            {INVITE_CONTEXT.projects.map((p, i) => (
              <span key={p}>
                <span className="font-semibold text-[var(--text-primary)]">{p}</span>
                {i < INVITE_CONTEXT.projects.length - 1 && ' · '}
              </span>
            ))}
          </p>
          <p className="inline-flex flex-wrap items-center justify-center gap-2 text-[12px] leading-[18px] text-[var(--text-tertiary)]">
            <span>Plus access to</span>
            <AccessPill variant="lead">Lead+</AccessPill>
            <AccessPill variant="value">QA Value</AccessPill>
            <span>sections</span>
          </p>
          <p
            className="inline-flex items-center gap-2 text-[12px] leading-[18px] text-[var(--text-tertiary)]"
            aria-live="polite"
          >
            Invited by{' '}
            <span className="font-medium text-[var(--text-secondary)]">
              {INVITE_CONTEXT.inviter.name}
            </span>
            <span aria-hidden="true" className="text-[var(--text-disabled)]">
              ·
            </span>
            <span className="font-mono text-[11px] text-[var(--text-disabled)]">
              {INVITE_CONTEXT.invitedAt}
            </span>
          </p>
        </section>

        {/* REGION 2 — Workspace Context Strip */}
        <section
          aria-label="Workspace context"
          className="flex w-full flex-wrap items-center justify-center gap-x-8 gap-y-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--raised)] px-5 py-4 sm:px-7"
        >
          <StripField label="Workspace" value={INVITE_CONTEXT.workspace} />
          <StripDivider />
          <StripField
            label="Invited by"
            value={
              <span className="inline-flex flex-wrap items-center gap-2">
                <span
                  aria-hidden="true"
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--warn)] text-[9px] font-bold text-[var(--primary-ink)]"
                >
                  {INVITE_CONTEXT.inviter.initials}
                </span>
                {INVITE_CONTEXT.inviter.name}{' '}
                <span className="font-normal text-[var(--text-tertiary)]">
                  ({INVITE_CONTEXT.inviter.role})
                </span>
              </span>
            }
          />
          <StripDivider />
          <StripField label="Projects" value={INVITE_CONTEXT.projects.join(' · ')} />
          <StripDivider />
          <StripField
            label="First login"
            value={
              <span className="font-mono text-[12px] text-[var(--text-tertiary)]">Just now</span>
            }
          />
        </section>

        {/* REGION 3 — AI Agent Tour (Lead-specific copy, violet glyphs retained) */}
        <section className="flex w-full flex-col gap-5" aria-labelledby="agent-tour-head">
          <header className="flex flex-wrap items-baseline justify-between gap-3">
            <span
              id="agent-tour-head"
              className="font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--text-tertiary)]"
            >
              Meet your AI Teammates
            </span>
            <span className="text-[13px] italic leading-[20px] text-[var(--text-secondary)]">
              You&apos;re in{' '}
              <span className="font-medium not-italic text-[var(--secondary)]">charge</span> — AI
              suggests, you review, approve, and govern.
            </span>
          </header>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {AGENTS.map((a) => (
              <article
                key={a.id}
                tabIndex={0}
                aria-label={`AI agent ${a.id}, ${a.title}`}
                className="hover:border-[var(--secondary)]/45 group flex min-h-11 flex-col gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--base)] p-5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--canvas)]"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className="border-[var(--secondary)]/20 bg-[var(--secondary)]/10 inline-flex h-8 w-8 items-center justify-center rounded-lg border text-[var(--secondary)]"
                  >
                    <SparkleIcon size={18} />
                  </span>
                  <span className="border-[var(--secondary)]/20 bg-[var(--secondary)]/15 rounded-[4px] border px-2 py-1 font-mono text-[11px] font-semibold uppercase leading-none tracking-[0.08em] text-[var(--secondary)]">
                    {a.id}
                  </span>
                </div>
                <h3 className="font-display text-[17px] font-bold leading-[24px] text-[var(--text-primary)]">
                  {a.title}
                </h3>
                <p className="flex-1 text-[13px] leading-[20px] text-[var(--text-secondary)]">
                  {a.desc}
                </p>
                <div className="-mx-5 mt-1 flex items-center gap-2 border-t border-dashed border-[var(--border-subtle)] px-5 pt-3">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
                    You&apos;ll
                  </span>
                  <span className="text-[12px] font-medium leading-[18px] text-[var(--text-primary)]">
                    {a.youll}
                  </span>
                </div>
              </article>
            ))}
          </div>
          <div className="flex justify-center pt-1">
            <a
              href="#F26"
              onClick={(e) => {
                e.preventDefault();
                logRoute('F26-agent-info');
              }}
              className="inline-flex items-center gap-1 text-[13px] font-medium text-[var(--secondary)] transition-colors hover:text-[var(--text-primary)] focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
            >
              Learn more about AI Agents <span aria-hidden="true">→</span>
            </a>
          </div>
        </section>

        {/* REGION 3b — Govern Access Strip (NEW for Lead/Admin) */}
        <aside
          role="note"
          aria-labelledby="govern-title"
          className="border-[var(--primary)]/30 bg-[var(--primary)]/5 flex w-full flex-col gap-3 rounded-xl border p-5 sm:flex-row sm:items-center sm:gap-5"
        >
          <span
            aria-hidden="true"
            className="border-[var(--primary)]/30 bg-[var(--primary)]/15 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-[var(--primary)]"
          >
            <ShieldIcon />
          </span>
          <div className="flex flex-1 flex-col gap-1.5">
            <h4
              id="govern-title"
              className="font-display text-[15px] font-semibold text-[var(--text-primary)]"
            >
              You also have Govern access
            </h4>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-[var(--text-secondary)]">
              {GOVERN_SECTIONS.map((item, i) => (
                <span key={item} className="inline-flex items-center gap-2">
                  <span className="font-medium text-[var(--text-primary)]">{item}</span>
                  {i < GOVERN_SECTIONS.length - 1 && (
                    <span aria-hidden="true" className="text-[var(--text-disabled)]">
                      ·
                    </span>
                  )}
                </span>
              ))}
            </div>
            <p className="text-[12px] italic leading-[18px] text-[var(--text-tertiary)]">
              Use these to manage the team, approve agent policy, and audit system activity.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2" aria-label="Your access tiers">
            <AccessPill variant="lead">Lead+</AccessPill>
            <AccessPill variant="value">QA Value</AccessPill>
          </div>
        </aside>

        {/* REGION 4 — First-Action Picker */}
        <section className="flex w-full flex-col gap-5" aria-labelledby="first-action-head">
          <header className="flex flex-wrap items-baseline justify-between gap-3">
            <span
              id="first-action-head"
              className="font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--text-tertiary)]"
            >
              How do you want to start?
            </span>
            <a
              href="#F08b"
              onClick={(e) => {
                e.preventDefault();
                logRoute('F08b-skip-to-dashboard');
              }}
              className="inline-flex items-center gap-1 text-[12px] font-medium text-[var(--primary)] transition-colors hover:text-[var(--text-primary)] focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
            >
              Skip setup — go to my dashboard <span aria-hidden="true">→</span>
            </a>
          </header>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            <PickerCard
              chip="~2 min"
              title="View team dashboard"
              desc="Full Lead/Admin view with Govern — see Sprint 42 readiness, team activity, release risk, and pending approvals at a glance."
              ctaLabel="Open dashboard"
              IconCmp={GridIcon}
              onCta={() => logRoute('F08b-home-dashboard')}
            />
            <PickerCard
              chip="~5 min"
              title="Connect your team's tools"
              desc={
                <>
                  Connect{' '}
                  <span className="font-mono text-[12px] text-[var(--text-primary)]">
                    iksula.atlassian.net
                  </span>{' '}
                  to pull requirements, plus Slack for alerts. Agents need these to work.
                </>
              }
              ctaLabel="Connect tools"
              IconCmp={LinkIcon}
              onCta={() => logRoute('F11a-jira-oauth-step1')}
            />
            <PickerCard
              chip="~3 min"
              title="Invite your teammates"
              desc="Add QA Engineers, Stakeholders, and co-Leads. Assign roles and projects in one flow — they'll get set-password invites by email."
              ctaLabel="Invite people"
              IconCmp={UsersIcon}
              onCta={() => logRoute('F27-users-roles-with-F27m1-modal')}
            />
          </div>
        </section>

        {/* REGION 5 — Skip / Continue */}
        <section
          className="flex w-full max-w-[640px] flex-col items-center gap-3 pt-2"
          aria-label="Skip onboarding"
        >
          <div aria-hidden="true" className="flex w-full items-center gap-4">
            <span className="h-px flex-1 bg-[var(--border-subtle)]" />
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--text-disabled)]">
              OR
            </span>
            <span className="h-px flex-1 bg-[var(--border-subtle)]" />
          </div>
          <a
            href="#F08b"
            onClick={(e) => {
              e.preventDefault();
              logRoute('F08b-skip-row');
            }}
            className="inline-flex items-center gap-1 text-[13px] font-medium text-[var(--primary)] transition-colors hover:text-[var(--text-primary)] focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
          >
            Skip and go to my dashboard <span aria-hidden="true">→</span>
          </a>
          <span className="text-[11px] leading-[16px] text-[var(--text-disabled)]">
            You can access this tour again from Settings → Help
          </span>
        </section>
      </div>
    </InvitedShell>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function AccessPill({
  variant,
  children,
}: {
  variant: 'lead' | 'value';
  children: React.ReactNode;
}) {
  // Lead+ → violet (organizational, AI-adjacent governance)
  // QA Value → teal (operational, system action)
  // Both whitelisted (#A78BFA / #2DD4BF).
  const isLead = variant === 'lead';
  return (
    <span
      className={[
        'inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em]',
        isLead
          ? 'border-[var(--secondary)]/30 bg-[var(--secondary)]/15 text-[var(--secondary)]'
          : 'border-[var(--primary)]/30 bg-[var(--primary)]/15 text-[var(--primary)]',
      ].join(' ')}
    >
      {children}
    </span>
  );
}

function StripField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex min-h-7 items-center gap-2.5">
      <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
        {label}
      </span>
      <span className="inline-flex flex-wrap items-center gap-2 text-[13px] font-medium leading-[18px] text-[var(--text-primary)]">
        {value}
      </span>
    </div>
  );
}

function StripDivider() {
  return (
    <span
      aria-hidden="true"
      className="hidden h-1 w-1 shrink-0 rounded-full bg-[var(--border-strong)] sm:inline-block"
    />
  );
}

interface PickerCardProps {
  chip: React.ReactNode;
  title: string;
  desc: React.ReactNode;
  ctaLabel: string;
  IconCmp: () => React.ReactElement;
  onCta: () => void;
}

function PickerCard({ chip, title, desc, ctaLabel, IconCmp, onCta }: PickerCardProps) {
  return (
    <article className="border-[var(--primary)]/45 bg-[var(--primary)]/5 hover:border-[var(--primary)]/70 flex min-h-11 flex-col rounded-2xl border p-5 transition-all">
      <div className="mb-3 flex items-center justify-between">
        <span
          aria-hidden="true"
          className="border-[var(--primary)]/20 bg-[var(--primary)]/10 inline-flex h-9 w-9 items-center justify-center rounded-lg border text-[var(--primary)]"
        >
          <IconCmp />
        </span>
        <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--raised)] px-2 py-1 font-mono text-[10px] font-medium leading-none text-[var(--text-tertiary)]">
          {chip}
        </span>
      </div>
      <h3 className="font-display mb-1.5 text-[17px] font-bold leading-[24px] text-[var(--text-primary)]">
        {title}
      </h3>
      <p className="mb-4 flex-1 text-[13px] leading-[20px] text-[var(--text-secondary)]">{desc}</p>
      <button
        type="button"
        onClick={onCta}
        aria-label={`${ctaLabel} — deferred until backend wiring (Pattern A)`}
        className="inline-flex h-10 min-h-11 w-full items-center justify-center gap-1.5 rounded-[4px] bg-[var(--primary)] text-[14px] font-semibold text-[var(--primary-ink)] transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--canvas)]"
      >
        {ctaLabel}
        <span aria-hidden="true">→</span>
      </button>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Inline icons
// ---------------------------------------------------------------------------

function SparkleIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3l2.09 5.26L19 10l-4.91 1.74L12 17l-2.09-5.26L5 10l4.91-1.74z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18 3v3M20 5h-3M6 17v3M8 19H5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6l-8-4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m9 12 2 2 4-4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="3"
        y="3"
        width="7"
        height="9"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="14"
        y="3"
        width="7"
        height="5"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="14"
        y="12"
        width="7"
        height="9"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="3"
        y="16"
        width="7"
        height="5"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1 1M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1-1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="9"
        cy="7"
        r="4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

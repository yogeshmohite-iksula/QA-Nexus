// F07c Invited Stakeholder First-Run — main page component.
//
// Reuses InvitedShell. Visual language for this role is intentionally
// teal-only on content surfaces — no violet anywhere except :focus-visible
// rings (a11y) and the brand-mark gradient (chrome, not content). The "VIEW
// ONLY" badge in the hero makes the reduced scope unambiguous on first paint.

'use client';

import { useEffect, useMemo } from 'react';
import { InvitedShell } from './invited-shell';

const INVITEE = {
  name: 'Meera R.',
  initials: 'MR',
  role: 'stakeholder' as const,
};

const INVITE_CONTEXT = {
  workspace: 'Iksula Services Pvt Ltd',
  inviter: { name: 'Yogesh M.', initials: 'YM', role: 'QA Lead' },
  projects: ['Iksula Returns', 'Iksula Commerce'],
  invitedAt: '5 min ago',
};

const DASH_CARDS = [
  {
    id: 'QA Value',
    title: 'AI Impact & ROI',
    desc: 'Cost-avoidance metrics, agent-hour savings, defect-escape reduction. Updated live from team activity.',
    youll: 'Quantify ROI · Report to execs · Track trends',
    Icon: ChartIcon,
  },
  {
    id: 'Reports',
    title: 'Sprint & Release Readiness',
    desc: 'Weekly sprint reports, release-readiness RAG, trend charts. Auto-generated and review-ready.',
    youll: 'Review · Approve · Escalate blockers',
    Icon: DocIcon,
  },
  {
    id: 'Approvals',
    title: 'Strategy Sign-offs',
    desc: 'Test strategy docs and high-risk test plans awaiting your approval before the team proceeds.',
    youll: 'Approve · Request changes · Comment',
    Icon: ShieldCheckIcon,
  },
];

export function StakeholderInvited() {
  const acceptPayload = useMemo(
    () => ({
      role: 'Stakeholder',
      workspace: INVITE_CONTEXT.workspace,
      inviter: INVITE_CONTEXT.inviter.name,
      projects: INVITE_CONTEXT.projects,
    }),
    [],
  );

  useEffect(() => {
    console.info('pattern-a:deferred:invited-stakeholder-accept', acceptPayload);
  }, [acceptPayload]);

  function logRoute(target: string) {
    console.info('pattern-a:deferred:invited-stakeholder-route', { target });
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
            className="border-[var(--primary)]/20 bg-[var(--primary)]/10 mb-1 inline-flex h-16 w-16 items-center justify-center rounded-2xl border text-[var(--primary)]"
          >
            <CheckIcon size={28} />
          </span>
          <h1
            id="welcome-title"
            className="font-display text-[26px] font-bold leading-tight tracking-[-0.02em] text-[var(--text-primary)] sm:text-[30px] lg:text-[34px]"
          >
            Welcome to QA Nexus,{' '}
            <span className="text-[var(--primary)]">{INVITEE.name.replace(' R.', '')}!</span>
          </h1>
          <p className="text-[14px] leading-[22px] text-[var(--text-tertiary)] sm:text-[15px]">
            You&apos;ve been added as a{' '}
            <span className="font-semibold text-[var(--text-primary)]">Stakeholder</span>. Read-only
            access to your team&apos;s quality posture on{' '}
            {INVITE_CONTEXT.projects.map((p, i) => (
              <span key={p}>
                <span className="font-semibold text-[var(--text-primary)]">{p}</span>
                {i < INVITE_CONTEXT.projects.length - 1 && ' · '}
              </span>
            ))}
            .
          </p>
          {/* VIEW-ONLY badge — explicitly per CHAT 2 brief, makes reduced scope unambiguous */}
          <span
            aria-label="View-only access"
            className="border-[var(--primary)]/30 bg-[var(--primary)]/10 mt-1 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--primary)]"
          >
            <EyeIcon /> View-only access
          </span>
          <p
            className="mt-1 inline-flex items-center gap-2 text-[12px] leading-[18px] text-[var(--text-tertiary)]"
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
              <span className="inline-flex items-center gap-2">
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

        {/* REGION 3 — Dashboard Tour (TEAL only, NO violet) */}
        <section className="flex w-full flex-col gap-5" aria-labelledby="dash-tour-head">
          <header className="flex flex-wrap items-baseline justify-between gap-3">
            <span
              id="dash-tour-head"
              className="font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--text-tertiary)]"
            >
              What you&apos;ll see
            </span>
            <span className="text-[13px] italic leading-[20px] text-[var(--text-secondary)]">
              Your stakeholder view focuses on outcomes, not execution.
            </span>
          </header>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {DASH_CARDS.map(({ id, title, desc, youll, Icon }) => (
              <article
                key={id}
                tabIndex={0}
                aria-label={`${id}: ${title}`}
                className="hover:border-[var(--primary)]/45 group flex min-h-11 flex-col gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--base)] p-5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--canvas)]"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className="border-[var(--primary)]/20 bg-[var(--primary)]/10 inline-flex h-8 w-8 items-center justify-center rounded-lg border text-[var(--primary)]"
                  >
                    <Icon />
                  </span>
                  <span className="border-[var(--primary)]/20 bg-[var(--primary)]/15 rounded-[4px] border px-2 py-1 font-mono text-[11px] font-semibold uppercase leading-none tracking-[0.08em] text-[var(--primary)]">
                    {id}
                  </span>
                </div>
                <h3 className="font-display text-[17px] font-bold leading-[24px] text-[var(--text-primary)]">
                  {title}
                </h3>
                <p className="flex-1 text-[13px] leading-[20px] text-[var(--text-secondary)]">
                  {desc}
                </p>
                <div className="-mx-5 mt-1 flex items-center gap-2 border-t border-dashed border-[var(--border-subtle)] px-5 pt-3">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--primary)]">
                    You&apos;ll
                  </span>
                  <span className="text-[12px] font-medium leading-[18px] text-[var(--text-primary)]">
                    {youll}
                  </span>
                </div>
              </article>
            ))}
          </div>
          <p className="text-center text-[12px] italic leading-[18px] text-[var(--text-tertiary)]">
            You won&apos;t see test execution or defect triage — those live with the QA team.
          </p>
        </section>

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
              variant="teal"
              chip="~3 min"
              title="View AI Value dashboard"
              desc={
                <>
                  Live cost-avoidance, agent-hour savings, defect-escape reduction.{' '}
                  <span className="font-mono font-bold text-[var(--primary)]">$28.4k</span> YTD
                  impact so far.
                </>
              }
              ctaLabel="Open dashboard"
              IconCmp={ChartIcon}
              onCta={() => logRoute('F24-qa-value-dashboard')}
            />
            <PickerCard
              variant="teal"
              chip="~5 min · 3 new"
              title="Browse this week's reports"
              desc={
                <>
                  <span className="font-mono font-bold text-[var(--primary)]">3</span> new reports
                  for Sprint 42 — release-readiness RAG and trend charts ready to review.
                </>
              }
              ctaLabel="Open reports"
              IconCmp={DocIcon}
              onCta={() => logRoute('F23-reports-weekly')}
            />
            <PickerCard
              variant="ghost"
              chip="Self-paced"
              title="Explore the dashboard first"
              desc="Tour the home dashboard at your own pace. You can come back to reports and approvals anytime."
              ctaLabel="Go to Dashboard"
              IconCmp={CompassIcon}
              onCta={() => logRoute('F08b-home-dashboard')}
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

function StripField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex min-h-7 items-center gap-2.5">
      <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
        {label}
      </span>
      <span className="inline-flex items-center gap-2 text-[13px] font-medium leading-[18px] text-[var(--text-primary)]">
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
  variant: 'teal' | 'ghost';
  chip: React.ReactNode;
  title: string;
  desc: React.ReactNode;
  ctaLabel: string;
  IconCmp: () => React.ReactElement;
  onCta: () => void;
}

function PickerCard({ variant, chip, title, desc, ctaLabel, IconCmp, onCta }: PickerCardProps) {
  const isTeal = variant === 'teal';
  const isGhost = variant === 'ghost';
  return (
    <article
      className={[
        'flex min-h-11 flex-col rounded-2xl border p-5 transition-all',
        isTeal
          ? 'border-[var(--primary)]/45 bg-[var(--primary)]/5 hover:border-[var(--primary)]/70'
          : 'border-[var(--border-subtle)] bg-[var(--base)] hover:border-[var(--border-strong)]',
      ].join(' ')}
    >
      <div className="mb-3 flex items-center justify-between">
        <span
          aria-hidden="true"
          className={[
            'inline-flex h-9 w-9 items-center justify-center rounded-lg border',
            isGhost
              ? 'border-[var(--border-subtle)] bg-[var(--overlay)] text-[var(--text-tertiary)]'
              : 'border-[var(--primary)]/20 bg-[var(--primary)]/10 text-[var(--primary)]',
          ].join(' ')}
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
        className={[
          'inline-flex h-10 min-h-11 w-full items-center justify-center gap-1.5 rounded-[4px] text-[14px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--canvas)]',
          isGhost
            ? 'border border-[var(--border-subtle)] bg-transparent text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:bg-[var(--raised)] hover:text-[var(--text-primary)]'
            : 'bg-[var(--primary)] text-[var(--primary-ink)] hover:opacity-90',
        ].join(' ')}
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

function CheckIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 6 9 17l-5-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 3v18h18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m7 14 4-4 4 4 6-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 2v6h6M8 13h8M8 17h6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShieldCheckIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

function CompassIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// F07b Invited QA Engineer First-Run — main page component.
// Mirrors the locked HTML frame structure (5 regions) translated to a
// fluid mobile-first layout. Source HTML uses palette values not in PM1's
// locked whitelist (extra slate / amber-text / secondary-600 shades);
// replaced with whitelisted CSS-vars or whitelisted hex (#2DD4BF, #A78BFA,
// #FBBF24, #003732, #94A3B8, #C4B5FD).

'use client';

import { useEffect, useMemo } from 'react';
import { InvitedShell } from './invited-shell';

// Demo invitee context — would be filled from BetterAuth session + invite
// row in MS0-T021/T022. Hard-coded for visual gate; matches source HTML.
const INVITEE = {
  name: 'Nadim S.',
  initials: 'PS',
  role: 'qa-engineer' as const,
};

const INVITE_CONTEXT = {
  workspace: 'Iksula Services Pvt Ltd',
  inviter: { name: 'Yogesh M.', initials: 'YM', role: 'QA Lead' },
  projects: ['Iksula Returns', 'Iksula Commerce'],
  invitedAt: '2 min ago',
};

const AGENTS = [
  {
    id: 'A1',
    title: 'Test Case Generator',
    desc: 'Drafts test cases from requirements, Figma mocks, and Jira stories. Generates step-by-step instructions in BDD or traditional format.',
    youll: 'Review · Edit · Approve drafts',
  },
  {
    id: 'A2',
    title: 'Duplicate Detection',
    desc: 'Scans test cases and flags semantic duplicates — even when wording differs. Prevents test bloat as your suite grows.',
    youll: 'Approve merge · Ignore · Dismiss false positives',
  },
  {
    id: 'A4',
    title: 'Defect Intelligence',
    desc: '5-Layer Root Cause Analysis weighs stack trace, env, config, code, and data signals to pinpoint the real cause.',
    youll: 'Triage faster · Trust signals · Override when needed',
  },
];

export function QaEngineerInvited() {
  const acceptPayload = useMemo(
    () => ({
      role: INVITEE.role,
      workspace: INVITE_CONTEXT.workspace,
      inviter: INVITE_CONTEXT.inviter.name,
      projects: INVITE_CONTEXT.projects,
    }),
    [],
  );

  // Pattern A: page-load IS the implicit acceptance for the email-link flow.
  // No POST. Just a marker so log-grep can verify zero network egress.
  useEffect(() => {
    console.info('pattern-a:deferred:invited-qa-engineer-accept', acceptPayload);
  }, [acceptPayload]);

  function logRoute(target: string) {
    console.info('pattern-a:deferred:invited-qa-engineer-route', { target });
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
            <span className="text-[var(--primary)]">{INVITEE.name.replace(' S.', '')}!</span>
          </h1>
          <p className="text-[14px] leading-[22px] text-[var(--text-tertiary)] sm:text-[15px]">
            You&apos;re a{' '}
            <span className="font-semibold text-[var(--text-primary)]">QA Engineer</span> on{' '}
            {INVITE_CONTEXT.projects.map((p, i) => (
              <span key={p}>
                <span className="font-semibold text-[var(--text-primary)]">{p}</span>
                {i < INVITE_CONTEXT.projects.length - 1 && ' · '}
              </span>
            ))}
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

        {/* REGION 3 — AI Agent Tour */}
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
              suggests, you decide.
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

        {/* REGION 4 — First-Action Picker */}
        <section className="flex w-full flex-col gap-5" aria-labelledby="first-action-head">
          <header className="flex flex-col gap-1">
            <span
              id="first-action-head"
              className="font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--text-tertiary)]"
            >
              Pick your first action
            </span>
          </header>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            <PickerCard
              variant="default"
              chip="~5 min"
              title="Create your first test case"
              desc="Start with the blank editor. Use BDD or traditional format. A1 suggestions appear inline while authoring."
              ctaLabel="Start creating"
              onCta={() => logRoute('F16a-test-case-editor')}
            />
            <PickerCard
              variant="teal"
              chip="4 items"
              title="Review pending AI suggestions"
              desc={
                <>
                  <span className="font-mono font-bold text-[var(--primary)]">4</span> A1-drafted
                  test cases for{' '}
                  <span className="font-mono text-[12px] text-[var(--text-primary)]">RET-137</span>{' '}
                  are awaiting your review. Accept, edit, or send back.
                </>
              }
              ctaLabel="Open review queue"
              onCta={() => logRoute('F17-test-case-library-a1-drafts')}
            />
            <PickerCard
              variant="ghost"
              chip="Self-paced"
              title="Explore the workspace first"
              desc="Tour the home page, left rail, and mode toggle at your own pace. You can come back to actions anytime."
              ctaLabel="Go to Home"
              onCta={() => logRoute('F08a-home-qa-engineer')}
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
            href="#F08a"
            onClick={(e) => {
              e.preventDefault();
              logRoute('F08a-skip-to-queue');
            }}
            className="inline-flex items-center gap-1 text-[13px] font-medium text-[var(--primary)] transition-colors hover:text-[var(--text-primary)] focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
          >
            Skip and go to my queue <span aria-hidden="true">→</span>
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
  variant: 'default' | 'teal' | 'ghost';
  chip: React.ReactNode;
  title: string;
  desc: React.ReactNode;
  ctaLabel: string;
  onCta: () => void;
}

function PickerCard({ variant, chip, title, desc, ctaLabel, onCta }: PickerCardProps) {
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
          {isGhost ? <CompassIcon /> : isTeal ? <CheckIcon /> : <SparkIcon />}
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
          'inline-flex h-10 min-h-11 w-full items-center justify-center gap-1.5 rounded-[4px] text-[14px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--canvas)]',
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
// Inline icons (no lucide-react dep yet)
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

function SparkIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 4v16M4 12h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="m5 13 4 4 10-10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CompassIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="m15 9-2 6-6 2 2-6 6-2Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

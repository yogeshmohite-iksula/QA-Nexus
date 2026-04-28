// F08c Empty Project First-Run — main orchestrator client component.
//
// Layout (mobile-first per CLAUDE.md Rule 12):
//   < lg: top bar + main (single col, no rails)
//   lg+:  + left rail (240 px)
// No right rail — the empty state has no live agent activity to surface.
//
// Pattern A: page mount fires `pattern-a:deferred:home-empty-load`.
// Each empty-state CTA fires `pattern-a:deferred:home-empty-route`.
// ZERO fetch / useMutation / axios.

'use client';

import { useEffect } from 'react';
import { HomeShell } from './home-shell';
import { LeftRail } from './left-rail';
import {
  ACTIVE_PROJECT,
  HERO,
  SETUP_CARDS,
  SETUP_CHECKLIST,
  SIGNED_IN_USER,
  type SetupCard,
} from './data';

export function FounderEmptyHome() {
  useEffect(() => {
    console.info('pattern-a:deferred:home-empty-load', {
      workspace: 'Iksula',
      projectKey: ACTIVE_PROJECT.key,
      projectId: ACTIVE_PROJECT.projectId,
      role: SIGNED_IN_USER.roleId,
    });
  }, []);

  function logRoute(target: string) {
    console.info('pattern-a:deferred:home-empty-route', { target });
  }

  return (
    <HomeShell>
      <div className="flex flex-1">
        <LeftRail />
        <main className="flex min-w-0 flex-1 flex-col gap-10 px-4 py-6 sm:px-6 sm:py-8 lg:gap-12 lg:px-8 xl:px-12">
          {/* BLOCK 1 — Welcome strip */}
          <WelcomeStrip />
          {/* BLOCK 2 — Three setup cards */}
          <SetupCardGrid onRoute={logRoute} />
          {/* BLOCK 3 — Skip row */}
          <SkipRow onRoute={logRoute} />
          {/* BLOCK 4 — Setup checklist */}
          <SetupChecklist />
          {/* BLOCK 5 — Empty-state zones */}
          <EmptyZones />
        </main>
      </div>
    </HomeShell>
  );
}

// ---------------------------------------------------------------------------
// BLOCK 1 — Welcome strip with teal→violet hint gradient
// ---------------------------------------------------------------------------

function WelcomeStrip() {
  return (
    <section
      aria-labelledby="welcome-head"
      className="flex flex-col gap-3 rounded-2xl border border-[var(--border-subtle)] p-5 sm:p-6 lg:flex-row lg:items-end lg:justify-between"
      style={{
        background:
          'linear-gradient(135deg, rgba(45,212,191,0.06) 0%, rgba(17,24,39,0.2) 50%, rgba(167,139,250,0.06) 100%)',
      }}
    >
      <div className="flex flex-col gap-2">
        <h1
          id="welcome-head"
          className="font-display text-[22px] font-bold leading-tight text-[var(--text-primary)] sm:text-[26px] lg:text-[30px]"
        >
          {HERO.heading}
        </h1>
        <p className="text-[13px] leading-[20px] text-[var(--text-tertiary)]">{HERO.sub}</p>
      </div>
      <span className="inline-flex w-fit items-center rounded-full border border-[var(--border-subtle)] bg-[var(--raised)] px-3 py-1 font-mono text-[11px] text-[var(--text-tertiary)]">
        Project ID: {ACTIVE_PROJECT.projectId}
      </span>
    </section>
  );
}

// ---------------------------------------------------------------------------
// BLOCK 2 — Three setup cards
// ---------------------------------------------------------------------------

function SetupCardGrid({ onRoute }: { onRoute: (target: string) => void }) {
  return (
    <section aria-labelledby="setup-head" className="flex flex-col gap-4">
      <h2
        id="setup-head"
        className="font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--text-tertiary)]"
      >
        Get started — pick one
      </h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {SETUP_CARDS.map((card) => (
          <SetupCardBlock key={card.id} card={card} onRoute={onRoute} />
        ))}
      </div>
    </section>
  );
}

function SetupCardBlock({ card, onRoute }: { card: SetupCard; onRoute: (target: string) => void }) {
  const isAi = card.variant === 'violet';
  return (
    <article
      className={[
        'flex flex-col gap-3 rounded-2xl border p-5',
        isAi
          ? 'border-[var(--secondary)]/25 bg-[var(--secondary)]/5'
          : 'border-[var(--primary)]/25 bg-[var(--primary)]/5',
      ].join(' ')}
    >
      <div className="flex items-center justify-between">
        <span
          aria-hidden="true"
          className={[
            'inline-flex h-10 w-10 items-center justify-center rounded-lg border',
            isAi
              ? 'border-[var(--secondary)]/30 bg-[var(--secondary)]/15 text-[var(--secondary)]'
              : 'border-[var(--primary)]/30 bg-[var(--primary)]/15 text-[var(--primary)]',
          ].join(' ')}
        >
          <CardGlyph kind={card.glyph} />
        </span>
        <div className="flex items-center gap-1.5">
          {card.fastChip && (
            <span className="bg-[var(--secondary)]/15 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold text-[var(--secondary)]">
              Fast
            </span>
          )}
          <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--raised)] px-2 py-0.5 font-mono text-[10px] text-[var(--text-tertiary)]">
            {card.eyebrow}
          </span>
        </div>
      </div>
      <h3 className="font-display text-[18px] font-bold leading-tight text-[var(--text-primary)]">
        {card.title}
      </h3>
      <p className="text-[13px] leading-[20px] text-[var(--text-secondary)]">{card.body}</p>
      <ul className="flex flex-wrap gap-1.5">
        {card.chips.map((c) => (
          <li
            key={c}
            className="inline-flex items-center rounded border border-[var(--border-subtle)] bg-[var(--raised)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-tertiary)]"
          >
            {c}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => onRoute(card.ctaTarget)}
        className={[
          'mt-auto inline-flex h-11 min-h-11 items-center justify-center rounded text-[14px] font-semibold transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--canvas)]',
          isAi
            ? 'bg-[var(--secondary)] text-[var(--primary-ink)] focus-visible:ring-[var(--secondary)]'
            : 'bg-[var(--primary)] text-[var(--primary-ink)] focus-visible:ring-[var(--secondary)]',
        ].join(' ')}
      >
        {card.ctaLabel}
      </button>
      <span className="text-[11px] leading-[16px] text-[var(--text-disabled)]">{card.subtext}</span>
    </article>
  );
}

function CardGlyph({ kind }: { kind: SetupCard['glyph'] }) {
  if (kind === 'connect') {
    return (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
  if (kind === 'upload') {
    return (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 4v11M7 9l5-5 5 5M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

// ---------------------------------------------------------------------------
// BLOCK 3 — Skip row (OR · manual entry)
// ---------------------------------------------------------------------------

function SkipRow({ onRoute }: { onRoute: (target: string) => void }) {
  return (
    <div className="flex items-center gap-4">
      <span aria-hidden="true" className="h-px flex-1 bg-[var(--border-subtle)]" />
      <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--text-disabled)]">
        OR
      </span>
      <span className="text-[13px] text-[var(--text-tertiary)]">Prefer to start from scratch?</span>
      <button
        type="button"
        onClick={() => onRoute('F16a-test-case-editor-blank')}
        className="text-[13px] font-medium text-[var(--primary)] hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
      >
        Create your first test case manually →
      </button>
      <span
        aria-hidden="true"
        className="hidden h-px flex-1 bg-[var(--border-subtle)] sm:inline-block"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// BLOCK 4 — Setup checklist
// ---------------------------------------------------------------------------

function SetupChecklist() {
  const completed = SETUP_CHECKLIST.filter((i) => i.done).length;
  return (
    <section
      aria-labelledby="checklist-head"
      className="flex flex-col gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--raised)] p-4 sm:p-5"
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <h2
            id="checklist-head"
            className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]"
          >
            Setup checklist
          </h2>
          <span className="font-mono text-[11px] text-[var(--text-disabled)]">
            {completed} of {SETUP_CHECKLIST.length} complete · first-run setup, dismissable anytime
          </span>
        </div>
        <button
          type="button"
          className="text-[12px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
        >
          Dismiss checklist
        </button>
      </header>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {SETUP_CHECKLIST.map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--base)] p-3"
          >
            <span
              aria-hidden="true"
              className={[
                'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
                item.done
                  ? 'bg-[var(--pass)]/15 border-[var(--pass)] text-[var(--pass)]'
                  : 'border-[var(--border-strong)] bg-transparent',
              ].join(' ')}
            >
              {item.done && <CheckIcon />}
            </span>
            <span
              className={[
                'text-[12px] leading-[16px]',
                item.done
                  ? 'text-[var(--text-primary)] line-through'
                  : 'text-[var(--text-secondary)]',
              ].join(' ')}
            >
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function CheckIcon() {
  return (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="m5 13 4 4 10-10"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// BLOCK 5 — Empty-state zones
// ---------------------------------------------------------------------------

function EmptyZones() {
  return (
    <section
      aria-label="Empty workspace zones"
      className="grid grid-cols-1 gap-4 lg:mt-6 lg:grid-cols-2 lg:gap-6"
    >
      <EmptyZone
        title="Your queue is empty"
        body="Tasks will appear here once you create test cases or connect a source."
        icon="doc"
      />
      <EmptyZone
        title="Nothing's happened yet"
        body="Activity shows up here as you and your team start working — test runs, defects, approvals."
        icon="clock"
      />
    </section>
  );
}

function EmptyZone({ title, body, icon }: { title: string; body: string; icon: 'doc' | 'clock' }) {
  return (
    <article className="flex items-start gap-4 rounded-xl border border-dashed border-[var(--border-subtle)] bg-transparent p-5">
      <span
        aria-hidden="true"
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--overlay)] text-[var(--text-tertiary)]"
      >
        {icon === 'doc' ? <DocIcon /> : <ClockIcon />}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h3 className="font-display text-[14px] font-semibold text-[var(--text-primary)]">
          {title}
        </h3>
        <p className="text-[12px] leading-[18px] text-[var(--text-tertiary)]">{body}</p>
      </div>
    </article>
  );
}

function DocIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 2v6h6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 7.5v5l3 2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

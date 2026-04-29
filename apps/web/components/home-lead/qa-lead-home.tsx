// F08b Home (QA Lead) — main orchestrator client component.
//
// Layout (mobile-first per CLAUDE.md Rule 12):
//   < lg (< 1024 px): top bar + main (single col stack)
//   >= lg: + left rail (240 px)
//   >= xl: + right rail (380 px) sticky aside
//
// Pattern A: page mount fires `pattern-a:deferred:home-lead-load`.
// Each Approve / Request changes / Reject fires
// `pattern-a:deferred:home-lead-action`. Each route attempt fires
// `pattern-a:deferred:home-route`. NO fetch / useMutation / axios.

'use client';

import { useEffect } from 'react';
import { useCurrentUser } from '@/lib/contexts/CurrentUserContext';
import { useActiveProject } from '@/lib/contexts/ProjectContext';
import { HomeShell } from './home-shell';
import { LeftRail } from './left-rail';
import { OutcomeBoard } from './outcome-board';
import { ApprovalsQueue } from './approvals-queue';
import { RightRail } from './right-rail';
import { HERO } from './data';

// View-specific stub: sprint metadata stays inline per ADR-006 / runbook step 4.
const ACTIVE_SPRINT = { number: 42, day: 9, length: 14 } as const;

export function QaLeadHome() {
  const me = useCurrentUser();
  const project = useActiveProject();

  useEffect(() => {
    console.info('pattern-a:deferred:home-lead-load', {
      project: project.key,
      sprint: ACTIVE_SPRINT.number,
      day: ACTIVE_SPRINT.day,
      role: me.organizationalLabel,
    });
  }, [project.key, me.organizationalLabel]);

  function logRoute(target: string) {
    console.info('pattern-a:deferred:home-route', { target });
  }

  function logAction(action: string, entityId: string) {
    console.info('pattern-a:deferred:home-lead-action', { action, entity_id: entityId });
  }

  return (
    <HomeShell>
      <div className="flex flex-1">
        <LeftRail />
        <div className="flex min-w-0 flex-1 flex-col xl:flex-row">
          <main className="flex min-w-0 flex-1 flex-col gap-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:gap-10">
            <Hero />
            <OutcomeBoard />
            <ApprovalsQueue onAction={logAction} onRoute={logRoute} />
          </main>
          <div className="px-4 pb-8 sm:px-6 lg:px-8 xl:p-0">
            <RightRail onRoute={logRoute} />
          </div>
        </div>
      </div>
    </HomeShell>
  );
}

// ---------------------------------------------------------------------------
// Hero — Lead-specific framing ("How is the team doing, and what needs approval?")
// ---------------------------------------------------------------------------

function Hero() {
  return (
    <section
      aria-labelledby="home-hero-head"
      className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
    >
      <div className="flex flex-col gap-2">
        <h1
          id="home-hero-head"
          className="font-display text-[24px] font-semibold leading-tight text-[var(--text-primary)] sm:text-[28px] lg:text-[32px]"
        >
          {HERO.heading}
        </h1>
        <p className="text-[14px] leading-[20px] text-[var(--text-secondary)] sm:text-[15px]">
          {HERO.sub}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <ActiveAgentsChip />
        <SprintChip />
        <ReleaseChip />
        <DateChip />
      </div>
    </section>
  );
}

function ActiveAgentsChip() {
  return (
    <span className="border-[var(--secondary)]/30 bg-[var(--secondary)]/10 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium text-[var(--secondary)]">
      <span
        aria-hidden="true"
        className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--secondary)]"
      >
        <span
          aria-hidden="true"
          className="absolute inset-0 animate-ping rounded-full bg-[var(--secondary)] opacity-60"
        />
      </span>
      A1 · A2 · A4 active
    </span>
  );
}

function SprintChip() {
  return (
    <span className="border-[var(--primary)]/30 bg-[var(--primary)]/10 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] font-medium text-[var(--primary)]">
      Sprint {ACTIVE_SPRINT.number} · Day {ACTIVE_SPRINT.day} of {ACTIVE_SPRINT.length}
    </span>
  );
}

function ReleaseChip() {
  return (
    <span className="inline-flex items-center rounded-full border border-[var(--border-subtle)] bg-[var(--raised)] px-2.5 py-1 font-mono text-[11px] text-[var(--text-tertiary)]">
      Ships {HERO.releaseShipDate}
    </span>
  );
}

function DateChip() {
  return (
    <span className="inline-flex items-center rounded-full border border-[var(--border-subtle)] bg-[var(--raised)] px-2.5 py-1 font-mono text-[11px] text-[var(--text-tertiary)]">
      {HERO.nowDate}
    </span>
  );
}

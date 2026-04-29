// F08a Home (QA Engineer) — main orchestrator client component.
//
// Layout (mobile-first per CLAUDE.md Rule 12):
//   < lg (< 1024 px): top bar + main content (single column, no left/right rails)
//   >= lg (1024 px+): left rail (240 px) + main content
//   >= xl (1280 px+): left rail (240 px) + main content + right rail (360 px)
//
// Pattern A: page mount fires `pattern-a:deferred:home-qa-engineer-load`.
// Each interactive route attempt fires `pattern-a:deferred:home-route` with
// { target, entity? }. NO fetch / useMutation / axios in this tree.

'use client';

import { useEffect } from 'react';
import { useCurrentUser } from '@/lib/contexts/CurrentUserContext';
import { useActiveProject } from '@/lib/contexts/ProjectContext';
import { HomeShell } from './home-shell';
import { LeftRail } from './left-rail';
import { OutcomeBoard } from './outcome-board';
import { Queue } from './queue';
import { RightRail } from './right-rail';
import { HERO } from './data';

// View-specific stub: sprint metadata isn't on the Project entity yet
// (lands when BE adds Sprint in M2+). Inline view constant per ADR-006 /
// runbook step 4.
const ACTIVE_SPRINT = { number: 42, day: 9, length: 14 } as const;

export function QaEngineerHome() {
  const me = useCurrentUser();
  const project = useActiveProject();

  useEffect(() => {
    console.info('pattern-a:deferred:home-qa-engineer-load', {
      project: project.key,
      sprint: ACTIVE_SPRINT.number,
      day: ACTIVE_SPRINT.day,
      role: me.role,
    });
  }, [project.key, me.role]);

  function logRoute(target: string, entity?: string) {
    console.info('pattern-a:deferred:home-route', entity ? { target, entity } : { target });
  }

  return (
    <HomeShell>
      <div className="flex flex-1">
        <LeftRail />
        <div className="flex min-w-0 flex-1 flex-col xl:flex-row">
          {/* Main content column */}
          <main className="flex min-w-0 flex-1 flex-col gap-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:gap-10">
            <Hero />
            <OutcomeBoard onRoute={logRoute} />
            <Queue onRoute={logRoute} />
          </main>
          {/* Right rail (becomes a stacked section below queue on < xl) */}
          <div className="px-4 pb-8 sm:px-6 lg:px-8 xl:p-0">
            <RightRail onRoute={logRoute} />
          </div>
        </div>
      </div>
    </HomeShell>
  );
}

// ---------------------------------------------------------------------------
// Hero / greeting (Region 1)
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
          className="font-display text-[24px] font-semibold leading-tight text-[var(--text-primary)] sm:text-[28px] lg:text-[30px]"
        >
          {HERO.heading}
        </h1>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] leading-[20px] text-[var(--text-secondary)] sm:text-[14px]">
          {HERO.subFragments.map((f, i) => (
            <span key={i} className="inline-flex items-center gap-2">
              <span className={f.tone === 'pass' ? 'font-medium text-[var(--pass)]' : ''}>
                {f.text}
              </span>
              {i < HERO.subFragments.length - 1 && (
                <span aria-hidden="true" className="text-[var(--text-disabled)]">
                  ·
                </span>
              )}
            </span>
          ))}
        </p>
      </div>

      {/* Right-side chip cluster */}
      <div className="flex flex-wrap items-center gap-2">
        <AiThinkingChip />
        <SprintChip />
        <DateChip />
      </div>
    </section>
  );
}

function AiThinkingChip() {
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
      A1 is thinking…
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

function DateChip() {
  return (
    <span className="inline-flex items-center rounded-full border border-[var(--border-subtle)] bg-[var(--raised)] px-2.5 py-1 font-mono text-[11px] text-[var(--text-tertiary)]">
      {HERO.nowDate}
    </span>
  );
}

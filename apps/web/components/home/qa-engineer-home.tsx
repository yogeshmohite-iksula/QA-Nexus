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
import { AdminShell } from '@/components/admin/admin-shell';
import { OutcomeBoard } from './outcome-board';
import { Queue } from './queue';
import { RightRail } from './right-rail';

// Fri WIRE batch 5: ACTIVE_SPRINT constant dropped (de-fictioned along with
// HERO + SprintChip + DateChip). Re-add when BE adds Sprint metadata to the
// Project entity (M2+).

export function QaEngineerHome() {
  const me = useCurrentUser();
  const project = useActiveProject();

  useEffect(() => {
    console.info('pattern-a:deferred:home-qa-engineer-load', {
      project: project.key,
      role: me.role,
    });
  }, [project.key, me.role]);

  function logRoute(target: string, entity?: string) {
    console.info('pattern-a:deferred:home-route', entity ? { target, entity } : { target });
  }

  return (
    <AdminShell active="home">
      {/* AdminShell owns the top bar + left rail (Hard Rule 14). The
          page is responsible only for its content area. F08's right
          rail stacks below main content on < xl per the original
          mobile-first layout. */}
      <div className="flex min-w-0 flex-1 flex-col xl:flex-row">
        <main className="flex min-w-0 flex-1 flex-col gap-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:gap-10">
          <Hero />
          <OutcomeBoard onRoute={logRoute} />
          <Queue onRoute={logRoute} />
        </main>
        <div className="px-4 pb-8 sm:px-6 lg:px-8 xl:p-0">
          <RightRail onRoute={logRoute} />
        </div>
      </div>
    </AdminShell>
  );
}

// ---------------------------------------------------------------------------
// Hero / greeting (Region 1)
// ---------------------------------------------------------------------------

/** Returns just the first name from a display name (e.g. "Yogesh M." → "Yogesh"). */
function firstNameOf(displayName: string): string {
  return displayName.trim().split(/\s+/)[0] ?? displayName;
}

function Hero() {
  // Fri WIRE batch 5 (2026-06-19): de-fictioned. Was canned `HERO.heading`
  // ("Sprint 42 · Day 9 of 14, …") + `HERO.subFragments` ("Refund regression
  // suite is queued / Release R-2026-04-PaymentV2 …"). Now: live greeting
  // from session + active project. No fake sprint, no fake release.
  const me = useCurrentUser();
  const project = useActiveProject();
  const firstName = firstNameOf(me.displayName);
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
          Welcome back, {firstName}.
        </h1>
        <p className="text-[13px] leading-[20px] text-[var(--text-secondary)] sm:text-[14px]">
          Working on <span className="font-medium text-[var(--text-primary)]">{project.name}</span>.
        </p>
      </div>

      {/* Right-side chip cluster — only the AI ambient chip survives the
       *  de-fiction; canonical sprint + date chips referenced fake data and
       *  are dropped (no equivalent BE endpoint). */}
      <div className="flex flex-wrap items-center gap-2">
        <AiThinkingChip />
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

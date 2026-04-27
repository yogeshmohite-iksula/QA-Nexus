// F07 Step 3 — Invite your team (atomic commit on submit).
// STUB for the Step 1 visual gate. Full UI lands in the Step 3 batch:
// dynamic email rows + role dropdowns + atomic submit that POSTs the
// merged wizard form (Steps 1+2+3) and, only on success, triggers the
// data-source flow (Pattern A per PM1_PRD §F07).

'use client';

import { Button } from '@/components/ui/button';

interface StepTeamInviteProps {
  onSubmit: () => void | Promise<void>;
  onBack: () => void;
}

export function StepTeamInvite({ onSubmit, onBack }: StepTeamInviteProps) {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h2 className="font-display text-[22px] font-bold leading-tight text-[var(--text-primary)] sm:text-[26px] lg:text-[28px]">
          Invite your team
        </h2>
        <p className="text-[14px] leading-[20px] text-[var(--text-tertiary)]">
          Step 3 — placeholder. Full UI lands in the next batch (atomic commit + Pattern A
          data-source flow trigger).
        </p>
      </header>

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-11 min-h-11 items-center justify-center gap-1.5 rounded-[4px] border border-[var(--border-subtle)] bg-transparent px-4 text-[14px] font-medium text-[var(--text-secondary)] hover:bg-[var(--raised)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
        >
          <span aria-hidden="true">←</span> Back
        </button>
        <Button type="button" onClick={() => onSubmit()} className="min-h-11">
          Create workspace
          <span aria-hidden="true">→</span>
        </Button>
      </div>
    </div>
  );
}

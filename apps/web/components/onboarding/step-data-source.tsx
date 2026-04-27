// F07 Step 2 — Data source choice (Jira | Upload).
// STUB for the Step 1 visual gate. Pattern A per PM1_PRD §F07: this step
// only STORES the user's selection in wizard state — it does NOT trigger
// the data-source flow (Jira OAuth handshake or Upload modal). The flow
// fires only AFTER Step 3's atomic commit succeeds (see founder-wizard.tsx
// handleSubmitFinal). Full UI in the Step 2 batch.

'use client';

import { Button } from '@/components/ui/button';

interface StepDataSourceProps {
  onNext: () => void;
  onBack: () => void;
}

export function StepDataSource({ onNext, onBack }: StepDataSourceProps) {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h2 className="font-display text-[22px] font-bold leading-tight text-[var(--text-primary)] sm:text-[26px] lg:text-[28px]">
          Choose a data source
        </h2>
        <p className="text-[14px] leading-[20px] text-[var(--text-tertiary)]">
          Step 2 — placeholder. Full UI lands in the next batch (Pattern A: store selection, defer
          flow trigger to after Step 3 atomic commit).
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
        <Button type="button" onClick={onNext} className="min-h-11">
          Continue
          <span aria-hidden="true">→</span>
        </Button>
      </div>
    </div>
  );
}

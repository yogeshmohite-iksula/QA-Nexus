// F07 wizard progress indicator (3 step pills + connector lines).
// Mirrors the locked HTML's .step-pill / .step-active / .step-done / .step-todo
// classes, translated to Tailwind + locked CSS variables.

'use client';

type StepStatus = 'active' | 'done' | 'todo';

const STEPS = [
  { num: 1, label: 'Create project' },
  { num: 2, label: 'Choose data source' },
  { num: 3, label: 'Invite your team' },
] as const;

interface WizardProgressProps {
  currentStep: 1 | 2 | 3;
}

export function WizardProgress({ currentStep }: WizardProgressProps) {
  return (
    <nav
      aria-label="Onboarding progress"
      className="flex w-full flex-wrap items-center justify-center gap-x-2 gap-y-2 sm:gap-x-3"
    >
      {STEPS.map((step, i) => {
        const status: StepStatus =
          step.num < currentStep ? 'done' : step.num === currentStep ? 'active' : 'todo';
        const isLast = i === STEPS.length - 1;
        return (
          <div key={step.num} className="flex items-center gap-2 sm:gap-3">
            <StepPill num={step.num} label={step.label} status={status} />
            {!isLast && <StepLine done={step.num < currentStep} />}
          </div>
        );
      })}
    </nav>
  );
}

function StepPill({ num, label, status }: { num: number; label: string; status: StepStatus }) {
  const isActive = status === 'active';
  const isDone = status === 'done';

  const wrap = [
    'inline-flex items-center gap-2 h-9 px-3 sm:px-4 rounded-full text-[13px] whitespace-nowrap transition-colors',
    isActive
      ? 'bg-[var(--primary)] text-[var(--primary-ink)] font-semibold'
      : isDone
        ? 'border border-[var(--primary)] text-[var(--primary)]'
        : 'border border-[var(--border-subtle)] text-[var(--text-tertiary)]',
  ].join(' ');

  const numChip = [
    'inline-flex items-center justify-center w-[18px] h-[18px] rounded-full font-mono text-[11px]',
    isActive
      ? 'bg-[#003732]/40 text-[var(--primary-ink)]'
      : isDone
        ? 'text-[var(--primary)]'
        : 'border border-[var(--border-subtle)] text-[var(--text-tertiary)]',
  ].join(' ');

  return (
    <span aria-current={isActive ? 'step' : undefined} className={wrap}>
      <span className={numChip} aria-hidden="true">
        {num}
      </span>
      <span className="hidden sm:inline">{label}</span>
      <span className="sr-only">
        {isActive ? 'Current step: ' : ''}
        {label}
      </span>
    </span>
  );
}

function StepLine({ done }: { done: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={[
        'h-[2px] w-6 rounded-[2px] sm:w-10',
        done ? 'bg-[var(--primary)]' : 'bg-[var(--border-subtle)]',
      ].join(' ')}
    />
  );
}

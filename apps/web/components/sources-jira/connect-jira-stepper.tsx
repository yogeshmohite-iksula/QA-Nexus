// 3-step pill indicator for F11 Source Connect Jira wizard.
// Same component will be reused by F11b (Map) + F11c (Verify) when those
// land — pass `current` 1/2/3 to highlight the active pill.

'use client';

interface ConnectJiraStepperProps {
  current: 1 | 2 | 3;
}

const STEPS = [
  { num: 1, label: 'Authorize' },
  { num: 2, label: 'Map' },
  { num: 3, label: 'Verify' },
] as const;

export function ConnectJiraStepper({ current }: ConnectJiraStepperProps) {
  return (
    <nav aria-label="Connect Jira progress" className="flex flex-col items-center gap-3">
      <ol className="flex w-full max-w-[640px] flex-wrap items-center justify-center gap-2 sm:gap-3">
        {STEPS.map((step, idx) => {
          const isCurrent = step.num === current;
          const isComplete = step.num < current;
          return (
            <li key={step.num} className="flex flex-1 items-center gap-2 sm:flex-initial sm:gap-3">
              <span
                aria-current={isCurrent ? 'step' : undefined}
                className={[
                  'inline-flex h-9 items-center gap-2 rounded-full border px-3 text-[12.5px] font-medium sm:px-4 sm:text-[13px]',
                  isCurrent
                    ? 'border-[var(--primary)] bg-[var(--primary)] font-semibold text-[var(--primary-ink)]'
                    : isComplete
                      ? 'border-[var(--primary)]/40 bg-[var(--primary)]/10 text-[var(--primary)]'
                      : 'border-[var(--border-subtle)] bg-transparent text-[var(--text-tertiary)]',
                ].join(' ')}
              >
                <span
                  aria-hidden="true"
                  className={[
                    'inline-flex h-[22px] w-[22px] items-center justify-center rounded-full font-mono text-[11px] font-semibold',
                    isCurrent
                      ? 'bg-[var(--primary-ink)]/25 text-[var(--primary-ink)]'
                      : isComplete
                        ? 'bg-[var(--primary)]/20 text-[var(--primary)]'
                        : 'bg-[var(--raised)] text-[var(--text-tertiary)]',
                  ].join(' ')}
                >
                  {isComplete ? (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2.5 6.3l2.2 2.2L9.5 3.5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    step.num
                  )}
                </span>
                <span className="truncate">{step.label}</span>
              </span>
              {idx < STEPS.length - 1 && (
                <span
                  aria-hidden="true"
                  className="hidden h-[2px] w-12 shrink-0 bg-[var(--border-subtle)] sm:inline-block"
                />
              )}
            </li>
          );
        })}
      </ol>
      <span className="font-mono text-[11px] text-[var(--text-tertiary)]">Step {current} of 3</span>
    </nav>
  );
}

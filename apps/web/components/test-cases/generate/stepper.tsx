// F16b · 4-step stepper (Source done → Generate current → Review → Accept).
//
// Direct port of F16b A1 Generate from Requirement v2.html lines 240-262
// (.stepper / .step). Pure presentational — phase is driven by the
// parent page's state.

'use client';

import { Check } from 'lucide-react';

export type StepKey = 'source' | 'generate' | 'review' | 'accept';

interface StepDef {
  key: StepKey;
  num: number;
  label: string;
  meta: string;
}

const STEPS: StepDef[] = [
  { key: 'source', num: 1, label: 'Source', meta: 'RET-247 + 3 chunks' },
  { key: 'generate', num: 2, label: 'Generate', meta: 'streaming · 3 of 5' },
  { key: 'review', num: 3, label: 'Review', meta: 'accept · edit · reject' },
  { key: 'accept', num: 4, label: 'Accept', meta: 'save to suite' },
];

interface StepperProps {
  /** Currently active step. Steps before are 'done', steps after are
   *  default. */
  current: StepKey;
}

export function Stepper({ current }: StepperProps) {
  const currentIdx = STEPS.findIndex((s) => s.key === current);

  return (
    <nav
      aria-label="Generate phases"
      className="flex h-16 flex-none items-center overflow-x-auto border-y px-4 sm:px-6"
      style={{
        background: 'var(--base)',
        borderColor: 'var(--border)',
      }}
    >
      {STEPS.map((step, idx) => {
        const isDone = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const tone = isDone ? 'done' : isCurrent ? 'current' : 'default';
        return <Step key={step.key} step={step} tone={tone} withDivider={idx > 0} />;
      })}
    </nav>
  );
}

interface StepProps {
  step: StepDef;
  tone: 'done' | 'current' | 'default';
  withDivider: boolean;
}

function Step({ step, tone, withDivider }: StepProps) {
  return (
    <div
      className="relative flex min-w-[120px] flex-1 items-center justify-center gap-2.5 py-[18px] text-[13px] font-semibold"
      style={{
        color:
          tone === 'current'
            ? 'var(--text-primary)'
            : tone === 'done'
              ? 'var(--text-secondary)'
              : 'var(--text-tertiary)',
        borderBottom: `2px solid ${tone === 'current' ? 'var(--primary)' : 'transparent'}`,
        lineHeight: 1,
      }}
    >
      {withDivider && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-1/2 h-[18px] w-px -translate-y-1/2"
          style={{ background: 'var(--border)' }}
        />
      )}
      <span
        className="inline-flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full font-mono text-[10.5px] font-semibold"
        style={
          tone === 'done'
            ? {
                background: 'rgba(45,212,191,0.10)',
                border: '1.5px solid var(--primary)',
                color: 'var(--primary)',
              }
            : tone === 'current'
              ? {
                  background: 'var(--primary)',
                  border: '1.5px solid var(--primary)',
                  color: 'var(--primary-ink)',
                  boxShadow: '0 0 0 4px rgba(45,212,191,0.10)',
                }
              : {
                  border: '1.5px solid var(--border-strong)',
                }
        }
      >
        {tone === 'done' ? <Check size={11} strokeWidth={3} /> : step.num}
      </span>
      <span className="flex flex-col items-start gap-px">
        <span className="text-[13px] font-semibold">{step.label}</span>
        <span
          className="font-mono text-[10px] font-normal"
          style={{
            color:
              tone === 'current'
                ? 'var(--primary)'
                : tone === 'done'
                  ? 'var(--pass)'
                  : 'var(--text-quaternary, var(--text-tertiary))',
          }}
        >
          {step.meta}
        </span>
      </span>
    </div>
  );
}

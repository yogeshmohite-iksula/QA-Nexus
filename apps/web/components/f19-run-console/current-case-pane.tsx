// F19 Pane 2 — Current case — v2 HTML L744-L850.
//
// Curator dedup hint + Steps (BDD format) + Action buttons + Notes.

'use client';

import { Check, X, Ban, SkipForward, Paperclip, Mic } from 'lucide-react';
import { LiveTag } from './live-pill';
import type { CurrentCase, BddStep } from './canned-data';

interface Props {
  current: CurrentCase;
  onStepAction: (action: 'pass' | 'fail' | 'block' | 'skip') => void;
  onCuratorClick: () => void;
  onAttachEvidence: () => void;
  onVoiceMemo: () => void;
  onNotesChange: (value: string) => void;
}

export function CurrentCasePane({
  current,
  onStepAction,
  onCuratorClick,
  onAttachEvidence,
  onVoiceMemo,
  onNotesChange,
}: Props) {
  return (
    <section
      aria-label="Current case"
      className="flex min-h-0 flex-col overflow-y-auto"
      style={{ background: 'var(--base)' }}
    >
      {/* Head */}
      <header
        className="flex-none border-b px-4 py-4 sm:px-5"
        style={{ borderColor: 'var(--border)' }}
      >
        <div
          className="mb-1.5 text-[10px] font-bold uppercase"
          style={{ color: 'var(--info)', letterSpacing: '0.12em' }}
        >
          {current.eyebrowLabel}{' '}
          <span className="ml-1 font-mono normal-case" style={{ color: 'var(--t4)' }}>
            {current.seqLabel}
          </span>
        </div>
        <h2
          className="m-0 mb-2 text-[22px] font-bold leading-[28px]"
          style={{
            color: 'var(--t1)',
            fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
          }}
        >
          {current.title}
        </h2>
        {/* Day-25 Round-3 fix per Yogesh "button size are more" feedback:
            tightened all chip padding from px-2 py-1 (Round-2 bumped) back to
            px-1.5 py-0.5 (compact, matches canonical chip-row zoom). Composer
            ⓘ icon shrunk from h-3.5 w-3.5 → h-3 w-3 to fit compact chip.
            - TC-RET-0247 stays as bare teal mono ID (no chip wrap)
            - Other chips uppercase + tracking-wider, compact padding
            - Composer chip keeps violet --ai-soft + mixed-case name */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] font-bold" style={{ color: 'var(--primary)' }}>
            {current.id}
          </span>
          {current.tags.map((t) => (
            <span
              key={t.label}
              className="rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
              style={{
                background: 'var(--base)',
                borderColor: 'var(--border)',
                color: t.dim ? 'var(--t4)' : 'var(--t2)',
              }}
            >
              {t.label}
            </span>
          ))}
          <span
            className="inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold"
            style={{
              background: 'var(--ai-soft)',
              borderColor: 'var(--ai-line)',
              color: 'var(--secondary)',
            }}
          >
            {current.agent.code}
            <span
              aria-hidden="true"
              className="inline-flex h-3 w-3 items-center justify-center rounded-full text-[8px] font-bold"
              style={{ background: 'var(--secondary)', color: 'var(--secondary-ink)' }}
              title={`${current.agent.code} agent`}
            >
              i
            </span>
            <span className="font-mono opacity-70">{current.agent.version}</span>
          </span>
          <span
            className="rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
            style={{
              background: 'var(--base)',
              borderColor: 'var(--border)',
              color: 'var(--t4)',
            }}
          >
            {current.owner}
          </span>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-col gap-4 px-4 py-4 sm:px-5">
        {/* Curator dedup hint */}
        <button
          type="button"
          role="note"
          onClick={onCuratorClick}
          className="flex items-start gap-2 rounded-md border px-3 py-2.5 text-left text-[12px] leading-[1.45] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
          style={{
            background: 'var(--ai-soft)',
            borderColor: 'var(--ai-line)',
            color: 'var(--t2)',
          }}
        >
          <span
            aria-hidden="true"
            className="mt-0.5 inline-flex h-4 w-4 flex-none items-center justify-center rounded-full text-[10px] font-bold"
            style={{ background: 'var(--secondary)', color: 'var(--secondary-ink)' }}
          >
            i
          </span>
          <span>
            <b style={{ color: 'var(--ai-accent)' }}>Curator</b> flagged this similar to{' '}
            <span
              className="rounded px-1 font-mono text-[11px]"
              style={{ background: 'var(--canvas)', color: 'var(--t1)' }}
            >
              {current.curatorDedupTargetId}
            </span>{' '}
            — review for dedup after run.
          </span>
        </button>

        {/* Steps */}
        <section aria-label="Test steps">
          <header className="mb-2 flex items-center justify-between">
            <span
              className="text-[11px] font-semibold uppercase tracking-[0.06em]"
              style={{ color: 'var(--t3)' }}
            >
              {current.stepsHeadLabel}
            </span>
            <span className="font-mono text-[10.5px]" style={{ color: 'var(--t4)' }}>
              {current.stepsProgress}
            </span>
          </header>
          <ol className="m-0 flex list-none flex-col gap-2 p-0">
            {current.steps.map((s) => (
              <StepRow key={s.num} step={s} />
            ))}
          </ol>
        </section>

        {/* Action buttons */}
        <div
          role="group"
          aria-label="Step result"
          className="grid flex-none grid-cols-2 gap-2 sm:grid-cols-4"
        >
          <ActionButton
            label="Pass"
            kbd="P"
            variant="pass"
            icon={<Check size={15} strokeWidth={3} aria-hidden="true" />}
            onClick={() => onStepAction('pass')}
          />
          <ActionButton
            label="Fail"
            kbd="F"
            variant="fail"
            icon={<X size={15} strokeWidth={3} aria-hidden="true" />}
            onClick={() => onStepAction('fail')}
          />
          <ActionButton
            label="Block"
            kbd="B"
            variant="warn"
            icon={<Ban size={15} strokeWidth={2.5} aria-hidden="true" />}
            onClick={() => onStepAction('block')}
          />
          <ActionButton
            label="Skip"
            kbd="S"
            variant="dim"
            icon={<SkipForward size={15} strokeWidth={2.5} aria-hidden="true" />}
            onClick={() => onStepAction('skip')}
          />
        </div>

        {/* Notes */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span
              className="text-[11px] font-semibold uppercase tracking-[0.06em]"
              style={{ color: 'var(--t3)' }}
            >
              Execution notes
            </span>
            <div className="flex flex-wrap gap-1.5">
              <NotesTool
                icon={<Paperclip size={12} aria-hidden="true" />}
                label="Attach evidence"
                onClick={onAttachEvidence}
              />
              <NotesTool
                icon={<Mic size={12} aria-hidden="true" />}
                label="Voice memo"
                onClick={onVoiceMemo}
              />
            </div>
          </div>
          <textarea
            className="min-h-[88px] w-full rounded-md border bg-[var(--base)] p-3 text-[12.5px] leading-[1.5] outline-none focus:border-[var(--primary)]"
            style={{ borderColor: 'var(--border)', color: 'var(--t2)' }}
            placeholder="Capture what happened — auto-saves on Pass / Fail. On Fail, Sherlock will pull this into 5-layer RCA."
            onChange={(e) => onNotesChange(e.target.value)}
          />
        </div>
      </div>
    </section>
  );
}

function StepRow({ step }: { step: BddStep }) {
  const isDone = step.status === 'done';
  const isCurrent = step.status === 'current';
  const numTone = isDone
    ? { bg: 'var(--pass-soft)', fg: 'var(--pass)', bd: 'var(--pass-line)' }
    : isCurrent
      ? { bg: 'var(--info-soft)', fg: 'var(--info)', bd: 'var(--info-line)' }
      : { bg: 'var(--canvas)', fg: 'var(--t4)', bd: 'var(--border)' };
  return (
    <li
      className="flex items-start gap-3 rounded-md border px-3 py-2.5"
      style={{
        borderColor: isCurrent ? 'var(--info-line)' : 'var(--border)',
        background: isCurrent ? 'var(--info-soft)' : 'var(--base)',
      }}
    >
      <span
        aria-hidden="true"
        className="inline-flex h-6 w-6 flex-none items-center justify-center rounded-full border font-mono text-[11.5px] font-bold"
        style={{
          background: numTone.bg,
          color: numTone.fg,
          borderColor: numTone.bd,
        }}
      >
        {isDone ? <Check size={12} strokeWidth={3.2} aria-hidden="true" /> : step.num}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="m-0 text-[13px] leading-[1.45]" style={{ color: 'var(--t1)' }}>
          <span
            className="mr-1.5 font-mono text-[12px] font-semibold uppercase"
            style={{ color: 'var(--secondary)' }}
          >
            {step.keyword}
          </span>
          {step.text}
          {step.monoToken && (
            <>
              {' '}
              <code
                className="rounded px-1 font-mono text-[11.5px]"
                style={{ background: 'var(--canvas)', color: 'var(--ai-accent)' }}
              >
                {step.monoToken}
              </code>
            </>
          )}
        </p>
        {step.meta && (
          <p className="m-0 text-[11px]" style={{ color: 'var(--t3)' }}>
            {step.isExecuting ? <LiveTag label={step.meta} /> : step.meta}
          </p>
        )}
      </div>
    </li>
  );
}

function ActionButton({
  label,
  kbd,
  variant,
  icon,
  onClick,
}: {
  label: string;
  kbd: string;
  variant: 'pass' | 'fail' | 'warn' | 'dim';
  icon: React.ReactNode;
  onClick: () => void;
}) {
  // Canonical F19 v2 HTML L407-L414: FILLED variant.
  // .act-pass  = solid --pass bg + --pass-ink text + --pass border + green glow hover
  // .act-fail  = solid --fail bg + --fail-ink text + --fail border + red glow hover
  // .act-block = solid --warn bg + --warn-ink text + --warn border + amber glow hover
  // .act-skip  = transparent bg + --t2 text + --border-strong border, --raised bg on hover
  const tones = {
    pass: {
      bg: 'var(--pass)',
      fg: 'var(--pass-ink)',
      bd: 'var(--pass)',
      glow: '0 0 18px -4px rgba(52,211,153,0.5)',
    },
    fail: {
      bg: 'var(--fail)',
      fg: 'var(--fail-ink)',
      bd: 'var(--fail)',
      glow: '0 0 18px -4px rgba(248,113,113,0.5)',
    },
    warn: {
      bg: 'var(--warn)',
      fg: 'var(--warn-ink)',
      bd: 'var(--warn)',
      glow: '0 0 18px -4px rgba(251,191,36,0.5)',
    },
    dim: {
      bg: 'transparent',
      fg: 'var(--t2)',
      bd: 'var(--border-strong)',
      glow: 'none',
    },
  }[variant];
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = tones.glow;
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
      className="inline-flex h-11 min-h-[44px] items-center justify-center gap-1.5 rounded-[7px] border px-2.5 text-[13px] font-semibold transition-[transform,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
      style={{
        background: tones.bg,
        borderColor: tones.bd,
        color: tones.fg,
      }}
    >
      {icon}
      <span>{label}</span>
      <kbd
        className="rounded font-mono text-[10px] font-bold leading-none"
        style={{
          background: 'rgba(0,0,0,0.25)',
          color: variant === 'dim' ? 'var(--t3)' : 'inherit',
          padding: '1px 5px',
        }}
      >
        {kbd}
      </kbd>
    </button>
  );
}

function NotesTool({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-9 min-h-[36px] items-center gap-1.5 rounded-md border px-2.5 text-[11.5px] transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
      style={{
        background: 'var(--canvas)',
        borderColor: 'var(--border)',
        color: 'var(--t3)',
      }}
    >
      {icon}
      {label}
    </button>
  );
}

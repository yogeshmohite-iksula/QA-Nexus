// F07 Step 3 — Invite your team (atomic commit on submit).
//
// Dynamic invite list backed by react-hook-form's useFieldArray. Each row
// is { email, role }; "+ Add another" appends a blank row, the trash icon
// removes one. Empty rows are filtered out by buildFounderAtomicPayload
// in schemas.ts before the (deferred) atomic commit fires.
//
// Pattern A (PM1_PRD §F07): the "Create workspace" button calls onSubmit,
// which routes to founder-wizard.tsx#handleSubmitFinal. That handler ONLY
// logs `pattern-a:deferred:*` markers and writes the payload to the
// console — NO network call. The real POST /onboarding/founder + the
// Jira-OAuth / Upload-modal triggers live behind MS0-T030.4 + T021.

'use client';

import { useFieldArray, useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { inviteRoleLabel, inviteRoles, type FounderWizardForm, type InviteRole } from './schemas';

interface StepTeamInviteProps {
  onSubmit: () => void | Promise<void>;
  onBack: () => void;
}

const MAX_INVITES = 8; // Iksula pilot caps at 8 users (CLAUDE.md roster).

export function StepTeamInvite({ onSubmit, onBack }: StepTeamInviteProps) {
  const {
    control,
    register,
    watch,
    formState: { errors, isSubmitting },
  } = useFormContext<FounderWizardForm>();

  const { fields, append, remove } = useFieldArray<FounderWizardForm, 'invites'>({
    control,
    name: 'invites',
  });

  const filledCount = (watch('invites') ?? []).filter(
    (inv) => inv?.email && inv.email.trim().length > 0,
  ).length;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await onSubmit();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-7" noValidate>
      <header className="flex flex-col gap-2">
        <h2 className="font-display text-[22px] font-bold leading-tight text-[var(--text-primary)] sm:text-[26px] lg:text-[28px]">
          Invite your team
        </h2>
        <p className="text-[14px] leading-[20px] text-[var(--text-tertiary)]">
          Add the QA folks who&apos;ll work in this project. You can edit roles later. Empty rows
          are skipped, so it&apos;s fine to leave some blank.
        </p>
      </header>

      <ul className="flex flex-col gap-3">
        {fields.map((row, index) => {
          const emailError = errors.invites?.[index]?.email?.message;
          return (
            <li key={row.id} className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3">
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <label
                  htmlFor={`invite-email-${index}`}
                  className="font-mono text-[12px] font-semibold uppercase tracking-[0.05em] text-[var(--text-tertiary)]"
                >
                  Email
                  <span className="sr-only"> for invitee {index + 1}</span>
                </label>
                <input
                  id={`invite-email-${index}`}
                  type="email"
                  inputMode="email"
                  autoComplete="off"
                  placeholder="teammate@iksula.com"
                  aria-invalid={emailError ? 'true' : 'false'}
                  className="h-11 min-h-11 w-full rounded-[4px] border border-[var(--border-subtle)] bg-[var(--raised)] px-4 text-[14px] text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-tertiary)] placeholder:opacity-60 focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] focus:ring-opacity-30"
                  {...register(`invites.${index}.email`)}
                />
                {emailError && (
                  <span role="alert" className="text-[12px] leading-[16px] text-[var(--fail)]">
                    {emailError}
                  </span>
                )}
              </div>

              <div className="flex shrink-0 flex-col gap-1.5 sm:w-44">
                <label
                  htmlFor={`invite-role-${index}`}
                  className="font-mono text-[12px] font-semibold uppercase tracking-[0.05em] text-[var(--text-tertiary)]"
                >
                  Role
                </label>
                <select
                  id={`invite-role-${index}`}
                  className="h-11 min-h-11 w-full rounded-[4px] border border-[var(--border-subtle)] bg-[var(--raised)] px-3 text-[14px] text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] focus:ring-opacity-30"
                  {...register(`invites.${index}.role` as const)}
                >
                  {inviteRoles.map((r) => (
                    <option key={r} value={r}>
                      {inviteRoleLabel[r as InviteRole]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex sm:items-end sm:pb-0 sm:pt-7">
                <button
                  type="button"
                  onClick={() => remove(index)}
                  disabled={fields.length <= 1}
                  aria-label={`Remove invitee ${index + 1}`}
                  className="inline-flex h-11 min-h-11 w-11 items-center justify-center rounded-[4px] border border-transparent text-[var(--text-tertiary)] hover:border-[var(--border-subtle)] hover:text-[var(--fail)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <TrashIcon />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="-mt-2 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => append({ email: '', role: 'qa-engineer' })}
          disabled={fields.length >= MAX_INVITES}
          className="inline-flex h-9 items-center gap-1.5 px-3 text-[13px] font-medium text-[var(--primary)] hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <PlusIcon />
          Add another
        </button>
        <span aria-live="polite" className="text-[12px] leading-[16px] text-[var(--text-tertiary)]">
          {filledCount === 0
            ? 'No invites yet — you can skip this and add team later.'
            : `${filledCount} ${filledCount === 1 ? 'invite' : 'invites'} ready (Iksula pilot cap: ${MAX_INVITES}).`}
        </span>
      </div>

      {/* Atomic-commit note */}
      <aside
        aria-label="Atomic commit notice"
        className="flex items-start gap-3 rounded-[6px] border border-[var(--border-subtle)] bg-[var(--raised)] p-4"
      >
        <span aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--primary)]">
          <ShieldIcon />
        </span>
        <div className="flex flex-col gap-1">
          <span className="text-[13px] font-semibold text-[var(--text-primary)]">
            One atomic commit creates everything.
          </span>
          <p className="text-[12px] leading-[18px] text-[var(--text-tertiary)]">
            Project, invites, and your data-source choice are written together. If anything fails,
            nothing is created — no half-set-up workspace.
          </p>
        </div>
      </aside>

      {/* Footer */}
      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="inline-flex h-11 min-h-11 items-center justify-center gap-1.5 rounded-[4px] border border-[var(--border-subtle)] bg-transparent px-4 text-[14px] font-medium text-[var(--text-secondary)] hover:bg-[var(--raised)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] disabled:opacity-50"
        >
          <span aria-hidden="true">←</span> Back
        </button>
        <Button type="submit" disabled={isSubmitting} className="min-h-11">
          {isSubmitting ? 'Creating workspace…' : 'Create workspace'}
          <span aria-hidden="true">→</span>
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Inline icons
// ---------------------------------------------------------------------------

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3 4 6v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V6l-8-3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m9 12 2 2 4-4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// F27m1 Invite User Modal — overlay rendered on top of /admin/users.
// Locked source: PM1_UI_v2/frames - claude code build (PM1 v2.6-v2.8)/F27m1 Invite User Modal.html
// Mounted by /admin/users/invite route on top of the F27 page underneath.
//
// Pattern A enforcement (PM1_PRD §F27m1) — 9 deferred markers:
// - Mount → `pattern-a:deferred:invite-modal-open` { rowCount, defaults }.
// - Bulk-apply click → `pattern-a:deferred:invite-bulk-apply`
//     { role, projectKeys, rowCount }.
// - Row email change → `pattern-a:deferred:invite-row-email-change`
//     { rowIndex } (debounced).
// - Row role change → `pattern-a:deferred:invite-row-role-change`
//     { rowIndex, role }.
// - Row project toggle → `pattern-a:deferred:invite-row-project-toggle`
//     { rowIndex, projectKey, action: 'add' | 'remove' }.
// - Add another → `pattern-a:deferred:invite-add-row` { newCount }.
// - Remove row → `pattern-a:deferred:invite-remove-row`
//     { rowIndex, newCount }.
// - Submit → `pattern-a:deferred:invite-submit`
//     { rowCount, validatedCount, hasMessage }.
// - Cancel + Esc + backdrop → `pattern-a:deferred:invite-cancel` + route
//     to /admin/users.
// - Validation errors → `pattern-a:deferred:invite-validation-error`
//     { rowIndex, fields }.
// - ZERO fetch / useMutation / axios.
//
// ADR-006 hooks:
// - `useCurrentUser()` — modal header attribution + workspace ID.
// - `useProjectList()` — project-chip picker options.
// (No `useTeamRoster()` here — invites go to NEW emails not on the seed.)

'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCurrentUser } from '@/lib/contexts/CurrentUserContext';
import { useProjectList } from '@/lib/contexts/ProjectContext';
import {
  buildInvitePayload,
  inviteFormDefaults,
  inviteFormSchema,
  inviteRoleLabel,
  inviteRoles,
  isLikelyEmail,
  parseEmailBlob,
  type InviteForm,
  type InviteRole,
} from './invite-user-schema';

interface InviteUserModalProps {
  onClose: () => void;
}

export function InviteUserModal({ onClose }: InviteUserModalProps) {
  const router = useRouter();
  const titleId = useId();
  const me = useCurrentUser();
  const projects = useProjectList();

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, isValid, isSubmitting },
  } = useForm<InviteForm>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: inviteFormDefaults,
    mode: 'onChange',
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'rows' });

  const personalMessage = watch('personalMessage') ?? '';
  const allRows = watch('rows');
  const validRowCount = useMemo(
    () => allRows.filter((r) => isLikelyEmail(r.email) && r.projectKeys.length > 0).length,
    [allRows],
  );

  // Bulk-apply local state (defaults to first-row values, applied on click).
  const [bulkRole, setBulkRole] = useState<InviteRole>('qa-engineer');
  const [bulkProjects, setBulkProjects] = useState<string[]>([]);

  useEffect(() => {
    console.info('pattern-a:deferred:invite-modal-open', {
      workspaceId: me.workspaceId,
      rowCount: fields.length,
      projectsAvailable: projects.length,
    });
    // Esc + body-scroll-lock. Inline the cancel call (don't close over the
    // unstable `handleCancel` ref) so the effect's deps array stays empty
    // for setup/cleanup but we still log the deferred-cancel marker.
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        console.info('pattern-a:deferred:invite-cancel', { trigger: 'esc' });
        onClose();
      }
    }
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [me.workspaceId, fields.length, projects.length, onClose]);

  function handleCancel() {
    console.info('pattern-a:deferred:invite-cancel', { rowCount: fields.length });
    onClose();
  }

  function handleBulkApply() {
    console.info('pattern-a:deferred:invite-bulk-apply', {
      role: bulkRole,
      projectKeys: bulkProjects,
      rowCount: fields.length,
    });
    const current = getValues('rows');
    current.forEach((_, idx) => {
      setValue(`rows.${idx}.role`, bulkRole, { shouldDirty: true, shouldValidate: true });
      setValue(`rows.${idx}.projectKeys`, [...bulkProjects], {
        shouldDirty: true,
        shouldValidate: true,
      });
    });
  }

  function handleAddRow() {
    append({ email: '', role: bulkRole, projectKeys: [...bulkProjects] });
    console.info('pattern-a:deferred:invite-add-row', { newCount: fields.length + 1 });
  }

  function handleRemoveRow(idx: number) {
    if (fields.length <= 1) return;
    remove(idx);
    console.info('pattern-a:deferred:invite-remove-row', {
      rowIndex: idx,
      newCount: fields.length - 1,
    });
  }

  function handleEmailBlobPaste(rowIdx: number, e: React.ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData('text');
    const list = parseEmailBlob(text);
    if (list.length <= 1) return; // single email — let default paste handle
    e.preventDefault();
    // Set first email into the current row, append new rows for the rest.
    setValue(`rows.${rowIdx}.email`, list[0], { shouldValidate: true, shouldDirty: true });
    for (let i = 1; i < list.length; i++) {
      append({ email: list[i], role: bulkRole, projectKeys: [...bulkProjects] });
    }
  }

  function handleProjectToggle(rowIdx: number, projectKey: string) {
    const current = getValues(`rows.${rowIdx}.projectKeys`);
    const has = current.includes(projectKey);
    const next = has ? current.filter((k) => k !== projectKey) : [...current, projectKey];
    setValue(`rows.${rowIdx}.projectKeys`, next, { shouldDirty: true, shouldValidate: true });
    console.info('pattern-a:deferred:invite-row-project-toggle', {
      rowIndex: rowIdx,
      projectKey,
      action: has ? 'remove' : 'add',
    });
  }

  function handleBulkProjectToggle(projectKey: string) {
    setBulkProjects((prev) =>
      prev.includes(projectKey) ? prev.filter((k) => k !== projectKey) : [...prev, projectKey],
    );
  }

  function onValid(values: InviteForm) {
    const payload = buildInvitePayload(values);
    console.info('pattern-a:deferred:invite-submit', {
      rowCount: payload.rows.length,
      validatedCount: payload.rows.length,
      hasMessage: Boolean(payload.personalMessage),
    });
    onClose();
    router.push('/admin/users');
  }

  function onInvalid(formErrors: Record<string, unknown>) {
    console.info('pattern-a:deferred:invite-validation-error', {
      fields: Object.keys(formErrors),
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-stretch justify-center md:items-start md:p-6"
    >
      <button
        type="button"
        aria-label="Close invite modal"
        onClick={handleCancel}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <div className="relative z-10 flex w-full max-w-[720px] flex-col overflow-hidden bg-[var(--base)] shadow-2xl md:mt-12 md:max-h-[calc(100vh-6rem)] md:rounded-xl md:border md:border-[var(--border-subtle)]">
        <Header titleId={titleId} onClose={handleCancel} />

        <form onSubmit={handleSubmit(onValid, onInvalid)} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
            <BulkApplyPanel
              projects={projects}
              role={bulkRole}
              setRole={setBulkRole}
              projectKeys={bulkProjects}
              onProjectToggle={handleBulkProjectToggle}
              rowCount={fields.length}
              onApply={handleBulkApply}
            />

            <div className="mt-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
                  Invitees ({fields.length} {fields.length === 1 ? 'row' : 'rows'} · max 25)
                </span>
                <span className="font-mono text-[10.5px] text-[var(--text-tertiary)]">
                  {validRowCount} valid
                </span>
              </div>

              <ul className="flex flex-col gap-2.5">
                {fields.map((field, idx) => (
                  <InviteRowCard
                    key={field.id}
                    idx={idx}
                    projects={projects}
                    register={register}
                    control={control}
                    errors={errors}
                    onPaste={handleEmailBlobPaste}
                    onProjectToggle={handleProjectToggle}
                    onRemove={() => handleRemoveRow(idx)}
                    canRemove={fields.length > 1}
                  />
                ))}
              </ul>

              <button
                type="button"
                onClick={handleAddRow}
                disabled={fields.length >= 25}
                className="inline-flex h-9 w-fit items-center gap-1.5 rounded-md border border-dashed border-[var(--border-subtle)] px-3 text-[12px] font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path
                    d="M8 3v10M3 8h10"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
                Add another invite
              </button>
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <label
                htmlFor="invite-message"
                className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]"
              >
                Personal message{' '}
                <span className="font-normal normal-case tracking-normal text-[var(--text-tertiary)]">
                  (optional)
                </span>
              </label>
              <div className="relative">
                <textarea
                  id="invite-message"
                  rows={3}
                  placeholder="Welcome message included in the invite email — set context, link to onboarding doc, etc."
                  aria-invalid={errors.personalMessage ? 'true' : 'false'}
                  className={inputCls(
                    !!errors.personalMessage,
                    'min-h-[88px] resize-y leading-[20px]',
                  )}
                  {...register('personalMessage')}
                />
                <span className="pointer-events-none absolute bottom-2 right-3 font-mono text-[11px] text-[var(--text-tertiary)]">
                  {personalMessage.length} / 500
                </span>
              </div>
              {errors.personalMessage && (
                <span role="alert" className="text-[12px] text-[var(--fail)]">
                  {errors.personalMessage.message}
                </span>
              )}
            </div>
          </div>

          <Footer
            isValid={isValid}
            isSubmitting={isSubmitting}
            validRowCount={validRowCount}
            onCancel={handleCancel}
          />
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modal header
// ---------------------------------------------------------------------------

function Header({ titleId, onClose }: { titleId: string; onClose: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[var(--border-subtle)] px-5 py-4 sm:px-6">
      <div className="flex flex-col gap-1">
        <h2
          id={titleId}
          className="font-display text-[18px] font-bold leading-[24px] tracking-[-0.01em] text-[var(--text-primary)] sm:text-[20px] sm:leading-[26px]"
        >
          Invite to QA Nexus
        </h2>
        <p className="text-[12.5px] leading-[18px] text-[var(--text-secondary)]">
          Send invites to join Iksula Services. Each person gets an email with a set-password link
          valid for 7 days.
        </p>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[var(--text-tertiary)] transition-colors hover:bg-[var(--raised)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path
            d="M3.5 3.5l9 9M12.5 3.5l-9 9"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bulk-apply panel
// ---------------------------------------------------------------------------

interface BulkApplyPanelProps {
  projects: Array<{ id: string; key: string; name: string }>;
  role: InviteRole;
  setRole: (next: InviteRole) => void;
  projectKeys: string[];
  onProjectToggle: (key: string) => void;
  rowCount: number;
  onApply: () => void;
}

function BulkApplyPanel({
  projects,
  role,
  setRole,
  projectKeys,
  onProjectToggle,
  rowCount,
  onApply,
}: BulkApplyPanelProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--raised)] px-4 py-3.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
          Apply to all rows
        </span>
        <span className="font-mono text-[10.5px] text-[var(--text-tertiary)]">
          Speeds up bulk invites
        </span>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex flex-col gap-1.5 sm:min-w-[150px]">
          <label
            htmlFor="bulk-role"
            className="text-[11px] font-medium text-[var(--text-tertiary)]"
          >
            Default role
          </label>
          <select
            id="bulk-role"
            value={role}
            onChange={(e) => setRole(e.target.value as InviteRole)}
            className={inputCls(false, 'h-9 cursor-pointer pr-8 text-[13px]')}
          >
            {inviteRoles.map((r) => (
              <option key={r} value={r}>
                {inviteRoleLabel[r]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <label className="text-[11px] font-medium text-[var(--text-tertiary)]">
            Default projects
          </label>
          <div className="flex flex-wrap items-center gap-1.5">
            {projects.map((p) => {
              const on = projectKeys.includes(p.key);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onProjectToggle(p.key)}
                  aria-pressed={on}
                  className={[
                    'inline-flex h-7 items-center rounded-md border px-2.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]',
                    on
                      ? 'border-[var(--primary)]/40 bg-[var(--primary)]/15 text-[var(--primary)]'
                      : 'border-[var(--border-subtle)] bg-[var(--overlay)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]',
                  ].join(' ')}
                >
                  {p.key}
                </button>
              );
            })}
          </div>
        </div>
        <button
          type="button"
          onClick={onApply}
          className="border-[var(--secondary)]/40 bg-[var(--secondary)]/15 hover:bg-[var(--secondary)]/25 inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-md border px-3 text-[12px] font-semibold text-[var(--secondary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
        >
          Apply to all {rowCount} {rowCount === 1 ? 'row' : 'rows'}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Per-row invite card
// ---------------------------------------------------------------------------

import type { Control, FieldErrors, UseFormRegister } from 'react-hook-form';

interface InviteRowCardProps {
  idx: number;
  projects: Array<{ id: string; key: string; name: string }>;
  register: UseFormRegister<InviteForm>;
  control: Control<InviteForm>;
  errors: FieldErrors<InviteForm>;
  onPaste: (rowIdx: number, e: React.ClipboardEvent<HTMLInputElement>) => void;
  onProjectToggle: (rowIdx: number, projectKey: string) => void;
  onRemove: () => void;
  canRemove: boolean;
}

function InviteRowCard({
  idx,
  projects,
  register,
  control,
  errors,
  onPaste,
  onProjectToggle,
  onRemove,
  canRemove,
}: InviteRowCardProps) {
  const rowError = errors.rows?.[idx];
  return (
    <li className="flex flex-col gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--raised)] px-3 py-3 sm:px-4">
      <div className="flex flex-wrap items-start gap-2 sm:flex-nowrap sm:items-center">
        <div className="flex w-full min-w-0 flex-1 flex-col gap-1 sm:w-auto">
          <input
            type="email"
            inputMode="email"
            autoComplete="off"
            placeholder="teammate@iksula.com"
            aria-invalid={rowError?.email ? 'true' : 'false'}
            onPaste={(e) => onPaste(idx, e)}
            {...register(`rows.${idx}.email`, {
              onChange: () => {
                console.info('pattern-a:deferred:invite-row-email-change', { rowIndex: idx });
              },
            })}
            className={inputCls(!!rowError?.email, 'h-9 text-[13px]')}
          />
        </div>
        <div className="w-full sm:w-[150px]">
          <Controller
            control={control}
            name={`rows.${idx}.role`}
            render={({ field }) => (
              <select
                value={field.value}
                onChange={(e) => {
                  field.onChange(e);
                  console.info('pattern-a:deferred:invite-row-role-change', {
                    rowIndex: idx,
                    role: e.target.value,
                  });
                }}
                aria-label={`Role for row ${idx + 1}`}
                className={inputCls(false, 'h-9 cursor-pointer pr-8 text-[13px]')}
              >
                {inviteRoles.map((r) => (
                  <option key={r} value={r}>
                    {inviteRoleLabel[r]}
                  </option>
                ))}
              </select>
            )}
          />
        </div>
        <button
          type="button"
          onClick={onRemove}
          disabled={!canRemove}
          aria-label={`Remove row ${idx + 1}`}
          className="hover:border-[var(--fail)]/30 hover:bg-[var(--fail)]/10 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[var(--border-subtle)] text-[var(--text-tertiary)] transition-colors hover:text-[var(--fail)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-[var(--border-subtle)] disabled:hover:bg-transparent disabled:hover:text-[var(--text-tertiary)]"
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <path
              d="M3.5 3.5l9 9M12.5 3.5l-9 9"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      <Controller
        control={control}
        name={`rows.${idx}.projectKeys`}
        render={({ field }) => (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-[10.5px] font-medium text-[var(--text-tertiary)]">
              Projects:
            </span>
            {projects.map((p) => {
              const on = field.value.includes(p.key);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onProjectToggle(idx, p.key)}
                  aria-pressed={on}
                  className={[
                    'inline-flex h-6 items-center rounded border px-2 text-[10.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]',
                    on
                      ? 'border-[var(--primary)]/40 bg-[var(--primary)]/15 text-[var(--primary)]'
                      : 'border-[var(--border-subtle)] bg-[var(--overlay)] text-[var(--text-tertiary)] hover:border-[var(--border-strong)] hover:text-[var(--text-secondary)]',
                  ].join(' ')}
                >
                  {p.key}
                </button>
              );
            })}
          </div>
        )}
      />

      {(rowError?.email || rowError?.projectKeys) && (
        <div role="alert" className="flex flex-col gap-0.5 text-[11.5px] text-[var(--fail)]">
          {rowError?.email && <span>· {rowError.email.message}</span>}
          {rowError?.projectKeys && <span>· {rowError.projectKeys.message}</span>}
        </div>
      )}
    </li>
  );
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

function Footer({
  isValid,
  isSubmitting,
  validRowCount,
  onCancel,
}: {
  isValid: boolean;
  isSubmitting: boolean;
  validRowCount: number;
  onCancel: () => void;
}) {
  return (
    <div className="flex flex-col-reverse gap-3 border-t border-[var(--border-subtle)] bg-[var(--base)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <button
        type="button"
        onClick={onCancel}
        className="inline-flex h-10 items-center justify-center rounded-md px-3 text-[13px] font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--raised)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
      >
        Cancel
      </button>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <span
          aria-live="polite"
          className="font-mono text-[11px] text-[var(--text-tertiary)] sm:text-right"
        >
          {validRowCount > 0
            ? `${validRowCount} ready to send · invites expire in 7 days`
            : 'Add an email + at least one project to enable Send'}
        </span>
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[var(--primary)] px-5 text-[13px] font-semibold text-[var(--primary-ink)] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Send invites
          {validRowCount > 0 && (
            <span className="bg-[var(--primary-ink)]/15 rounded-full px-1.5 py-0.5 font-mono text-[10px] font-bold">
              {validRowCount}
            </span>
          )}
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M3 8h10M9 4l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared input class helper
// ---------------------------------------------------------------------------

function inputCls(invalid: boolean, extra = ''): string {
  return [
    'w-full rounded-md border bg-[var(--canvas)] px-3 py-2 text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition-colors focus:outline-none focus:ring-2',
    invalid
      ? 'border-[var(--fail)] focus:border-[var(--fail)] focus:ring-[var(--fail)]/30'
      : 'border-[var(--border-subtle)] focus:border-[var(--primary)] focus:ring-[var(--primary)]/30',
    extra,
  ].join(' ');
}

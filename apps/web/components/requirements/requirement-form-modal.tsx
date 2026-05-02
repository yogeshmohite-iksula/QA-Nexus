// F14m1 Edit/Add Requirement Modal — overlay rendered on top of F14.
// Locked source: PM1_UI_v2/frame  html view/F14m1 Edit Requirement Modal.html
// Mounted by /requirements/new (Add) + /requirements/<key>/edit (Edit).
//
// Pattern A enforcement (PM1_PRD §4 Requirements lifecycle) — 7
// deferred markers:
// - Mount → `pattern-a:deferred:requirement-form-open`
//     { mode: 'create' | 'edit', reqKey, projectId }.
// - Field change → `pattern-a:deferred:requirement-form-field-change`
//     { field } (debounced via RHF onChange).
// - Tag add → `pattern-a:deferred:requirement-form-tag-add` { tag }.
// - Tag remove → `pattern-a:deferred:requirement-form-tag-remove`
//     { tag }.
// - Submit → `pattern-a:deferred:requirement-form-submit`
//     { mode, reqKey, fieldsTouched }.
// - Validation error → `pattern-a:deferred:requirement-form-validation-error`
//     { fields }.
// - Cancel + Esc + backdrop → `pattern-a:deferred:requirement-form-cancel`
//     + route to /requirements (or back to /requirements/<key> in edit
//     mode).
// - ZERO fetch / useMutation / axios. Real /api/projects/:slug/requirements
//   POST + PATCH wires at MS0-T030.5+.
//
// UX surfaces (Pattern A — toast wired, BE call deferred):
// - 600 ms simulated persistence delay so loading state is observable.
// - Sonner success toast on save: "Requirement <KEY> saved".
// - Sonner error toast on validation failure.
// - Submit button: "Save changes" / "Saving…" + animate-spin SVG.
// - Defence-in-depth `if (isSubmitting) return` guard against
//   double-submit (keyboard double-Enter).
// - Esc + backdrop click + Cancel button all close via the same
//   `onClose` prop.
//
// ADR-006 hooks:
// - `useCurrentUser()` — actor for the open + submit markers.
// - `useActiveProject()` — project context (RET).
// - `useTeamMember(actorId)` — N/A for the form itself; reserved for
//   future "last edited by" footer.

'use client';

import { useEffect, useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useCurrentUser } from '@/lib/contexts/CurrentUserContext';
import { useActiveProject } from '@/lib/contexts/ProjectContext';
import {
  requirementPriorityValues,
  requirementStatusValues,
  requirementPriorityLabel,
  requirementStatusLabel,
  REQUIREMENTS,
  type Requirement,
} from '@/lib/data/requirements';
import {
  buildRequirementPayload,
  parseTagInput,
  requirementFormDefaults,
  requirementFormSchema,
  requirementSprintOptions,
  type RequirementForm,
} from './requirement-form-schema';

interface RequirementFormModalProps {
  /** Routing hook: invoked by Cancel / Esc / backdrop / successful submit. */
  onClose: () => void;
  /** When set, the modal is in edit mode + pre-fills from the matched seed row. */
  reqKey?: string;
}

// Resolve the matching seed requirement (Pattern A — view-fixture only,
// real BE GET wires at MS0-T030.5+). Returns null in create mode or
// when the key doesn't exist.
function findRequirementByKey(reqKey: string | undefined): Requirement | null {
  if (!reqKey) return null;
  const normalized = reqKey.toLowerCase();
  return REQUIREMENTS.find((r) => r.key.toLowerCase() === normalized) ?? null;
}

export function RequirementFormModal({ onClose, reqKey }: RequirementFormModalProps) {
  const router = useRouter();
  const titleId = useId();
  const me = useCurrentUser();
  const project = useActiveProject();

  const editing = findRequirementByKey(reqKey);
  const mode: 'create' | 'edit' = editing ? 'edit' : 'create';

  const initialDefaults: RequirementForm = editing
    ? {
        title: editing.title,
        description: editing.description ?? '',
        priority: editing.priority,
        status: editing.status,
        sprint: editing.sprint ?? '',
        tags: editing.tags ?? [],
        acceptanceCriteria: '',
      }
    : requirementFormDefaults;

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid, isSubmitting, dirtyFields },
  } = useForm<RequirementForm>({
    resolver: zodResolver(requirementFormSchema),
    defaultValues: initialDefaults,
    mode: 'onChange',
  });

  const [tagInput, setTagInput] = useState('');
  const tags = watch('tags') ?? [];
  const description = watch('description') ?? '';
  const acceptance = watch('acceptanceCriteria') ?? '';

  useEffect(() => {
    // PATTERN-A: open requirement form deferred until M2 (T030.5) - real /api/projects/:slug/requirements GET (edit mode)
    console.info('pattern-a:deferred:requirement-form-open', {
      mode,
      reqKey: editing?.key ?? null,
      projectId: project.id,
      workspaceId: me.workspaceId,
    });

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        // PATTERN-A: cancel requirement form deferred until M2 (T030.5) - navigate back
        console.info('pattern-a:deferred:requirement-form-cancel', { trigger: 'esc', mode });
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
  }, [me.workspaceId, project.id, mode, editing?.key, onClose]);

  function handleCancel() {
    // PATTERN-A: cancel requirement form deferred until M2 (T030.5) - navigate back
    console.info('pattern-a:deferred:requirement-form-cancel', { trigger: 'button', mode });
    onClose();
  }

  function handleAddTagFromInput() {
    const next = parseTagInput(tagInput);
    if (next.length === 0) return;
    const merged = Array.from(new Set([...tags, ...next]));
    setValue('tags', merged, { shouldDirty: true, shouldValidate: true });
    setTagInput('');
    for (const tag of next) {
      // PATTERN-A: add tag deferred until M2 (T030.5) - client-only form mutation
      console.info('pattern-a:deferred:requirement-form-tag-add', { tag });
    }
  }

  function handleRemoveTag(tag: string) {
    const next = tags.filter((t) => t !== tag);
    setValue('tags', next, { shouldDirty: true, shouldValidate: true });
    // PATTERN-A: remove tag deferred until M2 (T030.5) - client-only form mutation
    console.info('pattern-a:deferred:requirement-form-tag-remove', { tag });
  }

  async function onValid(values: RequirementForm) {
    if (isSubmitting) return; // defence-in-depth double-submit guard

    const payload = buildRequirementPayload(values);
    const touched = Object.keys(dirtyFields);

    // PATTERN-A: submit requirement form deferred until M2 (T030.5) - real /api/projects/:slug/requirements POST/PATCH
    console.info('pattern-a:deferred:requirement-form-submit', {
      mode,
      reqKey: editing?.key ?? null,
      projectId: project.id,
      fieldsTouched: touched,
      payloadPreview: { title: payload.title, priority: payload.priority, status: payload.status },
    });

    // Simulated persistence — swap-out for real fetch at MS0-T030.5+.
    await new Promise((resolve) => setTimeout(resolve, 600));

    if (mode === 'edit' && editing) {
      toast.success(`Requirement ${editing.key} saved`, {
        description: 'Updated fields land in the audit log + Jira sync (deferred).',
      });
    } else {
      toast.success('Requirement created', {
        description: 'Next available RET-### key is assigned by the BE on persist (deferred).',
      });
    }

    onClose();
    router.push('/requirements');
  }

  function onInvalid(formErrors: Record<string, unknown>) {
    // PATTERN-A: form validation error deferred until M2 (T030.5) - client-only Zod, no BE call
    console.info('pattern-a:deferred:requirement-form-validation-error', {
      fields: Object.keys(formErrors),
    });

    const fieldList = Object.keys(formErrors);
    toast.error('Some fields need attention before saving', {
      description:
        fieldList.length > 0
          ? `${fieldList.length} field${fieldList.length === 1 ? '' : 's'} ${
              fieldList.length === 1 ? 'has' : 'have'
            } a validation error.`
          : 'Check title + priority + status.',
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-stretch justify-center md:items-start md:p-6"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close requirement form"
        onClick={handleCancel}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Sheet → desktop modal */}
      <div className="relative z-10 flex w-full max-w-[860px] flex-col overflow-hidden bg-[var(--base)] shadow-2xl md:mt-12 md:max-h-[calc(100vh-6rem)] md:rounded-xl md:border md:border-[var(--border-subtle)]">
        <Header mode={mode} reqKey={editing?.key} titleId={titleId} onClose={handleCancel} />

        <form onSubmit={handleSubmit(onValid, onInvalid)} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
            <div className="flex flex-col gap-5">
              {/* Title */}
              <Field id="req-title" label="Title" required error={errors.title?.message}>
                <input
                  id="req-title"
                  type="text"
                  autoComplete="off"
                  placeholder="Short, action-oriented summary"
                  aria-invalid={errors.title ? 'true' : 'false'}
                  className={inputCls(!!errors.title)}
                  {...register('title', {
                    onChange: () => {
                      // PATTERN-A: change requirement field deferred until M2 (T030.5) - client-only form mutation
                      console.info('pattern-a:deferred:requirement-form-field-change', {
                        field: 'title',
                      });
                    },
                  })}
                />
              </Field>

              {/* Description */}
              <Field
                id="req-description"
                label="Description"
                error={errors.description?.message}
                helper={`${description.length} / 4000`}
              >
                <textarea
                  id="req-description"
                  rows={4}
                  placeholder="Why does this requirement exist? Acceptance bar + business context."
                  aria-invalid={errors.description ? 'true' : 'false'}
                  className={inputCls(
                    !!errors.description,
                    'min-h-[100px] resize-y leading-[20px]',
                  )}
                  {...register('description', {
                    onChange: () => {
                      // PATTERN-A: change requirement field deferred until M2 (T030.5) - client-only form mutation
                      console.info('pattern-a:deferred:requirement-form-field-change', {
                        field: 'description',
                      });
                    },
                  })}
                />
              </Field>

              {/* Priority + Status + Sprint — 3-up on sm+ */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field id="req-priority" label="Priority" required error={errors.priority?.message}>
                  <Controller
                    control={control}
                    name="priority"
                    render={({ field }) => (
                      <select
                        id="req-priority"
                        value={field.value}
                        onChange={(e) => {
                          field.onChange(e);
                          // PATTERN-A: change requirement field deferred until M2 (T030.5) - client-only form mutation
                          console.info('pattern-a:deferred:requirement-form-field-change', {
                            field: 'priority',
                          });
                        }}
                        aria-label="Priority"
                        className={inputCls(false, 'h-10 cursor-pointer pr-8')}
                      >
                        {requirementPriorityValues.map((p) => (
                          <option key={p} value={p}>
                            {requirementPriorityLabel[p]}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                </Field>

                <Field id="req-status" label="Status" required error={errors.status?.message}>
                  <Controller
                    control={control}
                    name="status"
                    render={({ field }) => (
                      <select
                        id="req-status"
                        value={field.value}
                        onChange={(e) => {
                          field.onChange(e);
                          // PATTERN-A: change requirement field deferred until M2 (T030.5) - client-only form mutation
                          console.info('pattern-a:deferred:requirement-form-field-change', {
                            field: 'status',
                          });
                        }}
                        aria-label="Status"
                        className={inputCls(false, 'h-10 cursor-pointer pr-8')}
                      >
                        {requirementStatusValues.map((s) => (
                          <option key={s} value={s}>
                            {requirementStatusLabel[s]}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                </Field>

                <Field id="req-sprint" label="Sprint" error={errors.sprint?.message}>
                  <Controller
                    control={control}
                    name="sprint"
                    render={({ field }) => (
                      <select
                        id="req-sprint"
                        value={field.value}
                        onChange={(e) => {
                          field.onChange(e);
                          // PATTERN-A: change requirement field deferred until M2 (T030.5) - client-only form mutation
                          console.info('pattern-a:deferred:requirement-form-field-change', {
                            field: 'sprint',
                          });
                        }}
                        aria-label="Sprint"
                        className={inputCls(false, 'h-10 cursor-pointer pr-8')}
                      >
                        {requirementSprintOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                </Field>
              </div>

              {/* Tags */}
              <Field id="req-tag-input" label="Tags" helper="Press Enter or comma to add a tag">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    {tags.length === 0 && (
                      <span className="text-[12px] text-[var(--text-tertiary)]">No tags yet.</span>
                    )}
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex h-6 items-center gap-1 rounded border border-[var(--border-subtle)] bg-[var(--raised)] pl-2 pr-1 font-mono text-[10.5px] text-[var(--text-secondary)]"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          aria-label={`Remove tag ${tag}`}
                          className="inline-flex h-4 w-4 items-center justify-center rounded text-[var(--text-tertiary)] hover:text-[var(--fail)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      id="req-tag-input"
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault();
                          handleAddTagFromInput();
                        }
                      }}
                      placeholder="payments, security, …"
                      className={inputCls(false, 'h-9 flex-1 text-[13px]')}
                    />
                    <button
                      type="button"
                      onClick={handleAddTagFromInput}
                      disabled={tagInput.trim() === ''}
                      className="inline-flex h-9 items-center rounded-md border border-[var(--border-subtle)] bg-[var(--raised)] px-3 text-[12px] font-semibold text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Add tag
                    </button>
                  </div>
                </div>
              </Field>

              {/* Acceptance criteria */}
              <Field
                id="req-acceptance"
                label="Acceptance criteria"
                error={errors.acceptanceCriteria?.message}
                helper={`${acceptance.length} / 8000`}
              >
                <textarea
                  id="req-acceptance"
                  rows={5}
                  placeholder="Given <context> · When <action> · Then <outcome>. One bullet per line."
                  aria-invalid={errors.acceptanceCriteria ? 'true' : 'false'}
                  className={inputCls(
                    !!errors.acceptanceCriteria,
                    'min-h-[120px] resize-y leading-[20px]',
                  )}
                  {...register('acceptanceCriteria', {
                    onChange: () => {
                      // PATTERN-A: change requirement field deferred until M2 (T030.5) - client-only form mutation
                      console.info('pattern-a:deferred:requirement-form-field-change', {
                        field: 'acceptanceCriteria',
                      });
                    },
                  })}
                />
              </Field>
            </div>
          </div>

          <Footer
            mode={mode}
            isValid={isValid}
            isSubmitting={isSubmitting}
            onCancel={handleCancel}
          />
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

function Header({
  mode,
  reqKey,
  titleId,
  onClose,
}: {
  mode: 'create' | 'edit';
  reqKey?: string;
  titleId: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[var(--border-subtle)] px-5 py-4 sm:px-6">
      <div className="flex flex-col gap-1">
        <h2
          id={titleId}
          className="font-display text-[18px] font-bold leading-[24px] tracking-[-0.01em] text-[var(--text-primary)] sm:text-[20px] sm:leading-[26px]"
        >
          {mode === 'edit' ? 'Edit requirement' : 'Create requirement'}
        </h2>
        <p className="text-[12.5px] leading-[18px] text-[var(--text-secondary)]">
          {mode === 'edit' && reqKey ? (
            <>
              <span className="font-mono font-semibold text-[var(--text-primary)]">{reqKey}</span> ·
              changes append to the HMAC audit chain (deferred).
            </>
          ) : (
            <>The next available RET-### key is assigned by the BE on save (deferred).</>
          )}
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
// Footer (Cancel + Save)
// ---------------------------------------------------------------------------

function Footer({
  mode,
  isValid,
  isSubmitting,
  onCancel,
}: {
  mode: 'create' | 'edit';
  isValid: boolean;
  isSubmitting: boolean;
  onCancel: () => void;
}) {
  const saveLabel = mode === 'edit' ? 'Save changes' : 'Create requirement';
  return (
    <div className="flex flex-col-reverse gap-3 border-t border-[var(--border-subtle)] bg-[var(--base)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <button
        type="button"
        onClick={onCancel}
        className="inline-flex h-10 min-h-[44px] items-center justify-center rounded-md px-3 text-[13px] font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--raised)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] sm:min-h-0"
      >
        Discard changes
      </button>
      <button
        type="submit"
        disabled={!isValid || isSubmitting}
        aria-busy={isSubmitting || undefined}
        className="inline-flex h-10 min-h-[44px] items-center justify-center gap-2 rounded-md bg-[var(--primary)] px-5 text-[13px] font-semibold text-[var(--primary-ink)] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-0"
      >
        {isSubmitting ? 'Saving…' : saveLabel}
        {isSubmitting ? (
          <svg
            width="13"
            height="13"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
            className="animate-spin"
          >
            <circle
              cx="8"
              cy="8"
              r="6"
              stroke="currentColor"
              strokeOpacity="0.3"
              strokeWidth="1.8"
            />
            <path
              d="M14 8a6 6 0 0 0-6-6"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M3 8h10M9 4l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Field wrapper (label + helper + error)
// ---------------------------------------------------------------------------

function Field({
  id,
  label,
  required,
  error,
  helper,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]"
      >
        {label}
        {required && <span className="ml-0.5 text-[var(--fail)]">*</span>}
      </label>
      {children}
      <div className="flex items-start justify-between gap-3">
        {error ? (
          <span role="alert" className="text-[11.5px] text-[var(--fail)]">
            {error}
          </span>
        ) : (
          <span />
        )}
        {helper && (
          <span className="font-mono text-[11px] text-[var(--text-tertiary)]">{helper}</span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared input class helper (mirrors the F27m1 modal's inputCls)
// ---------------------------------------------------------------------------

function inputCls(invalid: boolean, extra = ''): string {
  return [
    'w-full rounded-md border bg-[var(--canvas)] px-3 py-2 text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition-colors focus:outline-none focus:ring-2',
    invalid
      ? 'border-[var(--fail)]/50 focus:border-[var(--fail)] focus:ring-[var(--fail)]/30'
      : 'border-[var(--border-subtle)] focus:border-[var(--border-strong)] focus:ring-[var(--secondary)]/30',
    extra,
  ]
    .filter(Boolean)
    .join(' ');
}

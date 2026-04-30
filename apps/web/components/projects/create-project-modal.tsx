// F10 Create Project Modal — overlay rendered from the F09 page when
// `?new=1` is in the URL. See PM1_UI_v2/frame  html view/F10 Create Project Modal.html.
//
// Pattern A (PM1_PRD §F10):
// - Mount fires `pattern-a:deferred:open-modal { modal: 'F10' }` (already
//   logged from the F09 trigger).
// - Submit fires `pattern-a:deferred:create-project` with the typed payload
//   then routes per chosen data source:
//     · jira  → /projects/{slug}/sources/jira (F11a Connect Jira Step 1)
//     · upload → /projects/{slug}/sources/upload (F12, deferred)
//     · blank → /projects (back to list, hard-coded data unchanged)
// - Cancel + close-X + Esc + backdrop click all route to /projects (clears `?new=1`).
// - ZERO fetch / useMutation / axios.
//
// Layout (CLAUDE.md Rule 12):
// - Mobile (< md): full-screen drawer (top sheet, fills viewport).
// - md+: centered card, max-w-[1120px], max-h-[90vh] with scrollable body.

'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCurrentUser } from '@/lib/contexts/CurrentUserContext';
import { useTeamRoster } from '@/lib/contexts/TeamRosterContext';
import {
  buildCreateProjectPayload,
  buildRosterSuggestions,
  createProjectDefaults,
  createProjectSchema,
  glyphIds,
  glyphInitials,
  inviteRoleLabel,
  inviteRoles,
  slugFromName,
  type CreateProjectForm,
  type DataSource,
  type GlyphId,
  type InviteRole,
} from './create-project-schema';

// Whitelisted gradient palette — same set as F07 onboarding glyph picker.
const GLYPH_GRADIENTS: Record<GlyphId, { label: string; gradient: string }> = {
  'teal-violet': { label: 'Teal → violet', gradient: 'linear-gradient(135deg, #2DD4BF, #A78BFA)' },
  'teal-soft': { label: 'Teal soft', gradient: 'linear-gradient(135deg, #2DD4BF, #C4B5FD)' },
  'violet-only': { label: 'Violet', gradient: 'linear-gradient(135deg, #A78BFA, #C4B5FD)' },
  neutral: { label: 'Neutral', gradient: 'linear-gradient(135deg, #232C3F, #1A2233)' },
};

const DATA_SOURCE_CARDS: Array<{
  id: DataSource;
  title: string;
  body: string;
  routeNote: string;
  recommended?: boolean;
}> = [
  {
    id: 'jira',
    title: 'Connect to Jira',
    body: 'Fetch requirements + link cases to issues. A1 enriches drafts with context.',
    routeNote: '→ routes to Source Connect (F11)',
    recommended: true,
  },
  {
    id: 'upload',
    title: 'Upload files',
    body: 'Drop XLSX, CSV, Jira exports, test-case docs. A2 checks for dupes + gaps.',
    routeNote: '→ routes to Upload (F12)',
  },
  {
    id: 'blank',
    title: 'Start blank',
    body: 'Empty project. Add cases manually as you go. Good for greenfield work.',
    routeNote: '→ back to Projects list',
  },
];

interface CreateProjectModalProps {
  onClose: () => void;
}

export function CreateProjectModal({ onClose }: CreateProjectModalProps) {
  const router = useRouter();
  const titleId = useId();
  const me = useCurrentUser();
  const { members } = useTeamRoster();
  const rosterSuggestions = useMemo(() => buildRosterSuggestions(members, me.id), [members, me.id]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isValid, isSubmitting },
  } = useForm<CreateProjectForm>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: createProjectDefaults,
    mode: 'onChange',
  });

  const {
    fields: inviteFields,
    append,
    remove,
  } = useFieldArray({
    control,
    name: 'invites',
  });

  const name = watch('name');
  const description = watch('description') ?? '';
  const glyph = watch('glyph');
  const connectJiraNow = watch('connectJiraNow');
  const dataSource = watch('dataSource');
  const defaultInviteRole = watch('defaultInviteRole');
  const slug = useMemo(() => slugFromName(name) || 'new-project', [name]);
  const initials = useMemo(() => glyphInitials(name || 'New project'), [name]);

  // Esc key closes the modal (per Rule 13 + a11y best practice).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    // Lock body scroll while modal is open.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  // Local state for the email-chip input (free-text → invites array).
  const [emailDraft, setEmailDraft] = useState('');
  const invitedEmails = useMemo(
    () => new Set(inviteFields.map((f) => f.email.toLowerCase())),
    [inviteFields],
  );

  function commitEmailDraft() {
    const candidate = emailDraft.trim();
    if (!candidate) return;
    if (invitedEmails.has(candidate.toLowerCase())) {
      setEmailDraft('');
      return;
    }
    // Lightweight email check — full zod runs on submit.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate)) return;
    append({ email: candidate, role: defaultInviteRole });
    setEmailDraft('');
  }

  function addRosterSuggestion(email: string, role: InviteRole) {
    if (invitedEmails.has(email.toLowerCase())) return;
    append({ email, role });
  }

  function onSubmit(values: CreateProjectForm) {
    const payload = buildCreateProjectPayload(values);
    console.info('pattern-a:deferred:create-project', payload);
    // Route per chosen data source. Slug + key are speculative — real
    // server-issued IDs come with MS0-T030.5+.
    const routeKey = payload.slug;
    if (payload.dataSource === 'jira') {
      router.push(`/projects/${routeKey}/sources/jira`);
    } else if (payload.dataSource === 'upload') {
      router.push(`/projects/${routeKey}/sources/upload`);
    } else {
      router.push('/projects');
    }
  }

  function onSaveDraft() {
    console.info('pattern-a:deferred:create-project-draft', {
      name: watch('name'),
      slug,
      glyph,
    });
    onClose();
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
        aria-label="Close create project modal"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Card */}
      <div className="relative z-10 flex w-full max-w-[1120px] flex-col overflow-hidden border-[var(--border-subtle)] bg-[var(--base)] shadow-2xl md:mt-6 md:max-h-[calc(100vh-3rem)] md:rounded-xl md:border">
        <ModalHeader titleId={titleId} onClose={onClose} />

        <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7 sm:py-7">
            {/* Section A — Identity */}
            <section className="flex flex-col gap-5">
              <div className="grid gap-5 md:grid-cols-2">
                <FieldShell
                  label="Project name"
                  htmlFor="cp-name"
                  error={errors.name?.message}
                  hint={
                    name.trim().length >= 2
                      ? `Slug auto-generated: ${slug}`
                      : 'Slug auto-generated from project name.'
                  }
                >
                  <input
                    id="cp-name"
                    type="text"
                    autoComplete="off"
                    placeholder="e.g. Iksula Returns, Iksula Loyalty, Iksula B2B…"
                    aria-invalid={errors.name ? 'true' : 'false'}
                    className={inputClass(!!errors.name)}
                    {...register('name')}
                  />
                </FieldShell>

                <FieldShell
                  label={
                    <>
                      Jira project key{' '}
                      <span className="font-normal normal-case tracking-normal text-[var(--text-tertiary)]">
                        (optional)
                      </span>
                    </>
                  }
                  htmlFor="cp-jira-key"
                  error={errors.jiraKey?.message}
                  hint="Uppercase, 2–10 chars. Leave blank to connect later."
                >
                  <input
                    id="cp-jira-key"
                    type="text"
                    autoComplete="off"
                    placeholder="e.g. RET"
                    aria-invalid={errors.jiraKey ? 'true' : 'false'}
                    className={`${inputClass(!!errors.jiraKey)} font-mono uppercase tracking-[0.04em]`}
                    {...register('jiraKey')}
                  />
                </FieldShell>
              </div>

              <FieldShell
                label={
                  <>
                    Description{' '}
                    <span className="font-normal normal-case tracking-normal text-[var(--text-tertiary)]">
                      (optional)
                    </span>
                  </>
                }
                htmlFor="cp-description"
                error={errors.description?.message}
              >
                <div className="relative">
                  <textarea
                    id="cp-description"
                    rows={3}
                    placeholder="What's in scope? e.g. customer returns flows, partner portal integration…"
                    aria-invalid={errors.description ? 'true' : 'false'}
                    className={`${inputClass(!!errors.description)} min-h-[88px] resize-y leading-[20px]`}
                    {...register('description')}
                  />
                  <span className="pointer-events-none absolute bottom-2 right-3 font-mono text-[11px] text-[var(--text-tertiary)]">
                    {description.length} / 500
                  </span>
                </div>
              </FieldShell>

              <div className="flex flex-col gap-3">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                  Project glyph
                </span>
                <Controller
                  control={control}
                  name="glyph"
                  render={({ field }) => (
                    <div className="flex flex-wrap items-center gap-3">
                      {glyphIds.map((id) => {
                        const g = GLYPH_GRADIENTS[id];
                        const active = field.value === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => field.onChange(id)}
                            aria-pressed={active}
                            aria-label={`Use ${g.label} glyph`}
                            className={[
                              'font-display inline-flex h-9 w-9 items-center justify-center rounded-lg text-[12px] font-bold text-[var(--primary-ink)] transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]',
                              active
                                ? 'shadow-[0_0_0_2px_var(--primary),0_0_0_4px_var(--base)]'
                                : 'opacity-90 hover:opacity-100',
                            ].join(' ')}
                            style={{ background: g.gradient }}
                          >
                            {initials}
                          </button>
                        );
                      })}
                      <span className="text-[12px] text-[var(--text-tertiary)]">
                        Auto-generated from project name. Pick a color.
                      </span>
                    </div>
                  )}
                />
              </div>
            </section>

            {/* Section B — Jira connection */}
            <section className="mt-7 border-t border-[var(--border-subtle)] pt-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                  Jira connection
                </span>
                <label className="inline-flex items-center gap-2 text-[12.5px] text-[var(--text-secondary)]">
                  <input type="checkbox" className="peer sr-only" {...register('connectJiraNow')} />
                  <span
                    aria-hidden="true"
                    className="inline-flex h-4 w-4 items-center justify-center rounded-[3px] border border-[var(--border-subtle)] bg-[var(--canvas)] text-[var(--primary-ink)] peer-checked:border-[var(--primary)] peer-checked:bg-[var(--primary)] peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--secondary)]"
                  >
                    {connectJiraNow && (
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                        <path
                          d="M2.5 6.5l2.3 2.3L9.5 3.5"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>
                  Connect Jira now{' '}
                  <span className="text-[var(--text-tertiary)]">(recommended)</span>
                </label>
              </div>

              {connectJiraNow && (
                <FieldShell
                  className="mt-4"
                  label="Jira base URL"
                  htmlFor="cp-jira-url"
                  error={errors.jiraBaseUrl?.message}
                >
                  <input
                    id="cp-jira-url"
                    type="url"
                    inputMode="url"
                    autoComplete="off"
                    placeholder="https://iksula.atlassian.net"
                    aria-invalid={errors.jiraBaseUrl ? 'true' : 'false'}
                    className={`${inputClass(!!errors.jiraBaseUrl)} font-mono text-[13px]`}
                    {...register('jiraBaseUrl')}
                  />
                </FieldShell>
              )}

              <p className="border-[var(--info)]/30 bg-[var(--info)]/10 mt-4 flex items-start gap-3 rounded-md border border-l-[3px] border-l-[var(--info)] px-4 py-3 text-[13px] leading-[20px] text-[var(--text-secondary)]">
                <span aria-hidden="true" className="mt-[2px] text-[var(--info)]">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect
                      x="2.5"
                      y="2.5"
                      width="11"
                      height="11"
                      rx="1.5"
                      stroke="currentColor"
                      strokeWidth="1.3"
                    />
                    <path
                      d="M8 6v4M5.5 6h5M5.5 10h5"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <span>
                  Connect Jira to fetch stories, epics, and test plans automatically.{' '}
                  <span className="font-medium text-[var(--secondary)]">A1</span> uses Jira context
                  when generating test cases — linked requirements become evidence chips on every
                  draft.
                </span>
              </p>
            </section>

            {/* Section C — Data source */}
            <section className="mt-7 border-t border-[var(--border-subtle)] pt-6">
              <span className="mb-3 block font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                How will you add test content?
              </span>
              <Controller
                control={control}
                name="dataSource"
                render={({ field }) => (
                  <div
                    role="radiogroup"
                    aria-label="Data source"
                    className="grid gap-4 md:grid-cols-3"
                  >
                    {DATA_SOURCE_CARDS.map((card) => (
                      <DataSourceCard
                        key={card.id}
                        card={card}
                        active={field.value === card.id}
                        onSelect={() => field.onChange(card.id)}
                      />
                    ))}
                  </div>
                )}
              />
            </section>

            {/* Section D — Invites */}
            <section className="mt-7 border-t border-[var(--border-subtle)] pt-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                  Invite teammates{' '}
                  <span className="font-normal normal-case tracking-normal text-[var(--text-tertiary)]">
                    (optional)
                  </span>
                </span>
                <label className="inline-flex items-center gap-2 text-[12px] text-[var(--text-tertiary)]">
                  Default role
                  <select
                    aria-label="Default invite role"
                    className="h-8 rounded-md border border-[var(--border-subtle)] bg-[var(--raised)] px-2 font-mono text-[12px] text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
                    {...register('defaultInviteRole')}
                  >
                    {inviteRoles.map((r) => (
                      <option key={r} value={r}>
                        {inviteRoleLabel[r]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="mt-3 flex min-h-[56px] flex-wrap items-center gap-2 rounded-md border border-[var(--border-subtle)] bg-[var(--raised)] p-3">
                {inviteFields.map((field, idx) => (
                  <InviteChip
                    key={field.id}
                    email={field.email}
                    role={field.role}
                    onRemove={() => remove(idx)}
                    onRoleChange={(role) =>
                      setValue(`invites.${idx}.role`, role, { shouldDirty: true })
                    }
                  />
                ))}
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="off"
                  placeholder={
                    inviteFields.length === 0
                      ? 'Add email… (Enter or comma to confirm)'
                      : 'Add another…'
                  }
                  value={emailDraft}
                  onChange={(e) => setEmailDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      commitEmailDraft();
                    } else if (
                      e.key === 'Backspace' &&
                      emailDraft.length === 0 &&
                      inviteFields.length > 0
                    ) {
                      remove(inviteFields.length - 1);
                    }
                  }}
                  onBlur={commitEmailDraft}
                  className="min-w-[200px] flex-1 bg-transparent text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none"
                />
              </div>

              <div className="mt-4 flex flex-col gap-2">
                <span className="text-[12px] text-[var(--text-tertiary)]">
                  Add existing team members:
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {rosterSuggestions.map((r) => {
                    const already = invitedEmails.has(r.email.toLowerCase());
                    return (
                      <button
                        key={r.email}
                        type="button"
                        onClick={() => addRosterSuggestion(r.email, r.role)}
                        aria-pressed={already}
                        aria-label={`Add ${r.fullName} (${inviteRoleLabel[r.role]})`}
                        className={[
                          'inline-flex h-8 items-center gap-2 rounded-full border px-3 text-[12px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]',
                          already
                            ? 'border-[var(--primary)]/40 bg-[var(--primary)]/15 text-[var(--primary)]'
                            : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]',
                        ].join(' ')}
                      >
                        <span
                          aria-hidden="true"
                          className="inline-flex h-4 w-4 items-center justify-center rounded-full font-mono text-[9px] font-bold text-[var(--primary-ink)]"
                          style={{ background: GLYPH_GRADIENTS[r.glyph].gradient }}
                        >
                          {r.initials}
                        </span>
                        <span className="truncate">{r.shortName}</span>
                        {already && (
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                            <path
                              d="M2.5 6.3l2.2 2.2L9.5 3.5"
                              stroke="currentColor"
                              strokeWidth="1.6"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
          </div>

          <ModalFooter
            isValid={isValid}
            isSubmitting={isSubmitting}
            dataSource={dataSource}
            onCancel={onClose}
            onSaveDraft={onSaveDraft}
          />
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ModalHeader({ titleId, onClose }: { titleId: string; onClose: () => void }) {
  return (
    <div className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--border-subtle)] pl-5 pr-4 sm:pl-7 sm:pr-5">
      <h2
        id={titleId}
        className="font-display text-[18px] font-semibold tracking-[-0.01em] text-[var(--text-primary)] sm:text-[22px]"
      >
        Create new project
      </h2>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="inline-flex h-10 w-10 items-center justify-center rounded-md text-[var(--text-tertiary)] transition-colors hover:bg-[var(--raised)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
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

function ModalFooter({
  isValid,
  isSubmitting,
  dataSource,
  onCancel,
  onSaveDraft,
}: {
  isValid: boolean;
  isSubmitting: boolean;
  dataSource: DataSource;
  onCancel: () => void;
  onSaveDraft: () => void;
}) {
  const ctaLabel =
    dataSource === 'jira'
      ? 'Create + connect Jira'
      : dataSource === 'upload'
        ? 'Create + upload files'
        : 'Create project';
  return (
    <div className="flex flex-col-reverse gap-3 border-t border-[var(--border-subtle)] bg-[var(--base)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
      <button
        type="button"
        onClick={onCancel}
        className="inline-flex h-10 items-center justify-center rounded-md px-4 text-[14px] font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--raised)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
      >
        Cancel
      </button>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <span
          aria-live="polite"
          className={[
            'inline-flex items-center gap-1.5 font-mono text-[11px]',
            isValid ? 'text-[var(--text-tertiary)]' : 'text-[var(--text-tertiary)]',
          ].join(' ')}
        >
          <span
            aria-hidden="true"
            className={`inline-block h-2 w-2 rounded-full ${
              isValid ? 'bg-[var(--primary)]' : 'bg-[var(--text-tertiary)]'
            }`}
          />
          {isValid ? 'Valid — ready to create' : 'Add a name to continue'}
        </span>
        <button
          type="button"
          onClick={onSaveDraft}
          className="inline-flex h-10 items-center justify-center rounded-md border border-[var(--border-subtle)] px-4 text-[13px] font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
        >
          Save as draft
        </button>
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[var(--primary)] px-5 text-[14px] font-semibold text-[var(--primary-ink)] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {ctaLabel}
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
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

function DataSourceCard({
  card,
  active,
  onSelect,
}: {
  card: (typeof DATA_SOURCE_CARDS)[number];
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onSelect}
      className={[
        'relative flex flex-col gap-2 rounded-lg border p-5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]',
        active
          ? 'border-[var(--primary)]/40 bg-[var(--primary)]/[0.06] shadow-[inset_3px_0_0_var(--primary)]'
          : 'border-[var(--border-subtle)] bg-[var(--raised)] hover:border-[var(--border-strong)]',
      ].join(' ')}
    >
      {card.recommended && (
        <span className="border-[var(--primary)]/35 bg-[var(--primary)]/15 absolute right-4 top-4 inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.06em] text-[var(--primary)]">
          Recommended
        </span>
      )}
      <span
        aria-hidden="true"
        className={[
          'absolute right-4 inline-flex h-4 w-4 items-center justify-center rounded-full border-[1.5px]',
          card.recommended ? 'top-12 sm:top-12' : 'top-4',
          active
            ? 'border-[var(--primary)] bg-[var(--primary)] shadow-[inset_0_0_0_3px_var(--base)]'
            : 'border-[var(--border-subtle)] bg-[var(--canvas)]',
        ].join(' ')}
      />
      <span className="font-display text-[15px] font-semibold text-[var(--text-primary)]">
        {card.title}
      </span>
      <span className="text-[12.5px] leading-[18px] text-[var(--text-secondary)]">{card.body}</span>
      <span className="mt-auto pt-2 font-mono text-[10.5px] text-[var(--text-tertiary)]">
        {card.routeNote}
      </span>
    </button>
  );
}

function InviteChip({
  email,
  role,
  onRemove,
  onRoleChange,
}: {
  email: string;
  role: InviteRole;
  onRemove: () => void;
  onRoleChange: (role: InviteRole) => void;
}) {
  const initials = email.slice(0, 2).toUpperCase();
  return (
    <span className="inline-flex h-7 items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--overlay)] px-2 text-[12px] text-[var(--text-secondary)]">
      <span
        aria-hidden="true"
        className="inline-flex h-4 w-4 items-center justify-center rounded-full font-mono text-[9px] font-bold text-[var(--primary-ink)]"
        style={{ background: 'linear-gradient(135deg, #2DD4BF, #A78BFA)' }}
      >
        {initials}
      </span>
      <span className="max-w-[180px] truncate">{email}</span>
      <select
        aria-label={`Role for ${email}`}
        value={role}
        onChange={(e) => onRoleChange(e.target.value as InviteRole)}
        className="bg-transparent font-mono text-[11px] text-[var(--text-tertiary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
      >
        {inviteRoles.map((r) => (
          <option key={r} value={r}>
            {inviteRoleLabel[r]}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${email}`}
        className="text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)]"
      >
        <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
          <path
            d="M3 3l6 6M9 3l-6 6"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </span>
  );
}

interface FieldShellProps {
  label: React.ReactNode;
  htmlFor: string;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}

function FieldShell({ label, htmlFor, error, hint, className = '', children }: FieldShellProps) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label
        htmlFor={htmlFor}
        className="font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--text-tertiary)]"
      >
        {label}
      </label>
      {children}
      {error ? (
        <span role="alert" className="text-[12px] text-[var(--fail)]">
          {error}
        </span>
      ) : hint ? (
        <span className="font-mono text-[11px] text-[var(--text-tertiary)]">{hint}</span>
      ) : null}
    </div>
  );
}

function inputClass(invalid: boolean): string {
  return [
    'w-full rounded-md border bg-[var(--raised)] px-3 py-3 text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition-colors focus:outline-none focus:ring-2',
    invalid
      ? 'border-[var(--fail)] focus:border-[var(--fail)] focus:ring-[var(--fail)]/30'
      : 'border-[var(--border-subtle)] focus:border-[var(--primary)] focus:ring-[var(--primary)]/30',
  ].join(' ');
}

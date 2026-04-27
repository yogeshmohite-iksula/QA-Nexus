// F07 Step 1 — Create project (name + description + glyph + optional Jira key).
// Mirrors the locked HTML's Step 1 form. All gradients use ONLY whitelisted
// palette values. The source HTML referenced extra teal/slate/near-black hex
// shades that are NOT in PM1's locked palette (01_SYSTEM.md §3.1) and would
// be blocked by enforce-design-tokens.sh — replaced with whitelisted
// equivalents that preserve the same visual intent.

'use client';

import { useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import type { FounderWizardForm, GlyphId } from './schemas';

const GLYPH_SWATCHES: ReadonlyArray<{
  id: GlyphId;
  label: string;
  gradient: string;
}> = [
  {
    id: 'teal-violet',
    label: 'Teal → Violet (default)',
    gradient: 'linear-gradient(135deg, #2DD4BF, #A78BFA)',
  },
  { id: 'teal-soft', label: 'Teal soft', gradient: 'linear-gradient(135deg, #2DD4BF, #C4B5FD)' },
  { id: 'violet-only', label: 'Violet', gradient: 'linear-gradient(135deg, #A78BFA, #C4B5FD)' },
  { id: 'neutral', label: 'Neutral', gradient: 'linear-gradient(135deg, #232C3F, #1A2233)' },
];

interface StepProjectProps {
  onNext: () => void;
  onSaveDraft?: () => void;
}

export function StepProject({ onNext, onSaveDraft }: StepProjectProps) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<FounderWizardForm>();

  const name = watch('name') ?? '';
  const initials = name.trim().slice(0, 2).toUpperCase() || 'IC';
  const glyph = (watch('glyph') ?? 'teal-violet') as GlyphId;
  const selectedSwatch = GLYPH_SWATCHES.find((s) => s.id === glyph) ?? GLYPH_SWATCHES[0];

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onNext();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-7" noValidate>
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-[22px] font-bold leading-tight text-[var(--text-primary)] sm:text-[26px] lg:text-[28px]">
          Create your first project
        </h1>
        <p className="text-[14px] leading-[20px] text-[var(--text-tertiary)]">
          Give it a clear name and a short description. You can edit both later.
        </p>
      </header>

      {/* Project name */}
      <FieldGroup id="name" label="Project name" required error={errors.name?.message}>
        <input
          id="name"
          type="text"
          placeholder="e.g. Iksula Returns"
          autoComplete="off"
          maxLength={50}
          aria-required="true"
          aria-invalid={errors.name ? 'true' : 'false'}
          className={inputClass}
          {...register('name')}
        />
      </FieldGroup>

      {/* Description */}
      <FieldGroup id="description" label="Description" optional error={errors.description?.message}>
        <textarea
          id="description"
          rows={3}
          placeholder="One sentence on what this project covers."
          maxLength={500}
          aria-invalid={errors.description ? 'true' : 'false'}
          className={`${inputClass} min-h-24 resize-y py-3 leading-[20px]`}
          {...register('description')}
        />
      </FieldGroup>

      {/* Glyph picker */}
      <fieldset className="m-0 flex flex-col gap-3 border-0 p-0">
        <legend className={labelClass}>Project glyph</legend>
        <div className="flex flex-wrap items-center gap-3">
          <span
            aria-label={`Avatar preview, initials ${initials}`}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[4px] font-mono text-[14px] font-bold text-[var(--primary-ink)] shadow-sm"
            style={{ background: selectedSwatch.gradient }}
          >
            {initials}
          </span>
          <div
            role="radiogroup"
            aria-label="Avatar gradient"
            className="flex flex-wrap items-center gap-2"
          >
            {GLYPH_SWATCHES.map((s) => {
              const active = s.id === glyph;
              return (
                <button
                  key={s.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-label={s.label}
                  title={s.label}
                  onClick={() =>
                    setValue('glyph', s.id, { shouldDirty: true, shouldValidate: false })
                  }
                  className={[
                    'h-11 w-11 rounded-[4px] transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]',
                    active
                      ? 'ring-2 ring-[var(--primary)] ring-offset-2 ring-offset-[var(--canvas)]'
                      : 'opacity-70 hover:opacity-100',
                  ].join(' ')}
                  style={{ background: s.gradient }}
                />
              );
            })}
          </div>
        </div>
        <span className="text-[12px] leading-[16px] text-[var(--text-tertiary)]">
          Letter avatar auto-generated — pick a gradient.
        </span>
      </fieldset>

      {/* Jira key (optional) */}
      <FieldGroup
        id="jiraKey"
        label="Jira project key"
        optional
        helper="Leave blank to connect Jira later."
        error={errors.jiraKey?.message}
      >
        <input
          id="jiraKey"
          type="text"
          placeholder="e.g. RET"
          autoComplete="off"
          maxLength={10}
          aria-invalid={errors.jiraKey ? 'true' : 'false'}
          className={`${inputClass} font-mono uppercase placeholder:normal-case sm:max-w-[160px]`}
          {...register('jiraKey')}
        />
      </FieldGroup>

      {/* Footer */}
      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onSaveDraft}
          className="inline-flex h-11 min-h-11 items-center justify-center gap-1.5 rounded-[4px] border border-[var(--border-subtle)] bg-transparent px-4 text-[14px] font-medium text-[var(--text-secondary)] hover:bg-[var(--raised)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
        >
          Save as draft
        </button>
        <Button type="submit" className="min-h-11">
          Continue
          <span aria-hidden="true">→</span>
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Local UI helpers (kept inline so this single file is reviewable end-to-end)
// ---------------------------------------------------------------------------

const labelClass =
  'font-mono text-[12px] font-semibold uppercase tracking-[0.05em] text-[var(--text-tertiary)]';

const inputClass =
  'w-full h-12 bg-[var(--raised)] border border-[var(--border-subtle)] rounded-[4px] px-4 text-[15px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] placeholder:opacity-60 outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] focus:ring-opacity-30 transition-colors min-h-11';

interface FieldGroupProps {
  id: string;
  label: string;
  required?: boolean;
  optional?: boolean;
  helper?: string;
  error?: string;
  children: React.ReactNode;
}

function FieldGroup({ id, label, required, optional, helper, error, children }: FieldGroupProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className={labelClass}>
        {label}
        {required && (
          <span className="text-[var(--fail)]" aria-hidden="true">
            {' *'}
          </span>
        )}
        {optional && (
          <span className="font-normal normal-case tracking-normal text-[var(--text-disabled)]">
            {' '}
            (optional)
          </span>
        )}
      </label>
      {children}
      {helper && !error && (
        <span className="text-[12px] leading-[16px] text-[var(--text-tertiary)]">{helper}</span>
      )}
      {error && (
        <span role="alert" className="text-[12px] leading-[16px] text-[var(--fail)]">
          {error}
        </span>
      )}
    </div>
  );
}

// F07 Step 2 — Data source choice (Jira | Upload).
//
// Pattern A (PM1_PRD §F07): this step ONLY stores the user's selection in
// wizard state. It does NOT trigger the Jira OAuth handshake or open the
// Upload modal here. Those flows fire from founder-wizard.tsx
// handleSubmitFinal(), AFTER Step 3's atomic commit succeeds.
//
// Visual model: two large selectable cards in a responsive grid (stack on
// mobile, side-by-side at sm+). Selected state uses a teal ring + tinted
// background. Two `role="radio"` buttons inside a `role="radiogroup"`
// container. Keyboard-accessible (Space/Enter to select, Tab to move).

'use client';

import { useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import type { DataSource, FounderWizardForm } from './schemas';

interface StepDataSourceProps {
  onNext: () => void;
  onBack: () => void;
}

export function StepDataSource({ onNext, onBack }: StepDataSourceProps) {
  const {
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useFormContext<FounderWizardForm>();

  const selected = watch('source');

  function selectSource(source: DataSource) {
    setValue('source', source, { shouldDirty: true, shouldValidate: false });
    clearErrors('source');
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) {
      setError('source', {
        type: 'required',
        message: 'Pick a data source to continue.',
      });
      return;
    }
    onNext();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-7" noValidate>
      <header className="flex flex-col gap-2">
        <h2 className="font-display text-[22px] font-bold leading-tight text-[var(--text-primary)] sm:text-[26px] lg:text-[28px]">
          Where will your test data come from?
        </h2>
        <p className="text-[14px] leading-[20px] text-[var(--text-tertiary)]">
          Pick one — you can connect more sources later from project settings.
        </p>
      </header>

      <div
        role="radiogroup"
        aria-label="Choose data source"
        aria-required="true"
        aria-invalid={errors.source ? 'true' : 'false'}
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4"
      >
        <SourceCard
          id="jira"
          title="Connect Jira"
          subtitle="Pull issues, sprints, and comments via OAuth."
          bullets={[
            'Live sync — new tickets land here automatically',
            'Map Jira projects to QA Nexus projects',
            '~2 min OAuth handshake',
          ]}
          glyph={<JiraIcon />}
          selected={selected === 'jira'}
          onSelect={() => selectSource('jira')}
        />
        <SourceCard
          id="upload"
          title="Upload files"
          subtitle="Import existing requirements docs, test cases, or recordings."
          bullets={[
            'CSV / XLSX / DOCX / MP4 supported',
            'Drag-and-drop in the next step',
            'Connect Jira later if you want both',
          ]}
          glyph={<UploadIcon />}
          selected={selected === 'upload'}
          onSelect={() => selectSource('upload')}
        />
      </div>

      {errors.source && (
        <span role="alert" className="-mt-3 text-[12px] leading-[16px] text-[var(--fail)]">
          {errors.source.message}
        </span>
      )}

      {/* Pattern A note */}
      <aside
        aria-label="Pattern A deferred routing notice"
        className="flex items-start gap-3 rounded-[6px] border border-[var(--border-subtle)] bg-[var(--raised)] p-4"
      >
        <span aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--primary)]">
          <ClockIcon />
        </span>
        <div className="flex flex-col gap-1">
          <span className="text-[13px] font-semibold text-[var(--text-primary)]">
            We&apos;ll connect after setup, not now.
          </span>
          <p className="text-[12px] leading-[18px] text-[var(--text-tertiary)]">
            {selected === 'jira'
              ? "We'll start the Jira OAuth handshake once you finish inviting your team in the next step."
              : selected === 'upload'
                ? "We'll open the upload modal once you finish inviting your team in the next step."
                : "Whichever you pick, we'll start it after Step 3 (team invites). Your workspace is created atomically — nothing partial."}
          </p>
        </div>
      </aside>

      {/* Footer */}
      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-11 min-h-11 items-center justify-center gap-1.5 rounded-[4px] border border-[var(--border-subtle)] bg-transparent px-4 text-[14px] font-medium text-[var(--text-secondary)] hover:bg-[var(--raised)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
        >
          <span aria-hidden="true">←</span> Back
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
// Card primitive
// ---------------------------------------------------------------------------

interface SourceCardProps {
  id: DataSource;
  title: string;
  subtitle: string;
  bullets: string[];
  glyph: React.ReactNode;
  selected: boolean;
  onSelect: () => void;
}

function SourceCard({ id, title, subtitle, bullets, glyph, selected, onSelect }: SourceCardProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      id={`source-${id}`}
      onClick={onSelect}
      className={[
        'group flex min-h-11 flex-col gap-3 rounded-[8px] border p-4 text-left transition-colors sm:p-5',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--canvas)]',
        selected
          ? 'bg-[var(--primary)]/10 border-[var(--primary)] ring-2 ring-[var(--primary)]'
          : 'border-[var(--border-subtle)] bg-[var(--raised)] hover:border-[var(--border-strong)] hover:bg-[var(--overlay)]',
      ].join(' ')}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={[
            'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[6px] transition-colors',
            selected
              ? 'bg-[var(--primary)] text-[var(--primary-ink)]'
              : 'bg-[var(--overlay)] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]',
          ].join(' ')}
        >
          {glyph}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="font-display text-[16px] font-semibold text-[var(--text-primary)] sm:text-[17px]">
            {title}
          </span>
          <span className="text-[13px] leading-[18px] text-[var(--text-tertiary)]">{subtitle}</span>
        </div>
        <RadioMark selected={selected} />
      </div>
      <ul className="flex flex-col gap-1.5 pl-14">
        {bullets.map((b) => (
          <li
            key={b}
            className="flex items-start gap-2 text-[12px] leading-[18px] text-[var(--text-secondary)]"
          >
            <span aria-hidden="true" className="shrink-0 text-[var(--primary)]">
              ✓
            </span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </button>
  );
}

function RadioMark({ selected }: { selected: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={[
        'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors',
        selected ? 'border-[var(--primary)] bg-[var(--primary)]' : 'border-[var(--border-strong)]',
      ].join(' ')}
    >
      {selected && (
        <span className="h-2 w-2 rounded-full bg-[var(--primary-ink)]" aria-hidden="true" />
      )}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Inline icons (no lucide-react dep yet — keeps the FE bundle lean)
// ---------------------------------------------------------------------------

function JiraIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M11.4 2.4 5.6 8.2c-.4.4-.4 1 0 1.4l2.4 2.4 4-4 4 4 2.4-2.4c.4-.4.4-1 0-1.4l-5.8-5.8a.99.99 0 0 0-1.4 0Z"
        fill="currentColor"
        opacity="0.55"
      />
      <path
        d="m12 8 4 4-4 4-4-4 4-4Zm0 5.8L9.6 16.2c-.4.4-.4 1 0 1.4l5.8 5.8c.4.4 1 .4 1.4 0l5.8-5.8c.4-.4.4-1 0-1.4L20.2 13.8 16 18l-4-4.2Z"
        fill="currentColor"
      />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 4v11M7 9l5-5 5 5M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 7.5v5l3 2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

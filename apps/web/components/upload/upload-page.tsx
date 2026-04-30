// F12 Upload Requirements & Test Cases — main orchestrator.
//
// Implements `PM1_UI_v2/frame  html view/F12 Upload Requirements · Test Cases.html`.
// Locked source renders as a 1120×860 modal layered over a dimmed F08c
// background — that's a static-mockup presentation device. In React the
// route is a real page mounted at:
//   /projects/[slug]/upload
//
// Pattern A enforcement (PM1_PRD §F12) — 10 deferred markers:
// - Mount → `pattern-a:deferred:upload-modal-open`
//     { projectSlug, projectName, defaultFileCount }.
// - Method-chooser sidebar / "Change method" link →
//     `pattern-a:deferred:upload-change-method` + route to /projects?new=1.
// - File added (drag-drop or browse) →
//     `pattern-a:deferred:upload-file-add` { filename, size, type }.
// - File removed →
//     `pattern-a:deferred:upload-file-remove` { filename }.
// - Platform pill change →
//     `pattern-a:deferred:upload-platform-change` { platform }.
// - Auto-create checkbox →
//     `pattern-a:deferred:upload-autocreate-toggle` { kind, on }.
// - A1 enrichment toggle →
//     `pattern-a:deferred:upload-ai-enrich-toggle` { on }.
// - Submit → `pattern-a:deferred:upload-submit` { fileCount, totalBytes,
//     platform, suite, plan, aiEnrich } + route to /projects/{slug}/imports.
// - Cancel → `pattern-a:deferred:upload-cancel` + route to /projects.
// - ZERO fetch / useMutation / axios. The R2 presigned-URL service from
//   ADR-005 is on main but its call-site lands with MS0-T030.5+; this page
//   stores file metadata in pure local state for visual gating only.

'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/lib/contexts/CurrentUserContext';
import { useProject } from '@/lib/contexts/ProjectContext';
import { UploadShell } from './upload-shell';

interface UploadPageProps {
  projectSlug: string;
}

// Whitelisted-icon palette per file kind. Each tone class uses the
// CLAUDE.md-allowed --pass / --primary / --secondary CSS vars directly.
type FileKind = 'xlsx' | 'csv' | 'pdf' | 'video' | 'other';

interface UploadFileEntry {
  id: string;
  filename: string;
  bytes: number;
  kind: FileKind;
  status: 'queued' | 'uploading' | 'uploaded' | 'error';
  errorMessage?: string;
}

const SUPPORTED_EXTENSIONS = ['.xlsx', '.csv', '.pdf', '.mp4', '.mov', '.mpeg'] as const;
const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 MB per locked source
const ACCEPT_ATTR = SUPPORTED_EXTENSIONS.join(',');

function kindFromFilename(name: string): FileKind {
  const lower = name.toLowerCase();
  if (lower.endsWith('.xlsx')) return 'xlsx';
  if (lower.endsWith('.csv')) return 'csv';
  if (lower.endsWith('.pdf')) return 'pdf';
  if (lower.endsWith('.mp4') || lower.endsWith('.mov') || lower.endsWith('.mpeg')) return 'video';
  return 'other';
}

function shortName(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];
  if (parts[1].endsWith('.')) return `${parts[0]} ${parts[1]}`;
  return `${parts[0]} ${parts[1][0]}.`;
}

function initialsOf(displayName: string): string {
  return displayName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(kb >= 100 ? 0 : 1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(mb >= 100 ? 0 : 1)} MB`;
}

// Default sample files mirror the locked source visual (and CLAUDE.md
// "Sample files for upload demos"). Pre-populated as `uploaded` state so
// the visual gate matches the design reference.
const DEFAULT_SAMPLES: UploadFileEntry[] = [
  {
    id: 'sample-xlsx',
    filename: 'return_policy_v2.xlsx',
    bytes: 1.8 * 1024 * 1024,
    kind: 'xlsx',
    status: 'uploaded',
  },
  {
    id: 'sample-csv',
    filename: 'legacy_refund_test_cases.csv',
    bytes: 240 * 1024,
    kind: 'csv',
    status: 'uploaded',
  },
  {
    id: 'sample-mp4',
    filename: 'customer_return_flow_recording.mp4',
    bytes: 12.4 * 1024 * 1024,
    kind: 'video',
    status: 'uploaded',
  },
];

type Platform = 'web' | 'mobile' | 'api' | 'cross-platform';
const PLATFORM_OPTIONS: Array<{ id: Platform; label: string }> = [
  { id: 'web', label: 'Web' },
  { id: 'mobile', label: 'Mobile' },
  { id: 'api', label: 'API' },
  { id: 'cross-platform', label: 'Cross-platform' },
];

function projectNameFromSlug(slug: string): string {
  return slug
    .split(/[-_]/)
    .filter(Boolean)
    .map((p) => p[0]?.toUpperCase() + p.slice(1))
    .join(' ');
}

export function UploadPage({ projectSlug }: UploadPageProps) {
  const router = useRouter();
  const me = useCurrentUser();
  // useProject() looks up by KEY, not slug. Slug "iksula-returns" maps
  // to key "RET" via the legacy slug ↔ key convention. Try both.
  const projectByKey = useProject(projectSlug);
  const projectName = projectByKey?.name ?? projectNameFromSlug(projectSlug);

  const [files, setFiles] = useState<UploadFileEntry[]>(DEFAULT_SAMPLES);
  const [platform, setPlatform] = useState<Platform>('web');
  const [createSuite, setCreateSuite] = useState(false);
  const [createPlan, setCreatePlan] = useState(false);
  const [aiEnrich, setAiEnrich] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputId = useId();

  useEffect(() => {
    console.info('pattern-a:deferred:upload-modal-open', {
      projectSlug,
      projectName,
      defaultFileCount: DEFAULT_SAMPLES.length,
    });
  }, [projectSlug, projectName]);

  function logFileAdd(entry: UploadFileEntry) {
    console.info('pattern-a:deferred:upload-file-add', {
      filename: entry.filename,
      size: entry.bytes,
      type: entry.kind,
    });
  }

  function processIncomingFiles(picked: FileList | File[]) {
    const arr = Array.from(picked);
    const newEntries: UploadFileEntry[] = [];
    for (const f of arr) {
      const oversize = f.size > MAX_FILE_BYTES;
      const kind = kindFromFilename(f.name);
      const entry: UploadFileEntry = {
        id: `${Date.now()}-${f.name}-${Math.random().toString(36).slice(2, 8)}`,
        filename: f.name,
        bytes: f.size,
        kind,
        status: oversize ? 'error' : 'uploaded',
        errorMessage: oversize ? `Exceeds 50 MB limit (${formatBytes(f.size)})` : undefined,
      };
      newEntries.push(entry);
      logFileAdd(entry);
    }
    if (newEntries.length > 0) {
      setFiles((prev) => [...prev, ...newEntries]);
    }
  }

  function onBrowseClick() {
    fileInputRef.current?.click();
  }

  function onFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      processIncomingFiles(e.target.files);
      // Reset so re-selecting the same file fires onChange again.
      e.target.value = '';
    }
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processIncomingFiles(e.dataTransfer.files);
    }
  }

  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (!dragActive) setDragActive(true);
  }

  function onDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
  }

  function removeFile(id: string) {
    const entry = files.find((f) => f.id === id);
    if (entry) {
      console.info('pattern-a:deferred:upload-file-remove', { filename: entry.filename });
    }
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  function onPlatformChange(next: Platform) {
    if (next === platform) return;
    console.info('pattern-a:deferred:upload-platform-change', { platform: next });
    setPlatform(next);
  }

  function onCreateSuiteToggle() {
    setCreateSuite((prev) => {
      const next = !prev;
      console.info('pattern-a:deferred:upload-autocreate-toggle', {
        kind: 'suite',
        on: next,
      });
      return next;
    });
  }

  function onCreatePlanToggle() {
    setCreatePlan((prev) => {
      const next = !prev;
      console.info('pattern-a:deferred:upload-autocreate-toggle', {
        kind: 'plan',
        on: next,
      });
      return next;
    });
  }

  function onAiEnrichToggle() {
    setAiEnrich((prev) => {
      const next = !prev;
      console.info('pattern-a:deferred:upload-ai-enrich-toggle', { on: next });
      return next;
    });
  }

  function onChangeMethod() {
    console.info('pattern-a:deferred:upload-change-method', { projectSlug });
    router.push('/projects?new=1');
  }

  function onCancel() {
    console.info('pattern-a:deferred:upload-cancel', { projectSlug });
    router.push('/projects');
  }

  function onSubmit() {
    const totalBytes = files.reduce((acc, f) => acc + f.bytes, 0);
    console.info('pattern-a:deferred:upload-submit', {
      projectSlug,
      fileCount: files.length,
      totalBytes,
      platform,
      suite: createSuite,
      plan: createPlan,
      aiEnrich,
    });
    router.push(`/projects/${projectSlug}/imports`);
  }

  const totalBytes = useMemo(() => files.reduce((acc, f) => acc + f.bytes, 0), [files]);
  const validFiles = files.filter((f) => f.status !== 'error').length;

  return (
    <UploadShell
      projectName={projectName}
      projectSlug={projectSlug}
      userInitials={initialsOf(me.displayName)}
    >
      <main className="mx-auto w-full max-w-[1120px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <PageHeader projectName={projectName} onChangeMethod={onChangeMethod} />

        <div className="mt-6 grid gap-6 lg:mt-8 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-6">
          <MethodChooserSidebar onChange={onChangeMethod} />

          <section className="flex flex-col gap-3.5">
            <StepIndicator />

            <DropZone
              dragActive={dragActive}
              fileInputId={fileInputId}
              fileInputRef={fileInputRef}
              onBrowseClick={onBrowseClick}
              onDragLeave={onDragLeave}
              onDragOver={onDragOver}
              onDrop={onDrop}
              onFileInputChange={onFileInputChange}
            />

            <FileList files={files} onRemove={removeFile} />

            <div className="grid gap-6 sm:grid-cols-2">
              <PlatformPicker selected={platform} onChange={onPlatformChange} />
              <AutoCreateSection
                createSuite={createSuite}
                createPlan={createPlan}
                onSuiteToggle={onCreateSuiteToggle}
                onPlanToggle={onCreatePlanToggle}
              />
            </div>

            <AiEnrichmentToggle on={aiEnrich} onChange={onAiEnrichToggle} />
          </section>
        </div>

        <StepFooter
          fileCount={validFiles}
          totalBytes={totalBytes}
          projectName={projectName}
          platform={platform}
          createSuite={createSuite}
          createPlan={createPlan}
          aiEnrich={aiEnrich}
          submitDisabled={validFiles === 0}
          onChangeMethod={onChangeMethod}
          onCancel={onCancel}
          onSubmit={onSubmit}
        />
        <span className="sr-only">{`Signed in as ${shortName(me.displayName)}`}</span>
      </main>
    </UploadShell>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PageHeader({
  projectName,
  onChangeMethod,
}: {
  projectName: string;
  onChangeMethod: () => void;
}) {
  return (
    <header className="flex flex-col gap-1">
      <h1 className="font-display text-[20px] font-bold leading-[28px] tracking-[-0.01em] text-[var(--text-primary)] sm:text-[22px] sm:leading-[30px]">
        Import Requirements &amp; Test Cases
      </h1>
      <p className="text-[12.5px] leading-[18px] text-[var(--text-secondary)] sm:text-[13px]">
        Uploading to <span className="font-semibold text-[var(--text-primary)]">{projectName}</span>{' '}
        · Method: File upload ·{' '}
        <button
          type="button"
          onClick={onChangeMethod}
          className="text-[var(--primary)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
        >
          ← Change method
        </button>
      </p>
    </header>
  );
}

function MethodChooserSidebar({ onChange }: { onChange: () => void }) {
  return (
    <aside className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--overlay)] p-3.5">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
          Method Chooser · Alternate entry
        </span>
        <p className="text-[11px] leading-[15px] text-[var(--text-tertiary)]">
          Available when entering from Plan → Requirements
        </p>

        <div className="mt-2 flex flex-col gap-1.5">
          <MethodOption
            tone="ai"
            label="Let AI Help"
            chip="FAST"
            chipTone="ai"
            disabled
            onClick={onChange}
          />
          <MethodOption tone="active" label="Upload Files" chip="BULK" chipTone="primary" active />
          <MethodOption
            tone="muted"
            label="Create Manually"
            chip="FRESH"
            chipTone="neutral"
            disabled
            onClick={onChange}
          />
        </div>
      </div>
      <p className="px-1 text-[11px] leading-[16px] text-[var(--text-tertiary)]">
        Three entry paths land on this form. Method chooser only appears from Plan → Requirements.
      </p>
    </aside>
  );
}

function MethodOption({
  tone,
  label,
  chip,
  chipTone,
  active,
  disabled,
  onClick,
}: {
  tone: 'ai' | 'active' | 'muted';
  label: string;
  chip: string;
  chipTone: 'ai' | 'primary' | 'neutral';
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const dotClass = {
    ai: 'bg-[var(--secondary)]',
    active: 'bg-[var(--primary)]',
    muted: 'bg-[var(--text-tertiary)]',
  }[tone];
  const chipClass = {
    ai: 'bg-[var(--secondary)]/15 text-[var(--secondary)]',
    primary: 'bg-[var(--primary)]/15 text-[var(--primary)]',
    neutral: 'bg-[var(--overlay)] text-[var(--text-tertiary)]',
  }[chipTone];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled && !active}
      aria-pressed={active}
      className={[
        'flex h-10 items-center gap-2 rounded-md px-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]',
        active
          ? 'border-[var(--primary)]/40 border bg-[var(--raised)] shadow-[inset_0_0_0_1px_var(--primary),inset_2px_0_0_var(--primary)]'
          : disabled
            ? 'cursor-not-allowed border border-[var(--border-subtle)] bg-[var(--raised)] opacity-60'
            : 'border border-[var(--border-subtle)] bg-[var(--raised)] hover:border-[var(--border-strong)]',
      ].join(' ')}
    >
      <span
        aria-hidden="true"
        className={`inline-block h-2 w-2 shrink-0 rounded-full ${dotClass}`}
      />
      <span
        className={`flex-1 truncate text-[12px] ${
          active ? 'font-semibold text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
        }`}
      >
        {label}
      </span>
      <span
        className={`inline-flex shrink-0 items-center rounded px-1.5 py-0.5 font-mono text-[9.5px] font-semibold tracking-[0.04em] ${chipClass}`}
      >
        {chip}
      </span>
    </button>
  );
}

function StepIndicator() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
        Step 1 of 2 · File details
      </span>
      <span className="text-[12px] text-[var(--text-tertiary)]">Next: Review &amp; confirm →</span>
    </div>
  );
}

function DropZone({
  dragActive,
  fileInputId,
  fileInputRef,
  onBrowseClick,
  onDragLeave,
  onDragOver,
  onDrop,
  onFileInputChange,
}: {
  dragActive: boolean;
  fileInputId: string;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onBrowseClick: () => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onBrowseClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onBrowseClick();
        }
      }}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      aria-label="Drop files here or press Enter to browse"
      className={[
        'flex flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-dashed bg-[var(--raised)] px-4 py-8 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] sm:py-10',
        dragActive
          ? 'bg-[var(--primary)]/[0.06] border-[var(--primary)]'
          : 'border-[var(--border-subtle)] hover:border-[var(--border-strong)]',
      ].join(' ')}
    >
      <span
        aria-hidden="true"
        className="bg-[var(--primary)]/15 inline-flex h-12 w-12 items-center justify-center rounded-xl text-[var(--primary)] shadow-[0_0_24px_rgba(45,212,191,0.22)] sm:h-[52px] sm:w-[52px]"
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <path
            d="M7 16a4 4 0 0 1-1-7.8 5 5 0 0 1 9.7-1.2A4.5 4.5 0 0 1 18 16"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 11v8M9 14l3-3 3 3"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <p className="font-display text-[16px] font-bold leading-[24px] text-[var(--text-primary)] sm:text-[18px] sm:leading-[26px]">
        Drop your files here or click to browse
      </p>
      <p className="text-[12px] leading-[18px] text-[var(--text-secondary)] sm:text-[12.5px]">
        Supported:{' '}
        <span className="font-semibold text-[var(--text-primary)]">
          XLSX, CSV, PDF, MP4 (MOV, MPEG)
        </span>{' '}
        · Max <span className="font-semibold text-[var(--text-primary)]">50 MB</span> per file
      </p>
      <div className="mt-1 flex w-full max-w-[220px] items-center gap-2.5">
        <span aria-hidden="true" className="h-px flex-1 bg-[var(--border-subtle)]" />
        <span className="font-mono text-[10.5px] text-[var(--text-tertiary)]">or</span>
        <span aria-hidden="true" className="h-px flex-1 bg-[var(--border-subtle)]" />
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onBrowseClick();
        }}
        className="inline-flex h-9 items-center rounded-md bg-[var(--primary)] px-4 text-[12.5px] font-semibold text-[var(--primary-ink)] shadow-[0_0_18px_rgba(45,212,191,0.22)] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
      >
        Browse files
      </button>
      <input
        ref={fileInputRef}
        id={fileInputId}
        type="file"
        multiple
        accept={ACCEPT_ATTR}
        className="sr-only"
        onChange={onFileInputChange}
      />
    </div>
  );
}

function FileList({
  files,
  onRemove,
}: {
  files: UploadFileEntry[];
  onRemove: (id: string) => void;
}) {
  if (files.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-[var(--border-subtle)] bg-[var(--raised)] px-4 py-3 text-center text-[12px] text-[var(--text-tertiary)]">
        No files added yet. Drag-drop above or browse.
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-2">
      {files.map((entry) => (
        <FileRow key={entry.id} entry={entry} onRemove={() => onRemove(entry.id)} />
      ))}
    </ul>
  );
}

function FileRow({ entry, onRemove }: { entry: UploadFileEntry; onRemove: () => void }) {
  const iconTone = (() => {
    if (entry.status === 'error') return 'fail';
    if (entry.kind === 'xlsx') return 'pass';
    if (entry.kind === 'csv') return 'primary';
    if (entry.kind === 'video') return 'secondary';
    return 'tertiary';
  })();
  const iconClass = {
    pass: 'bg-[var(--pass)]/15 text-[var(--pass)]',
    primary: 'bg-[var(--primary)]/15 text-[var(--primary)]',
    secondary: 'bg-[var(--secondary)]/15 text-[var(--secondary)]',
    tertiary: 'bg-[var(--overlay)] text-[var(--text-tertiary)]',
    fail: 'bg-[var(--fail)]/15 text-[var(--fail)]',
  }[iconTone];
  return (
    <li className="flex items-center gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--raised)] px-3 py-2.5">
      <span
        aria-hidden="true"
        className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${iconClass}`}
      >
        <FileKindIcon kind={entry.kind} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-baseline gap-2">
          <span className="truncate font-mono text-[12.5px] text-[var(--text-primary)]">
            {entry.filename}
          </span>
          <span className="shrink-0 font-mono text-[11px] font-medium text-[var(--text-tertiary)]">
            {formatBytes(entry.bytes)}
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="h-1 max-w-[260px] flex-1 overflow-hidden rounded-full bg-[var(--overlay)]">
            <div
              className={`h-full ${
                entry.status === 'error' ? 'bg-[var(--fail)]' : 'bg-[var(--pass)]'
              }`}
              style={{ width: entry.status === 'queued' ? '20%' : '100%' }}
            />
          </div>
          <span
            className={`inline-flex shrink-0 items-center gap-1 text-[11px] font-medium ${
              entry.status === 'error' ? 'text-[var(--fail)]' : 'text-[var(--pass)]'
            }`}
          >
            {entry.status === 'error' ? (
              <>
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M3 3l10 10M13 3L3 13"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
                {entry.errorMessage ?? 'Error'}
              </>
            ) : (
              <>
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M3 8.5l3 3 7-7"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Uploaded
              </>
            )}
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${entry.filename}`}
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[var(--text-tertiary)] transition-colors hover:bg-[var(--overlay)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
      >
        <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M3.5 3.5l9 9M12.5 3.5l-9 9"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </li>
  );
}

function FileKindIcon({ kind }: { kind: FileKind }) {
  if (kind === 'video') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="4" width="9" height="8" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
        <path d="M11 7l3-2v6l-3-2z" fill="currentColor" />
      </svg>
    );
  }
  if (kind === 'xlsx') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M4 2h5l3 3v9H4z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        <path
          d="M6 9l2 2m0-2l-2 2M10 9l-2 2m0-2l2 2"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (kind === 'csv') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M4 2h5l3 3v9H4z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        <path
          d="M6 8h4M6 10.5h4M6 12.5h2.5"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  // pdf / other
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4 2h5l3 3v9H4z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path
        d="M6 8h4M6 10.5h4M6 12.5h2.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PlatformPicker({
  selected,
  onChange,
}: {
  selected: Platform;
  onChange: (next: Platform) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
        What type of application?
      </legend>
      <div
        role="radiogroup"
        aria-label="Application platform"
        className="inline-flex flex-wrap rounded-md border border-[var(--border-subtle)] bg-[var(--base)] p-0.5"
      >
        {PLATFORM_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={selected === opt.id}
            onClick={() => onChange(opt.id)}
            className={[
              'inline-flex h-7 items-center rounded-[4px] px-3 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]',
              selected === opt.id
                ? 'bg-[var(--primary)] font-semibold text-[var(--primary-ink)]'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]',
            ].join(' ')}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <p className="text-[11px] leading-[15px] text-[var(--text-tertiary)]">
        A1 uses platform hints to tailor generated test steps
      </p>
    </fieldset>
  );
}

function AutoCreateSection({
  createSuite,
  createPlan,
  onSuiteToggle,
  onPlanToggle,
}: {
  createSuite: boolean;
  createPlan: boolean;
  onSuiteToggle: () => void;
  onPlanToggle: () => void;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
        Auto-create from uploaded files
      </legend>
      <AutoCreateCheckbox
        checked={createSuite}
        onChange={onSuiteToggle}
        title="Create a new Test Suite"
        hint={
          <>
            Group cases under{' '}
            <span className="font-mono text-[var(--text-secondary)]">Returns — April 2026</span>
          </>
        }
      />
      <AutoCreateCheckbox
        checked={createPlan}
        onChange={onPlanToggle}
        title="Add to a new Test Plan"
        hint="Attach the suite to the active Sprint 42 plan"
      />
    </fieldset>
  );
}

function AutoCreateCheckbox({
  checked,
  onChange,
  title,
  hint,
}: {
  checked: boolean;
  onChange: () => void;
  title: string;
  hint: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2">
      <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
      <span
        aria-hidden="true"
        className={[
          'mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border-[1.4px]',
          checked
            ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-ink)]'
            : 'border-[var(--border-strong)] bg-[var(--raised)]',
          'peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--secondary)]',
        ].join(' ')}
      >
        {checked && (
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
      <span className="flex flex-col gap-0.5">
        <span className="text-[12.5px] text-[var(--text-secondary)]">{title}</span>
        <span className="text-[11px] leading-[15px] text-[var(--text-tertiary)]">{hint}</span>
      </span>
    </label>
  );
}

function AiEnrichmentToggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      role="switch"
      aria-checked={on}
      className="flex w-full items-center gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--overlay)] px-3.5 py-3 text-left transition-colors hover:border-[var(--border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
    >
      <span
        aria-hidden="true"
        className={[
          'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors',
          on
            ? 'bg-[var(--primary)]/30 border-[var(--primary)]'
            : 'border-[var(--border-strong)] bg-[var(--raised)]',
        ].join(' ')}
      >
        <span
          aria-hidden="true"
          className={[
            'absolute top-[1px] inline-block h-3.5 w-3.5 rounded-full transition-transform',
            on
              ? 'translate-x-[18px] bg-[var(--primary)]'
              : 'translate-x-[2px] bg-[var(--text-tertiary)]',
          ].join(' ')}
        />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[12.5px] font-medium text-[var(--text-primary)]">
          Let <span className="font-semibold text-[var(--secondary)]">A1</span> enrich these files
          into test cases
        </span>
        <span className="text-[11px] leading-[15px] text-[var(--text-tertiary)]">
          Reads uploaded docs → drafts test cases → shows for review.{' '}
          <span className="font-medium text-[var(--text-secondary)]">Optional.</span>
        </span>
      </span>
      <span className="hidden shrink-0 rounded border border-[var(--border-subtle)] bg-[var(--raised)] px-2 py-0.5 font-mono text-[10.5px] text-[var(--text-tertiary)] sm:inline-flex">
        Adds ~1–2 min
      </span>
    </button>
  );
}

function StepFooter({
  fileCount,
  totalBytes,
  projectName,
  platform,
  createSuite,
  createPlan,
  aiEnrich,
  submitDisabled,
  onChangeMethod,
  onCancel,
  onSubmit,
}: {
  fileCount: number;
  totalBytes: number;
  projectName: string;
  platform: Platform;
  createSuite: boolean;
  createPlan: boolean;
  aiEnrich: boolean;
  submitDisabled: boolean;
  onChangeMethod: () => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const platformLabel = PLATFORM_OPTIONS.find((p) => p.id === platform)?.label ?? 'Web';
  const autoCreate =
    createSuite && createPlan
      ? 'Suite + Plan'
      : createSuite
        ? 'Suite'
        : createPlan
          ? 'Plan'
          : 'None';
  return (
    <div className="mt-6 flex flex-col gap-4 border-t border-[var(--border-subtle)] pt-5 sm:mt-8 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <p className="text-[13px] text-[var(--text-secondary)]">
          Selected:{' '}
          <span className="font-mono font-semibold text-[var(--text-primary)]">
            {fileCount} {fileCount === 1 ? 'file' : 'files'} · {formatBytes(totalBytes)}
          </span>
        </p>
        <p className="mt-1 text-[12px] leading-[16px] text-[var(--text-tertiary)]">
          Target: <span className="font-medium text-[var(--text-primary)]">{projectName}</span> ·
          Platform: <span className="font-medium text-[var(--text-primary)]">{platformLabel}</span>{' '}
          · Auto-create:{' '}
          <span className="font-medium text-[var(--text-primary)]">{autoCreate}</span> · A1
          enrichment:{' '}
          <span className="font-medium text-[var(--text-primary)]">{aiEnrich ? 'On' : 'Off'}</span>
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onChangeMethod}
          className="inline-flex h-10 items-center gap-2 rounded-md px-3 text-[13px] font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M13 8H3M7 4L3 8l4 4"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Change method
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-10 items-center justify-center px-3 text-[13px] font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitDisabled}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-[var(--primary)] px-5 text-[13px] font-semibold text-[var(--primary-ink)] shadow-[0_0_24px_rgba(45,212,191,0.18)] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Import {fileCount} {fileCount === 1 ? 'file' : 'files'}
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

// F12 KB Upload — component. Mounted via app/(app)/kb/upload/page.tsx.
//
// Locked reference: PM1_UI_v2/frame  html view/F12 Upload Requirements · Test Cases.html
// Design tokens: CLAUDE.md §4 + 01_SYSTEM.md §3.1
//   TEAL var(--primary) = system CTAs (Browse, Upload button)
//   VIOLET var(--secondary) = AI surfaces (A1 enrichment badge)
//   GREEN var(--pass) = success state
//   RED var(--fail) = error state
//
// Pattern A: stub upload (setInterval progress). Pattern B lands Thu 7 May.
// Anti-drift: ZERO axios / fetch / useMutation here.

'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, FileText, Loader2, UploadCloud, XCircle } from 'lucide-react';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCEPTED_EXTENSIONS = ['.pdf', '.docx', '.md', '.txt'] as const;
const ACCEPT_ATTR = ACCEPTED_EXTENSIONS.join(',');
const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 MB per ERD §5 TB-017

// Human-readable extension → MIME hint (for display only, not validation)
const EXT_LABEL: Record<string, string> = {
  '.pdf': 'PDF',
  '.docx': 'Word',
  '.md': 'Markdown',
  '.txt': 'Text',
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type UploadState = 'initial' | 'selected' | 'uploading' | 'success' | 'error';

interface SelectedFile {
  name: string;
  bytes: number;
  ext: string; // e.g. ".pdf"
  raw: File;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(kb >= 100 ? 0 : 1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(mb >= 100 ? 0 : 1)} MB`;
}

function extensionOf(name: string): string {
  const dotIdx = name.lastIndexOf('.');
  if (dotIdx === -1) return '';
  return name.slice(dotIdx).toLowerCase();
}

function isAccepted(name: string): boolean {
  return (ACCEPTED_EXTENSIONS as readonly string[]).includes(extensionOf(name));
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function KbUploadPage() {
  const router = useRouter();
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [uploadState, setUploadState] = useState<UploadState>('initial');
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [progress, setProgress] = useState(0); // 0–100
  const [errorMsg, setErrorMsg] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clear stub interval on unmount
  useEffect(
    () => () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    },
    [],
  );

  // ---------------------------------------------------------------------------
  // File intake
  // ---------------------------------------------------------------------------

  function acceptFile(raw: File) {
    if (!isAccepted(raw.name)) {
      setErrorMsg(
        `"${raw.name}" is not supported. Accepted types: PDF, Word (.docx), Markdown (.md), plain text (.txt).`,
      );
      setUploadState('error');
      return;
    }
    if (raw.size > MAX_FILE_BYTES) {
      setErrorMsg(
        `"${raw.name}" is ${formatBytes(raw.size)} — exceeds the 50 MB limit. Please compress or split the file.`,
      );
      setUploadState('error');
      return;
    }
    setSelectedFile({
      name: raw.name,
      bytes: raw.size,
      ext: extensionOf(raw.name),
      raw,
    });
    setUploadState('selected');
  }

  function handleFiles(list: FileList | File[]) {
    const files = Array.from(list);
    if (files.length === 0) return;
    // Single-file upload: take the first one; ignore extra files.
    acceptFile(files[0]);
  }

  const onBrowseClick = useCallback(() => fileInputRef.current?.click(), []);

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      e.target.value = '';
    }
  }

  // Drag handlers
  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(true);
  }
  function onDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
  }
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
  }

  // ---------------------------------------------------------------------------
  // Upload (Pattern A stub)
  // ---------------------------------------------------------------------------

  function startUpload() {
    if (!selectedFile) return;

    // Pattern A deferred marker — Pattern B replaces this entire block with
    // POST /api/kb/upload-init → PUT R2 → POST /api/kb/finalize-upload
    console.info('pattern-a:deferred:kb:upload', {
      fileName: selectedFile.name,
      size: selectedFile.bytes,
    });

    setProgress(0);
    setUploadState('uploading');

    // Stub progress: linearly 0→90 in 1.8 s, then jump to 100 + success.
    let pct = 0;
    progressIntervalRef.current = setInterval(() => {
      pct += 5;
      if (pct >= 90) {
        clearInterval(progressIntervalRef.current!);
        progressIntervalRef.current = null;
        setProgress(100);
        setTimeout(() => setUploadState('success'), 300);
      } else {
        setProgress(pct);
      }
    }, 100);
  }

  function reset() {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setSelectedFile(null);
    setProgress(0);
    setErrorMsg('');
    setUploadState('initial');
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex min-h-screen flex-col bg-[var(--canvas)]">
      {/* ── Top bar ── */}
      <header className="border-b border-[var(--border-subtle)] bg-[var(--base)] px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-[1120px] items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-tertiary)] transition-colors hover:bg-[var(--overlay)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
          >
            <ArrowLeft size={16} aria-hidden />
          </button>
          <div className="flex min-w-0 flex-col">
            <h1 className="font-display truncate text-[15px] font-semibold leading-[20px] text-[var(--text-primary)]">
              Upload to Knowledge Base
            </h1>
            <p className="text-[11.5px] text-[var(--text-tertiary)]">
              PDF · Word · Markdown · Plain text &mdash; max 50 MB
            </p>
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="mx-auto w-full max-w-[640px] flex-1 px-4 py-8 sm:px-6 sm:py-12">
        {uploadState === 'initial' && (
          <InitialState
            dragActive={dragActive}
            fileInputId={fileInputId}
            fileInputRef={fileInputRef}
            onBrowseClick={onBrowseClick}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onInputChange={onInputChange}
          />
        )}

        {uploadState === 'selected' && selectedFile && (
          <SelectedState file={selectedFile} onUpload={startUpload} onClear={reset} />
        )}

        {uploadState === 'uploading' && selectedFile && (
          <UploadingState file={selectedFile} progress={progress} />
        )}

        {uploadState === 'success' && selectedFile && (
          <SuccessState file={selectedFile} onUploadAnother={reset} />
        )}

        {uploadState === 'error' && <ErrorState message={errorMsg} onRetry={reset} />}
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// State sub-components
// ---------------------------------------------------------------------------

// ── Initial ──

interface InitialStateProps {
  dragActive: boolean;
  fileInputId: string;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onBrowseClick: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function InitialState({
  dragActive,
  fileInputId,
  fileInputRef,
  onBrowseClick,
  onDragOver,
  onDragLeave,
  onDrop,
  onInputChange,
}: InitialStateProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="font-display text-[22px] font-bold leading-[30px] text-[var(--text-primary)] sm:text-[26px] sm:leading-[34px]">
          Add a document to the KB
        </h2>
        <p className="mt-1.5 text-[14px] leading-[20px] text-[var(--text-secondary)] sm:text-[15px]">
          QA Nexus will chunk, embed, and index it for semantic search and A1 answers.
        </p>
      </div>

      {/* Drop zone */}
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
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        aria-label="Drop a document here or press Enter to browse"
        className={[
          'flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] sm:py-16',
          dragActive
            ? 'bg-[var(--primary)]/[0.06] border-[var(--primary)]'
            : 'border-[var(--border-subtle)] bg-[var(--raised)] hover:border-[var(--border-strong)]',
        ].join(' ')}
      >
        {/* Upload icon badge */}
        <span
          aria-hidden
          className="bg-[var(--primary)]/15 inline-flex h-14 w-14 items-center justify-center rounded-2xl text-[var(--primary)] shadow-[0_0_28px_rgba(45,212,191,0.2)]"
        >
          <UploadCloud size={28} />
        </span>

        <div className="flex flex-col gap-1">
          <p className="font-display text-[17px] font-bold leading-[24px] text-[var(--text-primary)] sm:text-[19px]">
            {dragActive ? 'Drop it here' : 'Drop your document here'}
          </p>
          <p className="text-[13px] leading-[19px] text-[var(--text-secondary)]">
            Supported:{' '}
            <span className="font-semibold text-[var(--text-primary)]">
              PDF, Word, Markdown, TXT
            </span>{' '}
            · Max <span className="font-semibold text-[var(--text-primary)]">50 MB</span>
          </p>
        </div>

        {/* Divider */}
        <div className="flex w-full max-w-[180px] items-center gap-2.5">
          <span aria-hidden className="h-px flex-1 bg-[var(--border-subtle)]" />
          <span className="font-mono text-[10.5px] text-[var(--text-tertiary)]">or</span>
          <span aria-hidden className="h-px flex-1 bg-[var(--border-subtle)]" />
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onBrowseClick();
          }}
          className="inline-flex h-9 min-h-[44px] items-center rounded-lg bg-[var(--primary)] px-5 text-[13px] font-semibold text-[var(--primary-ink)] shadow-[0_0_20px_rgba(45,212,191,0.2)] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] sm:min-h-0"
        >
          Browse files
        </button>

        <input
          ref={fileInputRef}
          id={fileInputId}
          type="file"
          accept={ACCEPT_ATTR}
          className="sr-only"
          onChange={onInputChange}
          aria-label="Choose a document to upload"
        />
      </div>

      {/* Supported type chips */}
      <div className="flex flex-wrap justify-center gap-2">
        {ACCEPTED_EXTENSIONS.map((ext) => (
          <span
            key={ext}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--raised)] px-3 py-1 font-mono text-[11px] text-[var(--text-tertiary)]"
          >
            <FileText size={12} aria-hidden className="text-[var(--primary)]" />
            {EXT_LABEL[ext] ?? ext.toUpperCase()}
          </span>
        ))}
      </div>

      {/* Pattern A note (dev only — hidden in production by CSS opacity-0 or removal) */}
      <p className="text-center font-mono text-[10px] text-[var(--text-tertiary)] opacity-50">
        Pattern A — deferred: kb:upload (Pattern B wires POST /api/kb/upload-init Thu 7 May)
      </p>
    </div>
  );
}

// ── Selected ──

function SelectedState({
  file,
  onUpload,
  onClear,
}: {
  file: SelectedFile;
  onUpload: () => void;
  onClear: () => void;
}) {
  const label = EXT_LABEL[file.ext] ?? file.ext.replace('.', '').toUpperCase();
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="font-display text-[22px] font-bold leading-[30px] text-[var(--text-primary)] sm:text-[26px]">
          Ready to upload
        </h2>
        <p className="mt-1.5 text-[14px] text-[var(--text-secondary)]">
          Review the details below, then click Upload.
        </p>
      </div>

      {/* File preview card */}
      <div className="flex items-center gap-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--raised)] p-4">
        <span
          aria-hidden
          className="bg-[var(--primary)]/15 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-[var(--primary)]"
        >
          <FileText size={22} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate font-mono text-[13px] font-semibold text-[var(--text-primary)]">
            {file.name}
          </span>
          <span className="font-mono text-[11.5px] text-[var(--text-tertiary)]">
            {label} · {formatBytes(file.bytes)}
          </span>
        </div>
        <button
          type="button"
          onClick={onClear}
          aria-label="Remove selected file"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--text-tertiary)] transition-colors hover:bg-[var(--overlay)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
        >
          <XCircle size={16} aria-hidden />
        </button>
      </div>

      {/* Action row */}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClear}
          className="inline-flex h-10 min-h-[44px] items-center justify-center px-4 text-[13px] font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] sm:min-h-0"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onUpload}
          className="inline-flex h-10 min-h-[44px] items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-6 text-[13px] font-semibold text-[var(--primary-ink)] shadow-[0_0_20px_rgba(45,212,191,0.18)] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] sm:min-h-0"
        >
          <UploadCloud size={15} aria-hidden />
          Upload document
        </button>
      </div>
    </div>
  );
}

// ── Uploading ──

function UploadingState({ file, progress }: { file: SelectedFile; progress: number }) {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <span
        aria-hidden
        className="bg-[var(--primary)]/15 inline-flex h-16 w-16 items-center justify-center rounded-2xl text-[var(--primary)]"
      >
        <Loader2 size={30} className="animate-spin" />
      </span>

      <div className="flex flex-col gap-1">
        <h2 className="font-display text-[22px] font-bold leading-[30px] text-[var(--text-primary)]">
          Uploading…
        </h2>
        <p className="truncate font-mono text-[13px] text-[var(--text-secondary)]">{file.name}</p>
      </div>

      {/* Progress bar */}
      <div
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Upload progress: ${progress}%`}
        className="w-full max-w-[360px]"
      >
        <div className="mb-1.5 flex justify-between font-mono text-[11px] text-[var(--text-tertiary)]">
          <span>Uploading to R2</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--overlay)]">
          <div
            className="h-full rounded-full bg-[var(--primary)] transition-[width] duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <p className="text-[12.5px] text-[var(--text-tertiary)]">
        Do not close this tab — upload in progress.
      </p>
    </div>
  );
}

// ── Success ──

function SuccessState({
  file,
  onUploadAnother,
}: {
  file: SelectedFile;
  onUploadAnother: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <span
        aria-hidden
        className="bg-[var(--pass)]/15 inline-flex h-16 w-16 items-center justify-center rounded-2xl text-[var(--pass)]"
      >
        <CheckCircle2 size={32} />
      </span>

      <div className="flex flex-col gap-1.5">
        <h2 className="font-display text-[22px] font-bold leading-[30px] text-[var(--text-primary)] sm:text-[26px]">
          Document uploaded
        </h2>
        <p className="text-[14px] leading-[20px] text-[var(--text-secondary)]">
          <span className="font-mono font-semibold text-[var(--text-primary)]">{file.name}</span> is
          in the queue. QA Nexus will chunk, embed, and index it — processing happens in the
          background.
        </p>
      </div>

      {/* A1 enrichment note */}
      <div className="border-[var(--secondary)]/25 bg-[var(--secondary)]/[0.07] flex w-full max-w-[420px] items-start gap-3 rounded-xl border px-4 py-3 text-left">
        <span
          aria-hidden
          className="mt-0.5 shrink-0 font-mono text-[11px] font-bold text-[var(--secondary)]"
        >
          A1
        </span>
        <p className="text-[12.5px] leading-[18px] text-[var(--text-secondary)]">
          Once indexed, this document will be available for semantic search and{' '}
          <span className="font-semibold text-[var(--secondary)]">A1</span> answers in the Knowledge
          Base.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onUploadAnother}
          className="inline-flex h-10 min-h-[44px] items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-5 text-[13px] font-semibold text-[var(--primary-ink)] shadow-[0_0_20px_rgba(45,212,191,0.18)] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] sm:min-h-0"
        >
          Upload another
        </button>
        <a
          href="/projects/iksula-returns/kb"
          className="inline-flex h-10 min-h-[44px] items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--raised)] px-5 text-[13px] font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] sm:min-h-0"
        >
          View Knowledge Base
        </a>
      </div>
    </div>
  );
}

// ── Error ──

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <span
        aria-hidden
        className="bg-[var(--fail)]/15 inline-flex h-16 w-16 items-center justify-center rounded-2xl text-[var(--fail)]"
      >
        <XCircle size={32} />
      </span>

      <div className="flex flex-col gap-1.5">
        <h2 className="font-display text-[22px] font-bold leading-[30px] text-[var(--text-primary)]">
          Upload failed
        </h2>
        <p className="text-[14px] leading-[20px] text-[var(--text-secondary)]">{message}</p>
      </div>

      <button
        type="button"
        onClick={onRetry}
        className="inline-flex h-10 min-h-[44px] items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-6 text-[13px] font-semibold text-[var(--primary-ink)] shadow-[0_0_20px_rgba(45,212,191,0.18)] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] sm:min-h-0"
      >
        Try again
      </button>
    </div>
  );
}

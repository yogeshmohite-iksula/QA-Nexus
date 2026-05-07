// F12 KB Upload — component. Mounted via app/(app)/kb/upload/page.tsx.
//
// Locked reference: PM1_UI_v2/frame  html view/F12 Upload Requirements · Test Cases.html
// Design tokens: CLAUDE.md §4 + 01_SYSTEM.md §3.1
//   TEAL var(--primary) = system CTAs (Browse, Upload button)
//   VIOLET var(--secondary) = AI surfaces (A1 enrichment badge)
//   GREEN var(--pass) = success state
//   RED var(--fail) = error state
//
// Shell wrap: AdminShell with active="knowledge-base" + projectKeyLower="ret"
// (Iksula Returns anchor). Matches F15 KB pattern — single source of truth
// for KB nav rail + top utility bar. Page no longer renders its own
// project header (the shell does).
//
// Day-12 TASK 1 RESUME (M2 close): Pattern A stub (setInterval) replaced
// with the real 3-step flow against BE+1's PR #78 + the existing
// finalize-upload from PR #40:
//
//   1. POST /api/projects/:projectId/kb/documents
//        → { documentId, presignedUploadUrl, r2Key }
//   2. PUT presignedUploadUrl with file bytes
//   3. POST /api/admin/kb/finalize-upload (sync; chunks + embeds)
//
// `chunkCount > 0` from finalize signals success — no polling needed
// since finalize is sync (~3-5 s). Pattern A `console.info` deferred
// markers removed.

'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronRight, CheckCircle2, FileText, Loader2, UploadCloud, XCircle } from 'lucide-react';
import { AdminShell } from '@/components/admin/admin-shell';
import {
  canonicalMimeForFileType,
  createKbDocument,
  fileTypeFromExt,
  finalizeKbUpload,
  putToR2,
} from '@/lib/api/kb-upload-api';
import { useProjectList } from '@/lib/contexts/ProjectContext';

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
// Main component — thin shell wrapper. Matches F15 split: shell-wrap fn
// returns AdminShell wrapping the content fn. projectKeyLower="ret" for
// the Iksula Returns anchor (per Day-11 brief).
// ---------------------------------------------------------------------------

export function KbUploadPage() {
  return (
    <AdminShell active="knowledge-base" projectKeyLower="ret">
      <KbUploadPageContent />
    </AdminShell>
  );
}

function KbUploadPageContent() {
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Resolve the active project's UUID from the project list. F12 is
  // mounted at /kb/upload (workspace-scoped), but BE endpoints are
  // project-scoped. Anchored to RET (Iksula Returns) to match the
  // AdminShell's projectKeyLower="ret" prop. PM2 will replace this
  // lookup with a real workspace route.
  const projects = useProjectList();
  const projectId = useMemo(
    () => projects.find((p) => p.key.toLowerCase() === 'ret')?.id ?? null,
    [projects],
  );

  const [uploadState, setUploadState] = useState<UploadState>('initial');
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [progress, setProgress] = useState(0); // 0–100
  const [progressLabel, setProgressLabel] = useState('Preparing…');
  const [errorMsg, setErrorMsg] = useState('');
  const [dragActive, setDragActive] = useState(false);
  /** Track in-flight upload so unmount can abort the network leg. */
  const uploadAbortRef = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      uploadAbortRef.current?.abort();
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
  // Upload (Pattern B — real BE pipeline, 3 sequential steps)
  //   1. POST /api/projects/:projectId/kb/documents → presigned URL
  //   2. PUT bytes → R2
  //   3. POST /api/admin/kb/finalize-upload (sync; returns chunkCount)
  // ---------------------------------------------------------------------------

  async function startUpload() {
    if (!selectedFile) return;
    if (!projectId) {
      setErrorMsg('No active project. Select a project from the top bar before uploading.');
      setUploadState('error');
      return;
    }

    const fileType = fileTypeFromExt(selectedFile.name);
    if (!fileType) {
      setErrorMsg(
        `"${selectedFile.name}" extension is not supported by the BE. Accepted: .pdf .docx .md .txt .xlsx .csv.`,
      );
      setUploadState('error');
      return;
    }

    const mimeType = canonicalMimeForFileType(fileType, selectedFile.raw.type);

    setProgress(0);
    setProgressLabel('Creating document…');
    setUploadState('uploading');

    try {
      // STEP 1 — create kb_document row + get presigned URL
      const createRes = await createKbDocument(projectId, {
        fileName: selectedFile.name,
        fileSize: selectedFile.bytes,
        mimeType,
        fileType,
      });
      setProgress(25);

      // STEP 2 — PUT bytes to R2
      setProgressLabel('Uploading to R2…');
      await putToR2(createRes.presignedUploadUrl, selectedFile.raw, mimeType);
      setProgress(60);

      // STEP 3 — finalize: BE chunks + embeds (sync, ~3-5 s)
      setProgressLabel('Indexing chunks + embedding…');
      const finalizeRes = await finalizeKbUpload({
        documentId: createRes.documentId,
        fileName: selectedFile.name,
        r2Key: createRes.r2Key,
      });
      setProgress(100);
      setProgressLabel(
        `Indexed ${finalizeRes.chunkCount} chunks · ${finalizeRes.embeddedCount} embedded`,
      );
      // Tiny visual settle, then success state
      setTimeout(() => setUploadState('success'), 250);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Upload failed. Please try again.';
      setErrorMsg(msg);
      setUploadState('error');
    }
  }

  function reset() {
    uploadAbortRef.current?.abort();
    uploadAbortRef.current = null;
    setSelectedFile(null);
    setProgress(0);
    setProgressLabel('Preparing…');
    setErrorMsg('');
    setUploadState('initial');
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <main className="mx-auto flex w-full max-w-screen-2xl flex-col gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-6 lg:px-8">
      {/* Page header — breadcrumb + title. Project header text is owned by
          AdminShell's top utility bar; we only own the page-scoped trail. */}
      <header className="flex flex-col gap-2">
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-1.5 text-[12.5px] text-[var(--text-tertiary)]">
            <li>
              <a
                href="/home"
                className="hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
              >
                Home
              </a>
            </li>
            <li aria-hidden="true">
              <ChevronRight size={11} className="text-[var(--text-tertiary)]" />
            </li>
            <li>
              <a
                href="/projects/ret/kb"
                className="hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
              >
                Knowledge Base
              </a>
            </li>
            <li aria-hidden="true">
              <ChevronRight size={11} className="text-[var(--text-tertiary)]" />
            </li>
            <li className="text-[var(--text-secondary)]">Upload document</li>
          </ol>
        </nav>
        <h1 className="font-display text-[20px] font-bold leading-[26px] tracking-[-0.01em] text-[var(--text-primary)] sm:text-[24px] sm:leading-[32px]">
          Upload document
        </h1>
        <p className="text-[13px] leading-[18px] text-[var(--text-tertiary)] sm:text-[14px]">
          PDF · Word · Markdown · Plain text &mdash; max 50 MB.
        </p>
      </header>

      {/* ── Body — constrained reading width for the upload form ── */}
      <div className="mx-auto w-full max-w-[640px]">
        {/* upload-state branches below */}
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
          <UploadingState file={selectedFile} progress={progress} progressLabel={progressLabel} />
        )}

        {uploadState === 'success' && selectedFile && (
          <SuccessState file={selectedFile} onUploadAnother={reset} />
        )}

        {uploadState === 'error' && <ErrorState message={errorMsg} onRetry={reset} />}
      </div>
    </main>
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

function UploadingState({
  file,
  progress,
  progressLabel,
}: {
  file: SelectedFile;
  progress: number;
  progressLabel: string;
}) {
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
          <span className="truncate">{progressLabel}</span>
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

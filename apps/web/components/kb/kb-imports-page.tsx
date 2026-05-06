// F13 KB Imports — component. Mounted via app/(app)/kb/imports/page.tsx.
//
// Locked reference: PM1_UI_v2/frame  html view/F13 Imported Files List.html
// Design tokens: CLAUDE.md §4 + 01_SYSTEM.md §3.1
//   TEAL var(--primary)   = system CTAs (Upload new, primary buttons)
//   GREEN var(--pass)     = "Ready" status badge
//   AMBER var(--warn)     = "Processing" status badge
//   RED var(--fail)       = "Failed" status badge + Delete confirm CTA
//   VIOLET var(--secondary) = NOT used here (no AI surface in F13)
//
// Shell wrap: AdminShell with active="knowledge-base" + projectKeyLower="ret"
// (Iksula Returns anchor). Matches F15 KB pattern — page no longer renders
// its own project header (the shell does).
//
// Pattern A markers (3 deferred):
//   pattern-a:deferred:kb:imports:view   { docId }
//   pattern-a:deferred:kb:imports:delete { docId }
//   pattern-a:deferred:kb:imports:retry  { docId }
//
// Anti-drift: ZERO axios / fetch / useMutation here.

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  Film,
  Loader2,
  RefreshCw,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { AdminShell } from '@/components/admin/admin-shell';

// ---------------------------------------------------------------------------
// Stub data (Pattern A) — verbatim from Day-11 brief
// ---------------------------------------------------------------------------

type ImportStatus = 'ready' | 'processing' | 'failed';

interface ImportRow {
  id: string;
  fileName: string;
  ext: string;
  bytes: number;
  uploadedBy: string;
  uploadedAtRelative: string;
  status: ImportStatus;
  /** number of indexed chunks; null while processing/failed */
  chunks: number | null;
}

const STUB_ROWS: ImportRow[] = [
  {
    id: 'kbi_001',
    fileName: 'return_policy_v2.xlsx',
    ext: '.xlsx',
    bytes: 248_320,
    uploadedBy: 'Akshay Panchal',
    uploadedAtRelative: '2 hr ago',
    status: 'ready',
    chunks: 12,
  },
  {
    id: 'kbi_002',
    fileName: 'legacy_refund_test_cases.csv',
    ext: '.csv',
    bytes: 91_404,
    uploadedBy: 'Yogesh Mohite',
    uploadedAtRelative: '1 hr ago',
    status: 'processing',
    chunks: null,
  },
  {
    id: 'kbi_003',
    fileName: 'customer_return_flow_recording.mp4',
    ext: '.mp4',
    bytes: 47_104_000,
    uploadedBy: 'Kishor Kadam',
    uploadedAtRelative: '30 min ago',
    status: 'failed',
    chunks: null,
  },
  {
    id: 'kbi_004',
    fileName: 'rfp_template_v3.docx',
    ext: '.docx',
    bytes: 521_312,
    uploadedBy: 'Nadim Siddiqui',
    uploadedAtRelative: '1 day ago',
    status: 'ready',
    chunks: 8,
  },
  {
    id: 'kbi_005',
    fileName: 'compliance_checklist.pdf',
    ext: '.pdf',
    bytes: 2_404_864,
    uploadedBy: 'Akshay Panchal',
    uploadedAtRelative: '3 days ago',
    status: 'ready',
    chunks: 22,
  },
];

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

function fileTypeLabel(ext: string): string {
  const map: Record<string, string> = {
    '.pdf': 'PDF',
    '.docx': 'Word',
    '.md': 'Markdown',
    '.txt': 'Text',
    '.xlsx': 'Excel',
    '.csv': 'CSV',
    '.mp4': 'Video',
  };
  return map[ext] ?? ext.replace('.', '').toUpperCase();
}

function FileIcon({ ext }: { ext: string }) {
  // Color cycling per family. Tokens only — no raw hex.
  if (ext === '.xlsx' || ext === '.csv') {
    return (
      <div
        aria-hidden="true"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
        style={{ background: 'rgba(52,211,153,0.10)', color: 'var(--pass)' }}
      >
        <FileSpreadsheet size={18} />
      </div>
    );
  }
  if (ext === '.mp4') {
    return (
      <div
        aria-hidden="true"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
        style={{ background: 'rgba(248,113,113,0.10)', color: 'var(--fail)' }}
      >
        <Film size={18} />
      </div>
    );
  }
  // pdf / docx / md / txt fallback
  return (
    <div
      aria-hidden="true"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
      style={{ background: 'rgba(45,212,191,0.10)', color: 'var(--primary)' }}
    >
      <FileText size={18} />
    </div>
  );
}

function StatusBadge({ status }: { status: ImportStatus }) {
  if (status === 'ready') {
    return (
      <span
        className="inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-semibold uppercase tracking-[0.04em]"
        style={{ background: 'rgba(52,211,153,0.12)', color: 'var(--pass)' }}
      >
        <CheckCircle2 size={12} aria-hidden="true" />
        Ready
      </span>
    );
  }
  if (status === 'processing') {
    return (
      <span
        className="inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-semibold uppercase tracking-[0.04em]"
        style={{ background: 'rgba(251,191,36,0.12)', color: 'var(--warn)' }}
      >
        <Loader2 size={12} aria-hidden="true" className="animate-spin" />
        Processing
      </span>
    );
  }
  return (
    <span
      className="inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-semibold uppercase tracking-[0.04em]"
      style={{ background: 'rgba(248,113,113,0.12)', color: 'var(--fail)' }}
    >
      <AlertCircle size={12} aria-hidden="true" />
      Failed
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main component — thin shell wrapper. Matches F15 split: shell-wrap fn
// returns AdminShell wrapping the content fn. projectKeyLower="ret" for
// the Iksula Returns anchor (per Day-11 brief).
// ---------------------------------------------------------------------------

export function KbImportsPage() {
  return (
    <AdminShell active="knowledge-base" projectKeyLower="ret">
      <KbImportsPageContent />
    </AdminShell>
  );
}

function KbImportsPageContent() {
  const [rows] = useState<ImportRow[]>(STUB_ROWS);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const counts = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        acc[r.status]++;
        acc.total++;
        return acc;
      },
      { ready: 0, processing: 0, failed: 0, total: 0 } as Record<string, number>,
    );
  }, [rows]);

  const onView = useCallback((docId: string) => {
    console.info('pattern-a:deferred:kb:imports:view', { docId });
  }, []);
  const onRetry = useCallback((docId: string) => {
    console.info('pattern-a:deferred:kb:imports:retry', { docId });
  }, []);
  const onConfirmDelete = useCallback((docId: string) => {
    console.info('pattern-a:deferred:kb:imports:delete', { docId });
    setConfirmDeleteId(null);
  }, []);

  const pendingDeleteRow = rows.find((r) => r.id === confirmDeleteId) ?? null;

  return (
    <>
      <main className="mx-auto flex w-full max-w-screen-2xl flex-col gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-6 lg:px-8">
        {/* Page header — breadcrumb + title + Upload CTA. Project header
            text owned by AdminShell's top utility bar. */}
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <div className="flex flex-col gap-2">
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
                <li className="text-[var(--text-secondary)]">Imports</li>
              </ol>
            </nav>
            <h1 className="font-display text-[20px] font-bold leading-[26px] tracking-[-0.01em] text-[var(--text-primary)] sm:text-[24px] sm:leading-[32px]">
              Imported files
            </h1>
            <p className="text-[13px] leading-[18px] text-[var(--text-tertiary)] sm:text-[14px]">
              Documents added to the project knowledge base. Indexed content powers A1 suggestions,
              A2 dedup, and A4 RCA evidence retrieval.
            </p>
          </div>
          <Link
            href="/kb/upload"
            className="inline-flex h-9 min-h-[44px] shrink-0 items-center gap-1.5 self-start rounded-md px-3 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] sm:min-h-0 sm:self-end"
            style={{
              background: 'var(--primary)',
              color: 'var(--primary-ink)',
            }}
          >
            <Upload size={14} aria-hidden="true" />
            <span>Upload document</span>
          </Link>
        </header>

        {/* ── Stats strip — 3 cards ── */}
        <div className="mb-6 grid grid-cols-3 gap-3 sm:gap-4">
          <StatCard label="Total" value={counts.total} accent="var(--text-primary)" />
          <StatCard label="Ready" value={counts.ready} accent="var(--pass)" />
          <StatCard
            label="Processing"
            value={counts.processing}
            accent="var(--warn)"
            extra={counts.failed > 0 ? `${counts.failed} failed` : undefined}
            extraColor="var(--fail)"
          />
        </div>

        {/* ── Table (desktop) ── */}
        <div
          className="hidden overflow-hidden rounded-lg border md:block"
          style={{
            borderColor: 'var(--border-subtle)',
            background: 'var(--base)',
          }}
        >
          <table className="w-full border-collapse text-left">
            <thead>
              <tr
                className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]"
                style={{ background: 'var(--overlay)' }}
              >
                <th className="px-4 py-3 font-semibold">File</th>
                <th className="px-4 py-3 font-semibold">Size</th>
                <th className="px-4 py-3 font-semibold">Uploaded by</th>
                <th className="px-4 py-3 font-semibold">Uploaded</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Chunks</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.id}
                  className="border-t text-[13px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--overlay)]"
                  style={{
                    borderColor: 'var(--border-subtle)',
                    background: i % 2 === 0 ? 'transparent' : 'var(--raised)',
                  }}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <FileIcon ext={row.ext} />
                      <div className="flex min-w-0 flex-col">
                        <button
                          type="button"
                          onClick={() => onView(row.id)}
                          className="truncate text-left text-[13px] font-semibold text-[var(--text-primary)] hover:text-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
                          style={{
                            fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
                          }}
                        >
                          {row.fileName}
                        </button>
                        <span className="text-[11px] uppercase tracking-[0.04em] text-[var(--text-tertiary)]">
                          {fileTypeLabel(row.ext)}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td
                    className="px-4 py-3 text-[var(--text-secondary)]"
                    style={{
                      fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {formatBytes(row.bytes)}
                  </td>
                  <td className="px-4 py-3">{row.uploadedBy}</td>
                  <td
                    className="px-4 py-3 text-[var(--text-tertiary)]"
                    style={{
                      fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {row.uploadedAtRelative}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={row.status} />
                  </td>
                  <td
                    className="px-4 py-3 text-[var(--text-secondary)]"
                    style={{
                      fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {row.chunks ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {row.status === 'failed' && (
                        <button
                          type="button"
                          onClick={() => onRetry(row.id)}
                          aria-label={`Retry import for ${row.fileName}`}
                          className="inline-flex h-8 min-h-[32px] items-center gap-1 rounded-md border px-2 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
                          style={{
                            borderColor: 'var(--border-subtle)',
                            color: 'var(--warn)',
                          }}
                        >
                          <RefreshCw size={12} aria-hidden="true" />
                          <span>Retry</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(row.id)}
                        aria-label={`Delete ${row.fileName}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-tertiary)] transition-colors hover:bg-[var(--overlay)] hover:text-[var(--fail)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
                      >
                        <Trash2 size={14} aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Cards (mobile) ── */}
        <ul className="flex flex-col gap-3 md:hidden">
          {rows.map((row) => (
            <li
              key={row.id}
              className="rounded-lg border p-4"
              style={{
                borderColor: 'var(--border-subtle)',
                background: 'var(--base)',
              }}
            >
              <div className="flex items-start gap-3">
                <FileIcon ext={row.ext} />
                <div className="flex min-w-0 flex-1 flex-col">
                  <button
                    type="button"
                    onClick={() => onView(row.id)}
                    className="truncate text-left text-[13px] font-semibold text-[var(--text-primary)] hover:text-[var(--primary)]"
                    style={{
                      fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
                    }}
                  >
                    {row.fileName}
                  </button>
                  <div
                    className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[var(--text-tertiary)]"
                    style={{
                      fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    <span>{fileTypeLabel(row.ext)}</span>
                    <span aria-hidden="true">·</span>
                    <span>{formatBytes(row.bytes)}</span>
                    <span aria-hidden="true">·</span>
                    <span>{row.chunks !== null ? `${row.chunks} chunks` : '—'}</span>
                  </div>
                </div>
                <StatusBadge status={row.status} />
              </div>

              <div
                className="mt-3 flex items-center justify-between border-t pt-3 text-[11px] text-[var(--text-tertiary)]"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <span>
                  {row.uploadedBy} &middot; {row.uploadedAtRelative}
                </span>
                <div className="flex items-center gap-1">
                  {row.status === 'failed' && (
                    <button
                      type="button"
                      onClick={() => onRetry(row.id)}
                      aria-label={`Retry import for ${row.fileName}`}
                      className="inline-flex h-8 min-h-[44px] items-center gap-1 rounded-md border px-2.5 text-[12px] font-medium"
                      style={{
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--warn)',
                      }}
                    >
                      <RefreshCw size={12} aria-hidden="true" />
                      Retry
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(row.id)}
                    aria-label={`Delete ${row.fileName}`}
                    className="inline-flex h-8 min-h-[44px] w-8 min-w-[44px] items-center justify-center rounded-md text-[var(--text-tertiary)] hover:text-[var(--fail)]"
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </main>

      {/* ── Delete confirm modal ── */}
      {pendingDeleteRow && (
        <DeleteConfirmModal
          fileName={pendingDeleteRow.fileName}
          onCancel={() => setConfirmDeleteId(null)}
          onConfirm={() => onConfirmDelete(pendingDeleteRow.id)}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// StatCard — small primitive for the stats strip
// ---------------------------------------------------------------------------

interface StatCardProps {
  label: string;
  value: number;
  accent: string;
  extra?: string;
  extraColor?: string;
}

function StatCard({ label, value, accent, extra, extraColor }: StatCardProps) {
  return (
    <div
      className="rounded-lg border p-3 sm:p-4"
      style={{
        borderColor: 'var(--border-subtle)',
        background: 'var(--base)',
      }}
    >
      <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <span
          className="font-display text-[22px] font-bold leading-none sm:text-[24px]"
          style={{
            color: accent,
            fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value}
        </span>
        {extra && (
          <span className="text-[11px] font-medium" style={{ color: extraColor ?? accent }}>
            {extra}
          </span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DeleteConfirmModal — Pattern A, focus-trap-light, ESC closes
// ---------------------------------------------------------------------------

interface DeleteConfirmModalProps {
  fileName: string;
  onCancel: () => void;
  onConfirm: () => void;
}

function DeleteConfirmModal({ fileName, onCancel, onConfirm }: DeleteConfirmModalProps) {
  const confirmRef = useRef<HTMLButtonElement | null>(null);

  // Auto-focus confirm button + ESC to close
  useEffect(() => {
    confirmRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-confirm-title"
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      style={{ background: 'rgba(11,15,23,0.72)' }}
    >
      <div
        className="relative w-full max-w-[480px] rounded-t-2xl border border-[var(--border-subtle)] bg-[var(--base)] p-5 shadow-2xl sm:rounded-2xl sm:p-6"
        style={{ minHeight: 'min(360px, 100%)' }}
      >
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close"
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-tertiary)] transition-colors hover:bg-[var(--overlay)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
        >
          <X size={16} aria-hidden="true" />
        </button>

        <div
          aria-hidden="true"
          className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full"
          style={{ background: 'rgba(248,113,113,0.12)', color: 'var(--fail)' }}
        >
          <Trash2 size={18} />
        </div>

        <h3
          id="delete-confirm-title"
          className="font-display m-0 mb-2 text-[18px] font-semibold leading-[24px] text-[var(--text-primary)] sm:text-[20px]"
          style={{ fontFamily: 'var(--font-dm-sans), system-ui, sans-serif' }}
        >
          Delete this import?
        </h3>
        <p className="m-0 text-[13px] leading-[18px] text-[var(--text-secondary)] sm:text-[14px]">
          This permanently removes{' '}
          <span
            className="font-semibold text-[var(--text-primary)]"
            style={{ fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace' }}
          >
            {fileName}
          </span>{' '}
          and its indexed chunks from the knowledge base. References to this document in test cases
          or defects will become stale. This cannot be undone.
        </p>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-10 min-h-[44px] items-center justify-center rounded-md border px-4 text-[13px] font-semibold text-[var(--text-secondary)] transition-colors hover:bg-[var(--overlay)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] sm:min-h-0"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            Cancel
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className="inline-flex h-10 min-h-[44px] items-center justify-center gap-1.5 rounded-md px-4 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] sm:min-h-0"
            style={{
              background: 'var(--fail)',
              color: '#0b0f17',
            }}
          >
            <Trash2 size={14} aria-hidden="true" />
            Delete import
          </button>
        </div>
      </div>
    </div>
  );
}

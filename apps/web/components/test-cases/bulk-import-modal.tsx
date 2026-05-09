// F16c Bulk Import Test Cases Modal — Pattern A scaffold (M3 Day-14
// Sat evening TASK B1).
//
// Locked reference: PM1_UI_v2/Redesign Frame by claude design/F16c
// Bulk Import Test Cases v2.html
//
// Per Hard Rule 15: pixel-faithful port within React-component idioms.
//
// Sizing per 01_SYSTEM.md §4.4: Stage modal 1120×860 desktop;
// full-screen sheet < md (Hard Rule 12).
//
// Reached from F16a Test Case Method Chooser modal "Bulk Import" card.
// URL trigger: `?bulk-import=1` on the parent /test-cases route.
// Renders the Dedupe phase (step 4 of 5) — the wizard's pre-import
// review surface where Curator's 14 potential-duplicate matches
// require user decisions before the final import fires.
//
// Pattern A markers fire `pattern-a:deferred:f16c:*` for every
// interactive site so Day-15 swap-point traceability is preserved.

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Download,
  FileText,
  Sparkles,
  SortDesc,
  Upload,
  X,
} from 'lucide-react';
import {
  CANNED_FILE,
  CANNED_DUP_PAIRS,
  CURATOR_META,
  DEFAULT_STRATEGY,
  STRATEGIES,
  TOTAL_DUP_COUNT,
  computeImportSummary,
  type DedupePair,
  type StrategyKey,
  type SimilarityTier,
} from './bulk-import-canned-data';

interface BulkImportModalProps {
  open: boolean;
  onClose: () => void;
}

export function BulkImportModal({ open, onClose }: BulkImportModalProps) {
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const [strategy, setStrategy] = useState<StrategyKey>(DEFAULT_STRATEGY);
  // Per-row override decisions that diverge from the default strategy.
  const [rowOverrides, setRowOverrides] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!open) return;
    console.info('pattern-a:deferred:f16c:open');
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        console.info('pattern-a:deferred:f16c:close', { reason: 'esc' });
        onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    setTimeout(() => closeBtnRef.current?.focus(), 80);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  const handleBackdrop = useCallback(() => {
    console.info('pattern-a:deferred:f16c:close', { reason: 'backdrop' });
    onClose();
  }, [onClose]);

  const handleX = useCallback(() => {
    console.info('pattern-a:deferred:f16c:close', { reason: 'x' });
    onClose();
  }, [onClose]);

  const handleStrategyChange = useCallback((k: StrategyKey) => {
    console.info('pattern-a:deferred:f16c:strategy-change', { strategy: k });
    setStrategy(k);
  }, []);

  const handlePairAction = useCallback((row: number, action: string) => {
    console.info('pattern-a:deferred:f16c:pair-action', { row, action });
    setRowOverrides((prev) => ({ ...prev, [row]: action }));
  }, []);

  const summary = useMemo(
    () => computeImportSummary(CANNED_FILE, strategy, TOTAL_DUP_COUNT),
    [strategy],
  );

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="f16c-title"
      className="fixed inset-0 z-50 flex items-center justify-center sm:p-6"
    >
      {/* Scrim */}
      <button
        type="button"
        aria-label="Close bulk import"
        tabIndex={-1}
        onClick={handleBackdrop}
        className="absolute inset-0"
        style={{
          background: 'rgba(11,15,23,0.72)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Modal */}
      <div
        className="relative flex h-full max-h-full w-full max-w-screen-xl flex-col overflow-hidden border bg-[var(--base)] shadow-2xl outline-none sm:max-h-[860px] sm:rounded-[14px]"
        style={{
          borderColor: 'var(--border)',
          boxShadow: '0 40px 88px -24px rgba(0,0,0,0.8), 0 0 0 1px rgba(45,212,191,0.06)',
        }}
      >
        <ModalHeader
          fileName={CANNED_FILE.name}
          sizeLabel={CANNED_FILE.sizeLabel}
          source={CANNED_FILE.source}
          rowsTotal={CANNED_FILE.rowsTotal}
          fieldsMapped={CANNED_FILE.fieldsMapped}
          fieldsTotal={CANNED_FILE.fieldsTotal}
          rowsExcluded={CANNED_FILE.rowsExcluded}
          dupCount={TOTAL_DUP_COUNT}
          onClose={handleX}
          closeBtnRef={closeBtnRef}
        />

        <Stepper currentStep="dedupe" />

        {/* Body — scrollable */}
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          <DoneCard />
          <PhaseCard dupCount={TOTAL_DUP_COUNT} />
          <StrategyRadios current={strategy} onChange={handleStrategyChange} />
          <PairList
            pairs={CANNED_DUP_PAIRS}
            totalDups={TOTAL_DUP_COUNT}
            rowOverrides={rowOverrides}
            onPairAction={handlePairAction}
          />
        </div>

        <ModalFooter
          newRows={summary.newRows}
          dupHandled={summary.dupHandled}
          excluded={summary.excluded}
          destination={summary.destination}
          onBack={() => {
            console.info('pattern-a:deferred:f16c:back-to-validate');
            onClose();
          }}
          onContinue={() => {
            console.info('pattern-a:deferred:f16c:continue', {
              newRows: summary.newRows,
              strategy,
            });
            onClose();
          }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface ModalHeaderProps {
  fileName: string;
  sizeLabel: string;
  source: string;
  rowsTotal: number;
  fieldsMapped: number;
  fieldsTotal: number;
  rowsExcluded: number;
  dupCount: number;
  onClose: () => void;
  closeBtnRef: React.RefObject<HTMLButtonElement | null>;
}

function ModalHeader({
  fileName,
  sizeLabel,
  source,
  rowsTotal,
  fieldsMapped,
  fieldsTotal,
  rowsExcluded,
  dupCount,
  onClose,
  closeBtnRef,
}: ModalHeaderProps) {
  return (
    <header
      className="flex flex-none items-start gap-3.5 border-b px-4 py-4 sm:gap-4 sm:px-6"
      style={{ borderColor: 'var(--border)' }}
    >
      <span
        aria-hidden="true"
        className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-[10px]"
        style={{
          background: 'rgba(45,212,191,0.10)',
          color: 'var(--primary)',
        }}
      >
        <Upload size={18} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <div
          className="flex flex-wrap items-center gap-2 font-mono text-[10.5px] font-bold uppercase"
          style={{
            color: 'var(--text-tertiary)',
            letterSpacing: '0.08em',
          }}
        >
          Bulk Import · Test Cases
          <FilePill tone="info">{fileName}</FilePill>
          <FilePill tone="neutral">{sizeLabel}</FilePill>
        </div>
        <h2
          id="f16c-title"
          className="font-display m-0 mt-1.5 text-[20px] font-bold leading-[26px]"
          style={{ color: 'var(--text-primary)' }}
        >
          Resolve duplicates before import
        </h2>
        <p
          className="m-0 mt-1 text-[12.5px] leading-[18px]"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Source: <b style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{source}</b> ·{' '}
          {rowsTotal} rows · {fieldsMapped} of {fieldsTotal} fields mapped · {rowsExcluded} rows
          excluded · A2 found{' '}
          <b style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{dupCount}</b> potential
          matches.
        </p>
      </div>
      <button
        ref={closeBtnRef}
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="ml-auto inline-flex h-9 w-9 flex-none items-center justify-center rounded-md transition-colors hover:bg-[var(--raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
        style={{ color: 'var(--text-tertiary)' }}
      >
        <X size={18} aria-hidden="true" />
      </button>
    </header>
  );
}

function FilePill({ tone, children }: { tone: 'info' | 'neutral'; children: React.ReactNode }) {
  if (tone === 'info') {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 font-mono text-[10.5px] font-semibold normal-case leading-none"
        style={{
          background: 'rgba(96,165,250,0.12)',
          color: 'var(--info)',
          border: '1px solid rgba(96,165,250,0.30)',
          letterSpacing: '0.02em',
        }}
      >
        <FileText size={10} aria-hidden="true" />
        {children}
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center rounded-sm px-1.5 py-0.5 font-mono text-[10.5px] font-semibold normal-case leading-none"
      style={{
        background: 'var(--raised)',
        color: 'var(--text-tertiary)',
        border: '1px solid var(--border)',
        letterSpacing: '0.02em',
      }}
    >
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// 5-step stepper
// ---------------------------------------------------------------------------

interface StepperProps {
  currentStep: 'upload' | 'map' | 'validate' | 'dedupe' | 'summary';
}

const STEPS: Array<{
  key: StepperProps['currentStep'];
  num: number;
  label: string;
  meta: string;
}> = [
  { key: 'upload', num: 1, label: 'Upload', meta: '1 file · 2.4 MB' },
  { key: 'map', num: 2, label: 'Map fields', meta: '8 of 9 mapped' },
  { key: 'validate', num: 3, label: 'Validate', meta: '245 valid · 2 excluded' },
  { key: 'dedupe', num: 4, label: 'Dedupe', meta: '14 potential matches' },
  { key: 'summary', num: 5, label: 'Summary', meta: 'awaiting strategy' },
];

function Stepper({ currentStep }: StepperProps) {
  const currentIdx = STEPS.findIndex((s) => s.key === currentStep);
  return (
    <nav
      aria-label="Import phases"
      className="flex h-[60px] flex-none items-center overflow-x-auto border-b px-4 sm:px-6"
      style={{
        background: 'var(--base)',
        borderColor: 'var(--border)',
      }}
    >
      {STEPS.map((s, idx) => {
        const tone = idx < currentIdx ? 'done' : idx === currentIdx ? 'current' : 'default';
        return <StepperItem key={s.key} step={s} tone={tone} divider={idx > 0} />;
      })}
    </nav>
  );
}

function StepperItem({
  step,
  tone,
  divider,
}: {
  step: (typeof STEPS)[number];
  tone: 'done' | 'current' | 'default';
  divider: boolean;
}) {
  return (
    <div
      className="relative flex min-w-[130px] flex-1 items-center justify-center gap-2.5 py-4 text-[12.5px] font-semibold"
      style={{
        color:
          tone === 'current'
            ? 'var(--text-primary)'
            : tone === 'done'
              ? 'var(--text-secondary)'
              : 'var(--text-tertiary)',
        borderBottom: `2px solid ${tone === 'current' ? 'var(--primary)' : 'transparent'}`,
        lineHeight: 1,
      }}
    >
      {divider && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-1/2 h-[18px] w-px -translate-y-1/2"
          style={{ background: 'var(--border)' }}
        />
      )}
      <span
        className="inline-flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full font-mono text-[10.5px] font-semibold"
        style={
          tone === 'done'
            ? {
                background: 'rgba(45,212,191,0.10)',
                border: '1.5px solid var(--primary)',
                color: 'var(--primary)',
              }
            : tone === 'current'
              ? {
                  background: 'var(--primary)',
                  border: '1.5px solid var(--primary)',
                  color: 'var(--primary-ink)',
                  boxShadow: '0 0 0 4px rgba(45,212,191,0.10)',
                }
              : {
                  border: '1.5px solid var(--border-strong)',
                }
        }
      >
        {tone === 'done' ? <Check size={11} strokeWidth={3} /> : step.num}
      </span>
      <span className="flex flex-col items-start gap-px">
        <span className="text-[12.5px] font-semibold">{step.label}</span>
        <span
          className="font-mono text-[9.5px] font-normal"
          style={{
            color:
              tone === 'current'
                ? 'var(--primary)'
                : tone === 'done'
                  ? 'var(--pass)'
                  : 'var(--text-tertiary)',
          }}
        >
          {step.meta}
        </span>
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Done-card recap (Steps 1-3)
// ---------------------------------------------------------------------------

function DoneCard() {
  return (
    <div
      className="flex flex-wrap items-start gap-3 rounded-md border px-3 py-3"
      style={{
        background: 'rgba(52,211,153,0.06)',
        borderColor: 'rgba(52,211,153,0.34)',
      }}
    >
      <span
        aria-hidden="true"
        className="inline-flex h-6 w-6 flex-none items-center justify-center rounded"
        style={{
          background: 'rgba(52,211,153,0.14)',
          color: 'var(--pass)',
          border: '1px solid rgba(52,211,153,0.34)',
        }}
      >
        <Check size={12} strokeWidth={3} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <h4 className="m-0 text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
          Upload &amp; Map &amp; Validate complete
        </h4>
        <p
          className="m-0 mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11.5px]"
          style={{ color: 'var(--text-tertiary)' }}
        >
          <b style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>247</b> rows
          <span style={{ color: 'var(--text-tertiary)' }}>·</span>
          <b style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>8/9</b> fields mapped
          <span style={{ color: 'var(--text-tertiary)' }}>·</span>
          <span style={{ color: 'var(--info)' }}>Steps→test_steps</span>
          <span style={{ color: 'var(--text-tertiary)' }}>·</span>
          <span style={{ color: 'var(--info)' }}>Expected→expected_results</span>
          <span style={{ color: 'var(--text-tertiary)' }}>·</span>
          <b style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>245</b> valid
          <span style={{ color: 'var(--text-tertiary)' }}>·</span>
          <span style={{ color: 'var(--warn)' }}>2 excluded</span>
          <span className="ml-1 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
            (Row 17: expected_results empty · Row 89: malformed steps)
          </span>
        </p>
      </div>
      <button
        type="button"
        onClick={() => {
          console.info('pattern-a:deferred:f16c:review-prior-steps');
        }}
        className="inline-flex h-7 flex-none items-center gap-1 rounded px-2 text-[11.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
        style={{
          color: 'var(--text-secondary)',
          border: '1px solid var(--border)',
        }}
      >
        Review ↑
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Phase card (Curator dedup metadata)
// ---------------------------------------------------------------------------

function PhaseCard({ dupCount }: { dupCount: number }) {
  return (
    <section
      className="flex flex-wrap items-center gap-3 rounded-[12px] border px-4 py-3.5"
      style={{
        background: 'rgba(167,139,250,0.06)',
        borderColor: 'rgba(167,139,250,0.30)',
      }}
    >
      <span
        aria-hidden="true"
        className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-md"
        style={{
          background: 'rgba(167,139,250,0.12)',
          color: 'var(--secondary)',
          border: '1px solid rgba(167,139,250,0.30)',
        }}
      >
        <Sparkles size={16} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <h3
          className="m-0 text-[14px] font-semibold leading-[20px]"
          style={{ color: 'var(--text-primary)' }}
        >
          <span style={{ color: 'var(--secondary)', fontWeight: 700 }}>{dupCount}</span> potential
          duplicates found in 245 valid rows
        </h3>
        <p
          className="m-0 mt-0.5 inline-flex flex-wrap items-center gap-1.5 text-[11.5px]"
          style={{ color: 'var(--text-tertiary)' }}
        >
          <span
            className="inline-flex items-center rounded-sm px-1.5 py-0.5 font-mono text-[9.5px] font-bold leading-none"
            style={{
              background: 'rgba(167,139,250,0.12)',
              color: 'var(--secondary)',
              border: '1px solid rgba(167,139,250,0.30)',
              letterSpacing: '0.06em',
            }}
          >
            {CURATOR_META.agentId} {CURATOR_META.agentVersion}
          </span>
          {CURATOR_META.technique} · scanned in {CURATOR_META.scanLatency} ·{' '}
          {CURATOR_META.precisionLastImport} precision on last import
        </p>
      </div>
      <span
        className="inline-flex h-6 items-center rounded-full px-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.06em]"
        style={{
          background: 'rgba(52,211,153,0.14)',
          color: 'var(--pass)',
          border: '1px solid rgba(52,211,153,0.34)',
        }}
      >
        scan complete
      </span>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Strategy radio group
// ---------------------------------------------------------------------------

interface StrategyRadiosProps {
  current: StrategyKey;
  onChange: (k: StrategyKey) => void;
}

function StrategyRadios({ current, onChange }: StrategyRadiosProps) {
  return (
    <section role="radiogroup" aria-label="Default merge strategy">
      <p
        className="m-0 mb-2 text-[10px] font-bold uppercase"
        style={{
          letterSpacing: '0.08em',
          color: 'var(--text-tertiary)',
        }}
      >
        Default strategy{' '}
        <span
          style={{
            color: 'var(--text-tertiary)',
            textTransform: 'none',
            letterSpacing: 0,
            fontWeight: 400,
          }}
        >
          — override per-row below
        </span>
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {STRATEGIES.map((s) => {
          const on = current === s.key;
          return (
            <button
              key={s.key}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(s.key)}
              className="flex flex-col items-start gap-1.5 rounded-md border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
              style={
                on
                  ? {
                      borderColor: 'rgba(45,212,191,0.34)',
                      background: 'rgba(45,212,191,0.06)',
                    }
                  : {
                      borderColor: 'var(--border)',
                      background: 'var(--canvas)',
                    }
              }
            >
              <span className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="inline-block h-3.5 w-3.5 flex-none rounded-full"
                  style={
                    on
                      ? {
                          background: 'var(--primary)',
                          boxShadow: '0 0 0 3px rgba(45,212,191,0.20)',
                        }
                      : {
                          border: '1.5px solid var(--border-strong)',
                        }
                  }
                />
                <span
                  className="text-[13px] font-semibold"
                  style={{
                    color: on ? 'var(--text-primary)' : 'var(--text-secondary)',
                  }}
                >
                  {s.title}
                </span>
              </span>
              <span
                className="ml-[22px] text-[11.5px] leading-[16px]"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {s.description}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Pair list (5-col grid degrades to 2-col < 1024)
// ---------------------------------------------------------------------------

interface PairListProps {
  pairs: DedupePair[];
  totalDups: number;
  rowOverrides: Record<number, string>;
  onPairAction: (row: number, action: string) => void;
}

function PairList({ pairs, totalDups, rowOverrides, onPairAction }: PairListProps) {
  return (
    <section className="flex flex-col gap-2.5">
      <div
        className="flex flex-wrap items-center justify-between gap-2.5 rounded-md border px-3 py-2"
        style={{
          background: 'var(--raised)',
          borderColor: 'var(--border)',
        }}
      >
        <span
          className="inline-flex items-center gap-2 text-[12.5px] font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          Duplicate pairs{' '}
          <span
            className="inline-flex items-center rounded-sm px-1.5 py-0.5 font-mono text-[10.5px] font-bold"
            style={{
              background: 'var(--overlay)',
              color: 'var(--text-secondary)',
            }}
          >
            {totalDups}
          </span>
        </span>
        <div className="flex items-center gap-2">
          <GhostBtn
            onClick={() =>
              console.info('pattern-a:deferred:f16c:sort', {
                by: 'similarity-desc',
              })
            }
          >
            <SortDesc size={11} aria-hidden="true" />
            Sort: similarity ↓
          </GhostBtn>
          <GhostBtn onClick={() => console.info('pattern-a:deferred:f16c:export-pairs')}>
            <Download size={11} aria-hidden="true" />
            Export pairs
          </GhostBtn>
        </div>
      </div>

      <ul className="m-0 flex list-none flex-col gap-1.5 pl-0">
        {pairs.map((p) => (
          <PairRow
            key={p.newRow}
            pair={p}
            override={rowOverrides[p.newRow]}
            onAction={onPairAction}
          />
        ))}
      </ul>

      {totalDups > pairs.length && (
        <p
          className="m-0 text-center font-mono text-[11px]"
          style={{ color: 'var(--text-tertiary)' }}
        >
          + {totalDups - pairs.length} more pairs below the fold (Pattern B paginates).
        </p>
      )}
    </section>
  );
}

interface PairRowProps {
  pair: DedupePair;
  override?: string;
  onAction: (row: number, action: string) => void;
}

function PairRow({ pair, override, onAction }: PairRowProps) {
  const simStyle = simChipStyle(pair.tier);
  const simLabel = simTierLabel(pair.tier);
  const action = override ?? pair.recommendedAction;

  return (
    <li
      className="grid grid-cols-1 items-center gap-3 rounded-md border px-3 py-2.5 lg:grid-cols-[1fr_auto_1fr_auto_auto]"
      style={{
        background: 'var(--base)',
        borderColor: 'var(--border)',
      }}
    >
      {/* New side */}
      <div className="flex min-w-0 flex-col gap-0.5">
        <span
          className="inline-flex w-fit items-center rounded-sm px-1.5 py-px font-mono text-[9.5px] font-bold uppercase leading-none"
          style={{
            background: 'rgba(96,165,250,0.12)',
            color: 'var(--info)',
            border: '1px solid rgba(96,165,250,0.30)',
            letterSpacing: '0.06em',
          }}
        >
          row {pair.newRow}
        </span>
        <span
          className="line-clamp-2 text-[12.5px] leading-[16px]"
          style={{ color: 'var(--text-primary)' }}
          title={pair.newTitle}
        >
          {pair.newTitle}
        </span>
      </div>

      {/* Arrow */}
      <span
        aria-hidden="true"
        className="hidden lg:inline-flex"
        style={{ color: 'var(--text-tertiary)' }}
      >
        <ArrowRight size={14} strokeWidth={2.4} />
      </span>

      {/* Existing side */}
      <div className="flex min-w-0 flex-col gap-0.5">
        <span
          className="inline-flex w-fit items-center rounded-sm px-1.5 py-px font-mono text-[9.5px] font-bold uppercase leading-none"
          style={{
            background: 'rgba(45,212,191,0.10)',
            color: 'var(--primary)',
            border: '1px solid rgba(45,212,191,0.28)',
            letterSpacing: '0.06em',
          }}
        >
          {pair.existTcId}
        </span>
        <span
          className="line-clamp-2 text-[12.5px] leading-[16px]"
          style={{ color: 'var(--text-secondary)' }}
        >
          {pair.existTitle}
        </span>
      </div>

      {/* Sim chip */}
      <span
        className="inline-flex h-[22px] w-fit items-center gap-1.5 rounded px-1.5 py-0.5 font-mono text-[10.5px] font-semibold leading-none"
        style={{ border: '1px solid', ...simStyle }}
      >
        <span
          className="inline-flex items-center rounded-sm px-1 py-0.5 font-mono text-[9px] font-bold leading-none"
          style={{
            background: 'rgba(167,139,250,0.12)',
            color: 'var(--secondary)',
            border: '1px solid rgba(167,139,250,0.30)',
            letterSpacing: '0.06em',
          }}
        >
          A2
        </span>
        <span
          className="text-[9px] font-bold uppercase"
          style={{ letterSpacing: '0.06em', opacity: 0.9 }}
        >
          Sim
        </span>
        <span style={{ fontWeight: 700 }}>{pair.similarityPct}%</span>
        <span
          className="text-[9.5px] font-medium normal-case"
          style={{ fontFamily: 'Inter, sans-serif', opacity: 0.85 }}
        >
          {simLabel}
        </span>
      </span>

      {/* Action */}
      <button
        type="button"
        onClick={() => onAction(pair.newRow, pair.recommendedAction)}
        className="inline-flex h-8 items-center gap-1.5 self-start rounded border px-2.5 text-[11.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] lg:self-auto"
        style={{
          borderColor: 'var(--border)',
          color: 'var(--text-secondary)',
          background: 'var(--canvas)',
        }}
      >
        {action}
        <ChevronDown size={11} aria-hidden="true" />
      </button>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

interface ModalFooterProps {
  newRows: number;
  dupHandled: number;
  excluded: number;
  destination: string;
  onBack: () => void;
  onContinue: () => void;
}

function ModalFooter({
  newRows,
  dupHandled,
  excluded,
  destination,
  onBack,
  onContinue,
}: ModalFooterProps) {
  return (
    <footer
      className="flex flex-none flex-wrap items-center gap-3 border-t px-4 py-3 sm:px-6"
      style={{
        background: 'var(--canvas)',
        borderColor: 'var(--border)',
      }}
    >
      <span
        className="inline-flex flex-none items-center gap-1.5 rounded-sm px-1.5 py-0.5 font-mono text-[10px] font-semibold leading-none"
        style={{
          background: 'rgba(167,139,250,0.12)',
          color: 'var(--secondary)',
          border: '1px solid rgba(167,139,250,0.30)',
          letterSpacing: '0.06em',
        }}
      >
        <Sparkles size={10} aria-hidden="true" />
        {CURATOR_META.agentId} {CURATOR_META.agentVersion}
      </span>
      <p className="m-0 flex-1 text-[11.5px]" style={{ color: 'var(--text-tertiary)' }}>
        Will import <b style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{newRows} new</b>{' '}
        rows · handle{' '}
        <b style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{dupHandled} dups</b> per
        strategy ·{' '}
        <b style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{excluded} excluded</b> from
        validate · destination{' '}
        <b style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{destination}</b>
      </p>
      <button
        type="button"
        onClick={onBack}
        className="inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-[12.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
        style={{
          borderColor: 'var(--border)',
          color: 'var(--text-secondary)',
        }}
      >
        <ArrowLeft size={13} aria-hidden="true" />
        Back to validate
      </button>
      <button
        type="button"
        onClick={onContinue}
        className="inline-flex h-9 min-h-[44px] items-center gap-2 rounded-md px-4 text-[13px] font-semibold transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] sm:min-h-0"
        style={{ background: 'var(--primary)', color: 'var(--primary-ink)' }}
      >
        Continue
        <span
          className="rounded-sm px-1.5 py-px font-mono text-[11px] font-bold"
          style={{
            background: 'rgba(0,55,50,0.22)',
            color: 'var(--primary-ink)',
          }}
        >
          {newRows} new
        </span>
        <ArrowRight size={13} strokeWidth={2.4} aria-hidden="true" />
      </button>
    </footer>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function simChipStyle(tier: SimilarityTier): React.CSSProperties {
  switch (tier) {
    case 'high':
      return {
        background: 'rgba(248,113,113,0.14)',
        color: 'var(--fail)',
        borderColor: 'rgba(248,113,113,0.34)',
      };
    case 'med':
      return {
        background: 'rgba(251,191,36,0.14)',
        color: 'var(--warn)',
        borderColor: 'rgba(251,191,36,0.34)',
      };
    case 'low':
      return {
        background: 'rgba(52,211,153,0.14)',
        color: 'var(--pass)',
        borderColor: 'rgba(52,211,153,0.34)',
      };
  }
}

function simTierLabel(tier: SimilarityTier): string {
  switch (tier) {
    case 'high':
      return 'likely dup';
    case 'med':
      return 'probable dup';
    case 'low':
      return 'possible dup';
  }
}

function GhostBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-7 items-center gap-1.5 rounded border px-2 text-[11px] font-medium leading-none transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--secondary)]"
      style={{
        borderColor: 'var(--border)',
        color: 'var(--text-secondary)',
      }}
    >
      {children}
    </button>
  );
}

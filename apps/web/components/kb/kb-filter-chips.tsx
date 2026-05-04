// F15 KB filter chips — Project / File type / Date range / Source-file.
// Clicking a chip is intentionally a no-op for the v1 scaffold — the
// filter state lives in `KbPage`, but the chip dropdowns themselves
// land in a follow-up PR (drag-snap-sheet primitive needed for mobile
// per primitives-playground.html). For now the chips render the
// current filter values + indicate the reset state.

'use client';

import { ChevronDown } from 'lucide-react';

interface KbFilterChipProps {
  label: string;
  value: string;
  onClick?: () => void;
}

function FilterChip({ label, value, onClick }: KbFilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-9 min-h-[44px] items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--raised)] px-3 text-[12.5px] font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] sm:h-8 sm:min-h-0"
    >
      <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
        {label}:
      </span>
      <span>{value}</span>
      <ChevronDown size={11} aria-hidden="true" className="text-[var(--text-tertiary)]" />
    </button>
  );
}

interface KbFilterChipsProps {
  projectName: string;
  fileTypeLabel: string;
  dateRangeLabel: string;
  onProjectClick?: () => void;
  onFileTypeClick?: () => void;
  onDateRangeClick?: () => void;
}

export function KbFilterChips({
  projectName,
  fileTypeLabel,
  dateRangeLabel,
  onProjectClick,
  onFileTypeClick,
  onDateRangeClick,
}: KbFilterChipsProps) {
  return (
    <div
      className="flex flex-wrap items-center gap-2"
      role="toolbar"
      aria-label="Knowledge base filters"
    >
      <FilterChip label="Project" value={projectName} onClick={onProjectClick} />
      <FilterChip label="File type" value={fileTypeLabel} onClick={onFileTypeClick} />
      <FilterChip label="Date" value={dateRangeLabel} onClick={onDateRangeClick} />
    </div>
  );
}

// F21 Defect row — canonical L820-1129 (.dfrow markup).
// Hard Rule 17: every string from canned-data.ts.

'use client';

import { Check } from 'lucide-react';
import type {
  DefectAgentKey,
  DefectMetaSegment,
  DefectPriority,
  DefectRow,
  DefectStatusKey,
  DefectTypeKey,
} from './canned-data';

const PRI_STYLE: Record<DefectPriority, { bg: string; bd: string; fg: string }> = {
  p0: { bg: 'var(--fail-soft)', bd: 'var(--fail-line)', fg: 'var(--fail)' },
  p1: { bg: 'var(--warn-soft)', bd: 'var(--warn-line)', fg: 'var(--warn)' },
  p2: { bg: 'var(--info-soft)', bd: 'var(--info-line)', fg: 'var(--info)' },
  p3: { bg: 'var(--overlay)', bd: 'var(--border-strong)', fg: 'var(--t3)' },
};

const TYPE_STYLE: Record<DefectTypeKey, { bg: string; bd: string; fg: string }> = {
  appbug: { bg: 'var(--fail-soft)', bd: 'var(--fail-line)', fg: 'var(--fail)' },
  env: { bg: 'var(--info-soft)', bd: 'var(--info-line)', fg: 'var(--info)' },
  ui: { bg: 'var(--primary-soft)', bd: 'var(--primary-line)', fg: 'var(--primary)' },
  flaky: { bg: 'var(--warn-soft)', bd: 'var(--warn-line)', fg: 'var(--warn)' },
  test: { bg: 'var(--overlay)', bd: 'var(--border-strong)', fg: 'var(--t3)' },
};

const STATUS_STYLE: Record<DefectStatusKey, { bg: string; bd: string; fg: string }> = {
  open: { bg: 'var(--fail-soft)', bd: 'var(--fail-line)', fg: 'var(--fail)' },
  progress: { bg: 'var(--info-soft)', bd: 'var(--info-line)', fg: 'var(--info)' },
  qa: { bg: 'var(--warn-soft)', bd: 'var(--warn-line)', fg: 'var(--warn)' },
  fixed: { bg: 'var(--pass-soft)', bd: 'var(--pass-line)', fg: 'var(--pass)' },
  closed: { bg: 'var(--overlay)', bd: 'var(--border-strong)', fg: 'var(--t3)' },
};

const AGENT_LABEL: Record<DefectAgentKey, string> = {
  sherlock: 'SHERLOCK',
  curator: 'CURATOR',
  composer: 'COMPOSER',
};

const AVATAR_STYLE: Record<DefectRow['assignee']['avatarTone'], { bg: string; fg: string }> = {
  amber: { bg: 'var(--warn-soft)', fg: 'var(--warn)' },
  violet: { bg: 'var(--ai-soft)', fg: 'var(--ai-accent)' },
  teal: { bg: 'var(--primary-soft)', fg: 'var(--primary)' },
  none: { bg: 'var(--overlay)', fg: 'var(--t4)' },
};

interface Props {
  row: DefectRow;
  isSelected: boolean;
  onSelect: () => void;
}

export function DefectRowItem({ row, isSelected, onSelect }: Props) {
  const pri = PRI_STYLE[row.priority];
  const type = TYPE_STYLE[row.typeKey];
  const status = STATUS_STYLE[row.statusKey];
  const av = AVATAR_STYLE[row.assignee.avatarTone];

  return (
    <button
      type="button"
      role="listitem"
      aria-current={isSelected ? 'true' : undefined}
      onClick={onSelect}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.background = 'var(--raised)';
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.background = 'transparent';
      }}
      className="flex w-full flex-wrap items-center gap-x-2.5 gap-y-1 border-b px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--secondary)] md:grid md:grid-cols-[auto_auto_auto_minmax(0,1fr)_auto_auto_auto_auto_auto_auto] md:flex-nowrap"
      style={{
        borderColor: 'var(--border)',
        background: isSelected ? 'var(--primary-soft)' : 'transparent',
        borderLeft: isSelected ? '3px solid var(--primary)' : '3px solid transparent',
      }}
    >
      {/* Checkbox — Day-19 Round-3 fix: canonical .ck.on uses --secondary
       *  violet (L362), unselected is transparent w/ --border-strong outline (L359). */}
      <span
        aria-hidden="true"
        className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border"
        style={{
          background: isSelected ? 'var(--secondary)' : 'transparent',
          borderColor: isSelected ? 'var(--secondary)' : 'var(--border-strong)',
          color: isSelected ? 'var(--secondary-ink)' : 'transparent',
        }}
      >
        <Check size={9} aria-hidden="true" strokeWidth={2.6} />
      </span>

      {/* Priority chip */}
      <span
        className="inline-flex h-5 min-w-[28px] items-center justify-center rounded border px-1 font-mono text-[10.5px] font-bold"
        style={{ background: pri.bg, borderColor: pri.bd, color: pri.fg }}
      >
        {row.priority.toUpperCase()}
      </span>

      {/* Defect id */}
      <span className="font-mono text-[10.5px] font-medium" style={{ color: 'var(--t3)' }}>
        {row.id}
      </span>

      {/* Title + meta (df-mid) — on mobile takes a full row below the chips */}
      <div className="order-last flex w-full min-w-0 basis-full flex-col md:order-none md:w-auto md:basis-auto">
        <span className="text-[12px] font-medium md:truncate" style={{ color: 'var(--t1)' }}>
          {row.title}
        </span>
        {(row.agentKey || row.ref || row.metaSegments.length > 0 || row.staleLabel) && (
          <span
            className="inline-flex flex-wrap items-center gap-1.5 text-[10.5px]"
            style={{ color: 'var(--t3)' }}
          >
            {row.agentKey && (
              <span
                className="inline-flex items-center gap-1 rounded border px-1 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.06em]"
                style={{
                  background: 'var(--ai-soft)',
                  borderColor: 'var(--ai-line)',
                  color: 'var(--ai-accent)',
                }}
              >
                {AGENT_LABEL[row.agentKey]}
                <span
                  aria-hidden="true"
                  className="inline-flex h-2.5 w-2.5 items-center justify-center rounded-full font-mono text-[7px] font-bold"
                  style={{ background: 'var(--ai-line)', color: 'var(--secondary-ink)' }}
                >
                  i
                </span>
              </span>
            )}
            {row.ref && (
              <span className="font-mono" style={{ color: 'var(--t2)' }}>
                {row.ref}
              </span>
            )}
            {row.metaSegments.length > 0 && (
              <>
                <span style={{ color: 'var(--border-strong)' }}>·</span>
                <span>
                  {row.metaSegments.map((seg, i) => (
                    <MetaSpan key={i} segment={seg} />
                  ))}
                </span>
              </>
            )}
            {row.staleLabel && (
              <>
                <span style={{ color: 'var(--border-strong)' }}>·</span>
                <span
                  className="inline-flex items-center gap-1 rounded border px-1 text-[9.5px] font-semibold uppercase tracking-[0.04em]"
                  style={{
                    background: 'var(--warn-soft)',
                    borderColor: 'var(--warn-line)',
                    color: 'var(--warn)',
                  }}
                >
                  {row.staleLabel}
                </span>
              </>
            )}
          </span>
        )}
      </div>

      {/* Type pill */}
      <span
        className="inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em]"
        style={{ background: type.bg, borderColor: type.bd, color: type.fg }}
      >
        {row.typeLabel}
      </span>

      {/* Status pill */}
      <span
        className="inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em]"
        style={{ background: status.bg, borderColor: status.bd, color: status.fg }}
      >
        {row.statusLabel}
      </span>

      {/* Impact tiles */}
      {row.impact ? (
        <span className="inline-flex items-center gap-1">
          {row.impact.map((v, i) => (
            <span
              key={i}
              className="inline-flex h-4 min-w-[18px] items-center justify-center rounded font-mono text-[10px] font-bold"
              style={{
                background: i === 0 ? 'var(--fail-soft)' : 'var(--overlay)',
                color: i === 0 ? 'var(--fail)' : 'var(--t3)',
                padding: '0 4px',
              }}
            >
              {v}
            </span>
          ))}
        </span>
      ) : (
        <span />
      )}

      {/* Assignee */}
      <span className="inline-flex items-center gap-1.5">
        <span
          aria-hidden="true"
          className="inline-flex h-5 w-5 items-center justify-center rounded-full font-mono text-[9px] font-bold"
          style={{ background: av.bg, color: av.fg }}
        >
          {row.assignee.initials}
        </span>
        <span
          className="hidden text-[11px] sm:inline"
          style={{ color: row.assignee.avatarTone === 'none' ? 'var(--t3)' : 'var(--t2)' }}
        >
          {row.assignee.name}
        </span>
      </span>

      {/* Right cluster: Age + Chevron
       *  Day-19 Round-5 mobile fix per Yogesh: age + chevron were wrapping
       *  to the LEFT of a new line when chips overflowed row 1. Wrap them
       *  in a single right-aligned cluster with `ml-auto` (mobile-only;
       *  on md+ they're separate grid cells so the wrapper is `contents`). */}
      <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 md:contents">
        {/* Age */}
        <span className="inline-flex flex-col items-end font-mono text-[10.5px]">
          <span style={{ color: 'var(--t2)' }}>{row.age}</span>
          <span className="text-[9.5px]" style={{ color: 'var(--t4)' }}>
            {row.opened}
          </span>
        </span>
        {/* "More" affordance — sentinel for keyboard focus */}
        <span aria-hidden="true" style={{ color: 'var(--t4)' }}>
          ›
        </span>
      </span>
    </button>
  );
}

function MetaSpan({ segment }: { segment: DefectMetaSegment }) {
  if (segment.kind === 'bold')
    return <b style={{ color: 'var(--t2)', fontWeight: 600 }}>{segment.value}</b>;
  return <>{segment.value}</>;
}

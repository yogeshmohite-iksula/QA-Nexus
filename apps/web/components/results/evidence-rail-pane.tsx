// F20 Evidence rail — canonical L1067-1200. Hard Rule 17 verbatim.
//
// Structure:
//   <aside class="ev-rail">
//     <header class="ev-head">             — Evidence title + "Selected · TC-RET-0342" + close
//     <nav class="ev-tabs">                — 6 tabs: Case 1 / Shots 3 / Console 2 / HAR 6 / Env / Related
//     <section ev-section> Selected case   — id, title (mono), AssertionError stack
//     <section ev-section> Screenshots
//     <section ev-section> Top stack trace — TimeoutError + 4 frames + hidden footer
//     <section ev-section> Env diff        — Browser / Payment SDK / Build (from → to)
//     <section ev-section> Related defects — Curator section with DEF-RET rows
//     <div sb-actions>                     — Open defect + Mark flaky + Re-run + View Run Console
//
// Pattern A — every action emits `pattern-a:deferred:f20:<key>` markers.

'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import {
  F20_ENV_DIFF,
  F20_EV_RAIL_ACTIONS,
  F20_EV_RAIL_HEAD,
  F20_EV_RAIL_TABS,
  F20_EV_RAIL_VIEW_RUN_CONSOLE,
  F20_RELATED_DEFECTS,
  F20_SELECTED_CASE,
  F20_STACK_TRACE,
  type ErrorHeadlineSegment,
  type EvRailActionBtn,
  type EvRailTabId,
  type RelatedDefectRow,
  type StackLine,
  type TitleSegment,
} from './canned-data';

const ACTION_STYLE: Record<EvRailActionBtn['variant'], { bg: string; bd: string; fg: string }> = {
  violet: {
    bg: 'var(--secondary)',
    bd: 'var(--ai-line)',
    fg: 'var(--secondary-ink)',
  },
  primary: { bg: 'var(--primary)', bd: 'var(--primary-line)', fg: 'var(--primary-ink)' },
  secondary: { bg: 'var(--raised)', bd: 'var(--border)', fg: 'var(--t2)' },
};

const RELATED_STATUS_STYLE: Record<
  RelatedDefectRow['statusVariant'],
  { bg: string; bd: string; fg: string }
> = {
  closed: { bg: 'var(--pass-soft)', bd: 'var(--pass-line)', fg: 'var(--pass)' },
  review: { bg: 'var(--warn-soft)', bd: 'var(--warn-line)', fg: 'var(--warn)' },
};

export function EvidenceRailPane() {
  const [activeTab, setActiveTab] = useState<EvRailTabId>('case');
  return (
    <aside
      aria-label="Evidence and actions"
      className="flex min-h-0 flex-col border-l"
      style={{ background: 'var(--canvas)', borderColor: 'var(--border)' }}
    >
      {/* ev-head */}
      <header
        className="flex items-start gap-2 border-b px-4 py-3"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex flex-1 flex-col">
          <h3
            className="m-0 text-[13.5px] font-semibold leading-[20px]"
            style={{ color: 'var(--t1)' }}
          >
            {F20_EV_RAIL_HEAD.title}
          </h3>
          <p className="m-0 text-[11.5px]" style={{ color: 'var(--t3)' }}>
            {F20_EV_RAIL_HEAD.contextLabel}
            <span className="font-mono font-medium" style={{ color: 'var(--t2)' }}>
              {F20_EV_RAIL_HEAD.contextName}
            </span>
          </p>
        </div>
        <button
          type="button"
          aria-label={F20_EV_RAIL_HEAD.closeAriaLabel}
          onClick={() => console.info('pattern-a:deferred:f20:close-ev-rail')}
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-[var(--t3)] transition-colors hover:bg-[var(--raised)] hover:text-[var(--t1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
        >
          <X size={13} strokeWidth={2.2} aria-hidden="true" />
        </button>
      </header>

      {/* ev-tabs — 6 tabs with numeric badges */}
      <nav
        role="tablist"
        aria-label="Evidence tabs"
        className="flex border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        {F20_EV_RAIL_TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive ? 'true' : 'false'}
              onClick={() => setActiveTab(tab.id)}
              className="inline-flex flex-1 items-center justify-center gap-1 px-1.5 py-2 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--secondary)]"
              style={{
                color: isActive ? 'var(--t1)' : 'var(--t3)',
                borderBottom: isActive ? '2px solid var(--secondary)' : '2px solid transparent',
                background: isActive ? 'var(--base)' : 'transparent',
              }}
            >
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className="font-mono text-[10px] font-semibold"
                  style={{ color: 'var(--t3)' }}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Body — scrollable region with ev-sections */}
      <div className="flex-1 overflow-y-auto px-4 py-3.5">
        <div className="flex flex-col gap-3.5">
          {/* Selected case panel */}
          <EvSection label="Selected case">
            <div className="flex flex-col gap-2">
              <span className="font-mono text-[11px] font-medium" style={{ color: 'var(--t3)' }}>
                {F20_SELECTED_CASE.id}
              </span>
              <p
                className="m-0 text-[12.5px] font-semibold leading-[18px]"
                style={{ color: 'var(--t1)' }}
              >
                {F20_SELECTED_CASE.title.map((seg, i) => (
                  <TitleSpan key={i} segment={seg} />
                ))}
              </p>
              <div
                className="flex flex-col gap-1 rounded-md border px-2.5 py-2 font-mono text-[10.5px] leading-[15px]"
                style={{ background: 'var(--canvas)', borderColor: 'var(--border)' }}
              >
                <div>
                  {F20_SELECTED_CASE.errorHeadline.map((seg, i) => (
                    <ErrorSpan key={i} segment={seg} />
                  ))}
                </div>
                {F20_SELECTED_CASE.stackLines.map((line, i) => (
                  <StackLineRow key={i} line={line} />
                ))}
              </div>
            </div>
          </EvSection>

          {/* Top stack trace */}
          <EvSection label={F20_STACK_TRACE.label}>
            <div
              className="flex flex-col gap-1 rounded-md border px-2.5 py-2 font-mono text-[10.5px] leading-[15px]"
              style={{ background: 'var(--canvas)', borderColor: 'var(--border)' }}
            >
              <div>
                {F20_STACK_TRACE.errorLine.map((seg, i) => (
                  <ErrorSpan key={i} segment={seg} />
                ))}
              </div>
              {F20_STACK_TRACE.frames.map((line, i) => (
                <StackLineRow key={i} line={line} />
              ))}
              <div style={{ color: 'var(--t4)' }}>{F20_STACK_TRACE.hiddenFooter}</div>
            </div>
          </EvSection>

          {/* Env diff */}
          <EvSection label={F20_ENV_DIFF.sectionLabel}>
            <div
              className="flex flex-col gap-1 rounded-md border px-2.5 py-2"
              style={{ background: 'var(--canvas)', borderColor: 'var(--border)' }}
            >
              {F20_ENV_DIFF.rows.map((row) => (
                <div key={row.key} className="flex flex-col gap-0.5 py-1">
                  <span
                    className="font-mono text-[10px] font-semibold uppercase tracking-[0.04em]"
                    style={{ color: 'var(--t3)' }}
                  >
                    {row.key}
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-mono text-[11px]">
                    <span style={{ color: 'var(--t4)', textDecoration: 'line-through' }}>
                      {row.from}
                    </span>
                    <span aria-hidden="true" style={{ color: 'var(--t3)' }}>
                      →
                    </span>
                    <span style={{ color: 'var(--t1)', fontWeight: 600 }}>{row.to}</span>
                  </span>
                </div>
              ))}
            </div>
          </EvSection>

          {/* Related defects (Curator) */}
          <EvSection label={F20_RELATED_DEFECTS.sectionLabel} hasInfoDot>
            <div className="flex flex-col gap-1">
              {F20_RELATED_DEFECTS.rows.map((row) => {
                const t = RELATED_STATUS_STYLE[row.statusVariant];
                return (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() =>
                      console.info('pattern-a:deferred:f20:open-related-defect', { id: row.id })
                    }
                    className="flex items-center gap-2 rounded-md border px-2.5 py-2 text-left transition-colors hover:bg-[var(--raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
                    style={{ background: 'var(--canvas)', borderColor: 'var(--border)' }}
                  >
                    <span
                      className="font-mono text-[11px] font-medium"
                      style={{ color: 'var(--t1)' }}
                    >
                      {row.id}
                    </span>
                    <span
                      className="font-mono text-[10.5px] font-semibold"
                      style={{ color: 'var(--ai-accent)' }}
                    >
                      {row.similarity}
                    </span>
                    <span
                      className="ml-auto inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em]"
                      style={{ background: t.bg, borderColor: t.bd, color: t.fg }}
                    >
                      {row.status}
                    </span>
                    <span aria-hidden="true" style={{ color: 'var(--t3)' }}>
                      →
                    </span>
                  </button>
                );
              })}
            </div>
          </EvSection>
        </div>
      </div>

      {/* Sticky action footer */}
      <footer
        className="flex flex-col gap-1.5 border-t px-4 py-3"
        style={{ borderColor: 'var(--border)', background: 'var(--base)' }}
      >
        <ActionButton
          action={F20_EV_RAIL_ACTIONS[0]}
          fullWidth
          onClick={() =>
            console.info('pattern-a:deferred:f20:action', {
              label: F20_EV_RAIL_ACTIONS[0].label,
            })
          }
        />
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          <ActionButton
            action={F20_EV_RAIL_ACTIONS[1]}
            onClick={() =>
              console.info('pattern-a:deferred:f20:action', {
                label: F20_EV_RAIL_ACTIONS[1].label,
              })
            }
          />
          <ActionButton
            action={F20_EV_RAIL_ACTIONS[2]}
            onClick={() =>
              console.info('pattern-a:deferred:f20:action', {
                label: F20_EV_RAIL_ACTIONS[2].label,
              })
            }
          />
        </div>
        <button
          type="button"
          onClick={() => console.info('pattern-a:deferred:f20:view-run-console')}
          className="inline-flex h-8 items-center justify-center text-[12px] font-medium transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
          style={{ color: 'var(--primary)', background: 'transparent', border: 0 }}
        >
          {F20_EV_RAIL_VIEW_RUN_CONSOLE}
        </button>
      </footer>
    </aside>
  );
}

function EvSection({
  label,
  hasInfoDot,
  children,
}: {
  label: string;
  hasInfoDot?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-1.5">
      <span
        className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.06em]"
        style={{ color: 'var(--t3)' }}
      >
        {label}
        {hasInfoDot && (
          <span
            aria-hidden="true"
            className="inline-flex h-2.5 w-2.5 items-center justify-center rounded-full font-mono text-[8px] font-bold"
            style={{
              background: 'rgba(167,139,250,0.10)',
              border: '1px solid var(--ai-line)',
              color: 'var(--secondary)',
            }}
          >
            i
          </span>
        )}
      </span>
      {children}
    </section>
  );
}

function TitleSpan({ segment }: { segment: TitleSegment }) {
  if (segment.kind === 'mono')
    return (
      <span className="font-mono text-[12px]" style={{ color: 'var(--t2)' }}>
        {segment.value}
      </span>
    );
  return <>{segment.value}</>;
}

function ErrorSpan({ segment }: { segment: ErrorHeadlineSegment }) {
  if (segment.kind === 'err')
    return <span style={{ color: 'var(--fail)', fontWeight: 600 }}>{segment.value}</span>;
  if (segment.kind === 'key')
    return (
      <span
        className="rounded px-1"
        style={{ background: 'var(--canvas)', color: 'var(--ai-accent)' }}
      >
        {segment.value}
      </span>
    );
  return <span style={{ color: 'var(--t2)' }}>{segment.value}</span>;
}

function StackLineRow({ line }: { line: StackLine }) {
  return (
    <div>
      <span style={{ color: 'var(--t4)' }}>{line.atPrefix}</span>{' '}
      <span style={{ color: 'var(--t2)' }}>{line.symbol}</span>{' '}
      <span style={{ color: 'var(--t4)' }}>{line.location}</span>
    </div>
  );
}

function ActionButton({
  action,
  onClick,
  fullWidth,
}: {
  action: EvRailActionBtn;
  onClick: () => void;
  fullWidth?: boolean;
}) {
  const t = ACTION_STYLE[action.variant];
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'inline-flex items-center justify-center gap-1.5 rounded-md border px-3 text-[12px] font-semibold transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]',
        fullWidth ? 'h-9 w-full' : 'h-8',
      ].join(' ')}
      style={{ background: t.bg, borderColor: t.bd, color: t.fg }}
    >
      {action.label}
    </button>
  );
}

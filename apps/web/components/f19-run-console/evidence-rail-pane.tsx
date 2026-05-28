// F19 Pane 3 — Evidence rail — v2 HTML L850-L962.
//
// Tabbed evidence (Last failure / Screenshots / Console / Network /
// DOM) + Sherlock RCA preview card with layer bars + Open full RCA CTA.

'use client';

import { useState } from 'react';
import { Check, Clock, Plus, Search, X } from 'lucide-react';
import { LiveCapturePill } from './live-pill';
import { FAIL_CARD, SHERLOCK, EV_TABS, EV_KBD_HINTS, type EvTab } from './canned-data';

interface Props {
  onTabChange: (tab: EvTab['key']) => void;
  onOpenSherlock: () => void;
}

export function EvidenceRailPane({ onTabChange, onOpenSherlock }: Props) {
  const [activeTab, setActiveTab] = useState<EvTab['key']>('last-failure');

  function handleTab(key: EvTab['key']) {
    setActiveTab(key);
    onTabChange(key);
  }

  return (
    <aside
      aria-label="Evidence"
      className="flex min-h-0 flex-col overflow-hidden border-t lg:border-l lg:border-t-0"
      style={{ background: 'var(--canvas)', borderColor: 'var(--border)' }}
    >
      {/* Head */}
      <header
        className="flex flex-none items-center justify-between gap-2 border-b px-4 py-3"
        style={{ borderColor: 'var(--border)' }}
      >
        <h3
          className="m-0 inline-flex items-center gap-2 text-[13.5px] font-semibold uppercase tracking-[0.06em]"
          style={{ color: 'var(--t3)' }}
        >
          Evidence
          <LiveCapturePill />
        </h3>
      </header>

      {/* Tabs */}
      <nav
        role="tablist"
        aria-label="Evidence tabs"
        className="flex flex-none gap-0.5 overflow-x-auto border-b px-2 py-2"
        style={{ borderColor: 'var(--border)' }}
      >
        {EV_TABS.map((t) => {
          const isOn = activeTab === t.key;
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={isOn}
              onClick={() => handleTab(t.key)}
              // Day-25 Round-2 fix: bumped active underline to 3px + brighter
              // active text color (--t1 instead of --primary) so the selection
              // is more obvious vs Yogesh canonical comparison.
              className="-mb-px inline-flex items-center gap-1.5 whitespace-nowrap px-3 pb-2.5 pt-1.5 text-[11.5px] font-semibold transition-colors hover:text-[var(--t2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
              style={{
                background: 'transparent',
                color: isOn ? 'var(--primary)' : 'var(--t3)',
                borderBottom: isOn ? '3px solid var(--primary)' : '3px solid transparent',
              }}
            >
              {t.label}
              {t.count !== undefined && (
                <span
                  className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 font-mono text-[9.5px] font-bold"
                  style={{
                    background: isOn ? 'var(--primary-soft)' : 'var(--base)',
                    color: isOn ? 'var(--primary)' : 'var(--t3)',
                  }}
                >
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Body — currently only Last-failure tab is wired (Pattern A) */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-3">
        {activeTab === 'last-failure' ? (
          <>
            <FailCard />
            <SherlockCard onOpenSherlock={onOpenSherlock} />
          </>
        ) : (
          <div
            className="rounded-md border p-4 text-center text-[12px]"
            style={{
              background: 'var(--canvas)',
              borderColor: 'var(--border)',
              color: 'var(--t3)',
            }}
          >
            {EV_TABS.find((t) => t.key === activeTab)?.label} preview wires Day-18+ (Pattern A).
          </div>
        )}
      </div>

      {/* Footer — keyboard hints */}
      <footer
        className="flex flex-none flex-wrap items-center gap-x-3 gap-y-1 border-t px-4 py-2 text-[10.5px]"
        style={{
          background: 'var(--canvas)',
          borderColor: 'var(--border)',
          color: 'var(--t3)',
        }}
      >
        {EV_KBD_HINTS.map((h) => (
          <span key={h.key} className="inline-flex items-center gap-1">
            <kbd
              className="rounded px-1 font-mono font-bold"
              style={{ background: 'var(--base)', color: 'var(--t2)' }}
            >
              {h.key}
            </kbd>
            {h.label}
          </span>
        ))}
      </footer>
    </aside>
  );
}

function FailCard() {
  return (
    <article
      aria-label={`Recent failure: ${FAIL_CARD.caseId}`}
      // Day-25 Round-5 fix per Yogesh canonical-vs-port comparison:
      // - REMOVED max-h-[520px] + overflow-y-auto — canonical has NO internal
      //   scrollbar. The parent rail-body already handles overflow. My Round-2
      //   scroll cap was over-engineering.
      // - Keep 4px LEFT accent bar (canonical red rail pattern) + 1px hairline
      //   border on other sides for the rounded card shape.
      className="flex flex-col gap-3 rounded-md p-3"
      style={{
        background: 'var(--canvas)',
        border: '1px solid var(--border)',
        borderLeft: '4px solid var(--fail)',
      }}
    >
      {/* Head — Round-5 fix: added border-bottom divider line per canonical
          (hairline between head and capture stream). pb-3 spacing keeps the
          divider visually separated from the captures below it. */}
      <div
        className="flex flex-wrap items-start gap-2 border-b pb-3"
        style={{ borderColor: 'var(--border)' }}
      >
        <span
          aria-hidden="true"
          className="inline-flex h-7 w-7 flex-none items-center justify-center rounded-md border"
          style={{
            background: 'var(--fail-soft)',
            borderColor: 'var(--fail-line)',
            color: 'var(--fail)',
          }}
        >
          <X size={14} strokeWidth={3} />
        </span>
        <div className="min-w-0 flex-1">
          <p
            className="m-0 font-mono text-[10.5px] font-bold uppercase tracking-wide"
            style={{ color: 'var(--fail)' }}
          >
            {FAIL_CARD.caseId} · {FAIL_CARD.statusLabel}
          </p>
          {/* Day-25 Round-6 fix: title bumped DOWN 12.5px → 11px + truncate
              for single-line ellipsis (canonical shows
              "Refund webhook · refund.retry.exhau…"). */}
          <p className="m-0 mt-0.5 truncate text-[11px]" style={{ color: 'var(--t1)' }}>
            {FAIL_CARD.title} ·{' '}
            <code className="font-mono text-[10.5px]" style={{ color: 'var(--t2)' }}>
              {FAIL_CARD.monoTitle}
            </code>
          </p>
        </div>
        <span className="flex-none font-mono text-[10.5px]" style={{ color: 'var(--t4)' }}>
          {FAIL_CARD.timeAgo}
        </span>
      </div>

      {/* Capture stream — Day-25 Round-4 fix per canonical zoom:
          - icon shape changed from rounded-full circle → rounded-md SQUARE
          - icon sized up h-4 → h-5, checkmark 9 → 12, clock icon for streaming
          - label color now matches status tone (pass green for done,
            secondary violet for streaming) per canonical row colors */}
      <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
        {FAIL_CARD.captures.map((c, idx) => (
          <li key={idx} className="flex items-center gap-2.5 text-[11.5px]">
            <span
              aria-hidden="true"
              className="inline-flex h-5 w-5 flex-none items-center justify-center rounded-md border"
              style={{
                background: c.status === 'streaming' ? 'var(--ai-soft)' : 'var(--pass-soft)',
                color: c.status === 'streaming' ? 'var(--secondary)' : 'var(--pass)',
                borderColor: c.status === 'streaming' ? 'var(--ai-line)' : 'var(--pass-line)',
                animation:
                  c.status === 'streaming' ? 'f19Pulse 1.2s ease-in-out infinite' : undefined,
              }}
            >
              {c.status === 'done' ? (
                <Check size={12} strokeWidth={3.2} aria-hidden="true" />
              ) : (
                <Clock size={12} strokeWidth={2.4} aria-hidden="true" />
              )}
            </span>
            <span
              className="flex-1 truncate font-semibold"
              style={{
                color: c.status === 'streaming' ? 'var(--secondary)' : 'var(--pass)',
              }}
            >
              {c.label}
            </span>
            <span className="font-mono text-[10.5px]" style={{ color: 'var(--t4)' }}>
              {c.time}
            </span>
          </li>
        ))}
      </ul>

      {/* Screenshots */}
      <div>
        <p
          className="m-0 mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide"
          style={{ color: 'var(--t3)' }}
        >
          Screenshots
        </p>
        <div className="grid grid-cols-2 gap-2">
          {FAIL_CARD.screenshots.map((s) => (
            <div
              key={s.id}
              title={s.alt}
              className="relative flex aspect-[16/10] items-end justify-start overflow-hidden rounded border p-1.5"
              style={{
                background: 'linear-gradient(135deg, var(--fail-soft) 0%, var(--canvas) 70%)',
                borderColor: 'var(--border)',
              }}
            >
              <span
                className="rounded font-mono text-[9px]"
                style={{
                  background: 'var(--canvas)',
                  color: 'var(--t3)',
                  padding: '1px 4px',
                }}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Console snippet */}
      <div>
        <p
          className="m-0 mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide"
          style={{ color: 'var(--t3)' }}
        >
          Console (last 3 lines)
        </p>
        <div
          className="overflow-x-auto rounded border p-2 font-mono text-[10.5px] leading-[1.55]"
          style={{ background: 'var(--canvas)', borderColor: 'var(--border)' }}
        >
          {FAIL_CARD.consoleLines.map((line, i) => (
            <div key={i} className="whitespace-nowrap">
              <span style={{ color: 'var(--t4)' }}>{line.ts}</span>{' '}
              {line.tokens.map((t, j) => {
                const color =
                  t.kind === 'err'
                    ? 'var(--fail)'
                    : t.kind === 'key'
                      ? 'var(--ai-accent)'
                      : t.kind === 'dim'
                        ? 'var(--t4)'
                        : 'var(--t2)';
                return (
                  <span key={j} style={{ color }}>
                    {t.k}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Env chips */}
      <div>
        <p
          className="m-0 mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide"
          style={{ color: 'var(--t3)' }}
        >
          Environment
        </p>
        {/* Day-25 Round-6 fix (FINAL on env chips): tightened to compact
            padding 2px/6px + text-[9.5px]. Stopping the flip-flop. */}
        <div className="flex flex-wrap gap-1">
          {FAIL_CARD.envChips.map((c) => (
            <span
              key={c}
              className="rounded border font-mono text-[9.5px]"
              style={{
                background: 'var(--base)',
                borderColor: 'var(--border)',
                color: 'var(--t2)',
                padding: '2px 6px',
              }}
            >
              {c}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

function SherlockCard({ onOpenSherlock }: { onOpenSherlock: () => void }) {
  return (
    <article
      aria-label="Sherlock root cause analysis preview"
      className="flex flex-col gap-3 rounded-md border p-3"
      style={{
        background: 'var(--ai-soft)',
        borderColor: 'var(--ai-line)',
      }}
    >
      <header className="flex flex-wrap items-center gap-2">
        <Search
          size={13}
          strokeWidth={1.8}
          aria-hidden="true"
          style={{ color: 'var(--ai-accent)' }}
        />
        <span
          className="inline-flex items-center gap-1 text-[13px] font-semibold"
          style={{ color: 'var(--ai-accent)' }}
        >
          {SHERLOCK.agentName}
          <span
            aria-hidden="true"
            className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-[9px] font-bold"
            style={{ background: 'var(--secondary)', color: 'var(--secondary-ink)' }}
            title="Sherlock agent (5-layer Root Cause Analysis)"
          >
            i
          </span>
        </span>
        <span className="font-mono text-[10.5px]" style={{ color: 'var(--t3)' }}>
          {SHERLOCK.handle}
        </span>
        <span
          className="ml-auto rounded border px-1.5 py-0.5 font-mono text-[10.5px] font-bold"
          style={{
            background: 'var(--ai-soft)',
            borderColor: 'var(--ai-line)',
            color: 'var(--secondary)',
          }}
        >
          {SHERLOCK.confidencePct}%
        </span>
      </header>

      {/* Likely root cause + Cluster note — canonical v2 HTML L936 */}
      <p className="m-0 text-[12px] leading-[1.5]" style={{ color: 'var(--t2)' }}>
        <b style={{ color: 'var(--secondary)' }}>Likely root cause:</b> {SHERLOCK.likelyRootCause}{' '}
        <b style={{ color: 'var(--secondary)' }}>Cluster:</b> {SHERLOCK.clusterNote}
      </p>

      <div className="flex flex-col gap-1.5">
        {SHERLOCK.layers.map((l) => (
          <div key={l.name} className="grid grid-cols-[60px_1fr_36px] items-center gap-2">
            <span className="text-[11px] font-semibold" style={{ color: 'var(--t2)' }}>
              {l.name}
            </span>
            <span
              className="h-1.5 overflow-hidden rounded-full"
              style={{ background: 'var(--canvas)' }}
            >
              <span
                className="block h-full"
                style={{ width: `${l.pct}%`, background: 'var(--secondary)' }}
              />
            </span>
            <span className="text-right font-mono text-[10.5px]" style={{ color: 'var(--t3)' }}>
              {l.pct}%
            </span>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onOpenSherlock}
        className="inline-flex h-9 items-center justify-center gap-1.5 self-start rounded-md px-3 text-[12.5px] font-semibold transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
        style={{ background: 'var(--secondary)', color: 'var(--secondary-ink)' }}
      >
        <Plus size={13} strokeWidth={2.2} aria-hidden="true" />
        {SHERLOCK.ctaLabel}
      </button>
    </article>
  );
}

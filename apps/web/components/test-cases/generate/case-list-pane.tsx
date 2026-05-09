// F16b · center pane — header + case list + sticky footer.
//
// Direct port of F16b A1 Generate from Requirement v2.html lines 364-979
// (.center-pane / .center-head / .case-list / .center-foot). Pattern A:
// receives the canned `cases` array via props and renders each card by
// state.

'use client';

import { Check, RefreshCw, ArrowLeft, ArrowRight, Clock } from 'lucide-react';
import { AgentName } from '@/components/ui/agent-name';
import { CaseCard } from './case-card';
import { StreamingCard, QueuedCard } from './streaming-card';
import type { GeneratedCase } from './canned-data';

interface CaseListPaneProps {
  cases: GeneratedCase[];
  /** Right pane closed → show "Activity" reopen pill. */
  isActivityClosed: boolean;
  onReopenActivity: () => void;
  onRegenAll: () => void;
  onAcceptAll: () => void;
  onAcceptCase: (id: string) => void;
  onRejectCase: (id: string) => void;
  onEditCase: (id: string) => void;
  onRegenVariation: (id: string) => void;
  onCuratorAction: (
    id: string,
    action: 'merge' | 'keep-new' | 'keep-existing' | 'distinct',
  ) => void;
  onBack: () => void;
  onSaveExit: () => void;
  /** elapsed seconds since the streaming card started, used for label. */
  streamingElapsed: number;
}

export function CaseListPane({
  cases,
  isActivityClosed,
  onReopenActivity,
  onRegenAll,
  onAcceptAll,
  onAcceptCase,
  onRejectCase,
  onEditCase,
  onRegenVariation,
  onCuratorAction,
  onBack,
  onSaveExit,
  streamingElapsed,
}: CaseListPaneProps) {
  const accepted = cases.filter((c) => c.state === 'accepted').length;
  const drafted = cases.filter((c) => c.state === 'drafted').length;
  const streaming = cases.filter((c) => c.state === 'streaming').length;
  const queued = cases.filter((c) => c.state === 'queued').length;
  const dups = cases.filter((c) => c.curatorDup).length;
  const total = cases.length;

  return (
    <section
      className="flex min-h-0 flex-col overflow-hidden lg:overflow-hidden"
      style={{ background: 'var(--canvas)' }}
    >
      {/* Center head */}
      <div
        className="flex flex-none flex-wrap items-center gap-3.5 border-b px-4 pb-3 pt-3.5 sm:px-5"
        style={{
          background: 'var(--base)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="min-w-0 flex-1">
          <h2
            className="font-display text-[15px] font-bold"
            style={{ color: 'var(--text-primary)', margin: 0 }}
          >
            {total} test cases for{' '}
            <span style={{ color: 'var(--ai-accent, var(--secondary))' }}>RET-247</span>
          </h2>
          <div
            className="mt-0.5 flex flex-wrap items-center gap-1 font-mono text-[11.5px]"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <b style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{drafted + accepted}</b>{' '}
            drafted
            <span style={{ color: 'var(--text-quaternary, var(--text-tertiary))' }}>·</span>
            <b style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
              {streaming + queued}
            </b>{' '}
            streaming
            <span style={{ color: 'var(--text-quaternary, var(--text-tertiary))' }}>·</span>
            <span className="inline-flex items-center align-baseline">
              <AgentName code="curator" inherit />
            </span>{' '}
            dedup live
          </div>
        </div>
        <div className="flex flex-none flex-wrap items-center gap-1.5">
          {isActivityClosed && (
            <button
              type="button"
              onClick={onReopenActivity}
              aria-label="Show activity log"
              title="Show activity"
              className="inline-flex h-[30px] items-center gap-1.5 rounded border px-2.5 pl-2 text-[11.5px] font-semibold leading-none transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--secondary)]"
              style={{
                borderColor: 'rgba(167,139,250,0.30)',
                background: 'rgba(167,139,250,0.12)',
                color: 'var(--ai-accent, var(--secondary))',
              }}
            >
              <Clock size={12} aria-hidden="true" />
              Activity
              <span
                className="rounded-sm px-1 py-px font-mono text-[10px]"
                style={{
                  background: 'rgba(167,139,250,0.22)',
                  color: 'var(--ai-accent, var(--secondary))',
                }}
              >
                12
              </span>
            </button>
          )}
          <GhostBtn onClick={onRegenAll}>
            <RefreshCw size={11} aria-hidden="true" />
            Re-generate all
          </GhostBtn>
          <GhostBtn onClick={onAcceptAll}>
            <Check size={11} strokeWidth={3} aria-hidden="true" />
            Accept all
          </GhostBtn>
        </div>
      </div>

      {/* Case list — scroll surface */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4 sm:px-5 lg:overflow-y-auto">
        {cases.map((c) => {
          if (c.state === 'streaming') {
            return <StreamingCard key={c.id} tcId={c.id} elapsedSeconds={streamingElapsed} />;
          }
          if (c.state === 'queued') {
            return <QueuedCard key={c.id} tcId={c.id} />;
          }
          return (
            <CaseCard
              key={c.id}
              testCase={c}
              onAccept={() => onAcceptCase(c.id)}
              onReject={() => onRejectCase(c.id)}
              onEdit={() => onEditCase(c.id)}
              onRegenVariation={() => onRegenVariation(c.id)}
              onCuratorAction={(a) => onCuratorAction(c.id, a)}
            />
          );
        })}
      </div>

      {/* Sticky footer */}
      <footer
        className="flex h-[60px] flex-none flex-wrap items-center gap-3 border-t px-4 sm:px-5"
        style={{
          background: 'var(--base)',
          borderColor: 'var(--border)',
          color: 'var(--text-tertiary)',
        }}
      >
        <div className="flex flex-1 flex-wrap items-center gap-x-3.5 gap-y-1 font-mono text-[11.5px]">
          <span>
            <b style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{accepted}</b> accepted
          </span>
          <span style={{ color: 'var(--text-quaternary, var(--text-tertiary))' }}>·</span>
          <span>
            <b style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{drafted}</b> awaiting
            review
          </span>
          <span style={{ color: 'var(--text-quaternary, var(--text-tertiary))' }}>·</span>
          <span>
            <b style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{streaming + queued}</b>{' '}
            generating
          </span>
          {dups > 0 && (
            <>
              <span style={{ color: 'var(--text-quaternary, var(--text-tertiary))' }}>·</span>
              <span style={{ color: 'var(--secondary)' }}>
                <span
                  className="mr-1.5 inline-flex items-center rounded-sm px-1.5 py-0.5 font-mono text-[9px] font-bold leading-none"
                  style={{
                    background: 'rgba(167,139,250,0.12)',
                    color: 'var(--secondary)',
                    border: '1px solid rgba(167,139,250,0.30)',
                    letterSpacing: '0.06em',
                  }}
                >
                  Curator
                </span>
                <b
                  style={{
                    color: 'var(--ai-accent, var(--secondary))',
                    fontWeight: 700,
                  }}
                >
                  {dups}
                </b>{' '}
                dup pair
              </span>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-9 items-center gap-1.5 rounded-md border px-3.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
          style={{
            borderColor: 'var(--border)',
            color: 'var(--text-secondary)',
          }}
        >
          <ArrowLeft size={13} aria-hidden="true" />
          Back
        </button>
        <button
          type="button"
          onClick={onSaveExit}
          className="inline-flex h-9 min-h-[44px] items-center gap-2 rounded-md px-4 text-[13px] font-semibold transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] sm:min-h-0"
          style={{
            background: 'var(--primary)',
            color: 'var(--primary-ink)',
          }}
        >
          Save &amp; exit
          <span
            className="rounded-sm px-1.5 py-px font-mono text-[11px] font-bold"
            style={{
              background: 'rgba(0,55,50,0.22)',
              color: 'var(--primary-ink)',
            }}
          >
            {accepted} accepted
          </span>
          <ArrowRight size={13} strokeWidth={2.4} aria-hidden="true" />
        </button>
      </footer>
    </section>
  );
}

function GhostBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-[30px] items-center gap-1.5 rounded border px-2.5 text-[11.5px] font-medium leading-none transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--secondary)]"
      style={{
        borderColor: 'var(--border)',
        color: 'var(--text-secondary)',
      }}
    >
      {children}
    </button>
  );
}

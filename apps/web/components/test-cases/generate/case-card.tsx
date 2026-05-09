// F16b · single generated test-case card.
//
// Direct port of F16b A1 Generate from Requirement v2.html lines 380-463
// (.case-card / .case-* / .case-dup). Renders one case in any of the
// drafted / accepted / rejected states. The streaming + queued
// variants live in `streaming-card.tsx`.
//
// Curator dedup pair (warn-tinted callout) renders inline above the
// footer when `case.curatorDup` is set.

'use client';

import { Check, Pencil, RefreshCw, X, AlertTriangle } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { ConfidenceTier, GeneratedCase, SimilarityTier } from './canned-data';

interface CaseCardProps {
  testCase: GeneratedCase;
  onAccept: () => void;
  onReject: () => void;
  onEdit: () => void;
  onRegenVariation: () => void;
  onCuratorAction: (action: 'merge' | 'keep-new' | 'keep-existing' | 'distinct') => void;
}

export function CaseCard({
  testCase: c,
  onAccept,
  onReject,
  onEdit,
  onRegenVariation,
  onCuratorAction,
}: CaseCardProps) {
  const accepted = c.state === 'accepted';
  const rejected = c.state === 'rejected';

  return (
    <article
      className="relative flex flex-col gap-2.5 overflow-hidden rounded-[14px] border px-4 py-3.5 transition-colors"
      data-state={c.state}
      data-tc-id={c.id}
      style={{
        background: accepted ? 'rgba(52,211,153,0.04)' : 'var(--base)',
        borderColor: accepted ? 'rgba(52,211,153,0.34)' : 'var(--border)',
        opacity: rejected ? 0.55 : 1,
      }}
    >
      {/* Header */}
      <header className="flex flex-wrap items-start gap-2.5">
        <button
          type="button"
          onClick={accepted ? onReject : onAccept}
          aria-label={accepted ? 'Deselect case' : 'Select case'}
          className="mt-px inline-flex h-[18px] w-[18px] flex-none items-center justify-center rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
          style={
            accepted
              ? {
                  background: 'var(--primary)',
                  border: '1.5px solid var(--primary)',
                }
              : {
                  background: 'var(--canvas)',
                  border: '1.5px solid var(--border-strong)',
                }
          }
        >
          {accepted && (
            <Check
              size={11}
              strokeWidth={3}
              style={{ color: 'var(--primary-ink)' }}
              aria-hidden="true"
            />
          )}
        </button>
        <span
          className="inline-flex items-center rounded-sm px-1.5 py-0.5 font-mono text-[11px] font-bold leading-none"
          style={{
            background: 'rgba(45,212,191,0.10)',
            color: 'var(--primary)',
            border: '1px solid rgba(45,212,191,0.28)',
            letterSpacing: '0.04em',
          }}
        >
          {c.id}
        </span>
        <h3
          className="m-0 min-w-[200px] flex-1 text-[14px] font-semibold leading-[20px]"
          style={{ color: 'var(--text-primary)', textWrap: 'pretty' }}
        >
          {c.title}
        </h3>
      </header>

      {/* Meta row — confidence + similarity + grounding */}
      <div className="flex flex-wrap items-center gap-2 text-[11px] leading-none">
        <ConfidenceChip pct={c.confidencePct} tier={c.confidenceTier} />
        <SimilarityChip pct={c.similarityPct} tier={c.similarityTier} />
        <GroundingChips reqId={c.groundedReq} chunkId={c.groundedChunkId} />
      </div>

      {/* Body — steps + expected */}
      <div
        className="flex max-h-[380px] min-h-[240px] flex-col gap-2.5 overflow-y-auto rounded-md border px-4 py-3.5 text-[13px] leading-[19px]"
        style={{
          background: 'var(--canvas)',
          borderColor: 'var(--border)',
          color: 'var(--text-secondary)',
        }}
      >
        {c.steps.map((s) => (
          <div key={s.step} className="flex items-start gap-2">
            <span
              className="w-[18px] flex-none font-mono text-[10px] font-bold leading-[18px]"
              style={{ color: 'var(--text-quaternary, var(--text-tertiary))' }}
            >
              {s.step}.
            </span>
            <span className="flex-1" style={{ color: 'var(--text-secondary)' }}>
              {s.text}
            </span>
          </div>
        ))}
        {c.expected && (
          <div
            className="text-[11.5px] italic"
            style={{ color: 'var(--text-tertiary)', marginLeft: '26px' }}
          >
            Expected: {c.expected}
          </div>
        )}
      </div>

      {/* Curator dedup pair callout */}
      {c.curatorDup && <CuratorDupCallout dup={c.curatorDup} onAction={onCuratorAction} />}

      {/* Footer actions */}
      <footer className="flex flex-wrap items-center gap-1.5">
        {accepted && (
          <span
            className="inline-flex items-center rounded-sm px-1.5 py-1 font-mono text-[10px] font-semibold uppercase leading-none"
            style={{
              color: 'var(--pass)',
              background: 'rgba(52,211,153,0.14)',
              border: '1px solid rgba(52,211,153,0.34)',
              letterSpacing: '0.06em',
            }}
          >
            ✓ Accepted
          </span>
        )}
        <span className="flex-1" />

        {!accepted && !rejected && (
          <CaseAct onClick={onReject} variant="default">
            <X size={11} aria-hidden="true" />
            Reject
          </CaseAct>
        )}
        <CaseAct onClick={onEdit} variant="default">
          <Pencil size={11} aria-hidden="true" />
          Edit
        </CaseAct>
        {accepted ? (
          <CaseAct onClick={onRegenVariation} variant="default">
            <RefreshCw size={11} aria-hidden="true" />
            Re-gen variation
          </CaseAct>
        ) : (
          <CaseAct onClick={onAccept} variant="accept">
            <Check size={11} strokeWidth={3} aria-hidden="true" />
            Accept
          </CaseAct>
        )}
      </footer>
    </article>
  );
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function ConfidenceChip({ pct, tier }: { pct: number; tier: ConfidenceTier }) {
  const isHigh = tier === 'high';
  return (
    <span
      className="inline-flex h-[22px] items-center gap-1.5 rounded px-1.5 py-0.5 font-mono text-[10.5px] font-semibold leading-none"
      style={{
        border: '1px solid',
        ...(isHigh
          ? {
              background: 'rgba(52,211,153,0.14)',
              color: 'var(--pass)',
              borderColor: 'rgba(52,211,153,0.34)',
            }
          : {
              background: 'rgba(251,191,36,0.14)',
              color: 'var(--warn)',
              borderColor: 'rgba(251,191,36,0.34)',
            }),
      }}
    >
      <span
        className="text-[9px] font-bold uppercase"
        style={{ letterSpacing: '0.06em', opacity: 0.9 }}
      >
        Conf
      </span>
      <span style={{ fontWeight: 700 }}>{pct}%</span>
      <span
        className="text-[9.5px] font-medium normal-case"
        style={{ fontFamily: 'Inter, sans-serif', opacity: 0.85 }}
      >
        {tier === 'high' ? 'high' : 'med'}
      </span>
    </span>
  );
}

function SimilarityChip({ pct, tier }: { pct: number; tier: SimilarityTier }) {
  let style: CSSProperties;
  let tierLabel: string;
  switch (tier) {
    case 'likely-dup':
      style = {
        background: 'rgba(248,113,113,0.14)',
        color: 'var(--fail)',
        borderColor: 'rgba(248,113,113,0.34)',
      };
      tierLabel = 'likely dup';
      break;
    case 'med':
      style = {
        background: 'rgba(251,191,36,0.14)',
        color: 'var(--warn)',
        borderColor: 'rgba(251,191,36,0.34)',
      };
      tierLabel = 'med';
      break;
    default:
      style = {
        background: 'rgba(52,211,153,0.14)',
        color: 'var(--pass)',
        borderColor: 'rgba(52,211,153,0.34)',
      };
      tierLabel = 'distinct';
  }
  return (
    <span
      className="inline-flex h-[22px] items-center gap-1.5 rounded px-1.5 py-0.5 font-mono text-[10.5px] font-semibold leading-none"
      style={{ border: '1px solid', ...style }}
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
        Curator
      </span>
      <span
        className="text-[9px] font-bold uppercase"
        style={{ letterSpacing: '0.06em', opacity: 0.9 }}
      >
        Sim
      </span>
      <span style={{ fontWeight: 700 }}>{pct}%</span>
      <span
        className="text-[9.5px] font-medium normal-case"
        style={{ fontFamily: 'Inter, sans-serif', opacity: 0.85 }}
      >
        {tierLabel}
      </span>
    </span>
  );
}

function GroundingChips({ reqId, chunkId }: { reqId: string; chunkId: string }) {
  return (
    <span
      className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]"
      style={{ color: 'var(--text-tertiary)' }}
    >
      <span
        className="text-[9.5px] font-semibold uppercase"
        style={{
          color: 'var(--text-quaternary, var(--text-tertiary))',
          letterSpacing: '0.06em',
        }}
      >
        Grounded:
      </span>
      <span style={{ color: 'var(--ai-accent, var(--secondary))', fontWeight: 600 }}>{reqId}</span>
      <span style={{ color: 'var(--text-quaternary, var(--text-tertiary))' }}>+</span>
      {chunkId && (
        <span
          className="rounded-sm px-1.5 py-px font-mono text-[10px] font-semibold leading-[14px]"
          style={{
            color: 'var(--ai-accent, var(--secondary))',
            background: 'rgba(167,139,250,0.12)',
            border: '1px solid rgba(167,139,250,0.30)',
          }}
        >
          {chunkId}
        </span>
      )}
    </span>
  );
}

interface CaseActProps {
  onClick: () => void;
  variant: 'default' | 'accept';
  children: React.ReactNode;
}

function CaseAct({ onClick, variant, children }: CaseActProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-[30px] items-center gap-1.5 rounded border px-2.5 text-[11.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
      style={
        variant === 'accept'
          ? {
              borderColor: 'rgba(52,211,153,0.34)',
              color: 'var(--pass)',
              background: 'rgba(52,211,153,0.14)',
            }
          : {
              borderColor: 'var(--border)',
              color: 'var(--text-secondary)',
              background: 'transparent',
            }
      }
    >
      {children}
    </button>
  );
}

function CuratorDupCallout({
  dup,
  onAction,
}: {
  dup: NonNullable<GeneratedCase['curatorDup']>;
  onAction: (a: 'merge' | 'keep-new' | 'keep-existing' | 'distinct') => void;
}) {
  return (
    <div
      className="flex flex-wrap items-center gap-2.5 rounded-md px-3 py-2"
      style={{
        background: 'var(--canvas)',
        border: '1px solid rgba(251,191,36,0.34)',
        borderLeft: '3px solid var(--warn)',
      }}
    >
      <span
        className="inline-flex h-[18px] w-[18px] flex-none items-center justify-center rounded"
        style={{
          background: 'rgba(251,191,36,0.14)',
          color: 'var(--warn)',
        }}
      >
        <AlertTriangle size={11} aria-hidden="true" />
      </span>
      <div
        className="min-w-[140px] flex-1 text-[11.5px] leading-[16px]"
        style={{ color: 'var(--text-secondary)' }}
      >
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
        Likely duplicate of{' '}
        <b className="font-mono" style={{ color: 'var(--primary)', fontWeight: 600 }}>
          {dup.matchTcId}
        </b>{' '}
        &ldquo;{dup.matchTitle}&rdquo; — similarity {dup.similarityPct}%.
      </div>
      <div className="flex flex-wrap items-center gap-1">
        <DupAct primary onClick={() => onAction('merge')}>
          Merge (Curator suggest)
        </DupAct>
        <DupAct onClick={() => onAction('keep-new')}>Keep new</DupAct>
        <DupAct onClick={() => onAction('keep-existing')}>Keep existing</DupAct>
        <DupAct onClick={() => onAction('distinct')}>Mark distinct</DupAct>
      </div>
    </div>
  );
}

function DupAct({
  primary = false,
  children,
  onClick,
}: {
  primary?: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-[26px] items-center rounded border px-2 text-[10.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--secondary)]"
      style={
        primary
          ? {
              borderColor: 'rgba(45,212,191,0.28)',
              color: 'var(--primary)',
              background: 'rgba(45,212,191,0.10)',
            }
          : {
              borderColor: 'var(--border)',
              color: 'var(--text-secondary)',
              background: 'transparent',
            }
      }
    >
      {children}
    </button>
  );
}

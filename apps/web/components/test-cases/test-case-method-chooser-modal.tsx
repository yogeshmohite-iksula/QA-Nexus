// F16a Test Case Method Chooser — Pattern A scaffold (M3 Day-13 evening).
//
// Locked reference: PM1_UI_v2/Redesign Frame by claude design/F16a
// Test Case Method Chooser v2.html
//
// Per Hard Rule 15: pixel-faithful port within React-component idioms.
//
// Sizing: 940 px max-w desktop (matches v2 verbatim — larger than the
// canon 480×360 Confirm modal because it's a 3-card chooser).
// Mobile <md: full-screen drawer per Rule 12.f.
//
// Phase 3 SYS-1 lock: ALL three card CTAs use TEAL (`var(--primary)`)
// because teal is the system-action color. Differentiation is via the
// icon-tile color (violet AI / blue Info / neutral) NOT the CTA color.
//
// Composer (A1) owns the AI Generated card. The provider line uses
// "A1-Groq" verbatim per spec — the agent name `<AgentName code="A1" />`
// would render "Composer" but the locked HTML pattern shows the
// internal provider code as a meta hint, so we keep it literal here.
//
// Pattern A: every interactive site fires `pattern-a:deferred:f16a:*`.
// Pattern B (Day-15+) wires real navigation to F16b / F16c / F22 routes.

'use client';

import { forwardRef, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowDownToLine,
  ArrowRight,
  CheckSquare,
  Clock,
  FileText,
  History,
  Network,
  PenLine,
  Plus,
  PlusCircle,
  RotateCcw,
  Shield,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Card data — single source of truth. Add new methods here when the
// product wants more authoring flows.
// ---------------------------------------------------------------------------

type CardId = 'ai' | 'bulk' | 'manual';

interface MethodCard {
  id: CardId;
  title: string;
  description: string;
  /** Icon-tile color tone — violet (AI surface) / blue (Info) / neutral. */
  tone: 'ai' | 'info' | 'neutral';
  recommended?: boolean;
  iconTile: typeof Sparkles;
  cta: string;
  targetRoute: string;
  meta: Array<{
    icon: typeof Clock;
    text: React.ReactNode;
  }>;
}

const CARDS: MethodCard[] = [
  {
    id: 'ai',
    title: 'AI Generated',
    description:
      'Pick a requirement, Jira ticket, or paste a spec — A1 drafts test cases grounded in your KB. You review and accept.',
    tone: 'ai',
    recommended: true,
    iconTile: Sparkles,
    cta: 'Generate with A1',
    targetRoute: '/test-cases/generate?source=RET-247',
    meta: [
      { icon: Clock, text: '~30s for 5 cases' },
      { icon: Shield, text: 'Grounded in F15 KB' },
      { icon: Network, text: 'Provider A1-Groq' },
    ],
  },
  {
    id: 'bulk',
    title: 'Bulk Import',
    description:
      'Upload a CSV or XLSX from TestRail, Zephyr, or your own template. Map columns, validate rows, dedupe against existing.',
    tone: 'info',
    iconTile: Upload,
    cta: 'Open uploader',
    targetRoute: '/test-cases/new?method=bulk',
    meta: [
      { icon: FileText, text: 'CSV · XLSX · ≤10 MB' },
      { icon: CheckSquare, text: 'Auto field-map + A2 dedupe' },
      { icon: History, text: 'Last: 247 cases · 2 days ago' },
    ],
  },
  {
    id: 'manual',
    title: 'Create Manually',
    description:
      'Open a blank case in the editor. Type your title, steps, and expected results. Best for one-off cases or careful authoring.',
    tone: 'neutral',
    iconTile: PenLine,
    cta: 'New blank case',
    targetRoute: '/test-cases/new?method=manual',
    meta: [
      { icon: Clock, text: '~3 min per case' },
      { icon: ArrowDownToLine, text: 'Open in F22 editor' },
      { icon: PlusCircle, text: 'Optional: link an F14 requirement' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Tone helpers
// ---------------------------------------------------------------------------

function iconTileStyle(tone: 'ai' | 'info' | 'neutral'): React.CSSProperties {
  switch (tone) {
    case 'ai':
      return {
        background: 'rgba(167,139,250,0.12)',
        borderColor: 'rgba(167,139,250,0.30)',
        color: 'var(--secondary)',
      };
    case 'info':
      return {
        background: 'rgba(96,165,250,0.12)',
        borderColor: 'rgba(96,165,250,0.30)',
        color: 'var(--info)',
      };
    case 'neutral':
      return {
        background: 'var(--raised)',
        borderColor: 'var(--border-strong)',
        color: 'var(--text-secondary)',
      };
  }
}

// ---------------------------------------------------------------------------
// Main modal
// ---------------------------------------------------------------------------

interface TestCaseMethodChooserModalProps {
  open: boolean;
  onClose: () => void;
}

export function TestCaseMethodChooserModal({ open, onClose }: TestCaseMethodChooserModalProps) {
  const router = useRouter();
  // Focus index tracked via ref — no re-renders needed since the
  // visual focus is owned by the browser via .focus() calls.
  const focusIdxRef = useRef(0);
  const cardRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    if (open) {
      console.info('pattern-a:deferred:f16a:open');
      focusIdxRef.current = 0;
      setTimeout(() => cardRefs.current[0]?.focus(), 80);
    }
  }, [open]);

  // ESC + arrow-key keyboard nav
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        console.info('pattern-a:deferred:f16a:close', { reason: 'esc' });
        onClose();
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        const next = (focusIdxRef.current + 1) % CARDS.length;
        focusIdxRef.current = next;
        cardRefs.current[next]?.focus();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        const next = (focusIdxRef.current - 1 + CARDS.length) % CARDS.length;
        focusIdxRef.current = next;
        cardRefs.current[next]?.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Body scroll-lock
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  if (!open) return null;

  function selectMethod(card: MethodCard) {
    console.info(`pattern-a:deferred:f16a:select-method:${card.id}`);
    // Pattern A: navigate to target route. The route may not yet
    // exist (F16b lands Day-15, F16c Day-16, F22 manual editor M3+).
    // The modal closes via onClose — the page is responsible for
    // handling the missing target gracefully.
    onClose();
    router.push(card.targetRoute);
  }

  function handleClose(reason: 'cancel' | 'backdrop' | 'x') {
    console.info('pattern-a:deferred:f16a:close', { reason });
    onClose();
  }

  function handleResume() {
    console.info('pattern-a:deferred:f16a:resume', {
      requirementId: 'RET-247',
      draftedCases: 3,
    });
    onClose();
    router.push('/test-cases/generate?source=RET-247&resume=1');
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="f16a-title"
      className="fixed inset-0 z-50 flex items-stretch justify-center sm:items-center sm:p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={() => handleClose('backdrop')}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-screen w-full flex-col overflow-hidden bg-[var(--base)] sm:max-h-[calc(100vh-48px)] sm:max-w-[940px] sm:rounded-[14px] sm:border"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        {/* ── Header ── */}
        <header
          className="flex items-start justify-between gap-3 border-b px-5 py-4 sm:px-6"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <span
              aria-hidden="true"
              className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border"
              style={{
                background: 'rgba(45,212,191,0.12)',
                borderColor: 'rgba(45,212,191,0.30)',
                color: 'var(--primary)',
              }}
            >
              <Plus size={18} />
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <span
                className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: 'var(--primary)' }}
              >
                New test case
              </span>
              <h2
                id="f16a-title"
                className="font-display text-[17px] font-bold leading-[22px] text-[var(--text-primary)] sm:text-[18px] sm:leading-[24px]"
              >
                How do you want to author this test case?
              </h2>
              <p className="text-[12.5px] leading-[18px] text-[var(--text-tertiary)]">
                Pick a method. You can switch later — every test case lands in{' '}
                <span className="font-semibold text-[var(--text-secondary)]">
                  Iksula Returns · Test Cases
                </span>{' '}
                regardless.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleClose('x')}
            aria-label="Close modal"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[var(--text-tertiary)] transition-colors hover:bg-[var(--overlay)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </header>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-[18px]">
            {/* Recall row — Iksula canon */}
            <div
              className="flex flex-col items-start gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:gap-3"
              style={{
                background: 'rgba(167,139,250,0.10)',
                borderColor: 'rgba(167,139,250,0.30)',
              }}
            >
              <span
                aria-hidden="true"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
                style={{ background: 'rgba(167,139,250,0.20)', color: 'var(--secondary)' }}
              >
                <RotateCcw size={14} />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span
                  className="font-mono text-[9.5px] font-bold uppercase tracking-[0.1em]"
                  style={{ color: 'var(--secondary)' }}
                >
                  Resume where you left off
                </span>
                <span className="text-[12.5px] leading-[16px] text-[var(--text-primary)]">
                  AI from{' '}
                  <span className="font-mono font-semibold" style={{ color: 'var(--secondary)' }}>
                    RET-247
                  </span>{' '}
                  · 3 cases drafted, not yet accepted · Sprint 42 · 2 days ago
                </span>
              </div>
              <button
                type="button"
                onClick={handleResume}
                className="inline-flex h-8 shrink-0 items-center gap-1 rounded-md border px-3 text-[12px] font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--overlay)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                Resume
                <ArrowRight size={11} aria-hidden="true" />
              </button>
            </div>

            {/* 3-card grid */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-3.5">
              {CARDS.map((card, i) => (
                <MethodCardButton
                  key={card.id}
                  ref={(el) => {
                    cardRefs.current[i] = el;
                  }}
                  card={card}
                  onSelect={() => selectMethod(card)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <footer
          className="flex flex-col-reverse items-stretch justify-between gap-2 border-t bg-[var(--base)] px-5 py-3 sm:flex-row sm:items-center sm:px-6"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-[var(--text-tertiary)]">
            <Kbd>Esc</Kbd>
            <span>close</span>
            <Kbd>↑↓</Kbd>
            <span>nav</span>
            <Kbd>↵</Kbd>
            <span>select</span>
          </div>
          <button
            type="button"
            onClick={() => handleClose('cancel')}
            className="inline-flex h-10 min-h-[44px] items-center justify-center rounded-md border px-4 text-[13px] font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--overlay)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] sm:min-h-0"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            Cancel
          </button>
        </footer>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MethodCardButton — one of the 3 cards
// ---------------------------------------------------------------------------

const MethodCardButton = forwardRef<HTMLButtonElement, { card: MethodCard; onSelect: () => void }>(
  function MethodCardButton({ card, onSelect }, ref) {
    const Icon = card.iconTile;
    const tile = iconTileStyle(card.tone);
    const recommendedBorder = card.recommended ? 'rgba(45,212,191,0.40)' : 'var(--border-subtle)';
    return (
      <button
        ref={ref}
        type="button"
        onClick={onSelect}
        aria-label={`${card.title} — ${card.description}`}
        className="group relative flex flex-col gap-3 rounded-[12px] border bg-[var(--canvas)] p-4 text-left transition-all hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] sm:p-[18px]"
        style={{ borderColor: recommendedBorder, borderWidth: '1.5px' }}
      >
        {card.recommended && (
          <span
            className="absolute right-3 top-3 inline-flex h-5 items-center rounded-[3px] border px-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.06em]"
            style={{
              background: 'rgba(45,212,191,0.12)',
              borderColor: 'rgba(45,212,191,0.30)',
              color: 'var(--primary)',
            }}
          >
            Recommended
          </span>
        )}

        {/* Icon tile */}
        <span
          aria-hidden="true"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border"
          style={tile}
        >
          <Icon size={18} />
        </span>

        {/* Title + description */}
        <div className="flex flex-col gap-1.5">
          <h3 className="font-display text-[15px] font-bold leading-[20px] text-[var(--text-primary)]">
            {card.title}
          </h3>
          <p className="text-[12.5px] leading-[18px] text-[var(--text-tertiary)]">
            {card.description}
          </p>
        </div>

        {/* Meta rows */}
        <ul
          className="flex flex-col gap-1.5 border-t pt-3 text-[11.5px] text-[var(--text-tertiary)]"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          {card.meta.map((m, i) => {
            const MetaIcon = m.icon;
            return (
              <li key={i} className="flex items-center gap-1.5">
                <MetaIcon size={11} aria-hidden="true" className="shrink-0" />
                <span>{m.text}</span>
              </li>
            );
          })}
        </ul>

        {/* CTA — TEAL per Phase 3 SYS-1 lock (CTA color = system action,
            differentiation comes from the icon tile above). */}
        <span
          className="mt-auto inline-flex h-9 items-center justify-center gap-1.5 rounded-md px-3 text-[12.5px] font-semibold transition-opacity group-hover:opacity-90"
          style={{ background: 'var(--primary)', color: 'var(--primary-ink)' }}
        >
          {card.cta}
          <ArrowRight size={12} aria-hidden="true" />
        </span>
      </button>
    );
  },
);

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      className="inline-flex h-5 items-center rounded border px-1.5 font-mono text-[10px]"
      style={{
        background: 'var(--overlay)',
        borderColor: 'var(--border-subtle)',
        color: 'var(--text-secondary)',
      }}
    >
      {children}
    </kbd>
  );
}

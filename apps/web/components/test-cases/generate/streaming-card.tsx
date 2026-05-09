// F16b · streaming + queued case cards.
//
// Direct port of F16b A1 Generate from Requirement v2.html lines 466-487
// (.streaming / .stream-* / .skel-line) and lines 953-959 (queued
// variant). Pattern A: animation runs continuously while the parent
// page sets `isGenerating` true; on Day-15 swap, this becomes
// SSE-frame-driven.

'use client';

import { Sparkles, Clock } from 'lucide-react';
import { AgentName } from '@/components/ui/agent-name';

interface StreamingCardProps {
  tcId: string; // 'TC-RET-0344'
  /** Elapsed seconds since stream started (formatted '0.74'). */
  elapsedSeconds: number;
}

export function StreamingCard({ tcId, elapsedSeconds }: StreamingCardProps) {
  return (
    <article
      className="relative flex flex-col gap-2.5 overflow-hidden rounded-[14px] px-4 py-3.5 motion-safe:animate-none"
      style={{
        background: 'var(--base)',
        border: '1px solid rgba(167,139,250,0.30)',
      }}
    >
      <span
        aria-hidden="true"
        className="absolute bottom-0 left-0 top-0 w-[3px] motion-safe:animate-[streamPulse_1.4s_linear_infinite]"
        style={{
          background:
            'linear-gradient(180deg,var(--secondary),var(--ai-accent, var(--secondary)),var(--secondary))',
          backgroundSize: '100% 200%',
        }}
      />

      <div className="flex items-center gap-2">
        <span
          className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-sm"
          style={{
            background: 'rgba(167,139,250,0.12)',
            color: 'var(--secondary)',
            border: '1px solid rgba(167,139,250,0.30)',
          }}
        >
          <Sparkles size={11} aria-hidden="true" />
        </span>
        <span
          className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold"
          style={{
            color: 'var(--ai-accent, var(--secondary))',
            letterSpacing: '0.04em',
          }}
        >
          ✦ <AgentName code="composer" inherit /> generating {tcId}
        </span>
        <span
          className="ml-auto inline-flex items-center gap-1 font-mono text-[10.5px]"
          style={{ color: 'var(--text-tertiary)' }}
        >
          <span
            aria-hidden="true"
            className="inline-block h-1 w-1 rounded-full motion-safe:animate-[pulseDot_1s_ease-in-out_infinite]"
            style={{ background: 'var(--secondary)' }}
          />
          streaming · {elapsedSeconds.toFixed(2)}s
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <SkelLine width="100%" />
        <SkelLine width="65%" />
        <SkelLine width="40%" />
      </div>
    </article>
  );
}

interface QueuedCardProps {
  tcId: string;
}

export function QueuedCard({ tcId }: QueuedCardProps) {
  return (
    <article
      className="relative flex flex-col gap-2.5 overflow-hidden rounded-[14px] px-4 py-3.5"
      style={{
        background: 'var(--base)',
        border: '1px solid var(--border)',
        opacity: 0.55,
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-sm"
          style={{
            background: 'var(--raised)',
            border: '1px solid var(--border)',
            color: 'var(--text-quaternary, var(--text-tertiary))',
          }}
        >
          <Clock size={11} aria-hidden="true" />
        </span>
        <span
          className="font-mono text-[11px] font-semibold"
          style={{
            color: 'var(--text-tertiary)',
            letterSpacing: '0.04em',
          }}
        >
          ⏱ Queued · {tcId}
        </span>
        <span className="ml-auto font-mono text-[10.5px]" style={{ color: 'var(--text-tertiary)' }}>
          waiting
        </span>
      </div>
    </article>
  );
}

function SkelLine({ width }: { width: string }) {
  return (
    <div
      className="h-2.5 motion-safe:animate-[skelShimmer_1.6s_linear_infinite]"
      style={{
        width,
        background:
          'linear-gradient(90deg, var(--raised) 0%, var(--overlay) 50%, var(--raised) 100%)',
        backgroundSize: '200% 100%',
        borderRadius: '3px',
      }}
    />
  );
}

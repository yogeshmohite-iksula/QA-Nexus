// F16b · right pane — Activity timeline / Provenance tab.
//
// Direct port of F16b A1 Generate from Requirement v2.html lines 504-543
// (.right-tabs / .activity-item / .a-glyph etc.) and lines 982-1045.
// Pattern A: timeline is static; Day-15 swap point streams events in
// real-time as Composer/Curator fire.

'use client';

import { Sparkles, Check, X, MessageCircle } from 'lucide-react';
import type { ActivityEvent } from './canned-data';

interface ActivityPaneProps {
  events: ActivityEvent[];
  onClose: () => void;
}

export function ActivityPane({ events, onClose }: ActivityPaneProps) {
  return (
    <aside
      className="hidden min-h-0 flex-col overflow-hidden border-l xl:flex"
      style={{
        background: 'var(--base)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Tabs */}
      <div
        role="tablist"
        className="flex flex-none items-stretch border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <button
          type="button"
          role="tab"
          aria-selected="true"
          className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 text-[12px] font-semibold leading-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--secondary)]"
          style={{
            color: 'var(--text-primary)',
            borderBottom: '2px solid var(--secondary)',
          }}
        >
          Activity{' '}
          <span
            className="rounded-sm px-1.5 py-px font-mono text-[10.5px]"
            style={{
              background: 'rgba(167,139,250,0.12)',
              color: 'var(--ai-accent, var(--secondary))',
            }}
          >
            {events.length}
          </span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected="false"
          className="inline-flex h-10 flex-1 items-center justify-center text-[12px] font-semibold leading-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--secondary)]"
          style={{
            color: 'var(--text-tertiary)',
            borderBottom: '2px solid transparent',
          }}
        >
          Provenance
        </button>
        <button
          type="button"
          onClick={() => {
            console.info('pattern-a:deferred:f16b:activity-close');
            onClose();
          }}
          aria-label="Close activity panel"
          title="Close"
          className="inline-flex w-9 flex-none items-center justify-center border-l transition-colors hover:bg-[var(--raised)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--secondary)]"
          style={{
            borderColor: 'var(--border)',
            color: 'var(--text-tertiary)',
          }}
        >
          <X size={14} aria-hidden="true" />
        </button>
      </div>

      {/* Body — scrollable timeline */}
      <ul className="m-0 flex min-h-0 flex-1 list-none flex-col gap-3 overflow-y-auto px-4 py-3.5">
        {events.map((ev, idx) => (
          <ActivityItem key={ev.id} ev={ev} isLast={idx === events.length - 1} />
        ))}
      </ul>
    </aside>
  );
}

function ActivityItem({ ev, isLast }: { ev: ActivityEvent; isLast: boolean }) {
  // Pick glyph variant by kind
  let glyph: 'ai' | 'ok' = 'ok';
  let Icon = Check;
  let strokeWidth = 3;
  switch (ev.kind) {
    case 'composer-start':
    case 'streaming':
      glyph = 'ai';
      Icon = Sparkles;
      strokeWidth = 2;
      break;
    case 'accepted':
      glyph = 'ai';
      Icon = MessageCircle;
      strokeWidth = 2;
      break;
    case 'drafted':
    case 'curator-flag':
    default:
      glyph = 'ok';
      Icon = Check;
      strokeWidth = 3;
  }

  return (
    <li
      className="relative flex gap-2.5 text-[11.5px] leading-[16px]"
      style={{ color: 'var(--text-secondary)' }}
    >
      {!isLast && (
        <span
          aria-hidden="true"
          className="absolute left-[9px] top-[22px] w-px"
          style={{
            background: 'var(--border)',
            bottom: '-12px',
          }}
        />
      )}
      <span
        className="relative z-[1] inline-flex h-5 w-5 flex-none items-center justify-center rounded-md"
        style={
          glyph === 'ai'
            ? {
                background: 'rgba(167,139,250,0.12)',
                border: '1px solid rgba(167,139,250,0.30)',
                color: 'var(--secondary)',
              }
            : {
                background: 'rgba(52,211,153,0.14)',
                border: '1px solid rgba(52,211,153,0.34)',
                color: 'var(--pass)',
              }
        }
      >
        <Icon size={11} strokeWidth={strokeWidth} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <div
          className="text-[11.5px] font-semibold leading-[16px]"
          style={{ color: 'var(--text-primary)' }}
        >
          {ev.title}
          {ev.tcId && (
            <>
              {' '}
              <b
                className="font-mono"
                style={{
                  color: 'var(--ai-accent, var(--secondary))',
                  fontWeight: 600,
                }}
              >
                {ev.tcId}
              </b>
            </>
          )}
        </div>
        <div
          className="mt-0.5 font-mono text-[10px]"
          style={{ color: 'var(--text-quaternary, var(--text-tertiary))' }}
        >
          {ev.meta}
        </div>
        {ev.detail && (
          <div
            className="mt-0.5 text-[11px] leading-[15px]"
            style={{
              color: ev.detailTone === 'warn' ? 'var(--warn)' : 'var(--text-tertiary)',
            }}
          >
            {ev.detail}
          </div>
        )}
      </div>
    </li>
  );
}

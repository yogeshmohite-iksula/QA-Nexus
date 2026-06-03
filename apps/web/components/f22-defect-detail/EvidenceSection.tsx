'use client';
// Implements F22 Evidence section — tabs + 3 mini-cards.
// Canonical: PM1_UI_v2/Redesign Frame by claude design/F22 Defect Detail v2.html L790-845.
// Strings trace to canned-data.ts (Hard Rule 17).

import { useState } from 'react';
import {
  Terminal,
  Image as ImageIcon,
  Network,
  Monitor,
  History,
  MessageSquare,
  Download,
  Maximize2,
} from 'lucide-react';
import type { EvidenceTab, EvidenceCard } from './types';

const TAB_ICONS: Record<string, typeof Terminal> = {
  terminal: Terminal,
  image: ImageIcon,
  lan: Network,
  computer: Monitor,
  history: History,
  forum: MessageSquare,
};

function LogCard({ card }: { card: EvidenceCard }) {
  return (
    <div
      data-canonical-section="ev-card-log"
      className="overflow-hidden rounded-md border border-[color:var(--border)] bg-[color:var(--raised)]"
    >
      <div className="relative h-[150px] bg-[color:var(--canvas)] p-3">
        <div className="font-mono text-[10px] leading-[1.5] text-[color:var(--t3)]">
          {(card.logLines ?? []).map((l, i) => (
            <div
              key={i}
              style={{
                color:
                  l.tone === 'err'
                    ? 'var(--fail)'
                    : l.tone === 'warn'
                      ? 'var(--warn)'
                      : 'var(--t3)',
              }}
            >
              {l.ts ? (
                <span>
                  [{l.tone.toUpperCase()}] {l.ts} {l.src}
                </span>
              ) : null}
              {l.ts ? null : <span> {l.body}</span>}
              {l.ts ? <div className="text-[color:var(--t3)]"> {l.body}</div> : null}
            </div>
          ))}
        </div>
        <span className="absolute right-2 top-2 inline-flex h-5 items-center gap-1 rounded-sm border border-[color:var(--fail-line)] bg-[color:var(--fail-soft)] px-2 font-mono text-[10px] font-semibold text-[color:var(--fail)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--fail)]" aria-hidden="true" />
          5× timeout
        </span>
      </div>
      <div className="flex items-center justify-between border-t border-[color:var(--border)] px-3 py-2 text-[11.5px] text-[color:var(--t2)]">
        <span className="truncate font-mono">{card.title}</span>
        <Maximize2 className="h-3.5 w-3.5 shrink-0 text-[color:var(--t3)]" aria-hidden="true" />
      </div>
    </div>
  );
}

function LatencyChartCard({ card }: { card: EvidenceCard }) {
  return (
    <div
      data-canonical-section="ev-card-latency"
      className="overflow-hidden rounded-md border border-[color:var(--border)] bg-[color:var(--raised)]"
    >
      <div className="relative h-[150px] bg-[color:var(--canvas)]">
        <svg
          viewBox="0 0 320 160"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="lat-grad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0" stopColor="#F87171" stopOpacity="0.4" />
              <stop offset="1" stopColor="#F87171" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M10 130 L60 110 L100 100 L140 88 L180 60 L220 30 L260 28 L310 25 L310 150 L10 150 Z"
            fill="url(#lat-grad)"
          />
          <path
            d="M10 130 L60 110 L100 100 L140 88 L180 60 L220 30 L260 28 L310 25"
            stroke="#F87171"
            strokeWidth="1.5"
            fill="none"
          />
          <line
            x1="180"
            y1="20"
            x2="180"
            y2="150"
            stroke="#FBBF24"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
          <text x="184" y="34" fill="#FBBF24" fontFamily="JetBrains Mono" fontSize="8">
            {card.latencyCaption}
          </text>
        </svg>
        <span className="absolute right-2 top-2 inline-flex h-5 items-center gap-1 rounded-sm border border-[color:var(--warn-line)] bg-[color:var(--warn-soft)] px-2 font-mono text-[10px] font-semibold text-[color:var(--warn)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--warn)]" aria-hidden="true" />
          p95 spike 5.6×
        </span>
      </div>
      <div className="flex items-center justify-between border-t border-[color:var(--border)] px-3 py-2 text-[11.5px] text-[color:var(--t2)]">
        <span className="truncate font-mono">{card.title}</span>
        <Maximize2 className="h-3.5 w-3.5 shrink-0 text-[color:var(--t3)]" aria-hidden="true" />
      </div>
    </div>
  );
}

function QueueCard({ card }: { card: EvidenceCard }) {
  return (
    <div
      data-canonical-section="ev-card-queue"
      className="overflow-hidden rounded-md border border-[color:var(--border)] bg-[color:var(--raised)]"
    >
      <div className="relative h-[150px] bg-[color:var(--canvas)] p-3">
        <div className="flex h-full flex-col items-center justify-center gap-1 rounded-md border border-dashed border-[color:var(--border)] text-center font-mono">
          <div className="text-[11px] text-[color:var(--secondary)]">refund-pending queue</div>
          <div className="text-[18px] text-[color:var(--warn)]">{card.queueRows}</div>
          <div className="text-[10px] text-[color:var(--t3)]">{card.queueBaseline}</div>
        </div>
        <span className="absolute right-2 top-2 inline-flex h-5 items-center gap-1 rounded-sm border border-[color:var(--warn-line)] bg-[color:var(--warn-soft)] px-2 font-mono text-[10px] font-semibold text-[color:var(--warn)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--warn)]" aria-hidden="true" />
          queue backlog
        </span>
      </div>
      <div className="flex items-center justify-between border-t border-[color:var(--border)] px-3 py-2 text-[11.5px] text-[color:var(--t2)]">
        <span className="truncate font-mono">{card.title}</span>
        <Maximize2 className="h-3.5 w-3.5 shrink-0 text-[color:var(--t3)]" aria-hidden="true" />
      </div>
    </div>
  );
}

interface Props {
  tabs: EvidenceTab[];
  cards: EvidenceCard[];
  source: string;
}

export function EvidenceSection({ tabs, cards, source }: Props) {
  const [activeId, setActiveId] = useState<string>(
    tabs.find((t) => t.active)?.id ?? tabs[0]?.id ?? '',
  );

  return (
    <section
      role="region"
      aria-label="Evidence"
      data-canonical-section="section-evidence"
      className="space-y-3"
    >
      <header data-canonical-section="sec-head" className="flex flex-wrap items-center gap-2">
        <h2 className="font-display text-[15px] font-bold text-[color:var(--t1)]">Evidence</h2>
        <span className="text-[11.5px] text-[color:var(--t3)]">
          captured automatically · <span className="font-mono">{source}</span>
        </span>
        <button
          type="button"
          className="ml-auto inline-flex h-7 items-center gap-1.5 rounded-md border border-[color:var(--border)] bg-transparent px-2.5 text-[11.5px] text-[color:var(--t2)] hover:border-[color:var(--border-strong)] hover:text-[color:var(--t1)]"
        >
          Download all
          <Download className="h-3 w-3" aria-hidden="true" />
        </button>
      </header>

      {/* Flat tabs with bottom border on active (canonical .dtab). Single row +
          horizontal scroll on overflow (canonical .tabs); unlike canonical we
          DON'T hide the scrollbar — the SYS-17 custom scrollbar (Rule 14) stays
          visible so mobile users can swipe to reach a tab (Yogesh visual gate). */}
      <div
        role="tablist"
        aria-label="Evidence tabs"
        data-canonical-section="ev-tabs"
        className="flex flex-nowrap items-center gap-x-2 overflow-x-auto border-b border-[color:var(--border)]"
      >
        {tabs.map((t) => {
          const Icon = TAB_ICONS[t.icon] ?? Terminal;
          const isActive = t.id === activeId;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={isActive}
              type="button"
              onClick={() => setActiveId(t.id)}
              className={`-mb-px inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2 text-[12px] font-medium transition-colors ${
                isActive
                  ? 'border-[color:var(--primary)] text-[color:var(--t1)]'
                  : 'border-transparent text-[color:var(--t3)] hover:text-[color:var(--t2)]'
              }`}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {t.label}
              {typeof t.count === 'number' ? (
                <span
                  className={`font-mono text-[10.5px] ${isActive ? 'text-[color:var(--primary)]' : 'text-[color:var(--t4)]'}`}
                >
                  {t.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div
        data-canonical-section="ev-grid"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
      >
        {cards.map((c, i) => {
          if (c.kind === 'log') return <LogCard key={i} card={c} />;
          if (c.kind === 'chart-latency') return <LatencyChartCard key={i} card={c} />;
          return <QueueCard key={i} card={c} />;
        })}
      </div>
    </section>
  );
}

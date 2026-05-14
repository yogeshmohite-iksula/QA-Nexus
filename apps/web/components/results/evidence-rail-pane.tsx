// F20 Evidence rail (right pane) — canonical L1067-1200 (markup).
//
// Reuses F19 ev-rail pattern: tabbed surface with sections.
// Pattern A — sections render evidence + actions for the selected case
// (defaults to TC-RET-0342 from canonical aria-current="true").
// Action buttons fire console.info markers; Pattern B will flip to
// real BE wires (POST /defects, POST /runs/:id/cases/:caseId/rerun).

'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  CircleDashed,
  CircleX,
  FileBarChart,
  Image as ImageIcon,
  Plus,
  RefreshCw,
  ScrollText,
  Terminal,
} from 'lucide-react';
import type { EvidenceRailContext } from './canned-data';

interface Props {
  context: EvidenceRailContext;
  onCollapse?: () => void;
}

const TABS = [
  { id: 'evidence', label: 'Evidence', icon: ImageIcon },
  { id: 'logs', label: 'Logs', icon: Terminal },
  { id: 'rca', label: 'RCA', icon: ScrollText },
  { id: 'env', label: 'Env diff', icon: FileBarChart },
] as const;

const ACTION_ICON_MAP = {
  primary: RefreshCw,
  secondary: Plus,
  warn: AlertTriangle,
  fail: CircleX,
} as const;

const ACTION_STYLE: Record<
  'primary' | 'secondary' | 'fail' | 'warn',
  { bg: string; bd: string; fg: string }
> = {
  primary: { bg: 'var(--primary)', bd: 'var(--primary-line)', fg: 'var(--primary-ink)' },
  secondary: { bg: 'var(--secondary)', bd: 'var(--ai-line)', fg: 'var(--secondary-ink)' },
  warn: { bg: 'var(--warn-soft)', bd: 'var(--warn-line)', fg: 'var(--warn)' },
  fail: { bg: 'var(--fail-soft)', bd: 'var(--fail-line)', fg: 'var(--fail)' },
};

export function EvidenceRailPane({ context }: Props) {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]['id']>('evidence');
  return (
    <aside
      aria-label="Evidence and actions"
      className="flex min-h-0 flex-col border-l"
      style={{ background: 'var(--canvas)', borderColor: 'var(--border)' }}
    >
      {/* Head — selected case context */}
      <header
        className="flex flex-col gap-1.5 border-b px-4 py-3"
        style={{ borderColor: 'var(--border)' }}
      >
        <span
          className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.06em]"
          style={{ color: 'var(--t3)' }}
        >
          Selected case
        </span>
        <span className="font-mono text-[11px] font-medium" style={{ color: 'var(--t2)' }}>
          {context.selectedCaseId} · {context.selectedSuiteName}
        </span>
        <span className="text-[12.5px] font-semibold" style={{ color: 'var(--t1)' }}>
          {context.selectedCaseTitle}
        </span>
      </header>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Evidence panes"
        className="flex border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive ? 'true' : 'false'}
              onClick={() => setActiveTab(tab.id)}
              className="inline-flex flex-1 items-center justify-center gap-1.5 px-2 py-2.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--secondary)]"
              style={{
                color: isActive ? 'var(--t1)' : 'var(--t3)',
                borderBottom: isActive ? '2px solid var(--secondary)' : '2px solid transparent',
                background: isActive ? 'var(--base)' : 'transparent',
              }}
            >
              <Icon size={12} aria-hidden="true" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Body — evidence kv list */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <section aria-label={`${activeTab} content`} className="flex flex-col gap-1.5">
          {activeTab === 'evidence' && (
            <ul className="m-0 flex flex-col gap-1.5 p-0">
              {context.evidence.map((kv) => (
                <li
                  key={kv.label}
                  className="flex items-baseline gap-2 border-b py-1.5 last:border-b-0"
                  style={{ borderColor: 'var(--border)', listStyle: 'none' }}
                >
                  <span
                    className="font-mono text-[10px] font-semibold uppercase tracking-[0.04em]"
                    style={{ color: 'var(--t3)', minWidth: 64 }}
                  >
                    {kv.label}
                  </span>
                  <span className="text-[12px]" style={{ color: 'var(--t1)' }}>
                    {kv.value}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {activeTab !== 'evidence' && (
            <div
              className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-[11.5px]"
              style={{
                background: 'var(--raised)',
                borderColor: 'var(--border)',
                color: 'var(--t3)',
              }}
            >
              <CircleDashed size={13} aria-hidden="true" />
              Pattern B will populate this pane from BE.
            </div>
          )}
        </section>
      </div>

      {/* Sticky action footer */}
      <footer
        className="flex flex-col gap-2 border-t px-4 py-3"
        style={{ borderColor: 'var(--border)', background: 'var(--base)' }}
      >
        {context.actions.map((a) => {
          const tones = ACTION_STYLE[a.tone];
          const Icon = ACTION_ICON_MAP[a.tone];
          return (
            <button
              key={a.label}
              type="button"
              onClick={() =>
                console.info(`pattern-a:deferred:f20:action`, { tone: a.tone, label: a.label })
              }
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border px-3 text-[12px] font-semibold transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
              style={{ background: tones.bg, borderColor: tones.bd, color: tones.fg }}
            >
              <Icon size={13} aria-hidden="true" />
              {a.label}
            </button>
          );
        })}
      </footer>
    </aside>
  );
}

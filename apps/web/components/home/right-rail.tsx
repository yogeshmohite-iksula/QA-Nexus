// Region 4 of F08a Home — right rail: evidence thread + suggested next +
// pinned references. Hidden below xl: (1280 px) — falls below queue on
// mobile/tablet as a stacked section. At xl+, sits at 360 px wide.

'use client';

import { useEffect, useState } from 'react';

import { EVIDENCE_THREAD, type EvidenceEntry } from './data';
import { agentOfAction, fetchAuditEntries, relativeFreshness } from '@/lib/api/audit-api';
import { ComingSoon } from '@/components/admin/coming-soon';

interface RightRailProps {
  onRoute: (target: string) => void;
}

/** Fri WIRE batch 3: live "Recent agent activity" from /api/audit, filtered
 *  to agent actions (A1/A2/A4). null = fetch failed → keep canned. Adapter
 *  derives agent code from `action` prefix (Hard Rule 11: action string IS
 *  the canonical agent attribution; no synthetic chips). */
function auditToEvidence(items: ReturnType<typeof Object>): EvidenceEntry[] {
  return (
    items as Array<{
      id: string;
      ts: string;
      action: string;
      entity: string;
      entityId: string | null;
    }>
  )
    .map((e): EvidenceEntry | null => {
      const agent = agentOfAction(e.action);
      if (!agent) return null;
      const verb = e.action.split('.').slice(1).join('.') || 'action';
      const target = e.entityId
        ? `${e.entity.replace(/_/g, ' ')} ${e.entityId.slice(0, 8)}`
        : e.entity.replace(/_/g, ' ');
      return {
        agent,
        body: `${verb.charAt(0).toUpperCase() + verb.slice(1)} on ${target}`,
        freshness: relativeFreshness(e.ts),
        chips: [],
      };
    })
    .filter((x): x is EvidenceEntry => x !== null);
}

export function RightRail({ onRoute }: RightRailProps) {
  const [liveEvidence, setLiveEvidence] = useState<EvidenceEntry[] | null>(null);
  useEffect(() => {
    let alive = true;
    void fetchAuditEntries(50).then((res) => {
      if (!alive || !res) return;
      const rows = auditToEvidence(res.items);
      // Keep canned visible if no agent actions exist yet (pre-pilot DB).
      if (rows.length > 0) setLiveEvidence(rows.slice(0, 4));
    });
    return () => {
      alive = false;
    };
  }, []);

  const evidence = liveEvidence ?? EVIDENCE_THREAD;
  return (
    <aside
      aria-label="Recent agent activity"
      className="flex w-full flex-col gap-5 lg:max-w-md xl:sticky xl:top-14 xl:h-[calc(100vh-3.5rem)] xl:w-[360px] xl:max-w-none xl:shrink-0 xl:overflow-y-auto xl:border-l xl:border-[var(--border-subtle)] xl:bg-[var(--canvas)] xl:p-5"
    >
      <header className="flex items-center justify-between">
        <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--text-tertiary)]">
          Your recent agent activity
        </h2>
        <kbd className="rounded border border-[var(--border-subtle)] bg-[var(--overlay)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-tertiary)]">
          ⌘J
        </kbd>
      </header>

      <ol className="flex flex-col">
        {evidence.map((e, i) => (
          <EvidenceRow key={`${e.agent}-${i}`} entry={e} isLast={i === evidence.length - 1} />
        ))}
      </ol>

      {/* Fri WIRE batch 5: Suggested next + Pinned references — no recommender
       *  or pin endpoint exists → ComingSoon affordances. */}
      <ComingSoon label="Suggested next" hint="Smart next-action suggestions are coming." />
      <ComingSoon
        label="Pinned references"
        hint="Pin docs + cases for quick access — coming soon."
      />

      <div className="mt-auto flex items-center justify-between border-t border-[var(--border-subtle)] pt-3 text-[11px] text-[var(--text-disabled)]">
        <span className="font-mono">evidence-mesh v1.0 · ⌘J toggle</span>
        <button
          type="button"
          onClick={() => onRoute('F26-evidence-mesh-all')}
          className="font-medium text-[var(--primary)] hover:text-[var(--text-primary)] focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
        >
          View all →
        </button>
      </div>
    </aside>
  );
}

function EvidenceRow({ entry, isLast }: { entry: EvidenceEntry; isLast: boolean }) {
  return (
    <li className="relative flex gap-3 pb-3 last:pb-0">
      {/* Connector + glyph column */}
      <div className="flex shrink-0 flex-col items-center">
        <span
          aria-hidden="true"
          className="border-[var(--secondary)]/30 bg-[var(--secondary)]/15 inline-flex h-7 w-7 items-center justify-center rounded-md border font-mono text-[10px] font-bold text-[var(--secondary)]"
        >
          {entry.agent}
        </span>
        {!isLast && (
          <span aria-hidden="true" className="mt-1 w-px flex-1 bg-[var(--border-subtle)]" />
        )}
      </div>

      {/* Body */}
      <div className="flex min-w-0 flex-1 flex-col gap-1 pt-0.5">
        <p className="text-[13px] leading-[18px] text-[var(--text-primary)]">{entry.body}</p>
        <div className="flex flex-wrap items-center gap-2 text-[11px] leading-[16px]">
          {entry.conf && (
            <span
              className={[
                'inline-flex items-center rounded px-1.5 py-0.5 font-mono font-medium',
                entry.conf.tone === 'pass'
                  ? 'bg-[var(--pass)]/10 text-[var(--pass)]'
                  : 'bg-[var(--warn)]/10 text-[var(--warn)]',
              ].join(' ')}
            >
              conf {entry.conf.value.toFixed(2)}
            </span>
          )}
          <span className={entry.awaiting ? 'text-[var(--warn)]' : 'text-[var(--text-tertiary)]'}>
            {entry.freshness}
          </span>
        </div>
        {entry.chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {entry.chips.map((c) => (
              <span
                key={c}
                className="inline-flex items-center rounded border border-[var(--border-subtle)] bg-[var(--raised)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-tertiary)]"
              >
                {c}
              </span>
            ))}
          </div>
        )}
      </div>
    </li>
  );
}

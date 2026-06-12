// F21 Defects Hub — LIVE list (Finding W2-R, 2026-06-12): rows come from
// GET /api/defects (#271, offset-paged, shared DefectListItem read-shape)
// with the canned fixture as the offline/dev fallback per the Option-B
// convention. Mounts under AdminShell active="defects-failures".

'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin/admin-shell';
import { fetchDefects, defectToRow } from '@/lib/api/defects-api';
import { DefHead } from './def-head';
import { FilterStrip } from './filter-strip';
import { DefectsToolbar } from './toolbar';
import { DefectRowItem } from './defect-row';
import { SdRail } from './sd-rail';
import { F21_DEFECTS, F21_GROUP_HEADERS, type DefectPriority, type DefectRow } from './canned-data';

// Day-19 Round-2 visual gate fix — render group-sep banner row per
// priority cohort when GROUP BY = Priority (canonical L819 / L944 / L1063).
// Token mapping mirrors defect-row.tsx PRI_STYLE: P0=fail, P1=warn (PM1
// design-token whitelist enforced; canonical's P1 orange substitutes to
// --warn amber per 01_SYSTEM.md).
const GROUP_PILL: Record<DefectPriority, { bg: string; bd: string; fg: string }> = {
  p0: { bg: 'var(--fail-soft)', bd: 'var(--fail-line)', fg: 'var(--fail)' },
  p1: { bg: 'var(--warn-soft)', bd: 'var(--warn-line)', fg: 'var(--warn)' },
  p2: { bg: 'var(--warn-soft)', bd: 'var(--warn-line)', fg: 'var(--warn)' },
  p3: { bg: 'var(--info-soft)', bd: 'var(--info-line)', fg: 'var(--info)' },
};

export function DefectsPage() {
  const [selectedId, setSelectedId] = useState<string>(F21_DEFECTS[0].id);

  // W2-R live wire: real defects when /api/defects responds; canned fallback
  // on error/offline (fetchDefects never throws). Selection is re-anchored to
  // the first live row when the current selection isn't in the live set.
  const [liveRows, setLiveRows] = useState<DefectRow[] | null>(null);
  useEffect(() => {
    let alive = true;
    void fetchDefects().then((res) => {
      if (!alive || !res || res.defects.length === 0) return;
      const rows = res.defects.map(defectToRow);
      setLiveRows(rows);
      setSelectedId((cur) => (rows.some((r) => r.id === cur) ? cur : rows[0].id));
    });
    return () => {
      alive = false;
    };
  }, []);

  const sourceRows = liveRows ?? F21_DEFECTS;

  // Group defects by priority for section-header rendering.
  const groupedRows = F21_GROUP_HEADERS.map((header) => ({
    header,
    rows: sourceRows.filter((d) => d.priority === header.priority),
  }));

  return (
    <AdminShell active="defects-failures" projectKeyLower="iksula-returns">
      <div
        data-canonical-section="def-shell"
        className="flex min-h-0 flex-1 flex-col"
        style={{ background: 'var(--canvas)', color: 'var(--t1)' }}
      >
        <DefHead />
        <FilterStrip />
        <DefectsToolbar />

        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px]">
          <section
            aria-label="Defect list"
            role="list"
            className="flex min-w-0 flex-col overflow-y-auto"
          >
            {groupedRows.map(({ header, rows }) => {
              const pill = GROUP_PILL[header.priority];
              return (
                <div key={header.priority} className="contents">
                  {/* Group separator banner — canonical .group-sep L335
                   *  Day-19 Round-5 bg fix per Yogesh: "P0/P1/P2 separator
                   *  rows need bg different than black". --base lifts them
                   *  off the --canvas list rows below for visual breakpoint. */}
                  <div
                    role="separator"
                    aria-label={`${header.pillLabel} ${header.label}`}
                    className="flex items-center gap-2 border-b px-3 py-2 sm:px-5 lg:px-7"
                    style={{ background: 'var(--base)', borderColor: 'var(--border)' }}
                  >
                    <span
                      className="inline-flex items-center justify-center rounded border px-1.5 py-0.5 font-mono text-[10.5px] font-bold tracking-[0.04em]"
                      style={{ background: pill.bg, borderColor: pill.bd, color: pill.fg }}
                    >
                      {header.pillLabel}
                    </span>
                    <span className="text-[11.5px]" style={{ color: 'var(--t2)' }}>
                      {header.label}
                    </span>
                    <span className="min-w-2 flex-1" />
                    <span
                      className="font-mono text-[10.5px] tracking-[0.04em]"
                      style={{ color: 'var(--t4)' }}
                    >
                      {header.count}
                    </span>
                  </div>
                  {rows.map((row) => (
                    <DefectRowItem
                      key={row.id}
                      row={row}
                      isSelected={row.id === selectedId}
                      onSelect={() => {
                        setSelectedId(row.id);
                        console.info('pattern-a:deferred:f21:select-defect', { id: row.id });
                      }}
                    />
                  ))}
                </div>
              );
            })}
          </section>

          <div className="hidden lg:block lg:min-h-0">
            <SdRail />
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

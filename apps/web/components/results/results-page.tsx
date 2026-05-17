// F20 Run Results — Pattern A page composition (Hard Rule 17 from start).
// Mounts under AdminShell active="run-results" + projectKeyLower="ret".
//
// Day-20 frame-port skill workflow Step 4 scaffold:
//   - Top control panel: run-summary
//   - Sherlock block (headline + agent name + RCA pill)
//   - 3 cluster cards (high / med / mixed) — data-canonical-section attrs
//     for diff-probe TERTIARY anchor of nested siblings (F21 v2.2 lesson)
//   - Results table grouped by suite
//   - Right rail: Evidence (tabs + sections)
//   - Sticky bottom: action-footer

'use client';

import { AdminShell } from '@/components/admin/admin-shell';
import { F20_CLUSTERS } from './canned-data';
import { ActionFooter } from './action-footer';
import { ClusterCard } from './cluster-card';
import { EvRail } from './ev-rail';
import { ResultsTable } from './results-table';
import { RunSummary } from './run-summary';
import { SherlockBlock } from './sherlock-block';

export function ResultsPage() {
  return (
    <AdminShell active="run-results" projectKeyLower="ret">
      <div
        data-canonical-section="run-shell"
        // Day-20 diff-probe SECONDARY tier: literal `run-shell` class so
        // probe matches canonical L707 div.run-shell. Tailwind follows.
        className="run-shell flex min-h-0 flex-1 flex-col"
        style={{ background: 'var(--canvas)', color: 'var(--t1)' }}
      >
        {/* Center pane + right rail — single grid on lg+, stacked on mobile */}
        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px]">
          {/* Center pane */}
          <div className="flex min-w-0 flex-col overflow-y-auto" data-canonical-section="run-body">
            <RunSummary />
            <SherlockBlock />
            {/* Cluster cards — 3 article.cluster siblings (high/med/mixed).
             * Day-19 lesson: each carries data-canonical-section so diff-probe
             * can verify the nested-sibling count (TERTIARY tier). */}
            <div
              data-canonical-section="cluster-list"
              className="flex flex-col gap-3 border-b px-4 py-4 sm:px-5 lg:px-7"
              style={{ borderColor: 'var(--border)' }}
            >
              {F20_CLUSTERS.map((cluster) => (
                <ClusterCard key={cluster.num} cluster={cluster} />
              ))}
            </div>
            <ResultsTable />
          </div>

          {/* Right rail — Evidence (hidden on mobile per RWD) */}
          <div className="hidden lg:block lg:min-h-0">
            <EvRail />
          </div>
        </div>

        {/* Sticky action footer */}
        <ActionFooter />
      </div>
    </AdminShell>
  );
}

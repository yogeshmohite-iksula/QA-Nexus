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
        {/* Day-20 R4 visual gate fix: canonical L710-740 .run-summary sits
         * ABOVE .run-body (the 2-pane grid). Must span full width across
         * both center-pane AND ev-rail. Previously was inside center-pane. */}
        <RunSummary />

        {/* Center pane + right rail — canonical .run-body grid (L292 1fr 380px) */}
        <div
          data-canonical-section="run-body"
          className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px]"
        >
          {/* Center pane — canonical L297 padding:18px 16px + gap:16px */}
          <div className="center-pane flex min-w-0 flex-col gap-4 overflow-y-auto p-4 sm:p-5 lg:p-7">
            <SherlockBlock />
            {/* Cluster cards — 3 article.cluster siblings (high/med/mixed). */}
            <div data-canonical-section="cluster-list" className="flex flex-col gap-3">
              {F20_CLUSTERS.map((cluster) => (
                <ClusterCard key={cluster.num} cluster={cluster} />
              ))}
            </div>
            <ResultsTable />
          </div>

          {/* Right rail — Evidence
           * Day-20 R6 visual gate fix: was `hidden lg:block` (invisible on
           * mobile). Now stacks below center-pane on mobile (grid-cols-1)
           * and shows as right rail on lg+ (grid-cols-[1fr_380px]). */}
          <div className="lg:min-h-0">
            <EvRail />
          </div>
        </div>

        {/* Sticky action footer */}
        <ActionFooter />
      </div>
    </AdminShell>
  );
}

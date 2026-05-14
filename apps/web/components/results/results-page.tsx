// F20 Run Results — Pattern A scaffold (Hard Rule 17 verbatim refactor).
//
// Wraps AdminShell + RunSummaryBar + grid [center-pane][ev-rail].
// All content sourced from canned-data.ts (verbatim per Hard Rule 17).
// No invented strings.

'use client';

import { useState } from 'react';
import { AdminShell } from '@/components/admin/admin-shell';
import { RunSummaryBar } from './run-summary-bar';
import { SherlockRcaBlock } from './sherlock-rca-block';
import { ClusterCard } from './cluster-card';
import { ResultsTable } from './results-table';
import { EvidenceRailPane } from './evidence-rail-pane';
import {
  F20_CLUSTERS,
  F20_FAILURE_CLUSTERS_EYEBROW,
  F20_FAILURE_CLUSTERS_INTRO,
  F20_RUN_LEVEL_ACTIONS,
  F20_RUN_SUMMARY,
  F20_SELECTED_CASE,
} from './canned-data';

export function ResultsPage() {
  const [selectedCaseId, setSelectedCaseId] = useState<string>(F20_SELECTED_CASE.id);
  return (
    <AdminShell active="run-results" projectKeyLower="ret">
      <div
        className="flex min-h-0 flex-1 flex-col"
        style={{ background: 'var(--canvas)', color: 'var(--t1)' }}
      >
        <RunSummaryBar />

        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* CENTER — Sherlock RCA + clusters + results table */}
          <section
            aria-label="Results detail"
            className="flex min-w-0 flex-col gap-4 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5 lg:px-7 lg:py-6"
          >
            <SherlockRcaBlock />

            <div className="flex flex-col gap-1.5">
              <h2
                className="m-0 text-[11px] font-bold uppercase tracking-[0.12em]"
                style={{ color: 'var(--secondary)' }}
              >
                {F20_FAILURE_CLUSTERS_EYEBROW}
              </h2>
              <p className="m-0 text-[12px]" style={{ color: 'var(--t3)' }}>
                {F20_FAILURE_CLUSTERS_INTRO}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              {F20_CLUSTERS.map((c) => (
                <ClusterCard key={c.id} cluster={c} />
              ))}
            </div>

            <ResultsTable
              selectedCaseId={selectedCaseId}
              onCaseSelect={(id) => {
                setSelectedCaseId(id);
                console.info('pattern-a:deferred:f20:select-case', { caseId: id });
              }}
            />

            {/* Run-level sticky footer */}
            <div
              className="sticky bottom-0 -mx-4 mt-4 flex flex-wrap items-center gap-2 border-t px-4 py-3 sm:-mx-5 sm:px-5 lg:-mx-7 lg:px-7"
              style={{ background: 'var(--base)', borderColor: 'var(--border)' }}
            >
              <button
                type="button"
                onClick={() => console.info('pattern-a:deferred:f20:export')}
                className="inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-[12px] font-medium transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
                style={{
                  background: 'var(--raised)',
                  borderColor: 'var(--border)',
                  color: 'var(--t2)',
                }}
              >
                {F20_RUN_LEVEL_ACTIONS.exportLabel}
              </button>
              <button
                type="button"
                onClick={() => console.info('pattern-a:deferred:f20:re-run-failed')}
                className="inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-[12px] font-medium transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
                style={{
                  background: 'var(--warn-soft)',
                  borderColor: 'var(--warn-line)',
                  color: 'var(--warn)',
                }}
              >
                {F20_RUN_LEVEL_ACTIONS.rerunFailedLabel} ({F20_RUN_SUMMARY.totals.fail})
              </button>
              <button
                type="button"
                onClick={() => console.info('pattern-a:deferred:f20:share-link')}
                className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-[12px] font-semibold transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
                style={{
                  background: 'var(--primary)',
                  borderColor: 'var(--primary-line)',
                  color: 'var(--primary-ink)',
                }}
              >
                {F20_RUN_LEVEL_ACTIONS.shareLabel}
              </button>
            </div>
          </section>

          {/* EV-RAIL — right pane, lg+ */}
          <div className="hidden lg:block lg:min-h-0">
            <EvidenceRailPane />
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

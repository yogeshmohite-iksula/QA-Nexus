// F20 Run Results — Pattern A scaffold (M4 Day-18, PR #147).
//
// Mounts under AdminShell with active="run-results" + projectKeyLower="ret"
// per Hard Rule 14 shell parity + Hard Rule 15 v2-HTML canonical port.
//
// Layout per F20 v2 HTML L235-300:
//   run-shell { flex column }
//     ├─ RunSummaryBar          (sticky top, --base bg)
//     └─ run-body { grid }
//          ├─ center-pane       (Sherlock RCA + cluster cards + table)
//          └─ EvidenceRailPane  (right column on lg+)
//
// Pattern A — all action buttons emit console.info markers. Pattern B
// will swap to BE wires when run-results endpoints ship.

'use client';

import { useState } from 'react';
import { AdminShell } from '@/components/admin/admin-shell';
import { RunSummaryBar } from './run-summary-bar';
import { SherlockRcaBlock } from './sherlock-rca-block';
import { ClusterCard } from './cluster-card';
import { ResultsTable } from './results-table';
import { EvidenceRailPane } from './evidence-rail-pane';
import {
  EVIDENCE_RAIL_DEFAULT,
  RESULTS_CLUSTERS,
  RESULTS_META,
  RESULTS_SUITES,
  SHERLOCK_SUMMARY,
  type EvidenceRailContext,
} from './canned-data';

export function ResultsPage() {
  const [evContext, setEvContext] = useState<EvidenceRailContext>(EVIDENCE_RAIL_DEFAULT);

  function handleCaseSelect(caseId: string) {
    // Pattern A — when a case row is clicked, mock up an evidence
    // context derived from the selected case ID. Pattern B will fetch
    // GET /api/runs/:runId/cases/:caseId/evidence and the response
    // schema will replace this stub.
    if (caseId === evContext.selectedCaseId) return;
    let title = '';
    let suite = '';
    for (const s of RESULTS_SUITES) {
      const row = s.rows.find((r) => r.id === caseId);
      if (row) {
        title = row.title;
        suite = s.name;
        break;
      }
    }
    if (!title) return;
    setEvContext({
      ...EVIDENCE_RAIL_DEFAULT,
      selectedCaseId: caseId,
      selectedCaseTitle: title,
      selectedSuiteName: suite,
      evidence: EVIDENCE_RAIL_DEFAULT.evidence.map((kv) =>
        kv.label === 'Suite' ? { label: 'Suite', value: suite } : kv,
      ),
    });
    console.info('pattern-a:deferred:f20:select-case', { caseId });
  }

  return (
    <AdminShell active="run-results" projectKeyLower="ret">
      <div
        className="flex min-h-0 flex-1 flex-col"
        style={{ background: 'var(--canvas)', color: 'var(--t1)' }}
      >
        <RunSummaryBar meta={RESULTS_META} />

        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* CENTER — Sherlock RCA + clusters + results table */}
          <section
            aria-label="Results detail"
            className="flex min-w-0 flex-col gap-4 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5 lg:px-7 lg:py-6"
          >
            <SherlockRcaBlock summary={SHERLOCK_SUMMARY} />

            <div className="flex flex-col gap-1.5">
              <h2
                className="m-0 text-[11px] font-bold uppercase tracking-[0.12em]"
                style={{ color: 'var(--secondary)' }}
              >
                Failure clusters
              </h2>
              <p className="m-0 text-[12px]" style={{ color: 'var(--t3)' }}>
                3 distinct failure modes detected by Sherlock RCA. Open a defect from any cluster
                (Sherlock pre-fills the description).
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              {RESULTS_CLUSTERS.map((c) => (
                <ClusterCard key={c.id} cluster={c} />
              ))}
            </div>

            <ResultsTable
              suites={RESULTS_SUITES}
              onCaseSelect={handleCaseSelect}
              selectedCaseId={evContext.selectedCaseId}
            />

            {/* Run-level actions sticky bottom (canonical L580+) */}
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
                Export results (CSV)
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
                Re-run failed only ({RESULTS_META.totals.fail})
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
                Share this run
              </button>
            </div>
          </section>

          {/* EV-RAIL — right pane, desktop only */}
          <div className="hidden lg:block lg:min-h-0">
            <EvidenceRailPane context={evContext} />
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

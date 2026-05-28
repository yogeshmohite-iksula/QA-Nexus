// F23 Reports Studio — page composer (client).
// Source: handoff/F23/spec.json + canned-data.ts (Hard Rule 17).
//
// Wraps AdminShell (active="reports") per Hard Rule 14. Composes 6 regions:
//   page-head · region-1-configure · region-2-output-canvas ·
//   region-3-saved-and-scheduled · save-as-template-modal · prove-mode-overlays
//
// Pattern A scaffold (Day-25): all state local, all handlers fire console.info
// markers for future BE wiring. Day-26+ wires:
//   - run-report → POST /reports/run (returns kpis/chart/table)
//   - save-as-template → POST /reports/templates
//   - schedule → POST /reports/scheduled
//   - prove-mode snapshot → AdminShell mode toggle + freeze of result state

'use client';

import { useState } from 'react';
import { AdminShell } from '@/components/admin/admin-shell';
import { PageHead } from './PageHead';
import { RegionConfigure, type ReportKindKey, type CanvasState } from './RegionConfigure';
import { RegionOutputCanvas } from './RegionOutputCanvas';
import { RegionSavedScheduled } from './RegionSavedScheduled';
import { SaveAsTemplateModal } from './SaveAsTemplateModal';
import { ProveModeOverlays } from './ProveModeOverlays';
import { f23CannedData } from './canned-data';

interface Props {
  projectSlug: string;
}

export function F23ReportsStudio({ projectSlug }: Props) {
  const [activeKind, setActiveKind] = useState<ReportKindKey>('cycle');
  const [activeTimeRange, setActiveTimeRange] = useState<string>(f23CannedData.time_range_default);
  // Day-25 Step 5 fix: default to 'result' state so the diff-probe compares
  // like-for-like against the canonical v4 HTML (which renders the full
  // result-state mock: KPIs + chart + table + Region 3 saved/scheduled).
  // Production-mode UX TBD post-M5 — could revert to 'empty' once a real
  // run-report cycle exists.
  const [state, setState] = useState<CanvasState>('result');
  const [modalOpen, setModalOpen] = useState(false);
  // TODO Monday: wire to AdminShell mode prop (operate/review/prove)
  const [mode] = useState<'operate' | 'review' | 'prove'>('operate');

  function onKindChange(k: ReportKindKey) {
    setActiveKind(k);
    setState('empty');
    console.warn('pattern-a:f23:kind-change', { kind: k });
  }

  function onRun() {
    console.warn('pattern-a:f23:run', { activeKind, activeTimeRange });
    setState('loading');
    // Pattern A fake delay → result
    setTimeout(() => setState('result'), 600);
  }

  function onStarterClick(starter: string) {
    console.warn('pattern-a:f23:starter-click', { starter });
    onRun();
  }

  function onRetry() {
    console.warn('pattern-a:f23:retry');
    setState('empty');
  }

  return (
    <AdminShell active="reports" projectKeyLower={projectSlug}>
      <div
        className="flex min-h-0 w-full flex-1 flex-col overflow-hidden"
        style={{ background: 'var(--canvas)' }}
      >
        <PageHead projectSlug={projectSlug} />
        <RegionConfigure
          activeKind={activeKind}
          onKindChange={onKindChange}
          activeTimeRange={activeTimeRange}
          onTimeRangeChange={setActiveTimeRange}
          onRun={onRun}
          onSave={() => setModalOpen(true)}
          onSchedule={() => console.warn('pattern-a:f23:schedule')}
          onExport={() => console.warn('pattern-a:f23:export')}
        />
        <ProveModeOverlays mode={mode} />
        <RegionOutputCanvas
          state={state}
          activeKind={activeKind}
          onStarterClick={onStarterClick}
          onRetry={onRetry}
        />
        {state === 'result' && (
          <RegionSavedScheduled
            onSavedClick={(id) => console.warn('pattern-a:f23:saved-click', { id })}
            onNewBlank={() => console.warn('pattern-a:f23:new-blank')}
          />
        )}
      </div>
      <SaveAsTemplateModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={() => {
          console.warn('pattern-a:f23:modal-save');
          setModalOpen(false);
        }}
      />
    </AdminShell>
  );
}

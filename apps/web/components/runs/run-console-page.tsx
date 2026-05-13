// F19 Run Console — Pattern A page assembly (M4 Day-17 TASK 1).
//
// Implements F19 Run Console v2.html. Hard Rule 14 AdminShell wrap
// (active='runs-sessions'). Hard Rule 15 v2-HTML-faithful port.
//
// Pattern A: hardcoded run state, stub cases / steps / evidence.
// Day-18 swap point: connect to BE WebSocket Gateway for live
// /runs/:runId topic. Pattern A markers (`pattern-a:deferred:f19:*`)
// trace the swap points.
//
// Layout (v2 HTML L634-L968):
//   - Run metadata bar (title + chips + LIVE pill + Pause/Stop)
//   - Run meter (5-segment progress bar)
//   - 3-pane body:
//       Pane 1: Case list
//       Pane 2: Current case (Curator hint + Steps + Actions + Notes)
//       Pane 3: Evidence rail (tabbed evidence + Sherlock RCA preview)
//
// RWD per Hard Rule 12:
//   ≥1024px: 3-pane horizontal (300px / 1fr / 360px)
//   <1024px: panes stack vertically

'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin/admin-shell';
import { RunMetadataBar } from './run-metadata-bar';
import { CaseListPane } from './case-list-pane';
import { CurrentCasePane } from './current-case-pane';
import { EvidenceRailPane } from './evidence-rail-pane';
import {
  RUN_META,
  RUN_METER,
  CASE_ROWS,
  CASE_COUNTS,
  CURRENT_CASE,
  type EvTab,
} from './canned-data';

interface Props {
  projectSlug: string;
  runId: string;
}

export function RunConsolePage({ projectSlug, runId }: Props) {
  // Pattern A: log the WS subscription swap point on mount. Day-18
  // wires this to a real WebSocket client subscribing to the runs
  // topic via the BE Gateway.
  useEffect(() => {
    console.info('pattern-a:deferred:f19:websocket', { runId, projectSlug });
  }, [runId, projectSlug]);

  // Pattern A handlers — all fire console.info markers for Day-18
  // swap-point traceability. Local state changes ONLY (no network).

  const [, setNotes] = useState('');

  function onCaseClick(caseId: string) {
    console.info('pattern-a:deferred:f19:case-row-click', { caseId });
  }
  function onStepAction(action: 'pass' | 'fail' | 'block' | 'skip') {
    console.info(`pattern-a:deferred:f19:action-${action}`, {
      runId,
      caseId: CURRENT_CASE.id,
      stepNum: CURRENT_CASE.steps.find((s) => s.status === 'current')?.num,
    });
  }
  function onCuratorClick() {
    console.info('pattern-a:deferred:f19:curator-dedup', {
      caseId: CURRENT_CASE.id,
      targetId: CURRENT_CASE.curatorDedupTargetId,
    });
  }
  function onAttachEvidence() {
    console.info('pattern-a:deferred:f19:attach-evidence', { runId, caseId: CURRENT_CASE.id });
  }
  function onVoiceMemo() {
    console.info('pattern-a:deferred:f19:voice-memo', { runId, caseId: CURRENT_CASE.id });
  }
  function onPause() {
    console.info('pattern-a:deferred:f19:pause-run', { runId });
  }
  function onStop() {
    console.info('pattern-a:deferred:f19:stop-run', { runId });
  }
  function onTabChange(tab: EvTab['key']) {
    console.info('pattern-a:deferred:f19:tab-change', { tab });
  }
  function onOpenSherlock() {
    console.info('pattern-a:deferred:f19:sherlock', {
      caseId: CURRENT_CASE.id,
      failedCaseId: 'TC-RET-0342',
    });
  }
  function onNotesChange(value: string) {
    setNotes(value);
    // Pattern A: don't fire marker on every keystroke; Day-18 will
    // debounce + fire :notes-save on blur or Pass/Fail action.
  }

  return (
    <AdminShell active="runs-sessions">
      <div
        className="flex min-h-0 w-full flex-1 flex-col overflow-hidden"
        style={{ background: 'var(--canvas)' }}
      >
        <RunMetadataBar meta={RUN_META} meter={RUN_METER} onPause={onPause} onStop={onStop} />

        {/* 3-pane body:
            xl ≥1280  → 300 / 1fr / 360 (full)
            lg 1024-1279 → 280 / 1fr / 320 (slightly compressed)
            < 1024     → panes stack vertically */}
        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-[280px_minmax(0,1fr)_320px] lg:overflow-hidden xl:grid-cols-[300px_minmax(0,1fr)_360px]">
          <CaseListPane rows={CASE_ROWS} counts={CASE_COUNTS} onCaseClick={onCaseClick} />
          <CurrentCasePane
            current={CURRENT_CASE}
            onStepAction={onStepAction}
            onCuratorClick={onCuratorClick}
            onAttachEvidence={onAttachEvidence}
            onVoiceMemo={onVoiceMemo}
            onNotesChange={onNotesChange}
          />
          <EvidenceRailPane onTabChange={onTabChange} onOpenSherlock={onOpenSherlock} />
        </div>
      </div>
    </AdminShell>
  );
}

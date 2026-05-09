// F16b A1 Generate from Requirement — Pattern A page (M3 Day-14 TASK A2).
//
// Implements F16b A1 Generate from Requirement v2.html. Hard Rule 14
// AdminShell wrap (active='test-cases'). Hard Rule 15 v2-HTML-faithful
// port. Pattern A: source pre-selected to RET-247 + canned 5 cases
// dataset; Day-15 swap point flips to real Composer + Curator
// endpoints from BE+1.
//
// Modal triggers / nav source: F16a Test Case Method Chooser modal
// "AI Generated" card → router.push('/test-cases/generate?source=RET-247').
// On Pattern A, the `source` param is informational; the canned
// dataset is always RET-247.

'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { AdminShell } from '@/components/admin/admin-shell';
import { Stepper, type StepKey } from './stepper';
import { SourcePane } from './source-pane';
import { CaseListPane } from './case-list-pane';
import { ActivityPane } from './activity-pane';
import { CANNED_CASES, CANNED_ACTIVITY, type GeneratedCase } from './canned-data';

const ACTIVITY_STORAGE_KEY = 'qa-nexus.f16b.activity-closed';

export function GeneratePage() {
  return (
    <AdminShell active="test-cases">
      <Suspense fallback={null}>
        <GeneratePageContent />
      </Suspense>
    </AdminShell>
  );
}

function GeneratePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sourceFromUrl = searchParams?.get('source') ?? 'RET-247';

  const [cases, setCases] = useState<GeneratedCase[]>(() => CANNED_CASES);
  const [isGenerating, setIsGenerating] = useState(true);
  const [streamingElapsed, setStreamingElapsed] = useState(0.74);
  const [isActivityClosed, setIsActivityClosed] = useState(false);

  // Restore activity-pane closed state from localStorage on mount
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = window.localStorage.getItem(ACTIVITY_STORAGE_KEY);
        if (stored === 'closed') setIsActivityClosed(true);
      }
    } catch {
      /* localStorage unavailable — fail open */
    }
  }, []);

  // Streaming card elapsed-time tick (Pattern A simulation).
  // Pure UI ticker — no real backend call. Day-15 swap replaces this
  // with SSE token-by-token streaming.
  useEffect(() => {
    if (!isGenerating) return;
    const handle = window.setInterval(() => {
      setStreamingElapsed((prev) => {
        const next = prev + 0.1;
        return next > 9.99 ? 0.74 : next;
      });
    }, 100);
    return () => window.clearInterval(handle);
  }, [isGenerating]);

  const closeActivity = useCallback(() => {
    setIsActivityClosed(true);
    try {
      window.localStorage.setItem(ACTIVITY_STORAGE_KEY, 'closed');
    } catch {
      /* fail open */
    }
  }, []);

  const reopenActivity = useCallback(() => {
    setIsActivityClosed(false);
    try {
      window.localStorage.setItem(ACTIVITY_STORAGE_KEY, 'open');
    } catch {
      /* fail open */
    }
  }, []);

  // Pattern A handlers — log + mutate state locally. Day-15 these
  // become real API calls.
  const onGenerate = useCallback(() => {
    console.info('pattern-a:deferred:f16b:generate-start', { source: sourceFromUrl });
    setIsGenerating(true);
  }, [sourceFromUrl]);

  const onAcceptCase = useCallback((id: string) => {
    console.info('pattern-a:deferred:f16b:accept-case', { id });
    setCases((prev) => prev.map((c) => (c.id === id ? { ...c, state: 'accepted' as const } : c)));
  }, []);

  const onRejectCase = useCallback((id: string) => {
    console.info('pattern-a:deferred:f16b:reject-case', { id });
    setCases((prev) => prev.map((c) => (c.id === id ? { ...c, state: 'rejected' as const } : c)));
  }, []);

  const onEditCase = useCallback((id: string) => {
    console.info('pattern-a:deferred:f16b:edit-case', { id });
  }, []);

  const onRegenVariation = useCallback((id: string) => {
    console.info('pattern-a:deferred:f16b:regen-variation', { id });
  }, []);

  const onCuratorAction = useCallback(
    (id: string, action: 'merge' | 'keep-new' | 'keep-existing' | 'distinct') => {
      console.info('pattern-a:deferred:f16b:curator-action', { id, action });
      // For Pattern A: 'merge' / 'keep-existing' / 'distinct' clear the
      // dup callout; 'keep-new' leaves it (user dismissed Curator).
      setCases((prev) =>
        prev.map((c) => {
          if (c.id !== id) return c;
          if (action === 'keep-new') return c;
          return { ...c, curatorDup: undefined };
        }),
      );
    },
    [],
  );

  const onRegenAll = useCallback(() => {
    console.info('pattern-a:deferred:f16b:regen-all');
  }, []);

  const onAcceptAll = useCallback(() => {
    console.info('pattern-a:deferred:f16b:accept-all');
    setCases((prev) =>
      prev.map((c) =>
        c.state === 'drafted' || c.state === 'rejected' ? { ...c, state: 'accepted' as const } : c,
      ),
    );
  }, []);

  const onBack = useCallback(() => {
    console.info('pattern-a:deferred:f16b:back');
    router.push('/test-cases?new-test-case=1');
  }, [router]);

  const onSaveExit = useCallback(() => {
    console.info('pattern-a:deferred:f16b:save-exit');
    router.push('/test-cases');
  }, [router]);

  const currentStep: StepKey = isGenerating ? 'generate' : 'review';

  return (
    <div
      className="flex min-h-0 w-full flex-1 flex-col overflow-hidden"
      style={{ background: 'var(--canvas)' }}
    >
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="flex flex-none flex-wrap items-center gap-1.5 px-4 pt-3.5 text-[12.5px] sm:px-6"
        style={{ color: 'var(--text-tertiary)' }}
      >
        <a
          href="/home"
          className="hover:text-[var(--text-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
        >
          Home
        </a>
        <ChevronRight size={11} aria-hidden="true" />
        <span>Author</span>
        <ChevronRight size={11} aria-hidden="true" />
        <a
          href="/test-cases"
          className="hover:text-[var(--text-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
        >
          Test Cases
        </a>
        <ChevronRight size={11} aria-hidden="true" />
        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Generate</span>
      </nav>

      <Stepper current={currentStep} />

      {/* 3-col workspace — graceful collapse:
          xl ≥1280  → 340 / 1fr / 340 (full)
          lg 1024-1279 → 300 / 1fr (right collapses)
          < 1024     → 1fr stacked (mobile/tablet) */}
      <div
        className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:overflow-hidden"
        style={{ gridTemplateRows: 'minmax(0,1fr)' }}
      >
        <div
          className="grid min-h-0 grid-cols-1 lg:overflow-hidden"
          style={{
            gridTemplateColumns: 'minmax(0,1fr)',
          }}
        >
          <div
            className={[
              'grid min-h-0',
              isActivityClosed
                ? 'lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)]'
                : 'lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)_340px]',
            ].join(' ')}
          >
            <SourcePane isGenerating={isGenerating} onGenerate={onGenerate} />
            <CaseListPane
              cases={cases}
              isActivityClosed={isActivityClosed}
              onReopenActivity={reopenActivity}
              onRegenAll={onRegenAll}
              onAcceptAll={onAcceptAll}
              onAcceptCase={onAcceptCase}
              onRejectCase={onRejectCase}
              onEditCase={onEditCase}
              onRegenVariation={onRegenVariation}
              onCuratorAction={onCuratorAction}
              onBack={onBack}
              onSaveExit={onSaveExit}
              streamingElapsed={streamingElapsed}
            />
            {!isActivityClosed && <ActivityPane events={CANNED_ACTIVITY} onClose={closeActivity} />}
          </div>
        </div>
      </div>
    </div>
  );
}

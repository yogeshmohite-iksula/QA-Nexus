// F22 Test Case Library — placeholder (M3 Day-13 evening TASK 6).
//
// Minimal AdminShell-wrapped page that hosts the F16a Test Case Method
// Chooser modal. Full F22 layout (table + bulk actions + filters)
// lands later in M3.
//
// Modal trigger: URL search-param `?new-test-case=1` opens the chooser.
// "+ New test case" CTA pushes the param via router.push.

'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronRight, Plus } from 'lucide-react';
import { AdminShell } from '@/components/admin/admin-shell';
import { useActiveProject, useIsProjectsLoaded } from '@/lib/contexts/ProjectContext';
import { fetchTestCases } from '@/lib/api/test-cases-api';
import { TestCaseMethodChooserModal } from './test-case-method-chooser-modal';
import { BulkImportModal } from './bulk-import-modal';

export function TestCaseLibraryPlaceholder() {
  return (
    <AdminShell active="test-cases">
      <Suspense fallback={null}>
        <TestCaseLibraryContent />
      </Suspense>
    </AdminShell>
  );
}

function TestCaseLibraryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isChooserOpen = (searchParams?.get('new-test-case') ?? null) === '1';
  const isBulkImportOpen = (searchParams?.get('bulk-import') ?? null) === '1';

  // Zero-canned sweep (2026-06-19 ~22:30 IST): gate the project-scoped
  // fetch on `isProjectsLoaded` (same fix class as F14 requirements). Stale
  // FE seed UUID would 404 otherwise; we now wait for the real UUIDs.
  const project = useActiveProject();
  const isProjectsLoaded = useIsProjectsLoaded();
  const [liveTotal, setLiveTotal] = useState<number | null>(null);
  useEffect(() => {
    if (!isProjectsLoaded) return;
    let alive = true;
    void fetchTestCases(project.id, 1, 1).then((res) => {
      if (!alive) return;
      setLiveTotal(res ? res.pagination.total : 0);
    });
    return () => {
      alive = false;
    };
  }, [isProjectsLoaded, project.id]);

  const openChooser = useCallback(() => {
    console.info('pattern-a:deferred:test-cases:new-test-case');
    router.push('/test-cases?new-test-case=1');
  }, [router]);

  const closeChooser = useCallback(() => {
    router.replace('/test-cases');
  }, [router]);

  const closeBulkImport = useCallback(() => {
    router.replace('/test-cases');
  }, [router]);

  return (
    <main className="mx-auto flex w-full max-w-screen-2xl flex-col gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-6 lg:px-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5 text-[12.5px] text-[var(--text-tertiary)]">
          <li>
            <a
              href="/home"
              className="hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
            >
              Home
            </a>
          </li>
          <li aria-hidden="true">
            <ChevronRight size={11} />
          </li>
          <li>Plan</li>
          <li aria-hidden="true">
            <ChevronRight size={11} />
          </li>
          <li className="text-[var(--text-secondary)]">Test Cases</li>
        </ol>
      </nav>

      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-[22px] font-bold leading-[28px] tracking-[-0.01em] text-[var(--text-primary)] sm:text-[26px] sm:leading-[32px]">
            Test Cases
          </h1>
          <p className="max-w-[640px] text-[13px] leading-[20px] text-[var(--text-tertiary)] sm:text-[14px]">
            <span className="font-semibold text-[var(--text-secondary)]">
              {liveTotal !== null
                ? `${liveTotal.toLocaleString('en-US')} ${liveTotal === 1 ? 'case' : 'cases'} in ${project.name}.`
                : '1,284 cases · 38 suites · last import 2 hours ago.'}
            </span>{' '}
            Authoring methods: AI Generated · Bulk Import · Manual.
          </p>
        </div>
        <button
          type="button"
          onClick={openChooser}
          className="inline-flex h-9 min-h-[44px] items-center gap-1.5 rounded-md px-3 text-[13px] font-semibold transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] sm:min-h-0"
          style={{ background: 'var(--primary)', color: 'var(--primary-ink)' }}
        >
          <Plus size={14} aria-hidden="true" />
          New test case
        </button>
      </header>

      {/* Placeholder body — full F22 layout (table + filters + bulk
          actions) lands later in M3. */}
      <section
        className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center"
        style={{
          background: 'var(--base)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-tertiary)',
        }}
      >
        <p className="font-display text-[15px] font-semibold text-[var(--text-secondary)]">
          F22 Test Case Library — full table lands later in M3.
        </p>
        <p className="text-[12.5px] leading-[18px]">
          Click <span className="font-semibold text-[var(--text-primary)]">+ New test case</span>{' '}
          above to open the F16a method chooser.
        </p>
      </section>

      <TestCaseMethodChooserModal open={isChooserOpen} onClose={closeChooser} />
      <BulkImportModal open={isBulkImportOpen} onClose={closeBulkImport} />
    </main>
  );
}

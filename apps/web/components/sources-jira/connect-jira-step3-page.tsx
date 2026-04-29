// F11c Source Connect Jira · Step 3 — Verify.
//
// Implements `PM1_UI_v2/frame  html view/F11c Source Connect Jira · Step 3 Verify.html`.
// Final wizard step: confirms the connection, previews 5 sample issues
// fetched via the Jira REST API, surfaces 4 integration-health metrics,
// and finishes the setup with a 142-issue backfill (Pattern A — deferred).
// Mounted at `/projects/[slug]/sources/jira/step-3`.
//
// Pattern A enforcement (PM1_PRD §F11c) — 7 deferred markers:
// - Mount → `pattern-a:deferred:jira-step3-load`
//     { projectSlug, sampleCount, totalIssues }.
// - Refresh test → `pattern-a:deferred:jira-step3-refresh-test`.
// - Issue link click → `pattern-a:deferred:jira-step3-issue-preview` { jiraId }.
// - Sort change → `pattern-a:deferred:jira-step3-sort-change` { sort }.
// - Finish setup → `pattern-a:deferred:jira-step3-connect`
//     { projectSlug, jiraKey, issuesToImport } + route to /projects/{slug}.
// - Back → `pattern-a:deferred:jira-step3-back` + route to /step-2.
// - Cancel → `pattern-a:deferred:jira-step3-cancel` + route to /projects.
// - ZERO fetch / useMutation / axios.
//
// Hex audit: like F11b, the locked source uses 3 Atlassian-brand swatch
// literals for the Story / Bug / Task issue-type dots (none on the
// CLAUDE.md whitelist). Swapped for the same whitelisted equivalents
// used in F11b — Story = info-blue, Bug = fail-red, Task = pass-green.

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ConnectJiraShell } from './connect-jira-shell';
import { ConnectJiraStepper } from './connect-jira-stepper';

interface ConnectJiraStep3PageProps {
  projectSlug: string;
}

// ---------------------------------------------------------------------------
// Stub fixtures — Pattern A.
//
// These represent what the OAuth-connected iksula.atlassian.net would
// return on a sample-fetch call. They are NOT seed user/project data.
//
// TODO: replace with useJiraIntegration().sampleIssues + .health
// once seed-centralization (Day-4 P1 followup i) lands.
// ---------------------------------------------------------------------------

// TODO: replace with useCurrentProject() once seed-centralization lands
const TODO_PROJECT_DISPLAY: Record<string, string> = {
  'iksula-returns': 'Iksula Returns',
  ret: 'Iksula Returns',
};
// TODO: replace with useCurrentUser() once seed-centralization lands
const TODO_CURRENT_USER = { initials: 'YM', email: 'yogesh.mohite@iksula.com' } as const;

const DEFAULT_JIRA_INSTANCE = 'iksula.atlassian.net';
const TOTAL_VISIBLE_PROJECTS = 12;
const TOTAL_ISSUES_TO_IMPORT = 142;

function projectNameFromSlug(slug: string): string {
  const cached = TODO_PROJECT_DISPLAY[slug.toLowerCase()];
  if (cached) return cached;
  return slug
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ');
}

// Whitelisted issue-type dot palette — identical mapping to F11b.
type IssueTypeTone = 'story' | 'bug' | 'task';
const ISSUE_TYPE_DOT: Record<IssueTypeTone, string> = {
  story: '#60A5FA',
  bug: '#F87171',
  task: '#34D399',
};

interface SampleIssue {
  jiraId: string;
  type: 'Story' | 'Bug' | 'Task';
  tone: IssueTypeTone;
  title: string;
  qaEntity: 'Requirement' | 'Defect' | 'Test Case';
  qaTone: 'teal' | 'fail';
  valid: boolean;
}

const SAMPLE_ISSUES: SampleIssue[] = [
  {
    jiraId: 'RET-142',
    type: 'Story',
    tone: 'story',
    title: 'Implement refund API for failed orders',
    qaEntity: 'Requirement',
    qaTone: 'teal',
    valid: true,
  },
  {
    jiraId: 'RET-141',
    type: 'Bug',
    tone: 'bug',
    title: 'Return tracking page shows wrong status',
    qaEntity: 'Defect',
    qaTone: 'fail',
    valid: true,
  },
  {
    jiraId: 'RET-140',
    type: 'Bug',
    tone: 'bug',
    title: 'Refund processed twice for order #A8891',
    qaEntity: 'Defect',
    qaTone: 'fail',
    valid: true,
  },
  {
    jiraId: 'RET-139',
    type: 'Story',
    tone: 'story',
    title: 'Return policy UI copy needs legal review',
    qaEntity: 'Requirement',
    qaTone: 'teal',
    valid: true,
  },
  {
    jiraId: 'RET-138',
    type: 'Task',
    tone: 'task',
    title: 'Test: refund webhook retry logic',
    qaEntity: 'Test Case',
    qaTone: 'teal',
    valid: true,
  },
];

interface HealthCard {
  label: string;
  status: string;
  meta: string;
  tone: 'pass';
}

const HEALTH_CARDS: HealthCard[] = [
  { label: 'Connection', status: 'Healthy', meta: '312ms · iksula.atlassian.net', tone: 'pass' },
  {
    label: 'Webhook',
    status: 'Ready',
    meta: 'Registers on save · 2-min fallback poll',
    tone: 'pass',
  },
  {
    label: 'Field Mapping',
    status: '8 / 8 valid',
    meta: '3 auto-mapped · 5 standard',
    tone: 'pass',
  },
  {
    label: 'Sync Mode',
    status: 'Bidirectional',
    meta: 'QA Nexus ↔ Jira · comments mirrored',
    tone: 'pass',
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function ConnectJiraStep3Page({ projectSlug }: ConnectJiraStep3PageProps) {
  const router = useRouter();
  const projectName = projectNameFromSlug(projectSlug);
  const [sortNewest, setSortNewest] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    console.info('pattern-a:deferred:jira-step3-load', {
      projectSlug,
      sampleCount: SAMPLE_ISSUES.length,
      totalIssues: TOTAL_ISSUES_TO_IMPORT,
      jiraInstance: DEFAULT_JIRA_INSTANCE,
    });
  }, [projectSlug]);

  function onRefreshTest() {
    console.info('pattern-a:deferred:jira-step3-refresh-test', { projectSlug });
    setRefreshing(true);
    window.setTimeout(() => setRefreshing(false), 900);
  }

  function onIssuePreview(jiraId: string) {
    console.info('pattern-a:deferred:jira-step3-issue-preview', { jiraId });
  }

  function onSortToggle() {
    setSortNewest((prev) => {
      const next = !prev;
      console.info('pattern-a:deferred:jira-step3-sort-change', {
        sort: next ? 'newest' : 'oldest',
      });
      return next;
    });
  }

  function onConnect() {
    console.info('pattern-a:deferred:jira-step3-connect', {
      projectSlug,
      jiraInstance: DEFAULT_JIRA_INSTANCE,
      issuesToImport: TOTAL_ISSUES_TO_IMPORT,
      sampleValidated: SAMPLE_ISSUES.filter((i) => i.valid).length,
    });
    router.push(`/projects/${projectSlug}`);
  }

  function onBack() {
    console.info('pattern-a:deferred:jira-step3-back', { projectSlug });
    router.push(`/projects/${projectSlug}/sources/jira/step-2`);
  }

  function onCancel() {
    console.info('pattern-a:deferred:jira-step3-cancel', { projectSlug });
    router.push('/projects');
  }

  const sortedIssues = sortNewest ? SAMPLE_ISSUES : [...SAMPLE_ISSUES].reverse();
  const validatedCount = SAMPLE_ISSUES.filter((i) => i.valid).length;

  return (
    <ConnectJiraShell
      projectName={projectName}
      projectSlug={projectSlug}
      userInitials={TODO_CURRENT_USER.initials}
    >
      <main className="mx-auto w-full max-w-[1120px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <PageHeader projectName={projectName} />

        <div className="mt-6 sm:mt-8">
          <ConnectJiraStepper current={3} />
        </div>

        <div className="mt-8 grid gap-6 lg:mt-10 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-6 xl:gap-8">
          <div className="flex flex-col gap-3">
            <SuccessBanner
              count={validatedCount}
              total={SAMPLE_ISSUES.length}
              jiraInstance={DEFAULT_JIRA_INSTANCE}
              refreshing={refreshing}
              onRefresh={onRefreshTest}
            />
            <SampleIssuesSection
              issues={sortedIssues}
              total={TOTAL_ISSUES_TO_IMPORT}
              sortNewest={sortNewest}
              onSortToggle={onSortToggle}
              onIssuePreview={onIssuePreview}
            />
            <IntegrationHealthSection cards={HEALTH_CARDS} />
            <OnSaveStrip totalIssues={TOTAL_ISSUES_TO_IMPORT} />
          </div>
          <ActivitySidebar
            jiraInstance={DEFAULT_JIRA_INSTANCE}
            totalVisible={TOTAL_VISIBLE_PROJECTS}
            sampleValidated={validatedCount}
            sampleTotal={SAMPLE_ISSUES.length}
            issuesToImport={TOTAL_ISSUES_TO_IMPORT}
            userEmail={TODO_CURRENT_USER.email}
          />
        </div>

        <StepFooter
          validatedCount={validatedCount}
          totalIssues={TOTAL_ISSUES_TO_IMPORT}
          onBack={onBack}
          onCancel={onCancel}
          onConnect={onConnect}
        />
      </main>
    </ConnectJiraShell>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PageHeader({ projectName }: { projectName: string }) {
  return (
    <header className="flex flex-col gap-2">
      <h1 className="font-display text-[20px] font-medium leading-[28px] text-[var(--text-primary)] sm:text-[22px] lg:text-[24px]">
        Connect Jira to <span className="font-semibold">{projectName}</span>
      </h1>
      <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
        Step 3 of 3 · Verify connection
      </p>
    </header>
  );
}

function SuccessBanner({
  count,
  total,
  jiraInstance,
  refreshing,
  onRefresh,
}: {
  count: number;
  total: number;
  jiraInstance: string;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  return (
    <div
      role="status"
      className="bg-[var(--pass)]/10 flex flex-wrap items-center gap-3 rounded-xl border border-[var(--pass)] px-4 py-3 sm:flex-nowrap sm:px-5"
    >
      <span
        aria-hidden="true"
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--pass)] text-[var(--primary-ink)]"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M3.5 8l3 3 6-6"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="font-display text-[14px] font-bold leading-[20px] text-[var(--pass)] sm:text-[15px] sm:leading-[22px]">
          ✓ All {count} sample {count === 1 ? 'issue' : 'issues'} mapped successfully
        </p>
        <p className="mt-0.5 text-[12px] leading-[18px] text-[var(--text-secondary)]">
          Fetched from <span className="font-mono text-[var(--text-primary)]">{jiraInstance}</span>{' '}
          · Test took{' '}
          <span className="font-mono font-semibold text-[var(--text-primary)]">1.8s</span> · Field
          mapping validated{count !== total ? ` (${count} of ${total})` : ''}
        </p>
      </div>
      <button
        type="button"
        onClick={onRefresh}
        disabled={refreshing}
        aria-busy={refreshing}
        className="inline-flex shrink-0 items-center gap-1 text-[12px] text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] disabled:cursor-wait disabled:opacity-70"
      >
        {refreshing ? 'Refreshing…' : 'Refresh test'}
        <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M14 3v4h-4M2 13v-4h4M3 8a5 5 0 0 1 8.5-3.5L14 7M13 8a5 5 0 0 1-8.5 3.5L2 9"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}

function SampleIssuesSection({
  issues,
  total,
  sortNewest,
  onSortToggle,
  onIssuePreview,
}: {
  issues: SampleIssue[];
  total: number;
  sortNewest: boolean;
  onSortToggle: () => void;
  onIssuePreview: (id: string) => void;
}) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-display text-[14px] font-bold text-[var(--text-primary)]">
            Sample Issues from RET
          </h2>
          <p className="text-[11.5px] text-[var(--text-tertiary)]">
            Most recent {issues.length} of{' '}
            <span className="font-mono text-[var(--text-secondary)]">{total}</span> · fetched via
            Jira REST API
          </p>
        </div>
        <button
          type="button"
          onClick={onSortToggle}
          className="inline-flex items-center gap-1 text-[11.5px] text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
        >
          Sort: {sortNewest ? 'Newest first' : 'Oldest first'}
          <svg
            width="10"
            height="10"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
            className={sortNewest ? '' : 'rotate-180'}
          >
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--raised)]">
        <div
          className="hidden items-center gap-3 bg-[var(--overlay)] px-3 py-2 lg:grid"
          style={{ gridTemplateColumns: '90px 1fr 200px 100px' }}
        >
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
            Issue
          </span>
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
            Title
          </span>
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
            Mapped to
          </span>
          <span className="text-right font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
            Validation
          </span>
        </div>

        <ul className="flex flex-col">
          {issues.map((issue, idx) => (
            <li
              key={issue.jiraId}
              className={[
                'border-b border-[var(--border-subtle)] last:border-b-0',
                idx % 2 === 0 ? 'bg-[var(--base)]' : 'bg-[var(--raised)]',
              ].join(' ')}
            >
              <div
                className="flex flex-col gap-1.5 px-3 py-2.5 lg:grid lg:items-center lg:gap-3 lg:py-3"
                style={{ gridTemplateColumns: '90px 1fr 200px 100px' }}
              >
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="inline-block h-2.5 w-2.5 shrink-0 rounded-[2px]"
                    style={{ background: ISSUE_TYPE_DOT[issue.tone] }}
                  />
                  <button
                    type="button"
                    onClick={() => onIssuePreview(issue.jiraId)}
                    className="font-mono text-[12px] font-semibold text-[var(--primary)] transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
                  >
                    {issue.jiraId}
                  </button>
                </span>
                <p className="truncate text-[13px] text-[var(--text-primary)]">{issue.title}</p>
                <span className="flex items-center gap-2">
                  <span className="text-[11.5px] text-[var(--text-tertiary)]">{issue.type}</span>
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 16 16"
                    fill="none"
                    className="text-[var(--text-tertiary)]"
                    aria-hidden="true"
                  >
                    <path
                      d="M3 8h10M9 4l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                  <ValidationChip tone={issue.qaTone}>{issue.qaEntity}</ValidationChip>
                </span>
                <span className="flex items-center gap-1 lg:justify-end">
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 16 16"
                    fill="none"
                    className="text-[var(--pass)]"
                    aria-hidden="true"
                  >
                    <path
                      d="M3 8.5l3 3 7-7"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="text-[12px] font-medium text-[var(--pass)]">Valid</span>
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function ValidationChip({ tone, children }: { tone: 'teal' | 'fail'; children: React.ReactNode }) {
  const cls =
    tone === 'teal'
      ? 'border-[var(--primary)]/35 bg-[var(--primary)]/15 text-[var(--primary)]'
      : 'border-[var(--fail)]/30 bg-[var(--fail)]/15 text-[var(--fail)]';
  return (
    <span
      className={`inline-flex h-[22px] items-center rounded-full border px-2.5 text-[11px] font-medium ${cls}`}
    >
      {children}
    </span>
  );
}

function IntegrationHealthSection({ cards }: { cards: HealthCard[] }) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-[14px] font-bold text-[var(--text-primary)]">
          Integration Health
        </h2>
        <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--pass)]">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M3 8.5l3 3 7-7"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          All systems ready
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <article
            key={c.label}
            className="flex flex-col gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--raised)] px-3 py-2.5"
          >
            <span className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--pass)]"
              />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                {c.label}
              </span>
            </span>
            <span className="font-display text-[15px] font-semibold leading-[22px] text-[var(--text-primary)] sm:text-[16px]">
              {c.status}
            </span>
            <span className="font-mono text-[10.5px] text-[var(--text-tertiary)]">{c.meta}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function OnSaveStrip({ totalIssues }: { totalIssues: number }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--overlay)] px-3.5 py-3 text-[12px] leading-[18px] text-[var(--text-secondary)]">
      <svg
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        className="mt-[2px] shrink-0 text-[var(--text-tertiary)]"
        aria-hidden="true"
      >
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
        <path
          d="M8 5.5v3M8 10.5v.3"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      </svg>
      <p>
        On finish: QA Nexus backfills{' '}
        <span className="font-semibold text-[var(--text-primary)]">{totalIssues} issues</span> in{' '}
        <span className="font-mono text-[var(--text-primary)]">~2 min</span>, registers the webhook
        listener, and begins 2-way sync. Activity appears in{' '}
        <span className="text-[var(--text-secondary)]">Settings → Integrations → Health</span>.
      </p>
    </div>
  );
}

function ActivitySidebar({
  jiraInstance,
  totalVisible,
  sampleValidated,
  sampleTotal,
  issuesToImport,
  userEmail,
}: {
  jiraInstance: string;
  totalVisible: number;
  sampleValidated: number;
  sampleTotal: number;
  issuesToImport: number;
  userEmail: string;
}) {
  return (
    <aside
      aria-labelledby="activity-head"
      className="flex flex-col gap-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--overlay)] px-4 py-4 lg:px-5 lg:py-5"
    >
      <h2
        id="activity-head"
        className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]"
      >
        Integration history
      </h2>

      <ol className="relative flex flex-col gap-3 pl-5">
        <span
          aria-hidden="true"
          className="absolute bottom-1.5 left-[5px] top-1.5 w-px bg-[var(--border-subtle)]"
        />

        <ActivityEvent
          dotTone="pass"
          time="09:41 AM"
          body={
            <>
              OAuth authorized —{' '}
              <span className="font-mono text-[var(--text-primary)]">{userEmail}</span>
            </>
          }
        />
        <ActivityEvent
          dotTone="pass"
          time="09:42 AM"
          body={
            <>
              Workspace detected —{' '}
              <span className="font-mono text-[var(--text-primary)]">{jiraInstance}</span>{' '}
              <span className="text-[var(--text-tertiary)]">({totalVisible} projects)</span>
            </>
          }
        />
        <ActivityEvent
          dotTone="pass"
          time="09:43 AM"
          body={
            <>
              Mapping saved — <span className="font-mono text-[var(--text-primary)]">RET</span> →{' '}
              Iksula Returns · 5 types, 4 priorities, 3 custom fields
            </>
          }
        />
        <ActivityEvent
          dotTone="pass"
          time="09:44 AM"
          body={
            <>
              Test fetch successful —{' '}
              <span className="font-mono text-[var(--text-primary)]">
                {sampleValidated} / {sampleTotal}
              </span>{' '}
              sample issues validated
            </>
          }
        />
        <ActivityEvent
          dotTone="current"
          time="09:44 AM"
          body={
            <span className="font-medium text-[var(--text-primary)]">Verifying connection…</span>
          }
        />
        <ActivityEvent
          dotTone="pending"
          time="—"
          body={
            <span className="text-[var(--text-tertiary)]">
              Next: Import <span className="font-mono">{issuesToImport}</span> issues + register
              webhook
            </span>
          }
        />
      </ol>

      <div className="border-t border-[var(--border-subtle)] pt-3">
        <h3 className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
          Webhook health
        </h3>
        <span className="border-[var(--pass)]/30 bg-[var(--pass)]/15 inline-flex h-6 items-center gap-1.5 rounded-full border px-2 font-mono text-[10.5px] text-[var(--pass)]">
          <span
            aria-hidden="true"
            className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--pass)]"
          />
          Ready · listener registers on save
        </span>
      </div>
    </aside>
  );
}

function ActivityEvent({
  dotTone,
  time,
  body,
}: {
  dotTone: 'pass' | 'current' | 'pending';
  time: string;
  body: React.ReactNode;
}) {
  const dotClass = {
    pass: 'bg-[var(--pass)] ring-1 ring-[var(--pass)]',
    current: 'bg-[var(--secondary)] ring-1 ring-[var(--secondary)]',
    pending: 'bg-[var(--raised)] ring-2 ring-[var(--border-strong)]',
  }[dotTone];
  return (
    <li className="relative">
      <span
        aria-hidden="true"
        className={`absolute -left-[18px] top-[5px] inline-block h-2.5 w-2.5 rounded-full border-2 border-[var(--overlay)] ${dotClass}`}
      />
      <span className="font-mono text-[10.5px] text-[var(--text-tertiary)]">{time}</span>
      <p className="mt-0.5 text-[12.5px] leading-[16px] text-[var(--text-secondary)]">{body}</p>
    </li>
  );
}

function StepFooter({
  validatedCount,
  totalIssues,
  onBack,
  onCancel,
  onConnect,
}: {
  validatedCount: number;
  totalIssues: number;
  onBack: () => void;
  onCancel: () => void;
  onConnect: () => void;
}) {
  return (
    <div className="mt-8 flex flex-col gap-4 border-t border-[var(--border-subtle)] pt-5 sm:mt-10 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
          Step 3 of 3 · Verify
        </p>
        <p className="mt-1 text-[12.5px] leading-[18px] text-[var(--text-secondary)]">
          Connection verified ·{' '}
          <span className="font-mono font-semibold text-[var(--text-primary)]">
            {validatedCount} / 5 issues validated
          </span>{' '}
          ·{' '}
          <span className="font-mono font-semibold text-[var(--text-primary)]">
            {totalIssues} issues ready to import
          </span>
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-10 items-center gap-2 rounded-md px-3 text-[13px] font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M13 8H3M7 4L3 8l4 4"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to Map
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-10 items-center justify-center px-3 text-[13px] font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConnect}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-[var(--primary)] px-5 text-[13px] font-semibold text-[var(--primary-ink)] shadow-[0_0_24px_rgba(45,212,191,0.18)] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
        >
          Finish setup · Import {totalIssues} issues
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M3 8h10M9 4l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

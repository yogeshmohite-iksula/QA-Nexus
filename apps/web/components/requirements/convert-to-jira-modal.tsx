// F14m3 Convert to Jira Story Modal — overlay rendered on top of F14.
// Locked source: PM1_UI_v2/frames - claude code build (PM1 v2.6-v2.8)/
//   F14m3 Convert to Jira Story Modal.html
// Mounted by /requirements/<key>/convert-to-jira routes.
//
// Pattern A enforcement (PM1_PRD §4 Requirements lifecycle, Jira sync
// lands in PM3) — 5 deferred markers:
// - Mount → `pattern-a:deferred:convert-jira-open`
//     { reqKey, projectId, workspaceId }.
// - Field change → `pattern-a:deferred:convert-jira-field-change`
//     { field } (project / issueType / sprint / storyPoints).
// - Submit → `pattern-a:deferred:convert-jira-submit`
//     { reqKey, targetProject, issueType, sprint, storyPoints }.
// - Cancel + Esc → `pattern-a:deferred:convert-jira-cancel`
//     { trigger: 'esc' | 'button' | 'backdrop' }.
// - Validation error → `pattern-a:deferred:convert-jira-validation-error`
//     { fields }.
// - ZERO fetch / useMutation / axios. Real
//   /api/requirements/:key/convert-to-jira POST wires in PM3 (Jira
//   2-way sync milestone — NOT M2). The simulated 800 ms delay +
//   mock RET-### key generation prove out the UX surface; the swap-
//   in happens in PM3 backlog item TBD.

'use client';

import { useEffect, useId, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useCurrentUser } from '@/lib/contexts/CurrentUserContext';
import { useActiveProject } from '@/lib/contexts/ProjectContext';
import { REQUIREMENTS, requirementPriorityLabel } from '@/lib/data/requirements';

// 5 Iksula Jira projects per CLAUDE.md "Other Iksula projects"
// background context. Keys + names match the data canon.
interface JiraProjectOption {
  key: string;
  name: string;
}
const JIRA_PROJECT_OPTIONS: JiraProjectOption[] = [
  { key: 'RET', name: 'Iksula Returns' },
  { key: 'CART', name: 'Iksula Commerce' },
  { key: 'PAY', name: 'Iksula Payments' },
  { key: 'AUTH', name: 'Iksula Mobile App' },
  { key: 'OPS', name: 'Iksula Internal Ops' },
];

const ISSUE_TYPE_OPTIONS = ['Story', 'Task', 'Epic'] as const;
type IssueType = (typeof ISSUE_TYPE_OPTIONS)[number];

const SPRINT_OPTIONS = ['No sprint', 'Sprint 41', 'Sprint 42', 'Sprint 43'] as const;
type SprintChoice = (typeof SPRINT_OPTIONS)[number];

interface ConvertToJiraModalProps {
  /** Routing hook: invoked by Cancel / Esc / backdrop / successful save. */
  onClose: () => void;
  /** Requirement to convert. Defaults to RET-001 when used standalone. */
  reqKey?: string;
}

export function ConvertToJiraModal({ onClose, reqKey = 'RET-001' }: ConvertToJiraModalProps) {
  const titleId = useId();
  const me = useCurrentUser();
  const project = useActiveProject();

  const parentReq = REQUIREMENTS.find((r) => r.key.toLowerCase() === reqKey.toLowerCase());

  // Form state — Pattern A: pure local state, no RHF needed (4 fields,
  // simple shape; would over-engineer to add Zod + react-hook-form).
  const [targetProject, setTargetProject] = useState<string>('RET');
  const [issueType, setIssueType] = useState<IssueType>('Story');
  const [sprint, setSprint] = useState<SprintChoice>(
    (parentReq?.sprint as SprintChoice) ?? 'Sprint 42',
  );
  const [storyPoints, setStoryPoints] = useState<string>('5');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // PATTERN-A: open convert-jira modal deferred until PM3 - Jira 2-way sync milestone
    console.info('pattern-a:deferred:convert-jira-open', {
      reqKey,
      projectId: project.id,
      workspaceId: me.workspaceId,
    });

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        // PATTERN-A: cancel convert-jira modal deferred until PM3 - Jira sync milestone
        console.info('pattern-a:deferred:convert-jira-cancel', { trigger: 'esc' });
        onClose();
      }
    }
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [reqKey, project.id, me.workspaceId, onClose]);

  function handleCancel(trigger: 'button' | 'backdrop' = 'button') {
    // PATTERN-A: cancel convert-jira modal deferred until PM3 - Jira sync milestone
    console.info('pattern-a:deferred:convert-jira-cancel', { trigger });
    onClose();
  }

  function fireFieldChange(field: 'project' | 'issueType' | 'sprint' | 'storyPoints') {
    // PATTERN-A: change convert-jira field deferred until PM3 - client-only form mutation
    console.info('pattern-a:deferred:convert-jira-field-change', { field });
  }

  // Compute validation: storyPoints must be a positive integer ≤ 100.
  const spNum = Number(storyPoints);
  const spValid = Number.isInteger(spNum) && spNum > 0 && spNum <= 100;
  const formValid = spValid && targetProject !== '';

  async function handleConvert() {
    if (isSubmitting) return; // double-submit guard
    if (!formValid) {
      // PATTERN-A: convert-jira validation error deferred until PM3 - client-only validation
      console.info('pattern-a:deferred:convert-jira-validation-error', {
        fields: spValid ? [] : ['storyPoints'],
      });
      toast.error('Story points must be a positive integer between 1 and 100', {
        description: 'Pick a valid estimate before converting.',
      });
      return;
    }

    setIsSubmitting(true);
    // PATTERN-A: convert to jira deferred until PM3 - real /api/requirements/:key/convert-to-jira POST
    console.info('pattern-a:deferred:convert-jira-submit', {
      reqKey,
      targetProject,
      issueType,
      sprint,
      storyPoints: spNum,
    });

    // 800 ms simulated Jira API call — swap-out for real
    // Atlassian POST in PM3.
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Mock new Jira key — increment a deterministic offset on the
    // target project key. Real Jira returns the actual issued key
    // in PM3.
    const mockNewIssueKey = `${targetProject}-${Math.floor(Math.random() * 200) + 200}`;

    toast.success(`Created ${mockNewIssueKey} in Jira`, {
      description: `Linked to ${reqKey} · real Jira POST lands in PM3 (Pattern A — toast + delay only).`,
    });

    setIsSubmitting(false);
    onClose();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-stretch justify-center md:items-start md:p-6"
    >
      <button
        type="button"
        aria-label="Close convert-to-jira modal"
        onClick={() => handleCancel('backdrop')}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <div className="relative z-10 flex w-full max-w-[720px] flex-col overflow-hidden bg-[var(--base)] shadow-2xl md:mt-12 md:max-h-[calc(100vh-6rem)] md:rounded-xl md:border md:border-[var(--border-subtle)]">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[var(--border-subtle)] px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-1">
            <h2
              id={titleId}
              className="font-display text-[18px] font-bold leading-[24px] tracking-[-0.01em] text-[var(--text-primary)] sm:text-[20px] sm:leading-[26px]"
            >
              Convert to Jira Story
            </h2>
            <p className="text-[12.5px] leading-[18px] text-[var(--text-secondary)]">
              {parentReq ? (
                <>
                  <span className="font-mono font-semibold text-[var(--text-primary)]">
                    {parentReq.key}
                  </span>{' '}
                  · {parentReq.title}
                </>
              ) : (
                <>Converting {reqKey}</>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleCancel('button')}
            aria-label="Close"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[var(--text-tertiary)] transition-colors hover:bg-[var(--raised)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path
                d="M3.5 3.5l9 9M12.5 3.5l-9 9"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Target Jira project */}
            <FormField id="convert-project" label="Target Jira project">
              <select
                id="convert-project"
                value={targetProject}
                onChange={(e) => {
                  setTargetProject(e.target.value);
                  fireFieldChange('project');
                }}
                aria-label="Target Jira project"
                className={inputCls('h-10 cursor-pointer pr-8')}
              >
                {JIRA_PROJECT_OPTIONS.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.key} · {p.name}
                  </option>
                ))}
              </select>
            </FormField>

            {/* Issue type */}
            <FormField id="convert-issue-type" label="Issue type">
              <select
                id="convert-issue-type"
                value={issueType}
                onChange={(e) => {
                  setIssueType(e.target.value as IssueType);
                  fireFieldChange('issueType');
                }}
                aria-label="Issue type"
                className={inputCls('h-10 cursor-pointer pr-8')}
              >
                {ISSUE_TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </FormField>

            {/* Sprint */}
            <FormField id="convert-sprint" label="Sprint">
              <select
                id="convert-sprint"
                value={sprint}
                onChange={(e) => {
                  setSprint(e.target.value as SprintChoice);
                  fireFieldChange('sprint');
                }}
                aria-label="Sprint"
                className={inputCls('h-10 cursor-pointer pr-8')}
              >
                {SPRINT_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </FormField>

            {/* Story points */}
            <FormField
              id="convert-points"
              label="Story points"
              error={spValid ? undefined : 'Enter a positive integer between 1 and 100'}
            >
              <input
                id="convert-points"
                type="number"
                min={1}
                max={100}
                value={storyPoints}
                onChange={(e) => {
                  setStoryPoints(e.target.value);
                  fireFieldChange('storyPoints');
                }}
                aria-label="Story points"
                aria-invalid={!spValid}
                className={inputCls('h-10', !spValid)}
              />
            </FormField>
          </div>

          {/* Preview pane — Conversion summary */}
          <div
            aria-label="Conversion summary"
            className="mt-5 flex flex-col gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--raised)] p-4"
          >
            <h3 className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
              Field mapping preview
            </h3>
            <div className="flex flex-col gap-2 text-[12.5px] text-[var(--text-secondary)]">
              <PreviewRow
                label="QA Nexus key"
                left={reqKey}
                right={`${targetProject}-NNN (assigned by Jira)`}
              />
              <PreviewRow
                label="Title"
                left={parentReq?.title ?? '—'}
                right={parentReq?.title ?? '—'}
              />
              <PreviewRow
                label="Priority"
                left={parentReq ? requirementPriorityLabel[parentReq.priority] : '—'}
                right={parentReq ? requirementPriorityLabel[parentReq.priority] : '—'}
              />
              <PreviewRow label="Sprint" left={parentReq?.sprint ?? 'No sprint'} right={sprint} />
              <PreviewRow label="Issue type" left="Requirement" right={issueType} />
              <PreviewRow label="Story points" left="—" right={String(spNum || '—')} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse gap-3 border-t border-[var(--border-subtle)] bg-[var(--base)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <button
            type="button"
            onClick={() => handleCancel('button')}
            className="inline-flex h-10 min-h-[44px] items-center justify-center rounded-md px-3 text-[13px] font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--raised)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] sm:min-h-0"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConvert}
            disabled={!formValid || isSubmitting}
            aria-busy={isSubmitting || undefined}
            aria-label="Create Story in Jira"
            className="inline-flex h-10 min-h-[44px] items-center justify-center gap-2 rounded-md bg-[var(--primary)] px-5 text-[13px] font-semibold text-[var(--primary-ink)] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-0"
          >
            {isSubmitting ? 'Creating in Jira…' : 'Create in Jira'}
            {isSubmitting ? (
              <svg
                width="13"
                height="13"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
                className="animate-spin"
              >
                <circle
                  cx="8"
                  cy="8"
                  r="6"
                  stroke="currentColor"
                  strokeOpacity="0.3"
                  strokeWidth="1.8"
                />
                <path
                  d="M14 8a6 6 0 0 0-6-6"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <ArrowRight size={13} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function FormField({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]"
      >
        {label}
      </label>
      {children}
      {error && (
        <span role="alert" className="text-[11.5px] text-[var(--fail)]">
          {error}
        </span>
      )}
    </div>
  );
}

function PreviewRow({ label, left, right }: { label: string; left: string; right: string }) {
  return (
    <div className="grid grid-cols-1 items-baseline gap-1.5 sm:grid-cols-[140px_minmax(0,1fr)_16px_minmax(0,1fr)]">
      <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
        {label}
      </span>
      <span className="truncate text-[12.5px] text-[var(--text-primary)]">{left}</span>
      <span aria-hidden="true" className="hidden text-center text-[var(--text-tertiary)] sm:inline">
        →
      </span>
      <span className="truncate text-[12.5px] text-[var(--secondary)]">{right}</span>
    </div>
  );
}

function inputCls(extra = '', invalid = false): string {
  return [
    'w-full rounded-md border bg-[var(--canvas)] px-3 py-2 text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition-colors focus:outline-none focus:ring-2',
    invalid
      ? 'border-[var(--fail)]/50 focus:border-[var(--fail)] focus:ring-[var(--fail)]/30'
      : 'border-[var(--border-subtle)] focus:border-[var(--border-strong)] focus:ring-[var(--secondary)]/30',
    extra,
  ]
    .filter(Boolean)
    .join(' ');
}

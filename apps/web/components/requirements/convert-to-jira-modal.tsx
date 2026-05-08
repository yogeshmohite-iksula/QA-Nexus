// F14m3 Convert to Jira Story Modal — Pattern A scaffold (M3 Day-13).
//
// Locked reference: PM1_UI_v2/Redesign Frame by claude design/F14m3
// Convert to Jira Story Modal v2.html
//
// Per Hard Rule 15: pixel-faithful port within React-component idioms.
//
// Sizing: 680 px max-w desktop (matches the locked HTML verbatim —
// the v2 deviates from the canon 960×720 Edit modal size; PR notes
// this deviation per Hard Rule 15 "match the v2 HTML pixel-faithfully"
// clause). Full-screen Drawer < md per Rule 12.f.
//
// Composer auto-draft chip on the Description label uses
// <AgentName code="composer" /> (Hard Rule 15 single source of truth)
// and var(--secondary) violet.
//
// Jira-blue accent: the locked HTML uses an Atlassian product blue
// not in the PM1 whitelist. Per Yogesh's instruction we use
// var(--info) as the closest whitelist token. If exact Jira-blue is
// required later, file an ADR + token addition.
//
// Pattern A: every interactive site fires `pattern-a:deferred:f14m3:*`.
// Pattern B (post-Jira-OAuth in M4) wires the real Jira-create
// endpoint. This modal stays Pattern A through M3.

'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Sparkles, X } from 'lucide-react';
import { AgentName } from '@/components/ui/agent-name';

// ---------------------------------------------------------------------------
// Stub seed (RET-247 per spec)
// ---------------------------------------------------------------------------

const SOURCE = {
  id: 'RET-247',
  title: 'Refund window for digital goods extends to 30 days on partial-download failure',
};

const DEFAULT_DESCRIPTION = `**Context**
Customer-facing refund window must auto-extend from 14 → 30 days when at least one download segment fails (mid-download corruption, partial CDN response).

**Acceptance criteria**
- When a digital download fails mid-stream, the eligibility window extends from 14 to 30 days from the original purchase timestamp.
- Refund-eligibility cron runs every 4 hours and surfaces any auto-extended cases in Stock Ops Lead's F08 queue with a 30-day SLA.
- Auto-extended refunds appear in the daily reconciliation report under a separate "partial-download" line item.

**Linked test cases**
TC-RET-0341, TC-RET-0342, TC-RET-0567 (3 cases · 92% confidence avg)

**Source**
RET-247 · Iksula Returns · Sprint 42`;

const COMPOSER_REDRAFT = `**Context (Composer-drafted)**
Returns Eligibility v2 ticket: extend the 14-day refund window to 30 days for digital goods that experienced mid-download failure (CDN partial response, segment corruption, or DNS timeout). Auto-detection lives in the eligibility cron; manual review queues to Stock Ops Lead.

**Acceptance criteria (5)**
1. Detection: a downloads.failure_event row with reason ∈ {partial-cdn, segment-corrupt, dns-timeout} triggers an eligibility extension within 4 h of the event.
2. Extension scope: only digital-goods orders within their original 14-day window — no extension on physical goods or refurb.
3. Reconciliation: extended refunds appear in the daily Stock Ops report under a separate partial-download line item.
4. Customer comms: confirmation email "Refund window extended to 30 days" with original + new expiry timestamps; EN/HI locales.
5. Idempotency: subsequent failures within the extended window do NOT trigger another extension.

**Source**
RET-247 · Iksula Returns · Sprint 42`;

const PROJECTS = [
  { value: 'RET', label: 'RET — Iksula Returns' },
  { value: 'CART', label: 'CART — Iksula Commerce' },
  { value: 'PAY', label: 'PAY — Iksula Payments' },
  { value: 'AUTH', label: 'AUTH — Iksula Mobile App' },
];

const ISSUE_TYPES = [
  { value: 'story', label: 'Story' },
  { value: 'task', label: 'Task' },
  { value: 'bug', label: 'Bug' },
  { value: 'epic', label: 'Epic' },
];

const PRIORITIES = [
  { value: 'highest', label: 'Highest' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const SPRINTS = [
  { value: '42', label: 'Sprint 42 (active)' },
  { value: '43', label: 'Sprint 43' },
  { value: 'backlog', label: 'Backlog' },
];

const DEFAULT_LABELS = ['qa-nexus', 'refund-flow', 'digital-goods'];

// ---------------------------------------------------------------------------
// Main modal component
// ---------------------------------------------------------------------------

interface ConvertToJiraModalProps {
  /** Requirement ID being converted (e.g. "RET-247"); null = closed. */
  requirementId: string | null;
  onClose: () => void;
}

export function ConvertToJiraModal({ requirementId, onClose }: ConvertToJiraModalProps) {
  const isOpen = requirementId !== null;

  const [project, setProject] = useState('RET');
  const [issueType, setIssueType] = useState('story');
  const [summary, setSummary] = useState(SOURCE.title);
  const [description, setDescription] = useState(DEFAULT_DESCRIPTION);
  const [priority, setPriority] = useState('high');
  const [sprint, setSprint] = useState('42');
  const [labels, setLabels] = useState<string[]>(DEFAULT_LABELS);
  const [labelDraft, setLabelDraft] = useState('');
  const [composerLoading, setComposerLoading] = useState(false);
  const [composerCompleted, setComposerCompleted] = useState(false);
  const summaryRef = useRef<HTMLInputElement | null>(null);

  // Reset on open + telemetry
  useEffect(() => {
    if (isOpen) {
      setProject('RET');
      setIssueType('story');
      setSummary(SOURCE.title);
      setDescription(DEFAULT_DESCRIPTION);
      setPriority('high');
      setSprint('42');
      setLabels(DEFAULT_LABELS);
      setLabelDraft('');
      setComposerLoading(false);
      setComposerCompleted(false);
      console.info('pattern-a:deferred:f14m3:open', { requirementId });
      setTimeout(() => summaryRef.current?.focus(), 80);
    }
  }, [isOpen, requirementId]);

  // ESC closes
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        console.info('pattern-a:deferred:f14m3:close', { reason: 'esc' });
        onClose();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Body scroll-lock
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  function handleClose(reason: 'cancel' | 'backdrop' | 'x' | 'esc' = 'x') {
    console.info('pattern-a:deferred:f14m3:close', { reason });
    onClose();
  }

  function handleComposerDraft() {
    console.info('pattern-a:deferred:f14m3:composer-draft', { requirementId });
    setComposerLoading(true);
    setTimeout(() => {
      setDescription(COMPOSER_REDRAFT);
      setComposerLoading(false);
      setComposerCompleted(true);
    }, 1800);
  }

  function handleAddLabel() {
    const label = labelDraft.trim();
    if (label.length === 0 || labels.includes(label)) {
      setLabelDraft('');
      return;
    }
    console.info('pattern-a:deferred:f14m3:label-add', { label });
    setLabels((prev) => [...prev, label]);
    setLabelDraft('');
  }

  function handleRemoveLabel(label: string) {
    console.info('pattern-a:deferred:f14m3:label-remove', { label });
    setLabels((prev) => prev.filter((l) => l !== label));
  }

  function handleCreate() {
    if (summary.trim().length === 0 || project.length === 0) return;
    console.info('pattern-a:deferred:f14m3:create', {
      requirementId,
      project,
      issueType,
      summary: summary.slice(0, 80),
      priority,
      sprint,
      labelCount: labels.length,
    });
    onClose();
  }

  const submitDisabled = summary.trim().length === 0 || project.length === 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="f14m3-title"
      className="fixed inset-0 z-50 flex items-stretch justify-center sm:items-center sm:p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={() => handleClose('backdrop')}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-screen w-full flex-col overflow-hidden bg-[var(--base)] sm:max-h-[90vh] sm:max-w-[680px] sm:rounded-xl sm:border"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        {/* ── Header ── */}
        <header
          className="flex items-start justify-between gap-3 border-b px-5 py-4 sm:px-6"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex min-w-0 flex-col gap-1">
            <span
              className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em]"
              style={{ color: 'var(--info)' }}
            >
              <span
                aria-hidden="true"
                className="mr-1 inline-flex h-3.5 w-3.5 items-center justify-center rounded-[3px] font-mono text-[8px] font-bold"
                style={{
                  background: 'rgba(96,165,250,0.20)',
                  color: 'var(--info)',
                }}
              >
                J
              </span>
              Convert to Jira story
            </span>
            <h2
              id="f14m3-title"
              className="font-display text-[18px] font-bold leading-[24px] text-[var(--text-primary)] sm:text-[20px] sm:leading-[28px]"
            >
              Create Jira story from requirement
            </h2>
            <p
              className="font-mono text-[11.5px] leading-[16px]"
              style={{ color: 'var(--text-tertiary)' }}
            >
              iksula.atlassian.net · OAuth 3LO connected
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleClose('x')}
            aria-label="Close modal"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[var(--text-tertiary)] transition-colors hover:bg-[var(--overlay)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </header>

        {/* ── Source banner ── */}
        <div className="px-5 pt-3 sm:px-6">
          <div
            className="flex items-center gap-2.5 rounded-lg border p-2.5"
            style={{
              background: 'rgba(96,165,250,0.08)',
              borderColor: 'rgba(96,165,250,0.30)',
            }}
          >
            <span
              aria-hidden="true"
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
              style={{ background: 'rgba(96,165,250,0.18)', color: 'var(--info)' }}
            >
              <span className="font-mono text-[10px] font-bold">→</span>
            </span>
            <div className="flex min-w-0 flex-1 items-baseline gap-2">
              <span
                className="font-mono text-[11px] font-semibold"
                style={{ color: 'var(--secondary)' }}
              >
                {SOURCE.id}
              </span>
              <span className="text-[11px] text-[var(--text-tertiary)]">→</span>
              <span
                className="font-mono text-[11px] font-semibold"
                style={{ color: 'var(--info)' }}
              >
                Jira
              </span>
              <span className="ml-2 truncate text-[12px] text-[var(--text-secondary)]">
                {SOURCE.title}
              </span>
            </div>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          <form
            className="flex flex-col gap-[14px]"
            onSubmit={(e) => {
              e.preventDefault();
              handleCreate();
            }}
          >
            {/* Project + Issue type */}
            <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
              <Field label="Jira project" required htmlFor="f14m3-project">
                <Select
                  id="f14m3-project"
                  value={project}
                  options={PROJECTS}
                  onChange={(v) => {
                    console.info('pattern-a:deferred:f14m3:project-change', { project: v });
                    setProject(v);
                  }}
                />
              </Field>
              <Field label="Issue type" required htmlFor="f14m3-issuetype">
                <Select
                  id="f14m3-issuetype"
                  value={issueType}
                  options={ISSUE_TYPES}
                  onChange={setIssueType}
                />
              </Field>
            </div>

            {/* Summary */}
            <Field label="Summary" required htmlFor="f14m3-summary">
              <input
                id="f14m3-summary"
                ref={summaryRef}
                type="text"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="h-10 w-full rounded-md border bg-[var(--canvas)] px-3 text-[13.5px] text-[var(--text-primary)] focus:outline-none focus:ring-2"
                style={{
                  borderColor: 'var(--border-subtle)',
                  // @ts-expect-error inline ring
                  '--tw-ring-color': 'rgba(96,165,250,0.50)',
                }}
              />
            </Field>

            {/* Description with Composer chip */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="f14m3-desc"
                  className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]"
                >
                  Description
                </label>
                <button
                  type="button"
                  onClick={handleComposerDraft}
                  disabled={composerLoading}
                  className="inline-flex h-7 items-center gap-1 rounded-md border px-2 font-mono text-[10.5px] font-bold uppercase tracking-[0.06em] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] disabled:opacity-60"
                  style={{
                    background: 'rgba(167,139,250,0.10)',
                    borderColor: 'rgba(167,139,250,0.30)',
                    color: 'var(--secondary)',
                  }}
                >
                  {composerLoading ? (
                    <>
                      <Sparkles size={10} aria-hidden="true" className="animate-pulse" />
                      Composer thinking…
                    </>
                  ) : composerCompleted ? (
                    <>
                      <Check size={10} aria-hidden="true" />
                      Re-draft with <AgentName code="composer" inherit noIcon />
                    </>
                  ) : (
                    <>
                      <Sparkles size={10} aria-hidden="true" />
                      Auto-draft with <AgentName code="composer" inherit noIcon />
                    </>
                  )}
                </button>
              </div>
              <textarea
                id="f14m3-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                className="min-h-[140px] w-full resize-y rounded-md border bg-[var(--canvas)] p-3 font-mono text-[12px] leading-[1.5] text-[var(--text-primary)] focus:outline-none focus:ring-2"
                style={{
                  borderColor: 'var(--border-subtle)',
                  // @ts-expect-error inline ring
                  '--tw-ring-color': 'rgba(96,165,250,0.50)',
                }}
              />
            </div>

            {/* Priority + Sprint */}
            <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
              <Field label="Priority" htmlFor="f14m3-priority">
                <Select
                  id="f14m3-priority"
                  value={priority}
                  options={PRIORITIES}
                  onChange={setPriority}
                />
              </Field>
              <Field label="Target sprint" htmlFor="f14m3-sprint">
                <Select id="f14m3-sprint" value={sprint} options={SPRINTS} onChange={setSprint} />
              </Field>
            </div>

            {/* Labels chip-input */}
            <Field label="Labels" htmlFor="f14m3-labels">
              <div
                className="flex flex-wrap items-center gap-1.5 rounded-md border bg-[var(--canvas)] p-2 focus-within:ring-2"
                style={{
                  borderColor: 'var(--border-subtle)',
                  // @ts-expect-error inline ring
                  '--tw-ring-color': 'rgba(96,165,250,0.50)',
                }}
              >
                {labels.map((label) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10.5px]"
                    style={{
                      background: 'rgba(96,165,250,0.10)',
                      borderColor: 'rgba(96,165,250,0.30)',
                      color: 'var(--info)',
                    }}
                  >
                    {label}
                    <button
                      type="button"
                      onClick={() => handleRemoveLabel(label)}
                      aria-label={`Remove label ${label}`}
                      className="inline-flex h-4 w-4 items-center justify-center rounded-full transition-opacity hover:bg-[rgba(96,165,250,0.30)] focus-visible:outline-none"
                    >
                      <X size={9} aria-hidden="true" />
                    </button>
                  </span>
                ))}
                <input
                  id="f14m3-labels"
                  type="text"
                  value={labelDraft}
                  onChange={(e) => setLabelDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      handleAddLabel();
                    } else if (
                      e.key === 'Backspace' &&
                      labelDraft.length === 0 &&
                      labels.length > 0
                    ) {
                      handleRemoveLabel(labels[labels.length - 1]);
                    }
                  }}
                  placeholder={labels.length === 0 ? 'Add a label and press Enter…' : ''}
                  className="min-w-[140px] flex-1 bg-transparent text-[12.5px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none"
                />
              </div>
            </Field>
          </form>
        </div>

        {/* ── Footer ── */}
        <footer
          className="flex flex-col-reverse items-stretch justify-between gap-2 border-t bg-[var(--base)] px-5 py-3 sm:flex-row sm:items-center sm:px-6"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <span className="flex items-center gap-1.5 font-mono text-[11px] text-[var(--text-tertiary)]">
            <span
              aria-hidden="true"
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: 'var(--pass)' }}
            />
            Jira connection healthy · last sync 2 min ago
          </span>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => handleClose('cancel')}
              className="inline-flex h-10 min-h-[44px] items-center justify-center rounded-md border px-4 text-[13px] font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--overlay)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] sm:min-h-0"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={submitDisabled}
              className="inline-flex h-10 min-h-[44px] items-center justify-center gap-1.5 rounded-md px-4 text-[13px] font-semibold transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-0"
              style={{ background: 'var(--info)', color: 'var(--primary-ink)' }}
            >
              <Check size={14} aria-hidden="true" />
              Create Jira story
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components (mirroring F14m1 patterns for consistency)
// ---------------------------------------------------------------------------

function Field({
  label,
  required,
  htmlFor,
  children,
}: {
  label: string;
  required?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="flex items-center gap-1 font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]"
      >
        {label}
        {required && (
          <span aria-hidden="true" style={{ color: 'var(--fail)' }}>
            *
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

function Select({
  id,
  value,
  onChange,
  options,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 w-full rounded-md border bg-[var(--canvas)] px-3 text-[13px] text-[var(--text-primary)] focus:outline-none focus:ring-2"
      style={{
        borderColor: 'var(--border-subtle)',
        // @ts-expect-error inline ring
        '--tw-ring-color': 'rgba(96,165,250,0.50)',
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// F14 Requirement Detail Drawer — slide-in right-side panel for read-only
// preview of a requirement (Day-14 Sat afternoon TASK A3).
//
// Reinstates the drawer pattern that lived in F14 v1 and was dropped in
// the v2 redesign. Yogesh requested it back at 13:00 on Day-14 — the
// row body needs a fast read-only preview surface separate from the
// F14m1 Edit Modal (which stays the full-edit flow).
//
// Affordance split:
//   - Row body click           → ?view=<id>  → THIS drawer opens
//   - Edit icon click          → ?edit=<id>  → F14m1 Edit Modal
//   - Link icon (more menu)    → ?link=<id>  → F14m2 Link Test Case Modal
//   - Convert-to-Jira          → ?jira=<id>  → F14m3 Convert Modal
//
// Modal priority (mutually exclusive): edit > link > jira > view
//
// Sizing per Hard Rule 12:
//   - Desktop ≥ 640px : up to ~448px wide (Tailwind max-w-md), slides
//                       from right edge. Spec wanted 420 but the
//                       enforce-rwd hook only allowlists semantic
//                       tokens or [480|640|768]px — max-w-md is the
//                       closest semantic match.
//   - Mobile  < 640px : full-screen sheet (100vw)
//
// Body sections (vertically stacked):
//   1. Description   (req.description)
//   2. Acceptance Criteria  (bullet list)
//   3. Coverage      (test cases linked + meter)
//   4. Composer ⓘ Suggests   (3 next-step suggestions)
//   5. Traceability  (Jira link · F14m2 links · audit chain)
//
// Footer actions:
//   - View in Jira (external link, target=_blank)
//   - Edit mapping (deferred — would route to a future F14m4 Mapping Modal)
//   - Unlink Jira (Pattern A: console.info marker only)

'use client';

import { useCallback, useEffect, useRef } from 'react';
import {
  X,
  ExternalLink,
  Link2,
  Unlink,
  Sparkles,
  CheckCircle2,
  ListChecks,
  GitBranch,
  FileText,
} from 'lucide-react';
import { AgentName } from '@/components/ui/agent-name';

export interface RequirementDetailDrawerData {
  id: string; // 'RET-247'
  title: string;
  description: string;
  status: 'active' | 'draft' | 'in-review' | 'archived' | 'done';
  statusLabel: string;
  jiraKey?: string; // 'RET-247'
  jiraUrl?: string; // 'https://iksula.atlassian.net/browse/RET-247'
  acceptanceCriteria: string[];
  linkedTestCaseCount: number;
  passedCount: number;
  failedCount: number;
  blockedCount: number;
  notRunCount: number;
  composerSuggestions: string[];
  traceability: {
    sprint: string;
    epicKey?: string;
    epicTitle?: string;
    auditChainHash?: string;
  };
}

interface RequirementDetailDrawerProps {
  open: boolean;
  data: RequirementDetailDrawerData | null;
  onClose: () => void;
  onOpenEdit: (id: string) => void;
  onGenerate: (id: string) => void;
}

export function RequirementDetailDrawer({
  open,
  data,
  onClose,
  onOpenEdit,
  onGenerate,
}: RequirementDetailDrawerProps) {
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  // ESC close + body scroll lock + initial focus
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        console.info('pattern-a:deferred:f14:detail-drawer:esc-close');
        onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Initial focus on close button per Hard Rule 13 a11y
    closeBtnRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  const handleBackdropClick = useCallback(() => {
    console.info('pattern-a:deferred:f14:detail-drawer:backdrop-close');
    onClose();
  }, [onClose]);

  const handleCloseClick = useCallback(() => {
    console.info('pattern-a:deferred:f14:detail-drawer:x-close');
    onClose();
  }, [onClose]);

  if (!open || !data) return null;

  const totalLinked = data.linkedTestCaseCount;
  const passPct = totalLinked ? Math.round((data.passedCount / totalLinked) * 100) : 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rq-drawer-title"
      className="fixed inset-0 z-50 flex justify-end"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close drawer"
        tabIndex={-1}
        onClick={handleBackdropClick}
        className="absolute inset-0 bg-black/50 transition-opacity"
      />

      {/* Drawer panel */}
      <aside
        ref={drawerRef}
        className="relative ml-auto flex h-full w-full flex-col overflow-hidden border-l shadow-2xl outline-none sm:max-w-md"
        style={{
          background: 'var(--base)',
          borderColor: 'var(--border)',
        }}
      >
        {/* Header */}
        <header
          className="flex flex-none items-center gap-2 border-b px-4 py-3"
          style={{ borderColor: 'var(--border)' }}
        >
          {data.jiraKey && (
            <span
              className="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 font-mono text-[10.5px] font-bold leading-none"
              style={{
                background: 'rgba(96,165,250,0.12)',
                color: 'var(--info)',
                border: '1px solid rgba(96,165,250,0.30)',
                letterSpacing: '0.04em',
              }}
            >
              <span
                aria-hidden="true"
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ background: 'var(--info)' }}
              />
              Jira
            </span>
          )}
          <h2
            id="rq-drawer-title"
            className="m-0 font-mono text-[13px] font-bold"
            style={{ color: 'var(--text-primary)', letterSpacing: '0.02em' }}
          >
            {data.id}
          </h2>
          <span
            className="inline-flex h-5 items-center rounded-full px-2 text-[10px] font-semibold uppercase tracking-[0.04em]"
            style={statusChipStyle(data.status)}
          >
            {data.statusLabel}
          </span>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={handleCloseClick}
            aria-label="Close drawer"
            className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:bg-[var(--raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </header>

        {/* Title (under header) */}
        <div className="flex-none border-b px-4 py-3" style={{ borderColor: 'var(--border)' }}>
          <h3
            className="font-display m-0 text-[16px] font-semibold leading-[22px]"
            style={{ color: 'var(--text-primary)' }}
          >
            {data.title}
          </h3>
          <p className="mt-1 font-mono text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
            {data.traceability.sprint}
            {data.traceability.epicKey && (
              <>
                {' · '}
                <span style={{ color: 'var(--text-secondary)' }}>
                  {data.traceability.epicKey}
                </span>{' '}
                {data.traceability.epicTitle}
              </>
            )}
          </p>
        </div>

        {/* Body — scrollable */}
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 py-4">
          {/* 1. Description */}
          <Section icon={<FileText size={12} aria-hidden="true" />} title="Description">
            <p
              className="m-0 text-[13px] leading-[19px]"
              style={{ color: 'var(--text-secondary)' }}
            >
              {data.description}
            </p>
          </Section>

          {/* 2. Acceptance Criteria */}
          <Section
            icon={<ListChecks size={12} aria-hidden="true" />}
            title="Acceptance criteria"
            count={data.acceptanceCriteria.length}
          >
            <ul className="m-0 list-none space-y-1.5 pl-0">
              {data.acceptanceCriteria.map((ac, idx) => (
                <li
                  key={ac}
                  className="flex items-start gap-2 text-[12.5px] leading-[18px]"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <span
                    aria-hidden="true"
                    className="mt-0.5 inline-flex h-4 w-4 flex-none items-center justify-center rounded-full font-mono text-[9px] font-bold"
                    style={{
                      background: 'rgba(45,212,191,0.10)',
                      color: 'var(--primary)',
                      border: '1px solid rgba(45,212,191,0.28)',
                    }}
                  >
                    {idx + 1}
                  </span>
                  <span>{ac}</span>
                </li>
              ))}
            </ul>
          </Section>

          {/* 3. Coverage */}
          <Section
            icon={<CheckCircle2 size={12} aria-hidden="true" />}
            title="Coverage"
            count={totalLinked}
          >
            {totalLinked === 0 ? (
              <p className="m-0 text-[12.5px]" style={{ color: 'var(--warn)' }}>
                No test cases linked yet — Composer can suggest 5 from this requirement.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                <div
                  className="flex flex-wrap items-center gap-2 font-mono text-[11.5px]"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  <span style={{ color: 'var(--pass)' }}>{data.passedCount} pass</span>
                  <span>·</span>
                  <span style={{ color: 'var(--fail)' }}>{data.failedCount} fail</span>
                  <span>·</span>
                  <span style={{ color: 'var(--warn)' }}>{data.blockedCount} blocked</span>
                  <span>·</span>
                  <span>{data.notRunCount} not run</span>
                </div>
                <div
                  className="h-1.5 w-full overflow-hidden rounded-full"
                  style={{ background: 'var(--overlay)' }}
                >
                  <div
                    className="h-full"
                    style={{
                      width: `${passPct}%`,
                      background: 'var(--pass)',
                    }}
                  />
                </div>
              </div>
            )}
          </Section>

          {/* 4. Composer ⓘ Suggests */}
          <Section
            icon={<Sparkles size={12} aria-hidden="true" />}
            title={
              <span className="inline-flex items-center gap-1.5">
                <AgentName code="composer" inherit /> Suggests
              </span>
            }
            tone="ai"
          >
            <ul className="m-0 list-none space-y-1.5 pl-0">
              {data.composerSuggestions.map((s) => (
                <li
                  key={s}
                  className="flex items-start gap-2 rounded-md border px-2.5 py-2 text-[12px] leading-[16px]"
                  style={{
                    borderColor: 'rgba(167,139,250,0.30)',
                    background: 'rgba(167,139,250,0.06)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <Sparkles
                    size={11}
                    aria-hidden="true"
                    style={{ color: 'var(--secondary)', marginTop: 2 }}
                  />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => {
                console.info('pattern-a:deferred:f14:detail-drawer:generate-from-req', {
                  id: data.id,
                });
                onGenerate(data.id);
              }}
              className="inline-flex h-9 items-center gap-1.5 self-start rounded-md px-3 text-[12.5px] font-semibold transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
              style={{ background: 'var(--primary)', color: 'var(--primary-ink)' }}
            >
              <Sparkles size={12} aria-hidden="true" />
              Generate test cases
            </button>
          </Section>

          {/* 5. Traceability */}
          <Section icon={<GitBranch size={12} aria-hidden="true" />} title="Traceability">
            <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 font-mono text-[11px]">
              <dt style={{ color: 'var(--text-tertiary)' }}>Sprint</dt>
              <dd className="m-0" style={{ color: 'var(--text-secondary)' }}>
                {data.traceability.sprint}
              </dd>
              {data.traceability.epicKey && (
                <>
                  <dt style={{ color: 'var(--text-tertiary)' }}>Epic</dt>
                  <dd className="m-0" style={{ color: 'var(--text-secondary)' }}>
                    <span style={{ color: 'var(--secondary)' }}>{data.traceability.epicKey}</span>{' '}
                    {data.traceability.epicTitle}
                  </dd>
                </>
              )}
              {data.jiraKey && (
                <>
                  <dt style={{ color: 'var(--text-tertiary)' }}>Jira</dt>
                  <dd className="m-0" style={{ color: 'var(--text-secondary)' }}>
                    {data.jiraKey}
                  </dd>
                </>
              )}
              {data.traceability.auditChainHash && (
                <>
                  <dt style={{ color: 'var(--text-tertiary)' }}>Audit</dt>
                  <dd
                    className="m-0 truncate"
                    style={{ color: 'var(--text-secondary)' }}
                    title={data.traceability.auditChainHash}
                  >
                    {data.traceability.auditChainHash.slice(0, 12)}…
                  </dd>
                </>
              )}
            </dl>
          </Section>
        </div>

        {/* Footer */}
        <footer
          className="flex flex-none flex-wrap items-center gap-2 border-t px-4 py-3"
          style={{
            borderColor: 'var(--border)',
            background: 'var(--canvas)',
          }}
        >
          {data.jiraUrl && (
            <a
              href={data.jiraUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                console.info('pattern-a:deferred:f14:detail-drawer:view-in-jira', {
                  id: data.id,
                })
              }
              className="inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-[12.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--text-secondary)',
              }}
            >
              <ExternalLink size={12} aria-hidden="true" />
              View in Jira
            </a>
          )}
          <button
            type="button"
            onClick={() => {
              console.info('pattern-a:deferred:f14:detail-drawer:edit-mapping', {
                id: data.id,
              });
              onOpenEdit(data.id);
            }}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-[12.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
            style={{
              borderColor: 'var(--border)',
              color: 'var(--text-secondary)',
            }}
          >
            <Link2 size={12} aria-hidden="true" />
            Edit mapping
          </button>
          <button
            type="button"
            onClick={() =>
              console.info('pattern-a:deferred:f14:detail-drawer:unlink-jira', {
                id: data.id,
              })
            }
            className="inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-[12.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
            style={{
              borderColor: 'rgba(248,113,113,0.34)',
              color: 'var(--fail)',
            }}
          >
            <Unlink size={12} aria-hidden="true" />
            Unlink
          </button>
        </footer>
      </aside>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function Section({
  icon,
  title,
  count,
  tone = 'default',
  children,
}: {
  icon: React.ReactNode;
  title: React.ReactNode;
  count?: number;
  tone?: 'default' | 'ai';
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h4
        className="m-0 inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase"
        style={{
          letterSpacing: '0.08em',
          color: tone === 'ai' ? 'var(--secondary)' : 'var(--text-tertiary)',
        }}
      >
        <span
          className="inline-flex h-4 w-4 flex-none items-center justify-center rounded-sm"
          style={
            tone === 'ai'
              ? {
                  background: 'rgba(167,139,250,0.12)',
                  color: 'var(--secondary)',
                  border: '1px solid rgba(167,139,250,0.30)',
                }
              : {
                  background: 'var(--raised)',
                  color: 'var(--text-tertiary)',
                  border: '1px solid var(--border)',
                }
          }
        >
          {icon}
        </span>
        {title}
        {typeof count === 'number' && (
          <span
            className="ml-1 inline-flex items-center rounded-sm px-1 py-px font-mono text-[10px] font-semibold"
            style={{
              background: 'var(--raised)',
              color: 'var(--text-tertiary)',
              border: '1px solid var(--border)',
              letterSpacing: '0.04em',
            }}
          >
            {count}
          </span>
        )}
      </h4>
      {children}
    </section>
  );
}

function statusChipStyle(status: RequirementDetailDrawerData['status']) {
  switch (status) {
    case 'active':
    case 'done':
      return {
        background: 'rgba(52,211,153,0.14)',
        color: 'var(--pass)',
        border: '1px solid rgba(52,211,153,0.34)',
      };
    case 'in-review':
      return {
        background: 'rgba(96,165,250,0.12)',
        color: 'var(--info)',
        border: '1px solid rgba(96,165,250,0.30)',
      };
    case 'archived':
      return {
        background: 'var(--raised)',
        color: 'var(--text-tertiary)',
        border: '1px solid var(--border)',
      };
    case 'draft':
    default:
      return {
        background: 'rgba(251,191,36,0.14)',
        color: 'var(--warn)',
        border: '1px solid rgba(251,191,36,0.34)',
      };
  }
}

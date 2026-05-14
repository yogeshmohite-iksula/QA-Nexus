// F21 Side detail rail (sd-rail) — canonical L1129-1302.
// Hard Rule 17: every string from canned-data.ts.

'use client';

import { Check, MessageSquare, RefreshCw, Search, UserPlus, X } from 'lucide-react';
import {
  F21_ACTIVITY,
  F21_COMMENTS,
  F21_CURATOR_SIMILAR,
  F21_SD_ACTIONS,
  F21_SD_HEAD,
  F21_SHERLOCK_RCA,
  F21_SUMMARY,
  type ActivityRow,
  type CommentItem,
  type DefectMetaSegment,
  type ReproSegment,
} from './canned-data';

const SIM_STATUS_STYLE = {
  open: { bg: 'var(--fail-soft)', bd: 'var(--fail-line)', fg: 'var(--fail)' },
  progress: { bg: 'var(--info-soft)', bd: 'var(--info-line)', fg: 'var(--info)' },
  qa: { bg: 'var(--warn-soft)', bd: 'var(--warn-line)', fg: 'var(--warn)' },
  fixed: { bg: 'var(--pass-soft)', bd: 'var(--pass-line)', fg: 'var(--pass)' },
  closed: { bg: 'var(--overlay)', bd: 'var(--border-strong)', fg: 'var(--t3)' },
};

const AVATAR_STYLE = {
  amber: { bg: 'var(--warn-soft)', fg: 'var(--warn)' },
  violet: { bg: 'var(--ai-soft)', fg: 'var(--ai-accent)' },
  teal: { bg: 'var(--primary-soft)', fg: 'var(--primary)' },
};

export function SdRail() {
  return (
    <aside
      aria-label="Defect detail"
      className="flex min-h-0 flex-col border-l"
      style={{ background: 'var(--canvas)', borderColor: 'var(--border)' }}
    >
      {/* sd-head */}
      <header
        className="flex flex-col gap-2.5 border-b px-4 py-3"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11.5px] font-semibold" style={{ color: 'var(--t1)' }}>
            {F21_SD_HEAD.id}
          </span>
          <span
            className="inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold"
            style={{
              background: 'var(--fail-soft)',
              borderColor: 'var(--fail-line)',
              color: 'var(--fail)',
            }}
          >
            {F21_SD_HEAD.priority}
          </span>
          <span
            className="inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em]"
            style={{
              background: 'var(--info-soft)',
              borderColor: 'var(--info-line)',
              color: 'var(--info)',
            }}
          >
            {F21_SD_HEAD.status}
          </span>
          <span className="ml-auto" />
          <button
            type="button"
            aria-label={F21_SD_HEAD.closeAriaLabel}
            onClick={() => console.info('pattern-a:deferred:f21:sd-close')}
            className="inline-flex h-6 w-6 items-center justify-center rounded text-[var(--t3)] transition-colors hover:bg-[var(--raised)] hover:text-[var(--t1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
          >
            <X size={13} aria-hidden="true" strokeWidth={2.2} />
          </button>
        </div>
        <h2
          className="m-0 text-[13.5px] font-semibold leading-[19px]"
          style={{ color: 'var(--t1)', fontFamily: 'var(--font-dm-sans), system-ui, sans-serif' }}
        >
          {F21_SD_HEAD.title}
        </h2>
        <div className="flex flex-wrap gap-1.5">
          {F21_SD_ACTIONS.map((a) => (
            <button
              key={a.label}
              type="button"
              onClick={() => console.info('pattern-a:deferred:f21:sd-action', { action: a.label })}
              className="inline-flex h-7 items-center gap-1 rounded-md border px-2 text-[11px] font-semibold transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
              style={
                a.variant === 'primary'
                  ? {
                      background: 'var(--primary)',
                      borderColor: 'var(--primary-line)',
                      color: 'var(--primary-ink)',
                    }
                  : {
                      background: 'var(--raised)',
                      borderColor: 'var(--border)',
                      color: 'var(--t2)',
                    }
              }
            >
              {a.variant === 'primary' && <Check size={11} aria-hidden="true" strokeWidth={2.6} />}
              {a.label === 'Reassign' && <UserPlus size={11} aria-hidden="true" />}
              {a.label}
            </button>
          ))}
        </div>
      </header>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-4 py-3.5">
        <div className="flex flex-col gap-4">
          {/* Summary section */}
          <SdSection label={F21_SUMMARY.label}>
            <div
              className="flex flex-col gap-2 rounded-md border p-3"
              style={{ background: 'var(--base)', borderColor: 'var(--border)' }}
            >
              <p className="m-0 text-[12px] leading-[18px]" style={{ color: 'var(--t2)' }}>
                {F21_SUMMARY.bodySegments.map((seg, i) => (
                  <ReproSegmentSpan key={i} segment={seg} />
                ))}
              </p>
              <div
                className="flex flex-col gap-0.5 rounded-md px-2.5 py-2 font-mono text-[11px]"
                style={{ background: 'var(--canvas)', color: 'var(--t2)' }}
              >
                {F21_SUMMARY.reproSteps.map((step) => (
                  <div key={step.num}>
                    <span style={{ color: 'var(--t4)' }}>{step.num}.</span>{' '}
                    {step.text.map((seg, i) => (
                      <ReproSegmentSpan key={i} segment={seg} />
                    ))}
                  </div>
                ))}
              </div>
              <div
                className="flex flex-wrap items-center gap-2 text-[11px]"
                style={{ color: 'var(--t3)' }}
              >
                <span
                  className="font-mono text-[9.5px] font-bold uppercase tracking-[0.06em]"
                  style={{ color: 'var(--t4)' }}
                >
                  Linked
                </span>
                {F21_SUMMARY.linkedRefs.map((ref, i) => (
                  <span key={ref.label} className="inline-flex items-center gap-1">
                    {i > 0 && <span style={{ color: 'var(--t4)' }}>·</span>}
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        console.info('pattern-a:deferred:f21:open-ref', {
                          kind: ref.kind,
                          label: ref.label,
                        });
                      }}
                      className="font-mono"
                      style={{ color: ref.kind === 'jira' ? 'var(--info)' : 'var(--primary)' }}
                    >
                      {ref.kind === 'jira' ? `JIRA ${ref.label}` : ref.label}
                    </a>
                  </span>
                ))}
              </div>
            </div>
          </SdSection>

          {/* Sherlock RCA */}
          <SdSection label={F21_SHERLOCK_RCA.label}>
            <div
              className="flex flex-col gap-2 rounded-md border p-3"
              style={{ background: 'var(--ai-soft)', borderColor: 'var(--ai-line)' }}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  aria-hidden="true"
                  className="inline-flex h-6 w-6 items-center justify-center rounded-md"
                  style={{
                    background: 'rgba(167,139,250,0.18)',
                    color: 'var(--secondary)',
                    border: '1px solid var(--ai-line)',
                  }}
                >
                  <Search size={13} aria-hidden="true" strokeWidth={1.8} />
                </span>
                <span
                  className="inline-flex items-center gap-1 text-[12px] font-semibold"
                  style={{ color: 'var(--t1)' }}
                >
                  {F21_SHERLOCK_RCA.name}
                  <span
                    aria-hidden="true"
                    className="inline-flex h-3 w-3 items-center justify-center rounded-full font-mono text-[8px] font-bold"
                    style={{ background: 'var(--ai-line)', color: 'var(--secondary-ink)' }}
                  >
                    i
                  </span>
                </span>
                <span
                  className="inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.04em]"
                  style={{
                    background: 'var(--pass-soft)',
                    borderColor: 'var(--pass-line)',
                    color: 'var(--pass)',
                  }}
                >
                  {F21_SHERLOCK_RCA.confidenceLabel}
                </span>
              </div>
              <p className="m-0 text-[12px] leading-[18px]" style={{ color: 'var(--t2)' }}>
                {F21_SHERLOCK_RCA.text.map((seg, i) => (
                  <ReproSegmentSpan key={i} segment={seg} />
                ))}
              </p>
            </div>
          </SdSection>

          {/* Curator similar */}
          <SdSection label={F21_CURATOR_SIMILAR.label}>
            <div
              className="flex flex-col gap-2 rounded-md border p-3"
              style={{ background: 'var(--base)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex items-center gap-1 text-[12px] font-semibold"
                  style={{ color: 'var(--t1)' }}
                >
                  {F21_CURATOR_SIMILAR.agentLabel}
                  <span
                    aria-hidden="true"
                    className="inline-flex h-3 w-3 items-center justify-center rounded-full font-mono text-[8px] font-bold"
                    style={{ background: 'var(--ai-line)', color: 'var(--secondary-ink)' }}
                  >
                    i
                  </span>
                  <span
                    className="ml-1 font-mono text-[10px] font-medium"
                    style={{ color: 'var(--t3)' }}
                  >
                    {F21_CURATOR_SIMILAR.agentVersion}
                  </span>
                </span>
                <span
                  className="ml-auto inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.04em]"
                  style={{
                    background: 'var(--ai-soft)',
                    borderColor: 'var(--ai-line)',
                    color: 'var(--ai-accent)',
                  }}
                >
                  {F21_CURATOR_SIMILAR.matchesLabel}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                {F21_CURATOR_SIMILAR.rows.map((r) => {
                  const t =
                    SIM_STATUS_STYLE[r.status as keyof typeof SIM_STATUS_STYLE] ??
                    SIM_STATUS_STYLE.open;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() =>
                        console.info('pattern-a:deferred:f21:open-similar', { id: r.id })
                      }
                      className="flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-left transition-colors hover:bg-[var(--raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
                      style={{ background: 'var(--canvas)', borderColor: 'var(--border)' }}
                    >
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span
                          className="font-mono text-[11px] font-medium"
                          style={{ color: 'var(--t1)' }}
                        >
                          {r.id}
                        </span>
                        <span className="truncate text-[11.5px]" style={{ color: 'var(--t2)' }}>
                          {r.title}
                        </span>
                      </span>
                      <span
                        className="inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em]"
                        style={{ background: t.bg, borderColor: t.bd, color: t.fg }}
                      >
                        {r.statusLabel}
                      </span>
                      <span
                        className="font-mono text-[10.5px] font-bold"
                        style={{ color: 'var(--ai-accent)' }}
                      >
                        {r.similarityPct}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </SdSection>

          {/* Activity */}
          <SdSection label={F21_ACTIVITY.label}>
            <div className="flex flex-col gap-2">
              {F21_ACTIVITY.rows.map((row, i) => (
                <ActivityRowItem key={i} row={row} />
              ))}
            </div>
          </SdSection>

          {/* Comments */}
          <SdSection label={F21_COMMENTS.label}>
            <div className="flex flex-col gap-2.5">
              {F21_COMMENTS.items.map((c, i) => (
                <CommentItemRow key={i} comment={c} />
              ))}
              <div
                className="flex flex-col gap-1.5 rounded-md border p-2"
                style={{ background: 'var(--base)', borderColor: 'var(--border)' }}
              >
                <textarea
                  placeholder={F21_COMMENTS.inputPlaceholder}
                  rows={2}
                  className="resize-none bg-transparent text-[12px] outline-none"
                  style={{ color: 'var(--t1)' }}
                  onChange={() => console.info('pattern-a:deferred:f21:comment-typing')}
                />
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => console.info('pattern-a:deferred:f21:comment-submit')}
                    className="inline-flex h-7 items-center gap-1 rounded-md border px-2.5 text-[11px] font-semibold transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
                    style={{
                      background: 'var(--primary)',
                      borderColor: 'var(--primary-line)',
                      color: 'var(--primary-ink)',
                    }}
                  >
                    Comment
                  </button>
                </div>
              </div>
            </div>
          </SdSection>
        </div>
      </div>
    </aside>
  );
}

function SdSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-1.5">
      <span
        className="font-mono text-[10px] font-semibold uppercase tracking-[0.06em]"
        style={{ color: 'var(--t3)' }}
      >
        {label}
      </span>
      {children}
    </section>
  );
}

function ReproSegmentSpan({ segment }: { segment: ReproSegment }) {
  if (segment.kind === 'mono')
    return (
      <code
        className="rounded px-1 font-mono text-[11px]"
        style={{ background: 'var(--canvas)', color: 'var(--ai-accent)' }}
      >
        {segment.value}
      </code>
    );
  if (segment.kind === 'fail')
    return <b style={{ color: 'var(--fail)', fontFamily: 'var(--font-mono)' }}>{segment.value}</b>;
  return <>{segment.value}</>;
}

function ActivityRowItem({ row }: { row: ActivityRow }) {
  const Icon =
    row.iconKind === 'comment' ? MessageSquare : row.iconKind === 'status' ? RefreshCw : UserPlus;
  return (
    <div
      className="flex items-start gap-2 rounded-md border p-2"
      style={{ background: 'var(--canvas)', borderColor: 'var(--border)' }}
    >
      <span
        aria-hidden="true"
        className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded"
        style={{ background: 'var(--overlay)', color: 'var(--t3)' }}
      >
        <Icon size={11} aria-hidden="true" />
      </span>
      <span className="flex-1 text-[11.5px] leading-[16px]" style={{ color: 'var(--t2)' }}>
        {row.segments.map((seg, i) => (
          <ActivitySegmentSpan key={i} segment={seg} />
        ))}
      </span>
      <span className="font-mono text-[10px]" style={{ color: 'var(--t4)' }}>
        {row.when}
      </span>
    </div>
  );
}

function ActivitySegmentSpan({ segment }: { segment: DefectMetaSegment }) {
  if (segment.kind === 'bold')
    return <b style={{ color: 'var(--t1)', fontWeight: 600 }}>{segment.value}</b>;
  return <>{segment.value}</>;
}

function CommentItemRow({ comment }: { comment: CommentItem }) {
  const av = AVATAR_STYLE[comment.authorAvatarTone];
  return (
    <div className="flex items-start gap-2">
      <span
        aria-hidden="true"
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold"
        style={{ background: av.bg, color: av.fg }}
      >
        {comment.authorInitials}
      </span>
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-center gap-1.5 text-[11px]">
          <span style={{ color: 'var(--t1)', fontWeight: 600 }}>{comment.authorName}</span>
          <span style={{ color: 'var(--t4)' }}>{comment.when}</span>
        </div>
        <p className="m-0 text-[12px] leading-[17px]" style={{ color: 'var(--t2)' }}>
          {comment.text}
        </p>
      </div>
    </div>
  );
}

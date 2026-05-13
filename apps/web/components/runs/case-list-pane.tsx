// F19 Pane 1 — Case list — v2 HTML L673-L744.

'use client';

import { Check, X, AlertTriangle, Play, Search } from 'lucide-react';
import type { CaseRow, CaseStatus } from './canned-data';

interface Props {
  rows: CaseRow[];
  counts: { pass: number; fail: number; flaky: number; running: number };
  onCaseClick: (caseId: string) => void;
}

const STATUS_COLOR: Record<CaseStatus, { bg: string; fg: string; bd: string }> = {
  pass: { bg: 'var(--pass-soft)', fg: 'var(--pass)', bd: 'var(--pass-line)' },
  fail: { bg: 'var(--fail-soft)', fg: 'var(--fail)', bd: 'var(--fail-line)' },
  flaky: { bg: 'var(--warn-soft)', fg: 'var(--warn)', bd: 'var(--warn-line)' },
  running: { bg: 'var(--info-soft)', fg: 'var(--info)', bd: 'var(--info-line)' },
  queued: { bg: 'var(--canvas)', fg: 'var(--t3)', bd: 'var(--border)' },
};

function StatusIcon({ status }: { status: CaseStatus }) {
  const sz = 13;
  if (status === 'pass') return <Check size={sz} strokeWidth={3.2} aria-hidden="true" />;
  if (status === 'fail') return <X size={sz} strokeWidth={3.2} aria-hidden="true" />;
  if (status === 'flaky') return <AlertTriangle size={sz} strokeWidth={3} aria-hidden="true" />;
  if (status === 'running') return <Play size={sz} aria-hidden="true" fill="currentColor" />;
  return <span aria-hidden="true" />;
}

export function CaseListPane({ rows, counts, onCaseClick }: Props) {
  return (
    <section
      aria-label="Cases in run"
      className="flex min-h-0 flex-col border-b lg:border-b-0 lg:border-r"
      style={{ background: 'var(--canvas)', borderColor: 'var(--border)' }}
    >
      {/* Head */}
      <div
        className="flex flex-none flex-col gap-2 border-b px-4 py-3"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center justify-between gap-2">
          <h2
            className="m-0 text-[13.5px] font-semibold uppercase tracking-[0.06em]"
            style={{ color: 'var(--t3)' }}
          >
            Cases in run
          </h2>
          <span className="font-mono text-[10.5px] font-bold">
            <span style={{ color: 'var(--pass)' }}>{counts.pass}</span>
            <Sep />
            <span style={{ color: 'var(--fail)' }}>{counts.fail}</span>
            <Sep />
            <span style={{ color: 'var(--warn)' }}>{counts.flaky}</span>
            <Sep />
            <span style={{ color: 'var(--info)' }}>{counts.running}</span>
          </span>
        </div>
        <div className="relative">
          <Search
            size={13}
            aria-hidden="true"
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--t3)' }}
          />
          <input
            type="search"
            placeholder="Filter cases…"
            className="h-9 w-full rounded-md border bg-[var(--canvas)] pl-8 pr-3 text-[12.5px] outline-none focus:border-[var(--primary)]"
            style={{ borderColor: 'var(--border)', color: 'var(--t2)' }}
            onChange={() =>
              console.info('pattern-a:deferred:f19:case-filter', { kind: 'client-side' })
            }
          />
        </div>
      </div>

      {/* Rows */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {rows.map((r) => {
          const isActive = r.isActive;
          const tones = STATUS_COLOR[r.status];
          return (
            <button
              key={r.id}
              type="button"
              aria-current={isActive ? 'true' : undefined}
              onClick={() => onCaseClick(r.id)}
              onMouseEnter={(e) => {
                // Canonical F19 v2 HTML hover bg = var(--raised). Inline
                // style below always wins over Tailwind hover:* — use JS
                // handlers to apply hover bg to non-active rows.
                if (!isActive) e.currentTarget.style.background = 'var(--raised)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = 'transparent';
              }}
              className="flex w-full items-center gap-2.5 border-b px-4 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--secondary)]"
              style={{
                borderColor: 'var(--border)',
                background: isActive ? 'var(--primary-soft)' : 'transparent',
                borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
              }}
            >
              <span
                className="inline-flex h-5 w-5 flex-none items-center justify-center rounded-full border"
                style={{
                  background: tones.bg,
                  color: tones.fg,
                  borderColor: tones.bd,
                  animation:
                    r.status === 'running' ? 'f19Pulse 1.2s ease-in-out infinite' : undefined,
                }}
              >
                <StatusIcon status={r.status} />
              </span>
              <div className="flex min-w-0 flex-col">
                <span
                  className="font-mono text-[10.5px] font-medium"
                  style={{ color: r.status === 'queued' ? 'var(--t4)' : 'var(--t3)' }}
                >
                  {r.id} · {r.seq}
                </span>
                <span
                  className="truncate text-[12px]"
                  style={{
                    color: r.status === 'queued' ? 'var(--t3)' : 'var(--t1)',
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  {r.title}
                  {r.titleMonoToken && (
                    <>
                      {' '}
                      <code
                        className="rounded px-1 font-mono text-[11px]"
                        style={{ background: 'var(--canvas)', color: 'var(--ai-accent)' }}
                      >
                        {r.titleMonoToken}
                      </code>
                    </>
                  )}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function Sep() {
  return (
    <span className="mx-1.5 font-normal" style={{ color: 'var(--border-strong)' }}>
      ·
    </span>
  );
}

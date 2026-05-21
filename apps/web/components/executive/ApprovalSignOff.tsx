'use client';

import { f25Demo } from './data/canned-data';
import { Check, Clock, Download } from 'lucide-react';

export function ApprovalSignOff() {
  const { approvals } = f25Demo;

  return (
    <section
      data-canonical-section="approval"
      role="region"
      aria-label="Approval and sign-off"
      className="grid grid-cols-1 items-start gap-[18px] rounded-xl border border-[color:var(--p-border)] bg-[color:var(--p-card-soft)] p-[18px] md:grid-cols-3 md:gap-6 md:p-5 lg:px-6 xl:grid-cols-[1fr_1fr_1fr_auto] xl:items-center"
    >
      {approvals.map((a, i) => (
        <div
          key={a.label}
          className={`flex flex-col gap-1 border-b border-[color:var(--p-border)] pb-3.5 md:border-b-0 md:pb-0 ${
            i < approvals.length - 1
              ? 'md:border-r md:border-[color:var(--p-border)] md:pr-[18px]'
              : ''
          } ${i === approvals.length - 1 ? 'xl:border-r-0 xl:pr-0' : ''}`}
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[color:var(--p-text-3)]">
            {a.label}
          </span>
          <span className="flex items-center gap-2 text-sm font-semibold text-[color:var(--p-text-1)]">
            <Avatar tone={a.avatarTone} initials={a.initials} />
            {a.name}
          </span>
          <span className="text-[11px] text-[color:var(--p-text-3)]">{a.role}</span>
          <StatusPill status={a.status} statusDate={a.statusDate} />
        </div>
      ))}

      <div className="flex flex-row flex-wrap items-center gap-2 xl:flex-col xl:items-end xl:items-stretch">
        <button
          type="button"
          className="inline-flex h-10 items-center gap-1.5 rounded-md border border-[color:var(--p-border-strong)] bg-[color:var(--p-card)] px-4 text-[13px] font-semibold leading-none text-[color:var(--p-text-1)] shadow-sm hover:border-[color:var(--p-text-3)] hover:bg-[color:var(--p-card-soft)]"
        >
          <Download className="h-3.5 w-3.5" strokeWidth={2} />
          Export PDF
        </button>
        <button
          type="button"
          className="inline-flex h-10 items-center gap-1.5 rounded-md border border-[color:var(--p-primary)] bg-[color:var(--p-primary)] px-4 text-[13px] font-semibold leading-none text-[color:var(--p-canvas)] shadow-sm hover:opacity-90"
        >
          <Check className="h-3.5 w-3.5" strokeWidth={2.4} />
          Approve release
        </button>
      </div>
    </section>
  );
}

function Avatar({ tone, initials }: { tone: 'green' | 'amber' | 'violet'; initials: string }) {
  const cls = {
    green:
      'bg-[color:var(--p-primary-bg)] text-[color:var(--p-primary)] border-[color:var(--p-primary)]',
    amber:
      'bg-[color:var(--p-warn-bg)] text-[color:var(--p-warn)] border-[color:var(--p-warn-line)]',
    violet:
      'bg-[color:var(--p-secondary-bg)] text-[color:var(--p-secondary)] border-[color:var(--p-secondary-line)]',
  }[tone];
  return (
    <span
      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[9.5px] font-[JetBrains_Mono] font-bold ${cls}`}
    >
      {initials}
    </span>
  );
}

function StatusPill({
  status,
  statusDate,
}: {
  status: 'approved' | 'pending';
  statusDate: string;
}) {
  const isApproved = status === 'approved';
  return (
    <span
      className={`mt-1 inline-flex h-[22px] w-fit items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-semibold leading-none ${
        isApproved
          ? 'border-[color:var(--p-pass-line)] bg-[color:var(--p-pass-bg)] text-[color:var(--p-pass)]'
          : 'border-[color:var(--p-warn-line)] bg-[color:var(--p-warn-bg)] text-[color:var(--p-warn)]'
      } `}
    >
      {isApproved ? (
        <Check className="h-2.5 w-2.5" strokeWidth={3} />
      ) : (
        <Clock className="h-2.5 w-2.5" strokeWidth={2.5} />
      )}
      {isApproved ? `Approved · ${statusDate}` : `Pending · ${statusDate}`}
    </span>
  );
}

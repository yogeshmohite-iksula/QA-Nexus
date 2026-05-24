// F23 Reports Studio — Region 3: AI savings tile + Saved reports + Scheduled.
// Source: handoff/F23/spec.json §sections[region-3-saved-and-scheduled].
//
// Only shown when canvas state == 'result' per spec §visibility.
// Tonight: structural skeleton + grid of saved cards + scheduled rows.

'use client';

import { f23CannedData } from './canned-data';

interface Props {
  onSavedClick: (id: string) => void;
  onNewBlank: () => void;
}

export function RegionSavedScheduled({ onSavedClick, onNewBlank }: Props) {
  return (
    <section
      role="region"
      aria-label="Saved reports and scheduled distributions"
      className="flex flex-none flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8"
      style={{ background: 'var(--canvas)', borderTop: '1px solid var(--border)' }}
    >
      {/* .ai-tile L403 — rgba(167,139,250,0.06) bg, --ai-line border, radius 10,
          INLINE sentence: "**312 h** saved YTD by Composer ⓘ + Sherlock ⓘ + Curator ⓘ · across all reports run" */}
      <div
        role="status"
        aria-label="AI-generation savings YTD"
        className="flex flex-wrap items-center gap-2.5 text-[12.5px]"
        style={{
          background: 'rgba(167,139,250,0.06)',
          border: '1px solid var(--ai-line)',
          borderRadius: 10,
          padding: '10px 14px',
          color: 'var(--t2)',
        }}
      >
        <span
          aria-hidden="true"
          className="inline-flex h-6 w-6 flex-none items-center justify-center"
          style={{
            background: 'var(--ai-soft)',
            border: '1px solid var(--ai-line)',
            borderRadius: 6,
            color: 'var(--secondary)',
          }}
        >
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.7}
            strokeLinecap="round"
            strokeLinejoin="round"
            width={13}
            height={13}
          >
            <path d="M8 1l1.8 4.4L14 6.4l-3.2 3 1 4.4L8 11.6l-3.8 2.2 1-4.4L2 6.4l4.2-1z" />
          </svg>
        </span>
        <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
          <b
            style={{
              color: 'var(--t1)',
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              fontWeight: 600,
            }}
          >
            312 h
          </b>
          <span>saved YTD by</span>
          <AgentInline name="Composer" />
          <span aria-hidden="true">+</span>
          <AgentInline name="Sherlock" />
          <span aria-hidden="true">+</span>
          <AgentInline name="Curator" />
          <span style={{ color: 'var(--t3)' }}>· across all reports run</span>
        </span>
      </div>

      {/* Saved reports — header with count + Manage all link per L1237 */}
      <div role="region" aria-label="Saved report templates" className="flex flex-col gap-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <h3
            className="m-0 flex items-baseline gap-2 text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--t3)' }}
          >
            Saved reports
            <span
              aria-label="count"
              className="inline-flex items-center font-mono text-[10px] font-bold"
              style={{
                background: 'var(--raised)',
                color: 'var(--t2)',
                border: '1px solid var(--border)',
                padding: '1px 6px',
                borderRadius: 999,
              }}
            >
              {f23CannedData.saved_reports.length - 1}
            </span>
          </h3>
          <a
            href="#"
            className="inline-flex items-center gap-1 font-mono text-[11px] hover:underline"
            style={{ color: 'var(--secondary)' }}
          >
            Manage all →
          </a>
        </div>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {f23CannedData.saved_reports.map((s) => (
            <SavedCard
              key={s.id}
              report={s}
              onClick={() => ('is_new' in s && s.is_new ? onNewBlank() : onSavedClick(s.id))}
            />
          ))}
        </div>
      </div>

      {/* Scheduled rail — .sec-h L412 with count + Manage link */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <h3
            className="m-0 flex items-baseline gap-2 text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--t3)' }}
          >
            Scheduled &amp; recurring
            <span
              aria-label="count"
              className="inline-flex items-center font-mono text-[10px] font-bold"
              style={{
                background: 'var(--raised)',
                color: 'var(--t2)',
                border: '1px solid var(--border)',
                padding: '1px 6px',
                borderRadius: 999,
              }}
            >
              {f23CannedData.scheduled.length}
            </span>
          </h3>
          <a
            href="#"
            className="inline-flex items-center gap-1 font-mono text-[11px] hover:underline"
            style={{ color: 'var(--secondary)' }}
          >
            Manage →
          </a>
        </div>
        {/* .sched-card L455 — bg --base, border, radius 10, overflow hidden,
            rows separated by border-top --border (NOT gap-2 between cards) */}
        <div
          role="region"
          aria-label="Scheduled and recurring distributions"
          className="flex flex-col overflow-hidden"
          style={{
            background: 'var(--base)',
            border: '1px solid var(--border)',
            borderRadius: 10,
          }}
        >
          {f23CannedData.scheduled.map((s) => (
            <ScheduledRow key={s.id} row={s} />
          ))}
        </div>
      </div>
    </section>
  );
}

// Use the union from canned-data directly so readonly tuple shapes pass through.
type SavedReport = (typeof f23CannedData.saved_reports)[number];

// .ai-tile .agent / .agent-i L407-408 — violet text + ⓘ chip
function AgentInline({ name }: { name: string }) {
  return (
    <span
      className="inline-flex items-center"
      style={{ color: 'var(--secondary)', fontWeight: 600 }}
    >
      {name}
      <span
        aria-hidden="true"
        className="ml-0.5 inline-flex items-center justify-center font-bold italic"
        style={{
          width: 11,
          height: 11,
          borderRadius: 999,
          background: 'var(--ai-soft)',
          border: '1px solid var(--ai-line)',
          color: 'var(--secondary)',
          fontSize: 8,
        }}
      >
        i
      </span>
    </span>
  );
}

// .saved-card.kind-ic tone variants L437-440. Maps to report.kind from canned-data.
const KIND_TONE: Record<string, { bg: string; bd: string; fg: string }> = {
  cycle: { bg: 'var(--primary-soft)', bd: 'var(--primary-line)', fg: 'var(--primary)' },
  defect: { bg: 'var(--fail-soft)', bd: 'var(--fail-line)', fg: 'var(--fail)' },
  agent: { bg: 'var(--ai-soft)', bd: 'var(--ai-line)', fg: 'var(--secondary)' },
  sprint: { bg: 'var(--info-soft)', bd: 'var(--info-line)', fg: 'var(--info)' },
  coverage: { bg: 'var(--warn-soft)', bd: 'var(--warn-line)', fg: 'var(--warn)' },
  reqcov: { bg: 'var(--primary-soft)', bd: 'var(--primary-line)', fg: 'var(--primary)' },
};
const KIND_PATH: Record<string, string> = {
  cycle: 'M2 11l3-3 2 2 5-5',
  defect: 'M7 3a2 2 0 0 1 2 0v10a2 2 0 0 1-2 0z',
  agent: 'M3 3h10v10H3zM3 7h10M7 3v10',
  sprint: 'M3 11l5-5 4 4 1-1',
  coverage: 'M2 13h12M4 10v3M7 6v7M10 8v5M13 3v10',
  reqcov: 'M5 8l3 3 5-7',
};
// Updated/relative date per saved-card id (canonical L1244-1300).
const UPDATED: Record<string, string> = {
  'wkly-cpr': '2d ago',
  'daily-da': 'today 9:00 AM',
  's42-ac': 'today 7:15 AM',
  'cov-mod': 'May 17',
  's42-bd': 'today 6:00 AM',
  'rcov-ret': 'May 16',
  rfp: '3h ago',
  'p01-da': 'today 11:00 AM',
  'wkly-ac': 'Mon 7:15 AM',
  'daily-sp': 'today 6:30 AM',
  'cov-aut': 'May 15',
};
function avatarGradient(initials: string): string {
  const grads = [
    'linear-gradient(135deg, var(--primary), var(--secondary))',
    'linear-gradient(135deg, var(--info), var(--secondary))',
    'linear-gradient(135deg, var(--pass), var(--info))',
    'linear-gradient(135deg, var(--warn), var(--fail))',
    'linear-gradient(135deg, var(--secondary), var(--info))',
    'linear-gradient(135deg, var(--primary), var(--info))',
    'linear-gradient(135deg, var(--fail), var(--warn))',
    'linear-gradient(135deg, var(--pass), var(--primary))',
  ];
  let h = 0;
  for (let i = 0; i < initials.length; i++) h = (h * 31 + initials.charCodeAt(i)) | 0;
  return grads[Math.abs(h) % grads.length];
}

function SavedCard({ report, onClick }: { report: SavedReport; onClick: () => void }) {
  const isNew = 'is_new' in report && report.is_new === true;
  const isDraft = 'draft' in report && report.draft === true;

  // .saved-card.new L450 — dashed --ai-line + violet tile icon
  if (isNew) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex flex-col items-center justify-center gap-2 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
        style={{
          minHeight: 120,
          padding: 11,
          borderRadius: 8,
          background: 'rgba(167,139,250,0.04)',
          border: '1px dashed var(--ai-line)',
          color: 'var(--secondary)',
        }}
      >
        <span
          aria-hidden="true"
          className="inline-flex items-center justify-center"
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'var(--ai-soft)',
            border: '1px solid var(--ai-line)',
          }}
        >
          <svg
            viewBox="0 0 16 16"
            width={14}
            height={14}
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
          >
            <path d="M8 3v10M3 8h10" />
          </svg>
        </span>
        <span className="text-[12.5px] font-semibold">New from blank</span>
      </button>
    );
  }

  const tone = KIND_TONE[report.kind] ?? KIND_TONE.cycle;
  const pathD = KIND_PATH[report.kind] ?? KIND_PATH.cycle;
  const updated = UPDATED[report.id] ?? '';

  // .saved-card L432 — bg --raised, border --border, radius 8, padding 11, gap 7
  return (
    <div
      className="flex flex-col"
      style={{
        background: 'var(--raised)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: 11,
        gap: 7,
        minWidth: 0,
      }}
    >
      {/* .top L434 — kind-ic + draft pill (ml-auto) */}
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="inline-flex flex-none items-center justify-center"
          style={{
            width: 22,
            height: 22,
            borderRadius: 5,
            background: tone.bg,
            border: `1px solid ${tone.bd}`,
            color: tone.fg,
          }}
        >
          <svg
            viewBox="0 0 16 16"
            width={12}
            height={12}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d={pathD} />
          </svg>
        </span>
        {isDraft && (
          <span
            className="ml-auto font-bold uppercase"
            style={{
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              fontSize: 9,
              color: 'var(--t4)',
              background: 'var(--base)',
              border: '1px solid var(--border)',
              padding: '1px 5px',
              borderRadius: 3,
              letterSpacing: '0.06em',
              lineHeight: 1,
            }}
          >
            Draft
          </span>
        )}
      </div>

      {/* .ttl L442 — 12.5px bold --t1 line-clamp 2 */}
      <span
        className="line-clamp-2 text-[12.5px] font-semibold"
        style={{ color: 'var(--t1)', lineHeight: 1.3 }}
      >
        {report.title}
      </span>

      {/* .meta L443 — JBM 10px --t3 + avatar gradient + owner name + relative date */}
      <span
        className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5"
        style={{
          fontFamily: 'var(--font-jetbrains-mono), monospace',
          fontSize: 10,
          color: 'var(--t3)',
        }}
      >
        {report.owner_initials && (
          <span
            aria-hidden="true"
            className="inline-flex flex-none items-center justify-center font-bold"
            style={{
              width: 16,
              height: 16,
              borderRadius: 999,
              background: avatarGradient(report.owner_initials),
              color: '#0B0F17',
              fontSize: 8,
            }}
            title={report.owner ?? undefined}
          >
            {report.owner_initials}
          </span>
        )}
        {report.owner && <span style={{ color: 'var(--t2)' }}>{report.owner}</span>}
        {updated && (
          <>
            <span aria-hidden="true">·</span>
            <span>{updated}</span>
          </>
        )}
      </span>

      {/* .row L447 — Run primary btn + ghost schedule (margin-left auto) */}
      <div className="mt-auto flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={onClick}
          className="inline-flex items-center gap-1.5 font-semibold transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
          style={{
            height: 28,
            padding: '0 10px',
            borderRadius: 6,
            background: 'var(--primary)',
            border: '1px solid var(--primary)',
            color: 'var(--primary-ink)',
            fontSize: 11,
          }}
        >
          <svg viewBox="0 0 16 16" width={11} height={11} fill="currentColor" aria-hidden="true">
            <path d="M4 3l8 5-8 5V3z" />
          </svg>
          Run
        </button>
        <span
          className="ml-auto truncate"
          style={{
            fontFamily: 'var(--font-jetbrains-mono), monospace',
            fontSize: 10.5,
            color: 'var(--t3)',
          }}
        >
          {report.schedule}
        </span>
      </div>
    </div>
  );
}

type Scheduled = (typeof f23CannedData.scheduled)[number];

function ScheduledRow({ row }: { row: Scheduled }) {
  // .pill L358-362 — height 20, padding 0/7, font 10px JBM bold uppercase 0.04em,
  // tone-coded bg/color/border per status_tone (pass/warn/fail)
  const pillBg =
    row.status_tone === 'pass'
      ? 'var(--pass-soft)'
      : row.status_tone === 'warn'
        ? 'var(--warn-soft)'
        : 'var(--fail-soft)';
  const pillFg =
    row.status_tone === 'pass'
      ? 'var(--pass)'
      : row.status_tone === 'warn'
        ? 'var(--warn)'
        : 'var(--fail)';
  const pillBd =
    row.status_tone === 'pass'
      ? 'var(--pass-line)'
      : row.status_tone === 'warn'
        ? 'var(--warn-line)'
        : 'var(--fail-line)';
  return (
    // .sched-row L456 — grid layout, padding 12/14, border-top --border (first:none)
    <div
      className="grid grid-cols-1 items-start gap-x-3 gap-y-2 sm:grid-cols-[auto_1fr] sm:items-center lg:grid-cols-[auto_1fr_auto]"
      style={{
        padding: '12px 14px',
        borderTop: '1px solid var(--border)',
        minWidth: 0,
      }}
    >
      {/* .sched-cron L460 — JBM 10.5px violet on rgba(167,139,250,0.08) + --ai-line */}
      <span
        className="font-bold"
        style={{
          fontFamily: 'var(--font-jetbrains-mono), monospace',
          fontSize: 10.5,
          color: 'var(--secondary)',
          background: 'rgba(167,139,250,0.08)',
          border: '1px solid var(--ai-line)',
          padding: '3px 7px',
          borderRadius: 4,
          fontWeight: 600,
          lineHeight: 1,
          letterSpacing: '0.02em',
          width: 'fit-content',
          whiteSpace: 'nowrap',
        }}
      >
        {row.cron}
      </span>

      {/* .sched-mid L461 — title 12.5px bold --t1 ellipsis, meta JBM 10px --t3 */}
      <div className="flex min-w-0 flex-col" style={{ gap: 3 }}>
        <span
          className="overflow-hidden text-ellipsis whitespace-nowrap text-[12.5px] font-semibold"
          style={{ color: 'var(--t1)' }}
        >
          {row.title}
        </span>
        <span
          className="overflow-hidden text-ellipsis whitespace-nowrap"
          style={{
            fontFamily: 'var(--font-jetbrains-mono), monospace',
            fontSize: 10,
            color: 'var(--t3)',
          }}
        >
          → <b style={{ color: 'var(--t2)', fontWeight: 600 }}>{row.recipients.split(',')[0]}</b>
          {row.recipients.includes(',') && row.recipients.slice(row.recipients.indexOf(','))}
        </span>
      </div>

      {/* .sched-right L465 — flex gap 6, .pill + 2 .btn-sm */}
      <div className="flex flex-wrap items-center" style={{ gap: 6 }}>
        {/* .pill L358 — rectangular 20h, padding 0/7, JBM 10px bold uppercase 0.04em */}
        <span
          aria-label={`status ${row.status_tone}`}
          className="inline-flex items-center font-bold uppercase"
          style={{
            height: 20,
            padding: '0 7px',
            borderRadius: 4,
            background: pillBg,
            color: pillFg,
            border: `1px solid ${pillBd}`,
            fontFamily: 'var(--font-jetbrains-mono), monospace',
            fontSize: 10,
            letterSpacing: '0.04em',
            lineHeight: 1,
            whiteSpace: 'nowrap',
          }}
        >
          {row.status}
        </span>
        {/* .btn.btn-sm L271 + L280 — height 30, padding 0/10, font 11.5, bg --raised --t1 */}
        {row.actions.map((a) => (
          <button
            key={a}
            type="button"
            className="inline-flex items-center justify-center font-medium transition-colors hover:bg-[var(--overlay)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
            style={{
              height: 30,
              padding: '0 10px',
              borderRadius: 6,
              background: 'var(--raised)',
              border: '1px solid var(--border)',
              color: 'var(--t1)',
              fontSize: 11.5,
            }}
          >
            {a}
          </button>
        ))}
      </div>
    </div>
  );
}

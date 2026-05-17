// F20 Evidence rail — canonical L1067-1205.
// Hard Rule 17: every string from canned-data.ts.
// Day-19 lesson applied: nested <section.ev-section> siblings carry
// data-canonical-section TERTIARY attrs to anchor diff-probe.

'use client';

import { useState } from 'react';
import { Download, Share2, BarChart2, CalendarClock, X } from 'lucide-react';
import {
  F20_EV_ENV,
  F20_EV_HEAD,
  F20_EV_RELATED,
  F20_EV_SCREENSHOTS,
  F20_EV_SELECTED_CASE,
  F20_EV_STACK,
  F20_EV_TABS,
  F20_EV_TABS_ARIA,
  F20_RUN_ACTIONS,
  type EvTab,
  type NarrativeSegment,
  type RelatedDefect,
  type RunActionBtn,
} from './canned-data';

export function EvRail() {
  const [activeTab, setActiveTab] = useState<EvTab['key']>('case');

  return (
    <aside
      aria-label={F20_EV_HEAD.ariaLabel}
      data-canonical-section="ev-rail"
      className="flex min-h-0 flex-col border-l"
      style={{ background: 'var(--canvas)', borderColor: 'var(--border)' }}
    >
      {/* ev-head */}
      <header
        data-canonical-section="ev-head"
        className="flex shrink-0 items-center gap-2 border-b px-4 py-3"
        style={{ borderColor: 'var(--border)' }}
      >
        <h2
          className="m-0 text-[12px] font-bold uppercase tracking-[0.06em]"
          style={{ color: 'var(--t3)' }}
        >
          {F20_EV_HEAD.title}
        </h2>
        {/* Day-20 R2 visual gate fix: "Selected · TC-RET-0342" — case ID
         * styled as violet chip per canonical (matches sel-id pattern). */}
        <span className="inline-flex items-center gap-1.5 text-[10.5px]">
          <span style={{ color: 'var(--t4)' }}>Selected</span>
          <span style={{ color: 'var(--t4)' }}>·</span>
          <span
            className="inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.04em]"
            style={{
              background: 'var(--ai-soft)',
              borderColor: 'var(--ai-line)',
              color: 'var(--ai-accent)',
            }}
          >
            TC-RET-0342
          </span>
        </span>
        <button
          type="button"
          aria-label={F20_EV_HEAD.closeAriaLabel}
          onClick={() => console.info('pattern-a:deferred:f20:close-ev-rail')}
          className="ml-auto inline-flex h-6 w-6 items-center justify-center rounded text-[var(--t3)] transition-colors hover:bg-[var(--raised)] hover:text-[var(--t1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
        >
          <X size={13} aria-hidden="true" strokeWidth={2.2} />
        </button>
      </header>

      {/* ev-tabs */}
      <nav
        role="tablist"
        aria-label={F20_EV_TABS_ARIA}
        className="flex shrink-0 items-center gap-0.5 overflow-x-auto border-b px-3 py-1.5"
        style={{ background: 'var(--base)', borderColor: 'var(--border)' }}
      >
        {F20_EV_TABS.map((tab) => {
          const isOn = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isOn ? 'true' : 'false'}
              onClick={() => {
                setActiveTab(tab.key);
                console.info('pattern-a:deferred:f20:ev-tab', { tab: tab.key });
              }}
              className="inline-flex h-6 items-center gap-1 whitespace-nowrap rounded px-2 text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
              style={{
                background: isOn ? 'var(--overlay)' : 'transparent',
                color: isOn ? 'var(--t1)' : 'var(--t3)',
                fontWeight: isOn ? 600 : 500,
              }}
            >
              {tab.label}
              {tab.count && (
                <span
                  className="font-mono text-[10px] font-bold"
                  style={{ color: isOn ? 'var(--t2)' : 'var(--t4)' }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ev-body */}
      <div className="flex-1 overflow-y-auto px-4 py-3.5">
        <div className="flex flex-col gap-4">
          {/* Day-20 R3 visual gate fix: canonical shows Selected case +
           * Screenshots + Stack trace + Env diff + Related defects ALL
           * visible under the case tab (Overview). Previous R1/R2 hid
           * Screenshots behind the shots tab — incorrect. */}
          {activeTab === 'case' && (
            <>
              <SelectedCase />
              <Screenshots />
              <StackTrace />
              <EnvDiff />
              <RelatedDefects />
            </>
          )}
          {activeTab === 'shots' && <Screenshots />}
          {activeTab === 'console' && <StackTrace />}
          {activeTab === 'har' && <StackTrace />}
          {activeTab === 'env' && <EnvDiff />}
          {activeTab === 'related' && (
            <>
              <SelectedCase />
              <RelatedDefects />
            </>
          )}
        </div>
      </div>

      {/* run-actions (sticky footer) */}
      <footer
        className="flex shrink-0 flex-col gap-1.5 border-t p-3"
        style={{ background: 'var(--base)', borderColor: 'var(--border)' }}
      >
        {F20_RUN_ACTIONS.map((a) => (
          <RunActionButton key={a.label} action={a} />
        ))}
      </footer>
    </aside>
  );
}

// ---- Sections -------------------------------------------------------------

function SelectedCase() {
  const sc = F20_EV_SELECTED_CASE;
  return (
    <SdSection label={sc.sectionLabel} dataSection="selected-case">
      <div
        className="flex flex-col gap-2 rounded-md border p-3"
        style={{ background: 'var(--base)', borderColor: 'var(--border)' }}
      >
        <span className="font-mono text-[11.5px] font-medium" style={{ color: 'var(--t1)' }}>
          {sc.caseId}
        </span>
        <p className="m-0 text-[12px] leading-[17px]" style={{ color: 'var(--t2)' }}>
          {sc.titleSegments.map((seg, i) => (
            <NarrativeSpan key={i} seg={seg} />
          ))}
        </p>
        <div
          className="flex flex-col gap-0.5 rounded-md px-2.5 py-2 font-mono text-[10.5px]"
          style={{ background: 'var(--canvas)', color: 'var(--t2)' }}
        >
          {sc.errorLines.map((e, i) => (
            <div key={i}>
              <b style={{ color: 'var(--fail)' }}>{e.err}</b>
              {e.text}
              <b style={{ color: 'var(--warn)' }}>{e.key}</b>
            </div>
          ))}
          {sc.stackFrames.map((f, i) => (
            <div key={i} style={{ color: 'var(--t4)' }}>
              {f.prefix} <span style={{ color: 'var(--t2)' }}>{f.call}</span> {f.loc}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {sc.actions.map((a) => (
            <button
              key={a.label}
              type="button"
              onClick={() =>
                console.info('pattern-a:deferred:f20:case-action', { action: a.label })
              }
              className="inline-flex h-6 items-center rounded border px-2 text-[10.5px] font-medium transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
              style={
                a.variant === 'primary'
                  ? {
                      background: 'var(--secondary)',
                      borderColor: 'var(--secondary)',
                      color: 'var(--secondary-ink)',
                    }
                  : a.variant === 'tertiary'
                    ? {
                        background: 'transparent',
                        borderColor: 'transparent',
                        color: 'var(--t3)',
                      }
                    : {
                        background: 'var(--raised)',
                        borderColor: 'var(--border)',
                        color: 'var(--t2)',
                      }
              }
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </SdSection>
  );
}

function Screenshots() {
  return (
    <SdSection label={F20_EV_SCREENSHOTS.sectionLabel} dataSection="screenshots">
      <div className="grid grid-cols-3 gap-2">
        {F20_EV_SCREENSHOTS.shots.map((s) => (
          <div
            key={s.caption}
            className="flex aspect-video flex-col items-center justify-end rounded border text-center"
            style={{
              background: 'var(--canvas)',
              borderColor: 'var(--border)',
              color: 'var(--t4)',
            }}
          >
            <span className="p-1 text-[9.5px]">{s.caption}</span>
          </div>
        ))}
      </div>
    </SdSection>
  );
}

function StackTrace() {
  const st = F20_EV_STACK;
  return (
    <SdSection label={st.sectionLabel} dataSection="stack-trace">
      <div
        className="flex flex-col gap-0.5 rounded-md px-2.5 py-2 font-mono text-[10.5px]"
        style={{ background: 'var(--canvas)', color: 'var(--t2)' }}
      >
        <div>
          <b style={{ color: 'var(--fail)' }}>{st.errType}</b>
          {st.errMessage}
          <b style={{ color: 'var(--warn)' }}>{st.errKey}</b>
          {st.errSuffix}
        </div>
        {st.frames.map((f, i) => (
          <div key={i} style={{ color: 'var(--t4)' }}>
            {f.prefix} <span style={{ color: 'var(--t2)' }}>{f.call}</span> {f.loc}
          </div>
        ))}
        <div className="text-center text-[9.5px]" style={{ color: 'var(--t4)' }}>
          {st.hiddenLabel}
        </div>
      </div>
    </SdSection>
  );
}

function EnvDiff() {
  return (
    <SdSection label={F20_EV_ENV.sectionLabel} dataSection="env-diff">
      <div className="flex flex-col gap-1">
        {F20_EV_ENV.rows.map((r) => (
          <div
            key={r.label}
            className="flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-[11px]"
            style={{ background: 'var(--base)', borderColor: 'var(--border)' }}
          >
            <span
              className="w-24 shrink-0 text-[10px] font-bold uppercase tracking-[0.04em]"
              style={{ color: 'var(--t3)' }}
            >
              {r.label}
            </span>
            <span className="font-mono" style={{ color: 'var(--t4)' }}>
              {r.from}
            </span>
            <span style={{ color: 'var(--t3)' }}>→</span>
            <span className="font-mono" style={{ color: 'var(--t1)' }}>
              {r.to}
            </span>
          </div>
        ))}
      </div>
    </SdSection>
  );
}

function RelatedDefects() {
  return (
    <SdSection label={F20_EV_RELATED.sectionLabel} dataSection="related-defects">
      <div className="flex flex-col gap-1">
        {F20_EV_RELATED.defects.map((d) => (
          <RelatedRow key={d.id} d={d} />
        ))}
      </div>
    </SdSection>
  );
}

function RelatedRow({ d }: { d: RelatedDefect }) {
  const statusStyle =
    d.statusTone === 'closed'
      ? { bg: 'var(--overlay)', bd: 'var(--border-strong)', fg: 'var(--t3)' }
      : { bg: 'var(--warn-soft)', bd: 'var(--warn-line)', fg: 'var(--warn)' };
  return (
    <button
      type="button"
      onClick={() => console.info('pattern-a:deferred:f20:related', { id: d.id })}
      className="flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-left transition-colors hover:bg-[var(--raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
      style={{ background: 'var(--base)', borderColor: 'var(--border)' }}
    >
      <span className="font-mono text-[11px] font-medium" style={{ color: 'var(--t1)' }}>
        {d.id}
      </span>
      <span
        className="ml-auto font-mono text-[10.5px] font-bold"
        style={{ color: 'var(--ai-accent)' }}
      >
        {d.similarity}
      </span>
      <span
        className="inline-flex items-center rounded border px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.04em]"
        style={{ background: statusStyle.bg, borderColor: statusStyle.bd, color: statusStyle.fg }}
      >
        {d.status}
      </span>
    </button>
  );
}

function RunActionButton({ action }: { action: RunActionBtn }) {
  const Icon =
    action.icon === 'export'
      ? Download
      : action.icon === 'share'
        ? Share2
        : action.icon === 'compare'
          ? BarChart2
          : CalendarClock;
  return (
    <button
      type="button"
      onClick={() => console.info('pattern-a:deferred:f20:run-action', { action: action.label })}
      className="inline-flex h-8 items-center gap-2 rounded-md border px-2.5 text-[11px] font-medium transition-colors hover:bg-[var(--raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
      style={{
        background: 'var(--canvas)',
        borderColor: 'var(--border)',
        color: 'var(--t2)',
      }}
    >
      <Icon size={13} aria-hidden="true" />
      <span>{action.label}</span>
      {action.meta && (
        <span className="ml-auto text-[10px]" style={{ color: 'var(--t4)' }}>
          {action.meta}
        </span>
      )}
    </button>
  );
}

function SdSection({
  label,
  children,
  dataSection,
}: {
  label: string;
  children: React.ReactNode;
  dataSection: string;
}) {
  return (
    <section data-canonical-section={`ev-${dataSection}`} className="flex flex-col gap-1.5">
      <span
        className="font-mono text-[10px] font-bold uppercase tracking-[0.06em]"
        style={{ color: 'var(--t3)' }}
      >
        {label}
      </span>
      {children}
    </section>
  );
}

function NarrativeSpan({ seg }: { seg: NarrativeSegment }) {
  if (seg.kind === 'bold') return <b style={{ color: 'var(--t1)' }}>{seg.value}</b>;
  if (seg.kind === 'mono')
    return (
      <code
        className="rounded px-1 font-mono text-[11px]"
        style={{ background: 'var(--canvas)', color: 'var(--ai-accent)' }}
      >
        {seg.value}
      </code>
    );
  return <>{seg.value}</>;
}

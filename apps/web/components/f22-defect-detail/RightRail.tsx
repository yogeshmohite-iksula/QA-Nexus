'use client';
// Implements F22 right rail — 5 cards: Defect / People / Linkage /
// Sherlock layer scores / Recent activity.
// Canonical: PM1_UI_v2/Redesign Frame by claude design/F22 Defect Detail v2.html L930-988.
// Strings trace to canned-data.ts (Hard Rule 17).

import { useState } from 'react';
import { SlidersHorizontal, X, ExternalLink } from 'lucide-react';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { AgentName } from './agents/AgentName';
import type { RightRailMeta, RailKvRow, RailLayerScore, RailActivityEvent } from './types';

const TONE_COLOR = {
  fail: 'var(--fail)',
  warn: 'var(--warn)',
  pass: 'var(--pass)',
  info: 'var(--info)',
} as const;

function Avatar({ initials, bg }: { initials: string; bg: string }) {
  return (
    <span
      className="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full font-mono text-[9px] font-semibold text-[color:var(--canvas)]"
      style={{ background: bg }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

function KvList({ rows }: { rows: RailKvRow[] }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[12px]">
      {rows.map((r) => (
        <div key={r.k} className="contents">
          <dt className="font-mono text-[10.5px] uppercase tracking-[0.05em] text-[color:var(--t3)]">
            {r.k}
          </dt>
          <dd className="min-w-0 break-words text-[color:var(--t2)]">
            {r.tone ? (
              (() => {
                const isPill = r.k === 'priority' || r.k === 'status';
                const pillStyle = isPill
                  ? {
                      background:
                        r.tone === 'fail'
                          ? 'var(--fail-soft)'
                          : r.tone === 'warn'
                            ? 'var(--warn-soft)'
                            : r.tone === 'pass'
                              ? 'var(--pass-soft)'
                              : 'var(--info-soft)',
                      borderColor:
                        r.tone === 'fail'
                          ? 'var(--fail-line)'
                          : r.tone === 'warn'
                            ? 'var(--warn-line)'
                            : r.tone === 'pass'
                              ? 'var(--pass-line)'
                              : 'var(--info-line)',
                      color: TONE_COLOR[r.tone],
                    }
                  : { color: TONE_COLOR[r.tone] };
                return (
                  <span
                    className={
                      isPill
                        ? 'inline-flex h-5 items-center gap-1 rounded-sm border px-2 font-mono text-[10.5px] font-semibold'
                        : ''
                    }
                    style={pillStyle}
                  >
                    {isPill ? (
                      <>
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: TONE_COLOR[r.tone!] }}
                          aria-hidden="true"
                        />
                        {r.v}
                      </>
                    ) : (
                      r.v
                    )}
                  </span>
                );
              })()
            ) : r.k === 'id' ? (
              <span className="font-mono text-[color:var(--t1)]">{r.v}</span>
            ) : r.k === 'jira' || r.k === 'test case' || r.k === 'source run' ? (
              <a href="#" className="font-mono text-[color:var(--info)] hover:underline">
                {r.v}
              </a>
            ) : (
              <span className={r.k === 'component' ? 'font-mono text-[10.5px]' : ''}>{r.v}</span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function LayerScores({ scores }: { scores: RailLayerScore[] }) {
  const toneColor = (t: RailLayerScore['tone']) =>
    t === 'high' ? 'var(--pass)' : t === 'med' ? 'var(--warn)' : 'var(--fail)';
  return (
    <div className="mt-1 flex flex-col gap-2">
      {scores.map((s) => (
        <div
          key={s.num}
          data-canonical-section="layer-mini"
          className="grid grid-cols-[auto_1fr_auto] items-center gap-2"
        >
          <span className="font-mono text-[10px] tabular-nums text-[color:var(--t3)]">{s.num}</span>
          <span className="text-[11.5px] text-[color:var(--t2)]">{s.name}</span>
          <span
            className="font-mono text-[11px] font-semibold"
            style={{ color: toneColor(s.tone) }}
          >
            {s.pct}%
          </span>
          <span className="col-span-3 h-1 overflow-hidden rounded-full bg-[color:var(--border)]">
            <span
              className="block h-full"
              style={{ width: `${s.pct}%`, background: toneColor(s.tone) }}
              aria-hidden="true"
            />
          </span>
        </div>
      ))}
    </div>
  );
}

const ACT_DOT: Record<string, string> = {
  warn: 'var(--warn)',
  ai: 'var(--secondary)',
  now: 'var(--info)',
  ok: 'var(--pass)',
  '': 'var(--t4)',
};

function ActList({ events }: { events: RailActivityEvent[] }) {
  return (
    <div data-canonical-section="act-list" className="flex flex-col gap-2.5">
      {events.map((e, i) => (
        <div
          key={i}
          data-canonical-section="act-row"
          className="flex items-start gap-2 text-[11.5px]"
        >
          <span
            className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ background: ACT_DOT[e.tag ?? ''] ?? 'var(--t4)' }}
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1 leading-[1.5] text-[color:var(--t2)]">
            <b className="font-semibold text-[color:var(--t1)]">{e.actor}</b> {e.text}
            <span className="ml-1.5 font-mono text-[10.5px] text-[color:var(--t3)]">{e.when}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function Card({
  title,
  children,
  dataCanonical,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  dataCanonical: string;
}) {
  return (
    <div
      data-canonical-section={dataCanonical}
      className="rounded-lg border border-[color:var(--border)] bg-[color:var(--raised)] p-3"
    >
      <h5 className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.06em] text-[color:var(--t3)]">
        {title}
      </h5>
      {children}
    </div>
  );
}

function Body({ meta }: { meta: RightRailMeta }) {
  return (
    <div className="flex flex-col gap-3">
      <Card title="Defect" dataCanonical="rail-card-defect">
        <KvList rows={meta.defect} />
      </Card>

      <Card title="People" dataCanonical="rail-card-people">
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[12px]">
          <dt className="font-mono text-[10.5px] uppercase tracking-[0.05em] text-[color:var(--t3)]">
            assigned
          </dt>
          <dd className="flex items-center gap-1.5 text-[color:var(--t2)]">
            <Avatar initials={meta.people.assigned.initials} bg="#FBBF24" />{' '}
            {meta.people.assigned.name}
          </dd>
          <dt className="font-mono text-[10.5px] uppercase tracking-[0.05em] text-[color:var(--t3)]">
            reported
          </dt>
          <dd className="flex items-center gap-1.5 text-[color:var(--t2)]">
            <Avatar initials={meta.people.reported.initials} bg="#60A5FA" />{' '}
            {meta.people.reported.name}
          </dd>
          <dt className="font-mono text-[10.5px] uppercase tracking-[0.05em] text-[color:var(--t3)]">
            watching
          </dt>
          <dd className="text-[color:var(--t2)]">{meta.people.watching}</dd>
        </dl>
      </Card>

      <Card title="Linkage" dataCanonical="rail-card-linkage">
        <KvList rows={meta.linkage} />
      </Card>

      <Card
        title={
          <span>
            <AgentName code="sherlock" /> · layer scores
          </span>
        }
        dataCanonical="rail-card-layer-scores"
      >
        <LayerScores scores={meta.layerScores} />
      </Card>

      <Card title="Recent activity" dataCanonical="rail-card-activity">
        <ActList events={meta.recentActivity} />
      </Card>
    </div>
  );
}

export function RightRail({ meta }: { meta: RightRailMeta }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {/* Mobile drawer trigger */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-md border border-[color:var(--border)] bg-[color:var(--raised)] px-4 text-[13px] font-medium text-[color:var(--t1)]"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
          Defect metadata
        </button>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side="right"
            className="w-full border-l border-[color:var(--border)] bg-[color:var(--base)] sm:max-w-md"
            aria-label="Defect metadata"
          >
            <SheetTitle className="px-4 pt-4 font-mono text-[12px] uppercase tracking-[0.08em] text-[color:var(--t3)]">
              Defect metadata
            </SheetTitle>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close drawer"
              className="absolute right-3 top-3 inline-flex h-11 w-11 items-center justify-center rounded-md text-[color:var(--t3)] hover:bg-[color:var(--raised)] hover:text-[color:var(--t1)]"
            >
              <ExternalLink className="h-4 w-4 rotate-45" aria-hidden="true" />
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
            <div className="p-4">
              <Body meta={meta} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop sticky aside */}
      <aside
        role="complementary"
        aria-label="Defect metadata"
        data-canonical-section="def-rail"
        className="hidden lg:sticky lg:top-20 lg:block lg:self-start"
      >
        <Body meta={meta} />
      </aside>
    </>
  );
}

// Implements F22 Discussion section with two-way Jira sync.
// Canonical: PM1_UI_v2/Redesign Frame by claude design/F22 Defect Detail v2.html L890-924.
// Strings trace to canned-data.ts (Hard Rule 17).

import { RefreshCw, FlaskConical, ExternalLink } from 'lucide-react';
import type { DiscussionComment } from './types';

const SRC_PILL = {
  'QA Nexus': {
    bg: 'var(--primary-soft)',
    border: 'var(--primary-line)',
    fg: 'var(--primary)',
    icon: 'flask' as const,
  },
  Jira: {
    bg: 'var(--info-soft)',
    border: 'var(--info-line)',
    fg: 'var(--info)',
    icon: 'extlink' as const,
  },
  'QA LEAD': { bg: 'var(--ai-soft)', border: 'var(--ai-line)', fg: 'var(--secondary)', icon: null },
};

const TAG_TONE = {
  fail: { bg: 'var(--fail-soft)', border: 'var(--fail-line)', fg: 'var(--fail)' },
  warn: { bg: 'var(--warn-soft)', border: 'var(--warn-line)', fg: 'var(--warn)' },
  pass: { bg: 'var(--pass-soft)', border: 'var(--pass-line)', fg: 'var(--pass)' },
  info: { bg: 'var(--info-soft)', border: 'var(--info-line)', fg: 'var(--info)' },
  secondary: { bg: 'var(--ai-soft)', border: 'var(--ai-line)', fg: 'var(--secondary)' },
};

interface Props {
  meta: { count: number; jiraKey: string; syncedAgo: string };
  comments: DiscussionComment[];
}

export function DiscussionThread({ meta, comments }: Props) {
  return (
    <section
      role="region"
      aria-label="Discussion"
      data-canonical-section="section-discussion"
      className="space-y-3"
    >
      <header data-canonical-section="sec-head" className="flex flex-wrap items-center gap-2">
        <h2 className="font-display text-[15px] font-bold text-[color:var(--t1)]">Discussion</h2>
        <span className="text-[11.5px] text-[color:var(--t3)]">
          {meta.count} comments · two-way Jira sync ·{' '}
          <span className="font-mono text-[color:var(--t2)]">{meta.jiraKey}</span>
        </span>
        <span className="ml-auto inline-flex h-5 items-center gap-1 rounded-sm border border-[color:var(--info-line)] bg-[color:var(--info-soft)] px-2 font-mono text-[10.5px] text-[color:var(--info)]">
          <RefreshCw className="h-3 w-3" aria-hidden="true" />
          Jira ✓ {meta.syncedAgo}
        </span>
      </header>

      <div data-canonical-section="disc-list" className="flex flex-col gap-3">
        {comments.map((c) => {
          const isLead = c.role === 'QA LEAD';
          const src = SRC_PILL[c.role];
          return (
            <article
              key={c.id}
              data-canonical-section={isLead ? 'disc-card-lead' : 'disc-card'}
              className={`rounded-[10px] border bg-[color:var(--base)] px-[14px] py-[13px] ${
                isLead ? 'border-[color:var(--primary-line)]' : 'border-[color:var(--border)]'
              }`}
            >
              <div
                data-canonical-section="disc-head"
                className="mb-2 flex flex-wrap items-center gap-2"
              >
                <span
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-semibold text-[color:var(--canvas)]"
                  style={{
                    background:
                      c.author.initials === 'PA'
                        ? '#60A5FA'
                        : c.author.initials === 'SP'
                          ? '#FBBF24'
                          : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                  }}
                  aria-hidden="true"
                >
                  {c.author.initials}
                </span>
                <span className="text-[13px] font-semibold text-[color:var(--t1)]">
                  {c.author.name}
                </span>
                <span className="font-mono text-[11px] text-[color:var(--t3)]">{c.ts}</span>
                <span
                  className="ml-auto inline-flex h-5 items-center gap-1 rounded-sm border px-2 font-mono text-[10.5px] font-semibold"
                  style={{ background: src.bg, borderColor: src.border, color: src.fg }}
                >
                  {src.icon === 'flask' ? (
                    <FlaskConical className="h-3 w-3" aria-hidden="true" />
                  ) : null}
                  {src.icon === 'extlink' ? (
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  ) : null}
                  {c.role}
                </span>
              </div>
              <p className="text-pretty text-[13.5px] leading-[1.55] text-[color:var(--t2)]">
                {c.body}
                {c.tags?.length ? (
                  <span className="ml-2 inline-flex gap-1.5">
                    {c.tags.map((t) => {
                      const tone = TAG_TONE[t.tone];
                      return (
                        <span
                          key={t.label}
                          className="inline-flex h-[18px] items-center rounded-sm border px-1.5 font-mono text-[10px] font-semibold"
                          style={{ background: tone.bg, borderColor: tone.border, color: tone.fg }}
                        >
                          {t.label}
                        </span>
                      );
                    })}
                  </span>
                ) : null}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

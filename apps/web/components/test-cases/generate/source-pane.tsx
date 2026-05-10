// F16b left pane — Source picker + KB grounding + Provider strip + Generate CTA.
//
// Port of F16b A1 Generate from Requirement v2.html lines 668-794
// (.pane.left). Pattern A: source is pre-selected to RET-247, KB
// chunks are static. The "Generate" CTA stays disabled while
// `isGenerating` is true; in Pattern B Day-15, this fires off the
// real `/api/composer/generate` SSE call.

'use client';

import { useState } from 'react';
import { FileText, Search, Sparkles, Plus } from 'lucide-react';
import { AgentName } from '@/components/ui/agent-name';
import {
  CANNED_REQUIREMENT,
  CANNED_KB_CHUNKS,
  CANNED_PROVIDER,
  type SourceType,
} from './canned-data';

interface SourcePaneProps {
  isGenerating: boolean;
  onGenerate: () => void;
}

export function SourcePane({ isGenerating, onGenerate }: SourcePaneProps) {
  const [sourceType, setSourceType] = useState<SourceType>('requirement');
  const [skipKb, setSkipKb] = useState(false);

  return (
    <section
      className="flex min-h-0 flex-col overflow-hidden border-b lg:border-b-0 lg:border-r"
      style={{
        background: 'var(--canvas)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Pane head */}
      <div
        className="flex-none border-b px-4 pb-2.5 pt-3.5"
        style={{ borderColor: 'var(--border)' }}
      >
        <div
          className="mb-1.5 text-[9.5px] font-bold uppercase leading-none"
          style={{
            letterSpacing: '0.12em',
            color: 'var(--text-tertiary)',
          }}
        >
          Source ·{' '}
          <span className="inline-flex items-center align-baseline">
            <AgentName code="composer" inherit />
          </span>{' '}
          input
        </div>
        <h3
          className="font-display text-[14px] font-bold"
          style={{ color: 'var(--text-primary)', margin: 0 }}
        >
          What should Composer generate from?
        </h3>
      </div>

      {/* Pane body — scrollable column */}
      <div className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto px-4 py-3.5">
        {/* Source-type tabs */}
        <SourceTabs current={sourceType} onChange={setSourceType} />

        {/* Search bar */}
        <SrcSearch />

        {/* Selected source card */}
        <SelectedSourceCard />

        {/* KB grounding panel */}
        <KbGroundingPanel skipKb={skipKb} onSkipKbChange={setSkipKb} />

        {/* Provider strip */}
        <ProviderStrip />

        {/* Generate CTA */}
        <button
          type="button"
          onClick={() => {
            if (!isGenerating) {
              console.info('pattern-a:deferred:f16b:generate-start');
              onGenerate();
            }
          }}
          disabled={isGenerating}
          className="inline-flex h-[42px] flex-none items-center justify-center gap-2 rounded-lg text-[14px] font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] disabled:cursor-not-allowed"
          style={
            isGenerating
              ? {
                  background: 'var(--overlay)',
                  color: 'var(--text-quaternary, var(--text-tertiary))',
                }
              : {
                  background: 'var(--primary)',
                  color: 'var(--primary-ink)',
                }
          }
        >
          <Sparkles size={14} aria-hidden="true" />
          {isGenerating ? 'Generating…' : 'Generate 5 cases'}
        </button>
      </div>
    </section>
  );
}

// ----------------------------------------------------------------------------
// Sub-components
// ----------------------------------------------------------------------------

interface SourceTabsProps {
  current: SourceType;
  onChange: (next: SourceType) => void;
}

function SourceTabs({ current, onChange }: SourceTabsProps) {
  const tabs: { key: SourceType; label: string }[] = [
    { key: 'requirement', label: 'F14 Requirement' },
    { key: 'jira', label: 'Jira Ticket' },
    { key: 'freeform', label: 'Freeform' },
  ];
  return (
    <div
      role="tablist"
      aria-label="Source type"
      className="flex flex-none gap-0.5 rounded-md border p-0.5"
      style={{
        background: 'var(--raised)',
        borderColor: 'var(--border)',
      }}
    >
      {tabs.map((t) => {
        const on = current === t.key;
        return (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => {
              console.info(`pattern-a:deferred:f16b:source-tab:${t.key}`);
              onChange(t.key);
            }}
            className="inline-flex h-[30px] min-w-0 flex-1 items-center justify-center gap-1.5 rounded text-[11.5px] font-medium leading-none transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--secondary)]"
            style={
              on
                ? {
                    background: 'var(--overlay)',
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                  }
                : {
                    color: 'var(--text-tertiary)',
                  }
            }
          >
            <FileText
              size={11}
              aria-hidden="true"
              style={{ color: on ? 'var(--secondary)' : 'currentColor' }}
            />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

function SrcSearch() {
  return (
    <div
      className="flex h-8 flex-none items-center gap-2 rounded-md border px-2.5 text-[12px]"
      style={{
        background: 'var(--raised)',
        borderColor: 'var(--border)',
        color: 'var(--text-tertiary)',
      }}
    >
      <Search size={13} aria-hidden="true" />
      <input
        type="text"
        placeholder="Search RET-, CART-, PAY-, AUTH-, OPS-…"
        className="min-w-0 flex-1 border-0 bg-transparent text-[12.5px] outline-none"
        style={{ color: 'var(--text-primary)' }}
        onChange={() => {
          console.info('pattern-a:deferred:f16b:source-search');
        }}
      />
      <span
        className="font-mono text-[10px]"
        style={{ color: 'var(--text-quaternary, var(--text-tertiary))' }}
      >
        486
      </span>
    </div>
  );
}

function SelectedSourceCard() {
  const req = CANNED_REQUIREMENT;
  return (
    <article
      className="relative flex flex-none flex-col gap-2 overflow-hidden rounded-lg px-3.5 py-3"
      style={{
        background: 'var(--base)',
        border: '1.5px solid rgba(167,139,250,0.30)',
      }}
    >
      <span
        aria-hidden="true"
        className="absolute bottom-0 left-0 top-0 w-[3px]"
        style={{ background: 'var(--secondary)' }}
      />

      <div className="flex items-center gap-2">
        <span
          className="inline-flex items-center rounded-sm px-1.5 py-0.5 font-mono text-[11px] font-bold leading-none"
          style={{
            background: 'rgba(167,139,250,0.12)',
            color: 'var(--ai-accent, var(--secondary))',
            border: '1px solid rgba(167,139,250,0.30)',
            letterSpacing: '0.04em',
          }}
        >
          {req.id}
        </span>
        <span
          className="inline-flex items-center rounded-sm px-1.5 py-0.5 font-mono text-[9.5px] font-semibold uppercase leading-none"
          style={{
            background: 'rgba(52,211,153,0.14)',
            color: 'var(--pass)',
            border: '1px solid rgba(52,211,153,0.34)',
            letterSpacing: '0.06em',
          }}
        >
          {req.status}
        </span>
        <span className="ml-auto font-mono text-[10.5px]" style={{ color: 'var(--text-tertiary)' }}>
          {req.source}
        </span>
      </div>

      <h4
        className="m-0 text-[13px] font-semibold leading-[18px]"
        style={{ color: 'var(--text-primary)' }}
      >
        {req.title}
      </h4>

      <div
        className="flex flex-wrap items-center gap-2 font-mono text-[11px]"
        style={{ color: 'var(--text-tertiary)' }}
      >
        <span>{req.sprint}</span>
        <span style={{ color: 'var(--text-quaternary, var(--text-tertiary))' }}>·</span>
        <span>{req.owner}</span>
        <span style={{ color: 'var(--text-quaternary, var(--text-tertiary))' }}>·</span>
        <span>{req.updatedAgo}</span>
      </div>

      <div className="border-t pt-2" style={{ borderColor: 'var(--border)' }}>
        <span
          className="mb-1 block font-mono text-[9.5px] font-bold uppercase"
          style={{
            color: 'var(--text-quaternary, var(--text-tertiary))',
            letterSpacing: '0.08em',
          }}
        >
          Acceptance criteria
        </span>
        <ul className="m-0 list-none space-y-0.5 pl-0">
          {req.acceptanceCriteria.map((ac) => (
            <li
              key={ac}
              className="text-[11.5px] leading-[16px]"
              style={{ color: 'var(--text-secondary)' }}
            >
              · {ac}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

interface KbGroundingPanelProps {
  skipKb: boolean;
  onSkipKbChange: (skip: boolean) => void;
}

function KbGroundingPanel({ skipKb, onSkipKbChange }: KbGroundingPanelProps) {
  return (
    <div className="flex flex-none flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span
          className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold"
          style={{ color: 'var(--text-secondary)' }}
        >
          <span
            className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-sm"
            style={{
              background: 'rgba(167,139,250,0.12)',
              border: '1px solid rgba(167,139,250,0.30)',
              color: 'var(--secondary)',
            }}
          >
            <Sparkles size={9} aria-hidden="true" />
          </span>
          KB grounding
        </span>
        <span className="font-mono text-[10.5px]" style={{ color: 'var(--text-tertiary)' }}>
          {CANNED_KB_CHUNKS.length} chunks · auto-suggested
        </span>
      </div>

      <ul className="m-0 flex list-none flex-col gap-1.5 pl-0">
        {CANNED_KB_CHUNKS.map((c) => (
          <li
            key={c.id}
            className="relative flex flex-col gap-1.5 rounded-md border px-2.5 py-2"
            style={{
              background: 'var(--base)',
              borderColor: 'var(--border)',
            }}
          >
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className="inline-flex items-center rounded-sm px-1.5 py-px font-mono text-[10px] font-semibold leading-none"
                style={{
                  background: 'rgba(167,139,250,0.12)',
                  color: 'var(--ai-accent, var(--secondary))',
                  border: '1px solid rgba(167,139,250,0.30)',
                }}
              >
                {c.id}
              </span>
              <span
                className="ml-auto font-mono text-[9.5px]"
                style={{ color: 'var(--text-tertiary)' }}
              >
                rel{' '}
                <b style={{ color: 'var(--secondary)', fontWeight: 700 }}>
                  {c.relevance.toFixed(2)}
                </b>
              </span>
            </div>
            <p
              className="m-0 line-clamp-2 text-[11px] leading-[15px]"
              style={{ color: 'var(--text-secondary)' }}
            >
              {c.text}
            </p>
            <span
              className="inline-flex w-fit items-center rounded-sm px-1.5 py-px font-mono text-[9.5px] leading-none"
              style={{
                color: 'var(--info)',
                background: 'rgba(96,165,250,0.12)',
                border: '1px solid rgba(96,165,250,0.30)',
              }}
            >
              {c.location}
            </span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => {
          console.info('pattern-a:deferred:f16b:kb-add-chunk');
        }}
        className="inline-flex h-[30px] items-center justify-center gap-1.5 rounded-md border-dashed text-[11.5px] font-medium transition-colors hover:bg-[rgba(167,139,250,0.12)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--secondary)]"
        style={{
          border: '1px dashed var(--border-strong)',
          color: 'var(--text-tertiary)',
        }}
      >
        <Plus size={11} aria-hidden="true" />
        Add KB chunk
      </button>

      <label
        className="inline-flex items-center gap-1.5 text-[11px]"
        style={{ color: 'var(--text-tertiary)' }}
      >
        <input
          type="checkbox"
          checked={skipKb}
          onChange={(e) => {
            console.info('pattern-a:deferred:f16b:kb-skip-toggle');
            onSkipKbChange(e.target.checked);
          }}
          style={{ accentColor: 'var(--secondary)' }}
        />
        Generate without KB grounding (pure-LLM)
      </label>
    </div>
  );
}

function ProviderStrip() {
  const p = CANNED_PROVIDER;
  const pct = (p.quotaUsed / p.quotaTotal) * 100;
  return (
    <div
      className="flex flex-none flex-col gap-2 rounded-lg border px-3 py-2.5"
      style={{
        background: 'var(--base)',
        borderColor: 'var(--border)',
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="font-mono text-[10px] font-bold uppercase"
          style={{
            letterSpacing: '0.08em',
            color: 'var(--text-tertiary)',
          }}
        >
          Provider
        </span>
        <div
          className="flex h-[30px] flex-1 items-center gap-1.5 rounded border px-2 text-[11.5px]"
          style={{
            background: 'var(--raised)',
            borderColor: 'var(--border)',
            color: 'var(--text-primary)',
          }}
        >
          <span
            aria-hidden="true"
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ background: 'var(--pass)' }}
          />
          <span className="font-semibold">{p.name}</span>
          <span
            className="ml-auto font-mono text-[10.5px]"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {p.model}
          </span>
        </div>
      </div>

      <div
        className="flex items-center gap-1.5 font-mono text-[10.5px]"
        style={{ color: 'var(--text-tertiary)' }}
      >
        <span>
          {p.quotaUsed}/{p.quotaTotal} today
        </span>
        <span
          className="h-1 min-w-[60px] flex-1 overflow-hidden rounded-full"
          style={{ background: 'var(--overlay)' }}
        >
          <span
            className="block h-full rounded-full"
            style={{
              background: 'var(--pass)',
              width: `${Math.max(0.5, pct)}%`,
            }}
          />
        </span>
        <span style={{ color: 'var(--pass)' }}>free tier</span>
      </div>
      <div
        className="font-mono text-[10.5px]"
        style={{ color: 'var(--text-quaternary, var(--text-tertiary))' }}
      >
        {p.fallbackLabel}
      </div>
    </div>
  );
}

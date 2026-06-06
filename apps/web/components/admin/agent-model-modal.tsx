// F26m2 Configure Composer — Model Assignment modal · Pattern A per Hard Rule 15.
//
// Renders the per-agent slot configuration (Primary / Long-context / Fallback)
// + routing rules + sample-prompt dry-run for the Composer agent. Defaults to
// the Iksula Returns Sprint-42 configuration (Groq gpt-oss-120b + Llama-4-scout
// preview + Gemini 2.5 Flash fallback per ADR-003 amendment / CLAUDE.md locked
// tech stack).
//
// Pattern A (no backend):
//   - "Change" buttons are deferred — will open a provider/model picker modal
//     (F26m2a — out of scope for pilot Day-1)
//   - "Run sample test" re-renders the success result (canonical shows it as
//     pre-rendered for visual fidelity)
//   - "Save & activate" is a no-op stub (real PUT lands MS0-T030.5+)
//
// All user-visible strings come from F26M2_* canned-data exports (Hard Rule 17).
// Canonical: PM1_UI_v2/Redesign Frame by claude design/F26m2 Agent Model Assignment Modal v2.html

'use client';

import './agent-model-modal.css';

import {
  F26M2_HEADER,
  F26M2_BANNER,
  F26M2_PRIMARY,
  F26M2_LONGCTX,
  F26M2_FALLBACK,
  F26M2_RULES,
  F26M2_TEST,
  F26M2_FOOTER,
} from '@/components/admin/agent-model-modal.canned-data';

interface AgentModelModalProps {
  /** Cancel / close-X / backdrop click handler. */
  onClose?: () => void;
}

const ChangeIcon = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M8 3H4a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V8M11 2l3 3-7 7H4v-3z" />
  </svg>
);

export function AgentModelModal({ onClose }: AgentModelModalProps = {}) {
  return (
    <div className="f26m2-scrim">
      <div
        className="scrim"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose?.();
        }}
      >
        <div
          className="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="m26-ttl"
          data-screen-label="F26m2 Configure Composer"
        >
          <header className="m-head">
            <span className="ic">
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3l2.1 5.3L19.5 10l-5.4 1.7L12 17l-2.1-5.3L4.5 10l5.4-1.7z" />
              </svg>
            </span>
            <div className="ttl">
              <span className="t" id="m26-ttl">
                Configure {F26M2_HEADER.titleAgent}
                <span className="ai-i" title={F26M2_HEADER.titleTail} />
                {' — '}
                {F26M2_HEADER.titleTail}
              </span>
              <span className="sub">{F26M2_HEADER.subtitle}</span>
            </div>
            <button className="x" type="button" aria-label="Close" onClick={() => onClose?.()}>
              <svg
                width="15"
                height="15"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>
          </header>

          <div className="m-body">
            {/* Agent status banner */}
            <div className="agent-banner">
              <div className="ab-top">
                <span className="ab-glyph">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M8 2l1.4 3.5L13 7l-3.6 1.5L8 12l-1.4-3.5L3 7l3.6-1.5z" />
                  </svg>
                </span>
                <span className="ab-name">
                  {F26M2_BANNER.agentName}
                  <span className="ab-ver">· {F26M2_BANNER.agentVer}</span>
                </span>
                <span className="ab-active">
                  <span className="dot"></span>
                  {F26M2_BANNER.activeLabel}
                </span>
              </div>
              <div className="ab-stats">
                {F26M2_BANNER.stats.map((s, i) => (
                  <div key={i} className="ab-stat">
                    <span className={['v', s.tone].filter(Boolean).join(' ')}>
                      {s.v}
                      {'vUnit' in s && s.vUnit ? (
                        <span
                          style={{
                            fontSize: '11px',
                            color: 'var(--t3)',
                            fontWeight: 500,
                          }}
                        >
                          {s.vUnit}
                        </span>
                      ) : null}
                    </span>
                    <span className="l">{s.l}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* PRIMARY slot */}
            <div className="sec">
              <div className="sec-h">
                <span className="label">{F26M2_PRIMARY.label}</span>
                <span className="req">{F26M2_PRIMARY.req}</span>
                <span className="hint">{F26M2_PRIMARY.hint}</span>
              </div>
              <div className="slot primary">
                <span className={['prov-logo', F26M2_PRIMARY.logoCls].join(' ')}>
                  {F26M2_PRIMARY.logoLetter}
                </span>
                <div className="s-body">
                  <div className="s-row1">
                    <span className="s-model">{F26M2_PRIMARY.model}</span>
                    <span className="s-prov">{F26M2_PRIMARY.prov}</span>
                    <span className={['s-badge', F26M2_PRIMARY.badgeCls].join(' ')}>
                      {F26M2_PRIMARY.badgeLabel}
                    </span>
                  </div>
                  <div className="s-specs">
                    {F26M2_PRIMARY.specs.flatMap((sp, i) =>
                      i === 0
                        ? [<span key={`sp-${i}`}>{sp}</span>]
                        : [
                            <span key={`sep-${i}`} className="sep">
                              ·
                            </span>,
                            <span key={`sp-${i}`}>{sp}</span>,
                          ],
                    )}
                  </div>
                </div>
                <button className="s-change" type="button">
                  <ChangeIcon />
                  {F26M2_PRIMARY.changeLabel}
                </button>
              </div>
            </div>

            {/* LONG-CONTEXT slot */}
            <div className="sec">
              <div className="sec-h">
                <span className="label">{F26M2_LONGCTX.label}</span>
                <span className="routing">{F26M2_LONGCTX.badge}</span>
                <span className="hint">{F26M2_LONGCTX.hint}</span>
              </div>
              <div className="slot">
                <span className={['prov-logo', F26M2_LONGCTX.logoCls].join(' ')}>
                  {F26M2_LONGCTX.logoLetter}
                </span>
                <div className="s-body">
                  <div className="s-row1">
                    <span className="s-model">{F26M2_LONGCTX.model}</span>
                    <span className={['s-badge', F26M2_LONGCTX.badgeCls].join(' ')}>
                      {F26M2_LONGCTX.badgeLabel}
                    </span>
                  </div>
                  <div className="s-specs">
                    {F26M2_LONGCTX.specs.flatMap((sp, i) =>
                      i === 0
                        ? [<span key={`sp-${i}`}>{sp}</span>]
                        : [
                            <span key={`sep-${i}`} className="sep">
                              ·
                            </span>,
                            <span key={`sp-${i}`}>{sp}</span>,
                          ],
                    )}
                  </div>
                </div>
                <button className="s-change" type="button">
                  <ChangeIcon />
                  {F26M2_LONGCTX.changeLabel}
                </button>
              </div>
            </div>

            {/* FALLBACK slot */}
            <div className="sec">
              <div className="sec-h">
                <span className="label">{F26M2_FALLBACK.label}</span>
                <span className="routing">{F26M2_FALLBACK.badge}</span>
                <span className="hint">{F26M2_FALLBACK.hint}</span>
              </div>
              <div className="slot">
                <span className={['prov-logo', F26M2_FALLBACK.logoCls].join(' ')}>
                  {F26M2_FALLBACK.logoLetter}
                </span>
                <div className="s-body">
                  <div className="s-row1">
                    <span className="s-model">{F26M2_FALLBACK.model}</span>
                    <span className="s-prov">{F26M2_FALLBACK.prov}</span>
                    <span className={['s-badge', F26M2_FALLBACK.badgeCls].join(' ')}>
                      {F26M2_FALLBACK.badgeLabel}
                    </span>
                  </div>
                  <div className="s-specs">
                    {F26M2_FALLBACK.specs.flatMap((sp, i) =>
                      i === 0
                        ? [<span key={`sp-${i}`}>{sp}</span>]
                        : [
                            <span key={`sep-${i}`} className="sep">
                              ·
                            </span>,
                            <span key={`sp-${i}`}>{sp}</span>,
                          ],
                    )}
                  </div>
                </div>
                <button className="s-change" type="button">
                  <ChangeIcon />
                  {F26M2_FALLBACK.changeLabel}
                </button>
              </div>
            </div>

            {/* ROUTING RULES (read-only) */}
            <div className="sec">
              <div className="sec-h">
                <span className="label">{F26M2_RULES.label}</span>
                <span className="hint">{F26M2_RULES.hint}</span>
              </div>
              <div className="rules">
                {F26M2_RULES.rules.map((r, i) => (
                  <div key={i} className="rule">
                    <span className="n">{i + 1}</span>
                    <span className="r-text">
                      {r.pre}
                      {'strong' in r && r.strong ? <b>{r.strong}</b> : null}
                      {'midTwo' in r && r.midTwo ? r.midTwo : null}
                      {'pill' in r && r.pill ? (
                        <span className={['pill', r.pillCls].filter(Boolean).join(' ')}>
                          {r.pill}
                        </span>
                      ) : null}
                      {'mid' in r ? r.mid : ''}
                      <code>{r.code}</code>
                      {r.tail}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* TEST with sample prompt */}
            <div className="sec">
              <div className="sec-h">
                <span className="label">{F26M2_TEST.label}</span>
                <span className="hint">{F26M2_TEST.hint}</span>
              </div>
              <div className="test">
                <div className="prompt">
                  <span className="plab">{F26M2_TEST.promptCap}</span>
                  {F26M2_TEST.promptPre}
                  <span className="req-id">{F26M2_TEST.reqId}</span>
                  {F26M2_TEST.promptTail}
                </div>
                <div className="run-row">
                  <button className="btn-run" type="button">
                    <svg viewBox="0 0 16 16" fill="currentColor">
                      <path d="M4 3l9 5-9 5V3z" />
                    </svg>
                    {F26M2_TEST.runLabel}
                  </button>
                  <div className="success">
                    <span className="chk">
                      <svg
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                      >
                        <path d="M3 8l3 3 7-7" />
                      </svg>
                    </span>
                    <span>
                      <b>{F26M2_TEST.successCount}</b>
                      {F26M2_TEST.successMid}
                      <span className="route">{F26M2_TEST.successRoute}</span>
                      {F26M2_TEST.successTail}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <footer className="m-foot">
            <div className="note">
              <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="8" cy="8" r="6" />
                <path d="M8 5v3l2 1" />
              </svg>
              {F26M2_FOOTER.note}
            </div>
            <div className="acts">
              <button className="btn-ghost" type="button" onClick={() => onClose?.()}>
                {F26M2_FOOTER.cancel}
              </button>
              <button className="btn-save" type="button">
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 8l4 4 6-8" />
                </svg>
                {F26M2_FOOTER.save}
              </button>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

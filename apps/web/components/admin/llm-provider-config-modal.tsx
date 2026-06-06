// F28m1 LLM Provider Configuration modal · canonical 2-pane per Hard Rule 15.
// Static Pattern A render for VG. All text from F28M1_* (Hard Rule 17).
// Agent tags use Composer/Curator/Sherlock canon (Hard Rule 14).

'use client';

import { useState } from 'react';

import './llm-provider-config-modal.css';

import {
  F28M1_HEADER,
  F28M1_CONNECTED,
  F28M1_AVAILABLE,
  F28M1_DETAIL,
  F28M1_MODELS,
  F28M1_FOOTER,
  F28M1_WIZARD,
} from '@/components/admin/llm-provider-config-modal.canned-data';

const Check = () => (
  <svg
    width="8"
    height="8"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
  >
    <path d="M3 8l3 3 7-7" />
  </svg>
);

export function LlmProviderConfigModal() {
  // Pane state: 'groq' → connected-provider detail; anything else → add-provider wizard.
  const [pane, setPane] = useState<'groq' | 'wizard'>('groq');
  const [activeKey, setActiveKey] = useState<string>('groq');
  // Wizard API key Show/Hide + validation (Groq gsk_ prefix).
  const [wizKey, setWizKey] = useState('');
  const [showWizKey, setShowWizKey] = useState(false);
  const [showDetailKey, setShowDetailKey] = useState(false);
  const wizKeyValid = wizKey.length > 0 ? /^gsk_[A-Za-z0-9_-]{20,}$/.test(wizKey) : null;
  const select = (key: string) => {
    setActiveKey(key);
    setPane(key === 'groq' ? 'groq' : 'wizard');
  };
  return (
    <div className="scrim f28m1-scrim" role="presentation">
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="m28-ttl">
        {/* Header */}
        <header className="m-head">
          <span className="ic">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="6" width="18" height="12" rx="2" />
              <path d="M7 10v4M11 10v4M15 10v4M19 10v4" />
            </svg>
          </span>
          <div className="ttl">
            <span className="t" id="m28-ttl">
              {F28M1_HEADER.title}
            </span>
            <span className="sub">{F28M1_HEADER.subtitle}</span>
          </div>
          <button className="x" type="button" aria-label="Close">
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
          {/* LEFT: provider directory */}
          <aside className="dir">
            <div className="dir-top">
              <div className="dir-tabs" role="tablist">
                {F28M1_HEADER.tabs.map((t, i) => (
                  <button
                    key={t.key}
                    className={i === 0 ? 'on' : ''}
                    data-dirtab={t.key}
                    role="tab"
                    type="button"
                  >
                    {t.label} <span className="n">{t.count}</span>
                  </button>
                ))}
              </div>
              <button
                className="btn-add"
                type="button"
                onClick={() => {
                  setActiveKey('add');
                  setPane('wizard');
                }}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                >
                  <path d="M8 3v10M3 8h10" />
                </svg>
                {F28M1_HEADER.addProvider}
              </button>
            </div>
            <div className="dir-list">
              <div className="dir-group">Connected · {F28M1_CONNECTED.length}</div>
              {F28M1_CONNECTED.map((p) => (
                <button
                  key={p.key}
                  className={`prov-item ${activeKey === p.key ? 'on' : ''}`}
                  data-prov={p.key}
                  type="button"
                  onClick={() => select(p.key)}
                >
                  <span className={`logo ${p.logoCls}`}>{p.logo}</span>
                  <span className="pi-main">
                    <span className="pi-row1">
                      <span className="nm">{p.name}</span>
                      <span className="check">
                        <Check />
                      </span>
                    </span>
                    <span className="sub">{p.sub}</span>
                  </span>
                </button>
              ))}
              <div className="dir-group">Available to add · {F28M1_AVAILABLE.length}</div>
              {F28M1_AVAILABLE.map((p) => (
                <button
                  key={p.name}
                  className={`prov-item avail ${activeKey === p.name ? 'on' : ''}`}
                  data-prov="add"
                  type="button"
                  onClick={() => select(p.name)}
                >
                  <span className="logo">{p.logo}</span>
                  <span className="pi-main">
                    <span className="pi-row1">
                      <span className="nm">{p.name}</span>
                      <span className={`tier ${p.tierCls}`}>{p.tier}</span>
                    </span>
                    <span className="sub">{p.sub}</span>
                  </span>
                </button>
              ))}
            </div>
          </aside>

          {/* RIGHT: Groq detail OR add-provider wizard */}
          <div className="detail">
            <div className={`pane ${pane === 'groq' ? 'on' : ''}`}>
              <div className="pd-head">
                <span className="logo">{F28M1_DETAIL.logo}</span>
                <div className="pd-id">
                  <div className="row1">
                    <span className="nm">{F28M1_DETAIL.name}</span>
                    <span className="rec">{F28M1_DETAIL.rec}</span>
                    <span className="status-pill ok">
                      <span className="dot" />
                      {F28M1_DETAIL.status}
                    </span>
                  </div>
                  <p className="desc">{F28M1_DETAIL.desc}</p>
                </div>
              </div>

              {/* Free tier */}
              <div className="freetier">
                <div className="ft-top">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M8 1.5l1.9 4 4.4.5-3.3 3 .9 4.3L8 11.1 4.2 13.3l.9-4.3L1.8 6l4.4-.5z" />
                  </svg>
                  <span>
                    <b>{F28M1_DETAIL.freeTierTop}</b> {F28M1_DETAIL.freeTierNote}
                  </span>
                </div>
                <div className="ft-grid">
                  {F28M1_DETAIL.ftStats.map((s, i) => (
                    <div key={i} className="ft-stat">
                      <span className="v">{s.v}</span>
                      <span className="l">{s.l}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* API key */}
              <div className="field">
                <label>
                  {F28M1_DETAIL.apiKeyLabel} <span className="req">*</span>
                </label>
                <div className="input-row">
                  <input
                    className="input mono"
                    type={showDetailKey ? 'text' : 'password'}
                    value={
                      showDetailKey ? 'gsk_live_8f2a9c1d4e6b3a7f8629' : F28M1_DETAIL.apiKeyMasked
                    }
                    readOnly
                  />
                  {F28M1_DETAIL.apiKeyBtns.map((b) => (
                    <button
                      key={b}
                      className="btn-mini"
                      type="button"
                      onClick={b === 'Show' ? () => setShowDetailKey((s) => !s) : undefined}
                    >
                      {b === 'Show' ? (showDetailKey ? 'Hide' : 'Show') : b}
                    </button>
                  ))}
                </div>
                <span className="helper">{F28M1_DETAIL.apiKeyHelper}</span>
              </div>

              {/* Endpoint */}
              <div className="field">
                <label>{F28M1_DETAIL.endpointLabel}</label>
                <div className="input-row">
                  <input
                    className="input mono"
                    type="text"
                    value={F28M1_DETAIL.endpointValue}
                    readOnly
                  />
                  <button className="btn-mini" type="button">
                    Edit
                  </button>
                </div>
              </div>

              {/* Test card */}
              <div className="test-card">
                <div className="tc-top">
                  <div className="lbl">
                    {F28M1_DETAIL.testTitle}
                    <span className="s">{F28M1_DETAIL.testSub}</span>
                  </div>
                  <button className="btn-test" type="button">
                    <svg
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 2L3 9h4l-1 5 6-7H8z" />
                    </svg>
                    Test connection
                  </button>
                </div>
                <div className="test-result">
                  <span className="head">
                    <svg
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 8l3 3 7-7" />
                    </svg>
                    {F28M1_DETAIL.testHealthy}
                  </span>
                  <span className="stat">
                    {F28M1_DETAIL.testStatParts.retrieved}
                    <span className="sep">·</span>
                    {F28M1_DETAIL.testStatParts.respondingPre}
                    <span className="v" style={{ color: 'var(--pass)' }}>
                      {F28M1_DETAIL.testStatParts.latency}
                    </span>
                    <span className="sep">·</span>
                    {F28M1_DETAIL.testStatParts.testedPre}
                    <span className="v">{F28M1_DETAIL.testStatParts.testedVal}</span>
                  </span>
                </div>
              </div>

              {/* Models */}
              <div className="models-head">
                <div className="ttl">
                  {F28M1_DETAIL.modelsTitle}
                  <span className="meta">{F28M1_DETAIL.modelsMeta}</span>
                </div>
                <div className="mfilter" role="tablist">
                  {F28M1_DETAIL.modelFilters.map((f, i) => (
                    <button key={f.label} className={i === 0 ? 'on' : ''} type="button">
                      {f.label}
                      <span className="n">{f.n}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="model-list">
                {F28M1_MODELS.map((m) => (
                  <div key={m.id} className={`model ${m.enabled ? 'enabled' : ''}`}>
                    <span
                      className={`cb ${m.enabled ? 'on' : ''}`}
                      role="checkbox"
                      aria-checked={m.enabled}
                    >
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
                    <div className="mbody">
                      <div className="mrow1">
                        <span className="mid">{m.id}</span>
                        {m.name && <span className="mname">{m.name}</span>}
                        <span className={`badge ${m.badgeCls}`}>{m.badge}</span>
                      </div>
                      <div className="mspecs">
                        {m.specs.map((s, j) => (
                          <span key={j}>
                            {j > 0 && <span className="sep">· </span>}
                            {s}
                          </span>
                        ))}
                      </div>
                      {m.agents.length > 0 && (
                        <div className="agent-tags">
                          {m.agents.map((a) => (
                            <span key={a} className="agent-tag">
                              <span className="star">★</span>
                              {a}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <button className="model-fold" type="button">
                  <svg
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M4 6l4 4 4-4" />
                  </svg>
                  {F28M1_DETAIL.foldLabel}
                </button>
              </div>
            </div>

            {/* Add-provider wizard pane (shown when a non-Groq provider is selected) */}
            <div className={`pane ${pane === 'wizard' ? 'on' : ''}`}>
              <div className="wiz-steps">
                {F28M1_WIZARD.steps.map((s, i) => (
                  <div key={s.num} className={`wiz-step ${i === 0 ? 'on' : ''}`}>
                    <span className="num">{s.num}</span>
                    <span className="lab">{s.label}</span>
                    <span className="conn" />
                  </div>
                ))}
              </div>

              <div className="wiz-section">
                <span className="wh">{F28M1_WIZARD.step1Title}</span>
                <div className="prov-cards">
                  {F28M1_WIZARD.cards.map((card) => (
                    <button
                      key={card.key}
                      className={`prov-card ${card.selected ? 'sel' : ''}`}
                      type="button"
                    >
                      <div className="pc-top">
                        <span className={`pc-logo pc-${card.logoStyle}`}>{card.logo}</span>
                        <span className="pc-name">{card.name}</span>
                        {card.rec && <span className="pc-rec">{card.rec}</span>}
                      </div>
                      <span className="pc-desc">{card.desc}</span>
                      <span className={`pc-tier pc-tier-${card.tierStyle}`}>{card.tier}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="wiz-section">
                <span className="wh">{F28M1_WIZARD.step2Title}</span>
                <div className="field">
                  <label>
                    {F28M1_WIZARD.apiKeyLabel} <span className="req">*</span>
                  </label>
                  <div className="input-row">
                    <input
                      className={`input mono ${wizKeyValid === true ? 'valid' : ''} ${wizKeyValid === false ? 'invalid' : ''}`}
                      type={showWizKey ? 'text' : 'password'}
                      placeholder={F28M1_WIZARD.apiKeyPlaceholder}
                      value={wizKey}
                      onChange={(e) => setWizKey(e.target.value)}
                    />
                    <button
                      className="btn-mini"
                      type="button"
                      onClick={() => setShowWizKey((s) => !s)}
                    >
                      {showWizKey ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {wizKeyValid === false ? (
                    <span className="helper invalid-msg">
                      ✕ Invalid key format. Expected gsk_xxx… .
                    </span>
                  ) : (
                    <span className="helper">{F28M1_WIZARD.apiKeyHelper}</span>
                  )}
                </div>
              </div>

              <div className="wiz-section">
                <span className="wh">{F28M1_WIZARD.step3Title}</span>
                <div className="field">
                  <label>{F28M1_WIZARD.modelLabel}</label>
                  <input
                    className="input mono"
                    type="text"
                    value={F28M1_WIZARD.modelValue}
                    readOnly
                  />
                  <span className="helper">{F28M1_WIZARD.modelHelper}</span>
                </div>
              </div>

              <div className="test-card">
                <div className="tc-top">
                  <div className="lbl">
                    {F28M1_WIZARD.testTitle}
                    <span className="s">{F28M1_WIZARD.testSub}</span>
                  </div>
                  <button className="btn-test" type="button">
                    <svg
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 2L3 9h4l-1 5 6-7H8z" />
                    </svg>
                    Test connection
                  </button>
                </div>
                <div className="test-result">
                  <span className="head">
                    <svg
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 8l3 3 7-7" />
                    </svg>
                    {F28M1_WIZARD.testSuccess}
                  </span>
                  <span className="stat">
                    {F28M1_WIZARD.testStatParts.providerPre}
                    <span className="v">{F28M1_WIZARD.testStatParts.provider}</span>
                    <span className="sep">·</span>
                    {F28M1_WIZARD.testStatParts.modelPre}
                    <span className="v">{F28M1_WIZARD.testStatParts.model}</span>
                    <span className="sep">·</span>
                    {F28M1_WIZARD.testStatParts.latencyPre}
                    <span className="v" style={{ color: 'var(--pass)' }}>
                      {F28M1_WIZARD.testStatParts.latency}
                    </span>
                  </span>
                  <div className="wiz-sample">
                    <span className="sample-lbl">{F28M1_WIZARD.samplePromptLabel}</span>
                    {F28M1_WIZARD.samplePrompt}
                    <span className="sample-lbl">{F28M1_WIZARD.sampleResponseLabel}</span>
                    {F28M1_WIZARD.sampleResponse}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="m-foot">
          <div className="fstat">
            {F28M1_FOOTER.stats.map((s, i) => (
              <span key={i} className={`item ${s.ai ? 'ai' : ''}`}>
                <span className={`dot ${s.ai ? 'ai' : ''}`} />
                <b>{s.b}</b> {s.t}
              </span>
            ))}
            <span className="item" style={{ color: 'var(--t4)' }}>
              {F28M1_FOOTER.auditNote}
            </span>
          </div>
          <div className="facts">
            <button className="btn-ghost" type="button">
              {F28M1_FOOTER.cancel}
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
              {F28M1_FOOTER.save}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

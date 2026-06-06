// F26m1 Configure LLM Provider modal · interactive wizard per Hard Rule 15.
// Mode derives from URL search params (production-ready entry-point pattern,
// replaces the canonical's mock-only Demo toggle):
//   /admin/agents/provider-setup                      → Fresh Setup
//   /admin/agents/provider-setup?mode=edit&id=groq    → Edit Existing (Groq pre-filled)
// In Fresh Setup, clicking a provider reveals Step 2/3 with placeholder + helper +
// key-format validation + Show/Hide. Clicking Test connection renders the
// "✓ Connection successful" result panel with the selected provider + model.
// In Edit Existing, banner + saved-key + Replace + prior-test result render on mount.
// All text from F26M1_* (Hard Rule 17).

'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

import './llm-provider-setup-modal.css';

import {
  F26M1_HEADER,
  F26M1_PROVIDERS,
  F26M1_STEPS,
  F26M1_TEST,
  F26M1_FOOTER,
  F26M1_EDIT,
  F26M1_TEST_RESULT,
  F26M1_PROVIDER_CONFIG,
} from '@/components/admin/llm-provider-setup-modal.canned-data';

type ProvKey = keyof typeof F26M1_PROVIDER_CONFIG;
type Mode = 'fresh' | 'edit';

// Display-friendly provider name (matches canonical showResult()).
const PROVIDER_NAME: Record<ProvKey, string> = {
  groq: 'Groq',
  gemini: 'Google Gemini',
  custom: 'Custom',
};

export function LlmProviderSetupModal() {
  const searchParams = useSearchParams();
  const urlMode = searchParams.get('mode') === 'edit' ? 'edit' : 'fresh';
  const urlId = (searchParams.get('id') ?? 'groq') as ProvKey;
  const editingProvider: ProvKey = urlId in F26M1_PROVIDER_CONFIG ? urlId : 'groq';

  const initialProvider: ProvKey | null = urlMode === 'edit' ? editingProvider : null;
  const initialResult: 'success' | null = urlMode === 'edit' ? 'success' : null;

  const [provider, setProvider] = useState<ProvKey | null>(initialProvider);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  // Edit mode: false while showing the masked saved key; true once Replace is clicked
  // (or once the user picks a different provider in edit mode).
  const [keyReplaced, setKeyReplaced] = useState(false);
  const [testResult, setTestResult] = useState<'success' | null>(initialResult);

  const isEdit: Mode = urlMode;
  const isEditView = isEdit === 'edit';
  // Saved-key affordance only while in edit mode, the editing provider is still
  // selected, and the user hasn't clicked Replace.
  const savedKeyActive = isEditView && provider === editingProvider && !keyReplaced;

  const cfg = provider ? F26M1_PROVIDER_CONFIG[provider] : null;
  const typedValid = cfg && apiKey.length > 0 ? new RegExp(cfg.keyPrefix).test(apiKey) : null;
  const keyValid = savedKeyActive ? true : typedValid;

  function pickProvider(key: ProvKey) {
    setProvider(key);
    setApiKey('');
    setTestResult(null);
    // Switching away from the editing provider invalidates its saved key.
    if (isEditView && key !== editingProvider) setKeyReplaced(true);
    if (isEditView && key === editingProvider) setKeyReplaced(false);
  }

  function replaceKey() {
    setKeyReplaced(true);
    setApiKey('');
    setShowKey(false);
    setTestResult(null);
  }

  function runTest() {
    if (provider && keyValid) setTestResult('success');
  }

  // The "Reset & choose again" affordance in edit mode clears Groq's pre-fill
  // in-place (mirrors canonical resetAll behavior without leaving the URL).
  function resetAll() {
    setProvider(null);
    setApiKey('');
    setShowKey(false);
    setKeyReplaced(true);
    setTestResult(null);
  }

  // Result panel: render whenever the current state has a "success" — that
  // covers both fresh-mode Test-connection clicks AND the edit-mode prior test.
  const showResult = testResult === 'success' && provider && cfg;
  const resultModel = cfg?.model ?? F26M1_TEST_RESULT.model;
  const resultProvider = provider ? PROVIDER_NAME[provider] : F26M1_TEST_RESULT.provider;
  // Trailing "12:30 IST · prior test" suffix appears only in edit mode (the
  // canonical's showResult('success', '12:30 IST · prior test') branch).
  const showPriorSuffix = savedKeyActive;

  return (
    <div className="scrim f26m1-scrim" role="presentation">
      <div
        className="modal"
        id="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="m-title"
        data-mode={isEdit}
        data-prov={provider ?? ''}
      >
        <header className="m-head">
          <span className="m-glyph" aria-hidden="true">
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
              <path d="M12 3l2.09 5.26L19 10l-4.91 1.74L12 17l-2.09-5.26L5 10l4.91-1.74z" />
            </svg>
          </span>
          <div className="m-titles">
            <span className="m-title display" id="m-title">
              {F26M1_HEADER.title}
            </span>
            <span className="m-sub">{F26M1_HEADER.subtitle}</span>
          </div>
          <span className="m-ctx">
            <span className="dot" />
            Admin
          </span>
          <button className="m-close" type="button" aria-label="Close">
            <svg
              width="16"
              height="16"
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

        <div className="m-body" id="body">
          {/* Existing-config banner — CSS shows it only when data-mode="edit" */}
          <div className="exist">
            <span className="ic">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 12l2 2 4-4" />
                <circle cx="12" cy="12" r="9" />
              </svg>
            </span>
            <div className="meta">
              {F26M1_EDIT.bannerLead} <b>{F26M1_EDIT.bannerTarget}</b>
              <br />
              <span className="ts">{F26M1_EDIT.bannerTs}</span>
            </div>
            <button className="btn-secondary-foot" type="button" onClick={resetAll}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              >
                <path d="M2 8a6 6 0 0 1 10.5-4M14 8a6 6 0 0 1-10.5 4M12 2v3h-3M4 14v-3h3" />
              </svg>
              {F26M1_EDIT.reset}
            </button>
          </div>

          {/* Step 1 — Provider selection (always visible) */}
          <div className="step active" id="step1" data-step="1">
            <div className="step-head">
              <span className={`step-num ${provider ? 'done' : ''}`}>1</span>
              <span className="step-title">{F26M1_STEPS.step1Title}</span>
            </div>
            <p className="step-help">{F26M1_STEPS.step1Help}</p>
            <div className="prov-grid">
              {F26M1_PROVIDERS.map((p) => (
                <label
                  key={p.key}
                  className={`prov-card ${provider === p.key ? 'selected' : ''}`}
                  data-prov={p.key}
                >
                  <input
                    type="radio"
                    name="provider"
                    value={p.key}
                    checked={provider === p.key}
                    onChange={() => pickProvider(p.key as ProvKey)}
                  />
                  <div className="pc-head">
                    <span className="pc-logo">{p.logo}</span>
                    <span className="pc-name">{p.name}</span>
                    <span className="pc-radio" />
                  </div>
                  <p className="pc-tag">{p.tag}</p>
                  <div className="pc-badges">
                    {p.badges.map((b, j) => (
                      <span key={j} className={`pc-badge ${b.cls}`}>
                        {b.t}
                      </span>
                    ))}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Step 2 — API key (revealed after a provider is chosen) */}
          {provider && cfg && (
            <div className="step" id="step2" data-step="2">
              <div className="step-head">
                <span className="step-num">2</span>
                <span className="step-title">{F26M1_STEPS.step2Title}</span>
              </div>
              <div className="field">
                <label htmlFor="apiKey">
                  {F26M1_STEPS.apiKeyLabel} <span className="req">*</span>
                </label>
                <div className="input-row">
                  <input
                    className={`input mono ${keyValid === true && !savedKeyActive ? 'valid' : ''} ${keyValid === false ? 'invalid' : ''}`}
                    id="apiKey"
                    type={!savedKeyActive && showKey ? 'text' : 'password'}
                    autoComplete="off"
                    spellCheck={false}
                    placeholder={cfg.placeholder}
                    value={savedKeyActive ? F26M1_EDIT.savedKeyMasked : apiKey}
                    disabled={savedKeyActive}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                  {savedKeyActive ? (
                    <button className="replace-key" type="button" onClick={replaceKey}>
                      {F26M1_EDIT.replace}
                    </button>
                  ) : (
                    <button
                      className="toggle-key"
                      type="button"
                      aria-label="Show or hide key"
                      onClick={() => setShowKey((s) => !s)}
                    >
                      <span>{showKey ? 'Hide' : 'Show'}</span>
                    </button>
                  )}
                </div>
                {savedKeyActive ? (
                  <span className="helper ok">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <path d="M3 8l3 3 7-7" />
                    </svg>{' '}
                    {F26M1_EDIT.savedKeyHelper}
                  </span>
                ) : keyValid === false ? (
                  <span className="helper invalid-msg">
                    ✕ Invalid key format. Expected {cfg.placeholder} .
                  </span>
                ) : (
                  <span className="helper">
                    Get your API key from <a href={cfg.docHref}>{cfg.docUrl}</a> . {cfg.keyHint}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Step 3 — Model (revealed after a provider is chosen) */}
          {provider && cfg && (
            <div className="step" id="step3" data-step="3">
              <div className="step-head">
                <span className="step-num">3</span>
                <span className="step-title">{F26M1_STEPS.step3Title}</span>
              </div>
              <div className="field">
                <label htmlFor="model">
                  {F26M1_STEPS.modelLabel} <span className="req">*</span>
                </label>
                <div className="select-wrap">
                  <select className="select" id="model" defaultValue={cfg.model}>
                    <option value={cfg.model}>{cfg.model}</option>
                  </select>
                </div>
                <span className="helper">{cfg.modelHelper}</span>
              </div>
            </div>
          )}

          {/* Test panel */}
          <div className="test-panel">
            <div className="test-row">
              <div className="l">
                <span className="t">{F26M1_TEST.title}</span>
                <span className="s">{F26M1_TEST.sub}</span>
              </div>
              <button className="btn-test" type="button" disabled={!keyValid} onClick={runTest}>
                <span className="lab">{F26M1_TEST.btn}</span>
              </button>
            </div>

            {/* Result — renders for both fresh-mode test-connection clicks AND edit-mode prior test */}
            {showResult && (
              <div className="test-result show success">
                <span className="head">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 8l3 3 7-7" />
                  </svg>{' '}
                  {F26M1_TEST_RESULT.successHead}
                </span>
                <span className="stat">
                  {F26M1_TEST_RESULT.providerLabel} <span className="v">{resultProvider}</span>
                  <span className="sep">·</span>
                  {F26M1_TEST_RESULT.modelLabel} <span className="v">{resultModel}</span>
                  <span className="sep">·</span>
                  {F26M1_TEST_RESULT.latencyLabel}{' '}
                  <span className="v" style={{ color: 'var(--pass)' }}>
                    {F26M1_TEST_RESULT.latencyValue}
                  </span>
                  {showPriorSuffix && (
                    <>
                      <span className="sep">·</span>
                      {F26M1_TEST_RESULT.priorTest}
                    </>
                  )}
                </span>
                <div className="resp">
                  <span className="lab">{F26M1_TEST_RESULT.samplePromptLabel}</span>
                  {F26M1_TEST_RESULT.samplePrompt}
                  <br />
                  <span className="lab" style={{ marginTop: '6px' }}>
                    {F26M1_TEST_RESULT.sampleRespLabel}
                  </span>
                  {F26M1_TEST_RESULT.sampleResp}
                </div>
              </div>
            )}
          </div>
        </div>

        <footer className="m-foot">
          <button className="btn-cancel" type="button">
            {F26M1_FOOTER.cancel}
          </button>
          <span className="gap" />
          <button
            className="btn-secondary-foot"
            type="button"
            disabled={!keyValid}
            onClick={runTest}
          >
            {F26M1_FOOTER.test}
          </button>
          <button className="btn-save" type="button" disabled={!keyValid || !showResult}>
            {F26M1_FOOTER.save}
          </button>
        </footer>
      </div>
    </div>
  );
}

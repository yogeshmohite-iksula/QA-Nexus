// F23 Reports Studio — Save-as-template modal.
// Source: handoff/F23/design.html L1342-1377 + L271-496 (CSS).
//
// Day-25 Sun re-port iteration 3 — full canonical diff applied at once after
// piece-by-piece visual feedback flagged repeated drift. Every token, padding,
// font, and border below is verbatim from the v4 CSS.
//
// Canonical token plan (from design.html L30-31, L271-496):
//   --canvas  #0B0F17  (page bg, darkest)
//   --base    #111827  (modal bg)
//   --raised  #1A2233  (fields + scope cards — LIFTED on top of modal)
//   --overlay #232C3F  (button hover)
//   --border  #2A3347
//   --border-strong #3B4660  (modal outer border)

'use client';

import { Save, X } from 'lucide-react';
import { f23CannedData } from './canned-data';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  onRunSave?: () => void;
}

export function SaveAsTemplateModal({ open, onClose, onSave, onRunSave }: Props) {
  if (!open) return null;
  const m = f23CannedData.modal;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Save report as template"
      // .scrim L471 — rgba(7,10,18,0.62) + 5px blur
      className="fixed inset-0 z-50 flex items-center justify-center p-5"
      style={{
        background: 'rgba(7,10,18,0.62)',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
      }}
    >
      {/* .modal L473 — width 520px, --base bg, --border-strong border, radius 12px */}
      <div
        className="flex max-h-[90vh] w-full max-w-[520px] flex-col overflow-hidden shadow-2xl"
        style={{
          background: 'var(--base)',
          border: '1px solid var(--border-strong)',
          borderRadius: 12,
        }}
      >
        {/* ── .m-head L475 — padding 14/16, border-bottom --border ── */}
        <header
          className="flex items-center gap-2.5 px-4 py-3.5"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          {/* .m-head .ic L476 — 32x32, radius 8, --ai-soft + --ai-line + --secondary */}
          <span
            aria-hidden="true"
            className="inline-flex h-8 w-8 flex-none items-center justify-center"
            style={{
              background: 'var(--ai-soft)',
              border: '1px solid var(--ai-line)',
              borderRadius: 8,
              color: 'var(--secondary)',
            }}
          >
            <Save size={15} strokeWidth={1.7} aria-hidden="true" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            {/* .m-head .t L478 — DM Sans 15px bold --t1 */}
            <span
              className="text-[15px] font-bold leading-tight"
              style={{
                color: 'var(--t1)',
                fontFamily: 'var(--font-dm-sans), system-ui',
                letterSpacing: '-0.005em',
              }}
            >
              {m.title}
            </span>
            {/* .m-head .sub L479 — 11px --t3 */}
            <span className="mt-0.5 block text-[11px]" style={{ color: 'var(--t3)' }}>
              {m.sub}
            </span>
          </div>
          {/* .m-head .x L480 — 36x36 transparent, hover --raised */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-9 w-9 flex-none items-center justify-center transition-colors hover:bg-[var(--raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
            style={{ background: 'transparent', borderRadius: 6, color: 'var(--t3)' }}
          >
            <X size={14} strokeWidth={2} />
          </button>
        </header>

        {/* ── .m-body L483 — padding 16, gap 14, overflow-y auto ── */}
        <div className="flex flex-col gap-3.5 overflow-y-auto p-4">
          {/* Template name — .field L484 */}
          <div className="flex flex-col gap-[5px]">
            <label
              htmlFor="f23-tpl-name"
              className="text-[9.5px] font-bold uppercase"
              style={{
                color: 'var(--t3)',
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                letterSpacing: '0.08em',
              }}
            >
              {m.fields.name.label}
            </label>
            <input
              id="f23-tpl-name"
              type="text"
              defaultValue={m.fields.name.default}
              className="w-full text-[13px] outline-none focus:border-[var(--secondary)]"
              style={{
                minHeight: 40,
                padding: '9px 11px',
                borderRadius: 6,
                background: 'var(--raised)',
                border: '1px solid var(--border)',
                color: 'var(--t1)',
              }}
            />
            <span className="text-[11px]" style={{ color: 'var(--t3)' }}>
              {m.fields.name.helper}
            </span>
          </div>

          {/* Description — .field */}
          <div className="flex flex-col gap-[5px]">
            <label
              htmlFor="f23-tpl-desc"
              className="text-[9.5px] font-bold uppercase"
              style={{
                color: 'var(--t3)',
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                letterSpacing: '0.08em',
              }}
            >
              {m.fields.description.label}
            </label>
            <textarea
              id="f23-tpl-desc"
              rows={3}
              defaultValue={m.fields.description.default}
              className="w-full resize-y text-[13px] outline-none focus:border-[var(--secondary)]"
              style={{
                minHeight: 40,
                padding: '9px 11px',
                borderRadius: 6,
                background: 'var(--raised)',
                border: '1px solid var(--border)',
                color: 'var(--t1)',
              }}
            />
          </div>

          {/* Share scope — .scope-row L490 (3 col grid, 6px gap) */}
          <div className="flex flex-col gap-[5px]">
            <span
              className="text-[9.5px] font-bold uppercase"
              style={{
                color: 'var(--t3)',
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                letterSpacing: '0.08em',
              }}
            >
              {m.fields.scope.label}
            </span>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
              {m.fields.scope.options.map((opt) => {
                const isOn = 'default' in opt && opt.default === true;
                return (
                  <label
                    key={opt.key}
                    className="flex cursor-pointer flex-col gap-[3px] transition-colors"
                    style={{
                      minHeight: 64,
                      padding: 10,
                      borderRadius: 6,
                      background: isOn ? 'rgba(167,139,250,0.06)' : 'var(--raised)',
                      border: `1px solid ${isOn ? 'var(--secondary)' : 'var(--border)'}`,
                      boxShadow: isOn ? '0 0 0 1px var(--secondary)' : undefined,
                    }}
                  >
                    <input type="radio" name="scope" defaultChecked={isOn} className="sr-only" />
                    <span className="text-[12.5px] font-semibold" style={{ color: 'var(--t1)' }}>
                      {opt.label}
                    </span>
                    <span className="text-[11px]" style={{ color: 'var(--t3)' }}>
                      {opt.sub}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── .m-foot L495 — padding 12/16, border-top, gap 8, Cancel·spacer·Run+Save·Save template ── */}
        <footer
          className="flex flex-wrap items-center gap-2 px-4 py-3"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          {/* .btn L271 — 36px tall, --raised bg, --t1 color */}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center text-[12.5px] font-medium transition-colors hover:bg-[var(--overlay)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
            style={{
              height: 36,
              padding: '0 13px',
              borderRadius: 6,
              background: 'var(--raised)',
              border: '1px solid var(--border)',
              color: 'var(--t1)',
            }}
          >
            {m.footer_buttons[0]}
          </button>

          {/* .m-foot .gap L496 — flex:1 spacer pushing next 2 buttons right */}
          <span className="flex-1" />

          {/* .btn-ai L278 — --ai-soft + --ai-line + --secondary */}
          <button
            type="button"
            onClick={onRunSave ?? onSave}
            className="inline-flex items-center justify-center text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
            style={{
              height: 36,
              padding: '0 13px',
              borderRadius: 6,
              background: 'var(--ai-soft)',
              border: '1px solid var(--ai-line)',
              color: 'var(--secondary)',
            }}
          >
            Run + Save
          </button>

          {/* .btn-primary L276 — --primary bg, --primary-ink color */}
          <button
            type="button"
            onClick={onSave}
            className="inline-flex items-center justify-center text-[12.5px] font-semibold transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
            style={{
              height: 36,
              padding: '0 13px',
              borderRadius: 6,
              background: 'var(--primary)',
              border: '1px solid var(--primary)',
              color: 'var(--primary-ink)',
            }}
          >
            {m.footer_buttons[1]}
          </button>
        </footer>
      </div>
    </div>
  );
}

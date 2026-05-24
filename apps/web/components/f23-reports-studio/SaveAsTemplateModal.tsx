// F23 Reports Studio — Save-as-template modal.
// Source: handoff/F23/spec.json §sections[save-as-template-modal] + canned-data.modal.
//
// Tonight: visual scaffold only. Monday wires real open/close + focus trap
// (use existing shadcn Dialog primitive from F22 EvidenceDrawer pattern).

'use client';

import { f23CannedData } from './canned-data';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function SaveAsTemplateModal({ open, onClose, onSave }: Props) {
  if (!open) return null;
  const m = f23CannedData.modal;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Save report as template"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'color-mix(in srgb, var(--canvas) 80%, transparent)' }}
    >
      <div
        className="flex w-full max-w-[640px] flex-col gap-4 rounded-lg border p-5 shadow-2xl"
        style={{ background: 'var(--canvas)', borderColor: 'var(--border)' }}
      >
        <header className="flex flex-col gap-1">
          <h2
            className="m-0 text-[18px] font-semibold"
            style={{ color: 'var(--t1)', fontFamily: 'var(--font-dm-sans), system-ui' }}
          >
            {m.title}
          </h2>
          <p className="m-0 text-[12px]" style={{ color: 'var(--t3)' }}>
            {m.sub}
          </p>
        </header>

        <label className="flex flex-col gap-1.5">
          <span
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--t3)' }}
          >
            {m.fields.name.label}
          </span>
          <input
            type="text"
            defaultValue={m.fields.name.default}
            className="h-9 rounded-md border bg-[var(--canvas)] px-3 text-[12.5px] outline-none focus:border-[var(--primary)]"
            style={{ borderColor: 'var(--border)', color: 'var(--t1)' }}
          />
          <span className="text-[10.5px]" style={{ color: 'var(--t4)' }}>
            {m.fields.name.helper}
          </span>
        </label>

        <label className="flex flex-col gap-1.5">
          <span
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--t3)' }}
          >
            {m.fields.description.label}
          </span>
          <textarea
            rows={3}
            defaultValue={m.fields.description.default}
            className="rounded-md border bg-[var(--canvas)] px-3 py-2 text-[12.5px] outline-none focus:border-[var(--primary)]"
            style={{ borderColor: 'var(--border)', color: 'var(--t1)' }}
          />
        </label>

        <fieldset className="flex flex-col gap-1.5">
          <legend
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--t3)' }}
          >
            {m.fields.scope.label}
          </legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {m.fields.scope.options.map((opt) => {
              const isDefault = 'default' in opt && opt.default === true;
              return (
                <label
                  key={opt.key}
                  className="flex cursor-pointer flex-col gap-0.5 rounded-md border px-3 py-2 text-[12px]"
                  style={{
                    background: isDefault ? 'var(--primary-soft)' : 'var(--base)',
                    borderColor: isDefault ? 'var(--primary-line)' : 'var(--border)',
                  }}
                >
                  <input type="radio" name="scope" defaultChecked={isDefault} className="sr-only" />
                  <span
                    className="font-semibold"
                    style={{ color: isDefault ? 'var(--primary)' : 'var(--t2)' }}
                  >
                    {opt.label}
                  </span>
                  <span className="text-[10.5px]" style={{ color: 'var(--t4)' }}>
                    {opt.sub}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <footer
          className="flex justify-end gap-2 border-t pt-3"
          style={{ borderColor: 'var(--border)' }}
        >
          <button
            onClick={onClose}
            className="inline-flex min-h-[36px] items-center rounded-md border px-3 text-[12px] font-semibold"
            style={{ background: 'var(--base)', borderColor: 'var(--border)', color: 'var(--t2)' }}
          >
            {m.footer_buttons[0]}
          </button>
          <button
            onClick={onSave}
            className="inline-flex min-h-[36px] items-center rounded-md border px-3 text-[12px] font-semibold"
            style={{
              background: 'var(--primary)',
              borderColor: 'var(--primary-line)',
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

// F20 Action footer (sticky bottom of page) — canonical L1205-1230.
// Hard Rule 17: every string from canned-data.ts.

'use client';

import { Play, AlertTriangle, FileWarning } from 'lucide-react';
import { F20_ACTION_FOOTER, type FooterAction } from './canned-data';

const VARIANT_STYLE: Record<FooterAction['variant'], { bg: string; bd: string; fg: string }> = {
  'primary-teal': {
    bg: 'var(--primary)',
    bd: 'var(--primary-line)',
    fg: 'var(--primary-ink)',
  },
  secondary: {
    bg: 'var(--raised)',
    bd: 'var(--border)',
    fg: 'var(--t2)',
  },
  tertiary: {
    bg: 'transparent',
    bd: 'transparent',
    fg: 'var(--t3)',
  },
  violet: {
    bg: 'var(--secondary)',
    bd: 'var(--secondary)',
    fg: 'var(--secondary-ink)',
  },
};

export function ActionFooter() {
  const left = F20_ACTION_FOOTER.slice(0, 2);
  const right = F20_ACTION_FOOTER.slice(2);
  return (
    <footer
      data-canonical-section="action-footer"
      className="flex flex-wrap items-center gap-2 border-t px-4 py-2.5 sm:px-5 lg:px-7"
      style={{ background: 'var(--base)', borderColor: 'var(--border)' }}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        {left.map((a) => (
          <FooterBtn key={a.label} action={a} />
        ))}
      </div>
      <span className="min-w-2 flex-1" />
      <div className="flex flex-wrap items-center gap-1.5">
        {right.map((a) => (
          <FooterBtn key={a.label} action={a} />
        ))}
      </div>
    </footer>
  );
}

function FooterBtn({ action }: { action: FooterAction }) {
  const style = VARIANT_STYLE[action.variant];
  const Icon =
    action.variant === 'primary-teal'
      ? Play
      : action.variant === 'secondary'
        ? AlertTriangle
        : action.variant === 'violet'
          ? FileWarning
          : null;
  return (
    <button
      type="button"
      aria-label={action.ariaLabel}
      onClick={() => console.info('pattern-a:deferred:f20:footer-action', { action: action.label })}
      className="inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-[11.5px] font-semibold transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
      style={{ background: style.bg, borderColor: style.bd, color: style.fg }}
    >
      {Icon && <Icon size={12} aria-hidden="true" strokeWidth={2.2} />}
      {action.label}
      {action.count > 0 && (
        <span
          className="ml-1 inline-flex h-4 min-w-[18px] items-center justify-center rounded-full font-mono text-[10px] font-bold"
          style={{
            background: 'rgba(0,0,0,0.25)',
            color: action.variant === 'tertiary' ? 'var(--t2)' : 'currentColor',
          }}
        >
          {action.count}
        </span>
      )}
    </button>
  );
}

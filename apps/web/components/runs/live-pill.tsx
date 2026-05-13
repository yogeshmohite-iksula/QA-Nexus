// Pulsing "LIVE" pill — F19 v2 HTML L263-267, L649.
//
// 1.4s ease-in-out pulse on the inner dot (`.ld`) per v2 spec.
// prefers-reduced-motion override comes from globals.css (animation
// disabled globally per media query — F19 pulse follows suit).

'use client';

interface LivePillProps {
  label?: string;
  variant?: 'pass' | 'info';
}

export function LivePill({ label = 'Live', variant = 'pass' }: LivePillProps) {
  const isInfo = variant === 'info';
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em]"
      style={{
        background: isInfo ? 'var(--info-soft)' : 'var(--pass-soft)',
        color: isInfo ? 'var(--info)' : 'var(--pass)',
        borderColor: isInfo ? 'var(--info-line)' : 'var(--pass-line)',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: '7px',
          height: '7px',
          borderRadius: '999px',
          background: isInfo ? 'var(--info)' : 'var(--pass)',
          animation: 'f19Pulse 1.4s ease-in-out infinite',
          boxShadow: isInfo ? '0 0 8px rgba(96,165,250,0.6)' : '0 0 8px rgba(52,211,153,0.6)',
        }}
      />
      {label}
    </span>
  );
}

/** Small variant used inside step-meta when a step is executing. */
export function LiveTag({ label }: { label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-semibold"
      style={{ color: 'var(--info)' }}
    >
      <span
        aria-hidden="true"
        style={{
          width: '5px',
          height: '5px',
          borderRadius: '999px',
          background: 'var(--info)',
          animation: 'f19Pulse 1s ease-in-out infinite',
        }}
      />
      {label}
    </span>
  );
}

/** Evidence-rail "Live capture" pill (1.2s pulse, mono font). */
export function LiveCapturePill({ label = 'Live capture' }: { label?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-wide"
      style={{
        fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
        color: 'var(--info)',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: '5px',
          height: '5px',
          borderRadius: '999px',
          background: 'var(--info)',
          animation: 'f19Pulse 1.2s ease-in-out infinite',
        }}
      />
      {label}
    </span>
  );
}

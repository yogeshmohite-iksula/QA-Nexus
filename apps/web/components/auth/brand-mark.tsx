// QA Nexus PM1 — Brand mark (logo + wordmark)
// Used in F06 Sign In and elsewhere on the auth surface.
// Source: PM1_UI_v2/frame  html view/F06 Sign In.html (lines 282-290).

export function BrandMark() {
  return (
    <div className="relative z-10 flex items-center gap-2.5">
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true">
        <path
          d="M9 2.5h6M10.2 2.5v4.6L5.2 16.6a2.2 2.2 0 0 0 2 3.2h9.6a2.2 2.2 0 0 0 2-3.2L13.8 7.1V2.5"
          stroke="#2dd4bf"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="10.6" cy="14.4" r="1" fill="#2dd4bf" />
        <circle cx="14.3" cy="16.8" r="0.8" fill="#2dd4bf" />
        <circle cx="12" cy="12" r="0.7" fill="#2dd4bf" />
      </svg>
      <span
        className="font-display text-primary text-[24px] font-bold tracking-[-0.01em]"
        style={{ fontFamily: 'var(--font-dm-sans), system-ui, sans-serif' }}
      >
        QA Nexus
      </span>
    </div>
  );
}

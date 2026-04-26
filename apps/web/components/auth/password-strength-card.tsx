// QA Nexus PM1 — Password Strength Card
// Static demo card matching F06b Set Password locked design.
// Source: PM1_UI_v2/frames - claude code build (PM1 v2.6-v2.8)/F06b Set Reset Password.html
// (.strength-card + .meter + .req-row rules).
//
// In the locked design this is a static visual at "Good" (3/4 strength).
// Real interactive strength evaluation lands in MS0-T021 alongside BetterAuth
// password validation (zxcvbn or equivalent).

import { cn } from '@/lib/utils';

interface Requirement {
  label: string;
  passed: boolean;
}

interface PasswordStrengthCardProps {
  /** "Good" by default; "Weak" / "Fair" / "Strong" supported. */
  level?: 'Weak' | 'Fair' | 'Good' | 'Strong';
  /** Filled segment count (0-4). Default 3 for "Good". */
  filledSegments?: number;
  /** Requirements list. Default = locked F06b values: 3 pass, 1 pending. */
  requirements?: Requirement[];
  className?: string;
}

const DEFAULT_REQUIREMENTS: Requirement[] = [
  { label: '8 or more characters', passed: true },
  { label: 'Uppercase letter (A–Z)', passed: true },
  { label: 'Number (0–9)', passed: true },
  { label: 'Special character (!@#$%^&*)', passed: false },
];

export function PasswordStrengthCard({
  level = 'Good',
  filledSegments = 3,
  requirements = DEFAULT_REQUIREMENTS,
  className,
}: PasswordStrengthCardProps) {
  // Segment colors per locked design (F06b "Good" + F06c "Strong"):
  //   s1 = fail (red), s2 = warn (amber), s3 = primary (teal),
  //   s4 = pass (green) when 4/4 is hit (Strong state, F06c).
  // Empty segments fall back to overlay.
  const segColor = (i: number) => {
    if (i >= filledSegments) return 'bg-overlay';
    if (i === 0) return 'bg-fail';
    if (i === 1) return 'bg-warn';
    if (i === 2) return 'bg-primary';
    return 'bg-pass';
  };

  // Level label color follows the dominant segment per locked F06c rule:
  // Strong -> pass (green), Good -> primary (teal), Fair -> warn (amber),
  // Weak -> fail (red). Keeps semantic parity with the meter.
  const levelColor =
    level === 'Strong'
      ? 'text-pass'
      : level === 'Good'
        ? 'text-primary'
        : level === 'Fair'
          ? 'text-warn'
          : 'text-fail';

  return (
    <div
      className={cn('border-border-subtle bg-raised rounded-[12px] border p-4', className)}
      aria-live="polite"
    >
      <div className="flex items-center justify-between">
        <span className="text-text-tertiary text-[11px] font-semibold uppercase tracking-[0.05em]">
          PASSWORD STRENGTH
        </span>
        <span
          className={cn('text-[12px] font-semibold', levelColor)}
          style={{
            fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {level}
        </span>
      </div>
      <div
        className="mt-3 flex h-[6px] w-full gap-[2px]"
        role="progressbar"
        aria-valuenow={filledSegments}
        aria-valuemin={0}
        aria-valuemax={4}
        aria-label={`Password strength: ${level}`}
      >
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              'flex-1 rounded-[2px] transition-[background,width] duration-300',
              segColor(i),
            )}
          />
        ))}
      </div>

      {/* Requirements checklist */}
      <div className="mt-3 flex flex-col gap-1.5">
        {requirements.map((req) => (
          <div
            key={req.label}
            className={cn(
              'flex h-5 items-center gap-[10px] text-[12px] leading-5 transition-[opacity,color] duration-200',
              req.passed ? 'text-text-secondary opacity-100' : 'text-text-tertiary opacity-70',
            )}
          >
            <span
              aria-hidden="true"
              className="inline-flex h-[14px] w-[14px] flex-none items-center justify-center"
            >
              {req.passed ? (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="6.25" fill="#34d399" />
                  <path
                    d="M4 7.2l2 2 4-4.2"
                    stroke="#0b0f17"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="5.75" stroke="#8a94a6" strokeWidth="1.3" />
                </svg>
              )}
            </span>
            <span>{req.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

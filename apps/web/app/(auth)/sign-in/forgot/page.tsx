// Implements F06c Reset Password · see PM1_UI_v2/frames - claude code build (PM1 v2.6-v2.8)/F06c Reset Password.html
// Backend wiring deferred to MS0-T021 (BetterAuth integration).
//
// F06c is the FORGOT-FLOW LANDING (Mode B): user clicks the reset link from
// the forgot-password email, lands here, sets a new password. Distinguishes
// from F06b (invite-link landing -- Mode A) by:
//   - Hero "Reset your password" + recipient email shown in mono font
//   - Strength card pre-filled to "Strong" (4/4) per locked design state
//     (sample of a strong password the user has just typed)
//   - Footer: AMBER pulse + warn-color time (1-hour reset window; <2h
//     triggers the warn state per locked F06c expiry banner)
//   - "← Back to sign in" tertiary link (lets user abandon the reset flow
//     without consuming the one-time token)
//
// RESPONSIVE LAYOUT (per CLAUDE.md hard rule 12, established 2026-04-26):
//   < 1024px (mobile + tablet portrait): brand panel HIDDEN; auth panel
//     fills viewport with mobile-only BrandMark above the form. Form
//     container max-w-[440px].
//   >= 1024px (lg+, desktop): two columns, brand panel left + auth panel
//     right, each flex-1.
// The locked F06c HTML frame is a 1600x1024 design REFERENCE -- React port
// is fully responsive per PM1_PRD §10 NFR-001.
//
// Anti-drift per validation checklist line 514: NO violet UI here (Auth
// surface is AI-free). Violet reserved for focus-rings only. TEAL for system
// actions (Reset password CTA). Amber/warn ONLY on the expiry indicator
// (semantic, not violet).
//
// DEVIATION from locked HTML (lines 339-347): the locked F06c also ships a
// small QA Nexus wordmark in the top-left of the auth panel. Per Yogesh
// override on 2026-04-26, that wordmark is OMITTED on desktop -- the left
// brand panel handles brand identity. On mobile (< lg) the BrandMark renders
// ABOVE the form to preserve identity when the brand panel is hidden by the
// responsive layout. Same deviation applies across F06b/F06c/F07/F07b/c/d.

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BrandMark } from '@/components/auth/brand-mark';
import { EvidenceMesh } from '@/components/auth/evidence-mesh';
import { PasswordInput } from '@/components/auth/password-input';
import { PasswordStrengthCard } from '@/components/auth/password-strength-card';
import { PulseDot } from '@/components/auth/pulse-dot';

// Demo recipient email -- in M1 this comes from decoding the reset token via
// BetterAuth on /auth/reset-password/[token]. "priya.s@iksula.com" preserved
// per 1:1 parity with the locked F06c HTML (note: not in the final 8-user
// pilot roster; replaced at runtime in M1).
const DEMO_EMAIL = 'priya.s@iksula.com';

// Demo pre-fill -- matches the locked F06c "Strong" design state. In
// production both inputs are empty on first paint.
const DEMO_PASSWORD = 'RefundFlow2026!';

// All 4 requirements met -- F06c shows the user has typed a Strong password
// (vs F06b's 3-pass / 1-pending "Good" sample state). Real interactive
// strength evaluation lands in MS0-T021 alongside zxcvbn or equivalent.
const ALL_REQUIREMENTS_MET = [
  { label: '8 or more characters', passed: true },
  { label: 'Uppercase letter (A–Z)', passed: true },
  { label: 'Number (0–9)', passed: true },
  { label: 'Special character (!@#$%^&*)', passed: true },
];

export default function ForgotPasswordPage() {
  const [newPassword, setNewPassword] = useState(DEMO_PASSWORD);
  const [confirmPassword, setConfirmPassword] = useState(DEMO_PASSWORD);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // MS0-T021 (M1): wire BetterAuth POST /auth/reset-password here.
    // For now: no-op stub so the form renders and submits cleanly.
    console.warn('F06c Reset Password submit -- BetterAuth integration pending (MS0-T021)', {
      newPasswordLength: newPassword.length,
      matches: newPassword === confirmPassword,
      emailScope: DEMO_EMAIL,
    });
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row" id="stage">
      {/* LEFT BRAND PANEL — identical to F06; hidden < lg */}
      <section
        aria-label="QA Nexus brand"
        className="border-border-subtle relative hidden flex-1 flex-col justify-between overflow-hidden border-r p-8 lg:flex xl:p-12"
        style={{
          background: [
            'linear-gradient(to right, transparent 0%, transparent 55%, rgba(11,15,23,0.4) 100%)',
            'radial-gradient(circle at 0% 100%, rgba(45,212,191,0.02) 0%, transparent 60%)',
            'radial-gradient(circle at 100% 0%, rgba(167,139,250,0.015) 0%, transparent 60%)',
            '#0b0f17',
          ].join(', '),
          boxShadow: 'inset 0 0 240px rgba(0,0,0,0.55)',
        }}
      >
        <EvidenceMesh />
        <BrandMark />
        <div className="relative z-10 max-w-[480px]">
          <h1
            className="m-0 leading-[1.05] tracking-[-0.02em]"
            style={{ fontFamily: 'var(--font-dm-sans), system-ui, sans-serif' }}
          >
            <span className="text-text-primary block text-[40px] font-bold xl:text-[56px]">
              Operational Intelligence.
            </span>
            <span className="text-primary block text-[40px] font-medium xl:text-[56px]">
              Engineered for quality.
            </span>
          </h1>
          <p className="text-text-secondary mt-6 max-w-[420px] text-[15px] font-normal leading-[1.5] tracking-[0.01em] xl:text-[17px]">
            Centralized test case management, AI-assisted defect intelligence, and real-time release
            posture &mdash; for QA teams that ship quality under pressure.
          </p>
        </div>
        <div className="relative z-10 flex flex-wrap items-center gap-4">
          <span
            className="border-border-subtle bg-canvas text-text-tertiary rounded-[4px] border px-2 py-1 text-[12px]"
            style={{
              fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            v1.0.4-stable
          </span>
          <span className="text-text-tertiary flex items-center gap-2 text-[14px]">
            <span
              aria-hidden="true"
              className="bg-pass block h-2 w-2 rounded-full"
              style={{ boxShadow: '0 0 0 3px rgba(52,211,153,0.15)' }}
            />
            All systems operational
          </span>
        </div>
      </section>

      {/* RIGHT AUTH PANEL — F06c Mode B Forgot-Flow */}
      <section
        aria-label="Reset password"
        className="bg-canvas relative flex flex-1 items-center justify-center overflow-y-auto px-4 py-12 sm:px-6 lg:px-8"
      >
        <div className="w-full max-w-[440px]">
          {/* Mobile-only BrandMark -- desktop's brand panel handles brand identity at lg+ */}
          <div className="mb-10 flex justify-center lg:hidden">
            <BrandMark />
          </div>

          {/* Reset hero */}
          <div>
            <h2
              className="text-text-primary m-0 mb-2 text-[28px] font-bold leading-9 sm:text-[30px]"
              style={{ fontFamily: 'var(--font-dm-sans), system-ui, sans-serif' }}
            >
              Reset your password
            </h2>
            <p className="text-text-secondary m-0 text-[15px] font-normal leading-6 sm:text-[16px]">
              Create a new password for{' '}
              <span
                className="text-text-primary font-medium"
                style={{
                  fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {DEMO_EMAIL}
              </span>
              .
            </p>
          </div>

          <form className="mt-8 flex flex-col gap-3" onSubmit={handleSubmit} noValidate>
            {/* New password */}
            <div>
              <label
                htmlFor="newpw"
                className="text-text-tertiary mb-2 block text-[12px] font-semibold uppercase tracking-[0.05em]"
              >
                New password<span className="text-fail ml-1">*</span>
              </label>
              <PasswordInput
                id="newpw"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            {/* Confirm password */}
            <div>
              <label
                htmlFor="confirmpw"
                className="text-text-tertiary mb-2 block text-[12px] font-semibold uppercase tracking-[0.05em]"
              >
                Confirm password<span className="text-fail ml-1">*</span>
              </label>
              <PasswordInput
                id="confirmpw"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            {/* Password strength card -- "Strong" (4/4) per F06c locked design.
                Component renders s4 in `bg-pass` (green) + label in `text-pass`
                because PasswordStrengthCard derives both colors from `level`. */}
            <PasswordStrengthCard
              className="mt-2"
              level="Strong"
              filledSegments={4}
              requirements={ALL_REQUIREMENTS_MET}
            />

            {/* Primary CTA — TEAL system action (never violet) */}
            <Button type="submit" variant="primary" className="mt-4 w-full">
              <span>Reset password</span>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path
                  d="M4 10h12M11 5l5 5-5 5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Button>
          </form>

          {/* Footer: link expiry -- AMBER pulse + warn-color time
              (F06c reset window is 1 hour total; <2h remaining triggers the
              warn semantic per locked banner. Compare with F06b's neutral
              24-hour invite expiry indicator.) */}
          <div className="mt-6 flex items-center justify-center gap-2">
            <PulseDot amber />
            <p
              className="text-text-tertiary m-0 text-center text-[12px]"
              style={{
                fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              Link expires in <span className="text-warn font-semibold">58 minutes</span>
            </p>
          </div>

          {/* Back to sign in -- F06c-specific (Mode B). Lets the user abandon
              the reset flow without consuming the single-use token. */}
          <div className="mt-6 text-center">
            <Link
              href="/sign-in"
              className="text-text-tertiary hover:text-text-secondary inline-flex items-center gap-1.5 text-[13px] font-medium no-underline transition-colors duration-150"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path
                  d="M9 3L5 7l4 4"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Back to sign in</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

// Implements F06 Sign In · see PM1_UI_v2/frame  html view/F06 Sign In.html
// Backend wiring deferred to MS0-T021 (BetterAuth integration).
//
// Two-panel layout (1600x1024):
//   LEFT  brand panel  - Evidence Mesh constellation + brand mark + hero + status meta
//   RIGHT auth panel   - centered 384px form with email + password + Authenticate
// Anti-drift: TEAL #2dd4bf for ALL system actions (Authenticate, Forgot password link).
// VIOLET #a78bfa is reserved for AI surfaces; on F06 the "Contact Site Admin"
// link uses violet because it's an admin-escalation route (the canonical
// non-AI use of violet -- see 01_SYSTEM.md sec 3.1 CTA / AI disambiguation rule).

'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input, InputWrap, InputIcon } from '@/components/ui/input';
import { BrandMark } from '@/components/auth/brand-mark';
import { EvidenceMesh } from '@/components/auth/evidence-mesh';

export default function SignInPage() {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // MS0-T021 (M1): wire BetterAuth POST /auth/sign-in here.
    // For now: no-op stub so the form renders and submits cleanly.
    console.warn('F06 Sign In submit -- BetterAuth integration pending (MS0-T021)');
  }

  return (
    <div className="mx-auto flex min-h-screen w-[1600px]" id="stage">
      {/* LEFT BRAND PANEL */}
      <section
        aria-label="QA Nexus"
        className="border-border-subtle relative flex w-[800px] flex-none flex-col justify-between overflow-hidden border-r p-12"
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

        {/* Brand mark (top-left) */}
        <BrandMark />

        {/* Hero (middle) */}
        <div className="relative z-10 max-w-[480px]">
          <h1
            className="m-0 leading-[1.05] tracking-[-0.02em]"
            style={{ fontFamily: 'var(--font-dm-sans), system-ui, sans-serif' }}
          >
            <span className="text-text-primary block text-[56px] font-bold">
              Operational Intelligence.
            </span>
            <span className="text-primary block text-[56px] font-medium">
              Engineered for quality.
            </span>
          </h1>
          <p className="text-text-secondary mt-6 max-w-[420px] text-[17px] font-normal leading-[1.5] tracking-[0.01em]">
            Centralized test case management, AI-assisted defect intelligence, and real-time release
            posture &mdash; for QA teams that ship quality under pressure.
          </p>
        </div>

        {/* Meta (bottom-left): version chip + status indicator */}
        <div className="relative z-10 flex items-center gap-4">
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

      {/* RIGHT AUTH PANEL */}
      <section
        aria-label="Sign in"
        className="bg-canvas flex w-[800px] flex-none items-center justify-center p-12"
      >
        <div className="w-[384px]">
          <div className="text-center">
            <h2
              className="text-text-primary m-0 mb-2 text-[30px] font-semibold leading-9"
              style={{ fontFamily: 'var(--font-dm-sans), system-ui, sans-serif' }}
            >
              Sign in to workspace
            </h2>
            <p className="text-text-secondary m-0 text-[16px] font-normal leading-[1.5]">
              Enter your credentials to access the workbench.
            </p>
          </div>

          <form className="mt-12 flex flex-col gap-6" onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="text-text-tertiary mb-2 block text-[12px] font-semibold uppercase tracking-[0.05em]"
              >
                Work email
              </label>
              <InputWrap>
                <InputIcon>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <rect
                      x="2.5"
                      y="4"
                      width="15"
                      height="12"
                      rx="1.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M3 5.5l7 5 7-5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                  </svg>
                </InputIcon>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="nexus.operator@company.com"
                  hasIcon
                />
              </InputWrap>
            </div>

            {/* Password */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-text-tertiary text-[12px] font-semibold uppercase tracking-[0.05em]"
                >
                  Password
                </label>
                <Link
                  href="/sign-in/forgot"
                  className="text-primary text-[12px] font-normal hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <InputWrap>
                <InputIcon>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <rect
                      x="3.5"
                      y="9"
                      width="13"
                      height="8.5"
                      rx="1.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <path d="M6 9V6.5a4 4 0 0 1 8 0V9" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </InputIcon>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  hasIcon
                />
              </InputWrap>
            </div>

            {/* Submit -- TEAL CTA (system action, never violet) */}
            <Button type="submit" variant="primary" className="mt-2 w-full">
              <span>Authenticate</span>
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

          {/* Contact Site Admin -- violet link is canonical for admin escalation */}
          <p className="text-text-tertiary mt-12 text-center text-[14px] font-normal">
            Need emergency access?{' '}
            <Link href="#" className="text-secondary no-underline hover:underline">
              Contact Site Admin
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}

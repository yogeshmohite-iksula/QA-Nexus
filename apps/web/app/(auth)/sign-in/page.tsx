// F06 Sign In — magic-link Pattern B (BetterAuth live wiring, T021 + ADR-007).
//
// BetterAuth's magic-link plugin owns the verify route at
// `/api/auth/magic-link/verify` — the link auto-authenticates +
// redirects via `callbackURL`. This file owns the email-entry UX +
// "Check your inbox" success state only.
//
// 4 view states:
//   - Initial:    email input + "Send magic link" button
//   - Submitting: button disabled + spinner
//   - Sent:       "Check your inbox at <email>" + 60 s resend timer
//   - Error:      Sonner toast (surfaced from authClient catch or ?error= param)
//
// Anti-drift: TEAL `var(--primary)` for the Send button (system CTA).
// VIOLET `var(--secondary)` reserved for AI surfaces; "Contact Site
// Admin" link below uses violet because it's an admin-escalation
// route (canonical non-AI use of violet per 01_SYSTEM.md §3.1).

'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Loader2, Mail, MailCheck } from 'lucide-react';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth/client';
import { getAppBaseURL } from '@/lib/env';
import { Button } from '@/components/ui/button';
import { Input, InputWrap, InputIcon } from '@/components/ui/input';
import { BrandMark } from '@/components/auth/brand-mark';
import { EvidenceMesh } from '@/components/auth/evidence-mesh';

// Cross-tab session polling cadence (per #137 brief). Sign-in tab
// polls every 2 s while showing "Check your inbox" — when the user
// completes the magic-link verify in another tab, this tab detects
// the new session cookie and auto-redirects. Stops after 10 min
// (= magic-link expiry, no point polling longer).
const SESSION_POLL_INTERVAL_MS = 2000;
const SESSION_POLL_TIMEOUT_MS = 10 * 60 * 1000; // 10 min

type SignInState = 'initial' | 'submitting' | 'sent';

const RESEND_SECONDS = 60;
// Minimal RFC-5322-ish guardrail. BetterAuth + the BE will do the
// canonical validation; this is just to suppress obvious typos before
// firing the (deferred) request.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Next.js 15 + `output: 'export'` requires `useSearchParams()` to live
// inside a <Suspense> boundary at the route segment, otherwise the
// static prerender bails. The default export is a thin Suspense wrapper;
// all real logic lives in <SignInPageInner />.
export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInPageInner />
    </Suspense>
  );
}

function SignInPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [state, setState] = useState<SignInState>('initial');
  const [sentToEmail, setSentToEmail] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Surface BetterAuth's `errorCallbackURL` redirect signals (e.g.
  // `?error=expired`) as a Sonner toast on mount. Pattern B uses the
  // same query-param convention so this code stays put through the flip.
  useEffect(() => {
    const err = searchParams?.get('error');
    if (!err) return;
    if (err === 'expired') {
      toast.error('That magic link has expired', {
        description: 'Send yourself a fresh one — links are valid for ~10 minutes.',
      });
    } else if (err === 'invalid') {
      toast.error('That magic link could not be verified', {
        description: 'Send a new one and try again.',
      });
    } else if (err === 'rate-limit') {
      toast.error('Too many sign-in attempts', {
        description: 'Wait a minute, then try again.',
      });
    }
  }, [searchParams]);

  // Resend countdown ticker — runs while in `sent` state.
  useEffect(() => {
    if (state !== 'sent' || resendCountdown <= 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    intervalRef.current = setInterval(() => {
      setResendCountdown((s) => Math.max(0, s - 1));
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state, resendCountdown]);

  // Cross-tab session polling (#137). While "Check your inbox" is on
  // screen, poll for a session every 2 s. When the user clicks the
  // magic-link in their email (which now opens the intermediate-confirm
  // page in a new tab) and presses "Confirm sign in", the session
  // cookie lands. The next poll here detects it and auto-redirects
  // THIS tab to /home — so the user returning to the original tab
  // sees the workspace instead of "Check your inbox".
  //
  // 10-minute timeout matches the magic-link expiry (BA config: 600s).
  // We stop polling on unmount + state-change + timeout — three layers.
  useEffect(() => {
    if (state !== 'sent') return;
    let stopped = false;
    const poll = window.setInterval(async () => {
      if (stopped) return;
      try {
        const session = await authClient.getSession();
        if (session?.data?.user) {
          stopped = true;
          window.clearInterval(poll);
          router.replace('/home');
        }
      } catch {
        /* network blip — keep polling */
      }
    }, SESSION_POLL_INTERVAL_MS);
    const timeout = window.setTimeout(() => {
      stopped = true;
      window.clearInterval(poll);
    }, SESSION_POLL_TIMEOUT_MS);
    return () => {
      stopped = true;
      window.clearInterval(poll);
      window.clearTimeout(timeout);
    };
  }, [state, router]);

  const isEmailValid = useMemo(() => EMAIL_RE.test(email.trim()), [email]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === 'submitting') return; // double-submit guard
    const value = email.trim();
    if (!EMAIL_RE.test(value)) {
      toast.error('Enter a valid work email', {
        description: 'Format: name@company.com',
      });
      return;
    }

    setState('submitting');

    // BetterAuth client resolves with { data, error } — never throws.
    // errorCallbackURL is a server-side BetterAuth config option (set in
    // BE T021's magicLink() plugin), not a client-side parameter.
    //
    // ABSOLUTE callbackURL required (Day-16 M3 close blocker): the
    // verify redirect runs on the API origin (qa-nexus-api.onrender.com);
    // a relative '/home' would resolve against the API origin and 404.
    // Refs: BetterAuth GH #6104, #7406.
    const { error } = await authClient.signIn.magicLink({
      email: value,
      callbackURL: `${getAppBaseURL()}/home`,
    });

    if (error) {
      setState('initial');
      toast.error('Failed to send magic link', {
        description: error.message ?? 'Please try again.',
      });
      return;
    }

    setSentToEmail(value);
    setResendCountdown(RESEND_SECONDS);
    setState('sent');
  }

  async function handleResend() {
    if (resendCountdown > 0 || state !== 'sent') return;
    // ABSOLUTE callbackURL — see handleSubmit comment above for rationale.
    const { error } = await authClient.signIn.magicLink({
      email: sentToEmail,
      callbackURL: `${getAppBaseURL()}/home`,
    });
    if (error) {
      toast.error('Failed to resend magic link', {
        description: error.message ?? 'Please try again.',
      });
      return;
    }
    toast.success('Magic link resent', {
      description: `Sent another link to ${sentToEmail}.`,
    });
    setResendCountdown(RESEND_SECONDS);
  }

  function handleUseDifferentEmail() {
    setEmail('');
    setSentToEmail('');
    setResendCountdown(0);
    setState('initial');
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row" id="stage">
      {/* LEFT BRAND PANEL — hidden < lg (1024px); flex-1 on desktop */}
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

      {/* RIGHT AUTH PANEL — always visible; full width on mobile, flex-1 on desktop */}
      <section
        aria-label="Sign in"
        className="bg-canvas flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8"
      >
        <div className="w-full max-w-[440px]">
          <div className="mb-10 flex justify-center lg:hidden">
            <BrandMark />
          </div>

          {state === 'sent' ? (
            <SentState
              email={sentToEmail}
              resendCountdown={resendCountdown}
              onResend={handleResend}
              onUseDifferentEmail={handleUseDifferentEmail}
            />
          ) : (
            <InitialState
              email={email}
              setEmail={setEmail}
              isEmailValid={isEmailValid}
              isSubmitting={state === 'submitting'}
              onSubmit={handleSubmit}
            />
          )}

          <p className="text-text-tertiary mt-10 text-center text-[14px] font-normal sm:mt-12">
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

// ---------------------------------------------------------------------------
// Initial state (email input + Send magic link)
// ---------------------------------------------------------------------------

interface InitialStateProps {
  email: string;
  setEmail: (s: string) => void;
  isEmailValid: boolean;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

function InitialState({
  email,
  setEmail,
  isEmailValid,
  isSubmitting,
  onSubmit,
}: InitialStateProps) {
  return (
    <>
      <div className="text-center">
        <h2
          className="text-text-primary m-0 mb-2 text-[28px] font-semibold leading-9 sm:text-[30px]"
          style={{ fontFamily: 'var(--font-dm-sans), system-ui, sans-serif' }}
        >
          Sign in to workspace
        </h2>
        <p className="text-text-secondary m-0 text-[15px] font-normal leading-[1.5] sm:text-[16px]">
          Enter your work email — we&apos;ll send you a one-click sign-in link.
        </p>
      </div>

      <form className="mt-10 flex flex-col gap-6 sm:mt-12" onSubmit={onSubmit} noValidate>
        <div>
          <label
            htmlFor="email"
            className="text-text-tertiary mb-2 block text-[12px] font-semibold uppercase tracking-[0.05em]"
          >
            Work email
          </label>
          <InputWrap>
            <InputIcon>
              <Mail size={18} aria-hidden="true" />
            </InputIcon>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="nexus.operator@iksula.com"
              hasIcon
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              required
              aria-invalid={email.length > 0 && !isEmailValid ? 'true' : 'false'}
            />
          </InputWrap>
          {email.length > 0 && !isEmailValid && (
            <p role="alert" className="mt-1.5 text-[12px] text-[var(--fail)]">
              Enter a valid email like name@company.com.
            </p>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          className="mt-2 w-full"
          disabled={!isEmailValid || isSubmitting}
          aria-busy={isSubmitting || undefined}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={18} aria-hidden="true" className="animate-spin" />
              <span>Sending magic link…</span>
            </>
          ) : (
            <>
              <span>Send magic link</span>
              <ArrowRight size={18} aria-hidden="true" />
            </>
          )}
        </Button>

        <p className="text-text-tertiary text-center text-[12px] leading-[18px]">
          Magic links expire in 10 minutes. We&apos;ll never ask for your password.
        </p>
      </form>
    </>
  );
}

// ---------------------------------------------------------------------------
// Sent state ("Check your inbox at <email>" + 60 s resend timer)
// ---------------------------------------------------------------------------

interface SentStateProps {
  email: string;
  resendCountdown: number;
  onResend: () => void;
  onUseDifferentEmail: () => void;
}

function SentState({ email, resendCountdown, onResend, onUseDifferentEmail }: SentStateProps) {
  const canResend = resendCountdown === 0;
  return (
    <div className="text-center">
      <div
        aria-hidden="true"
        className="bg-secondary/15 mx-auto mb-5 inline-flex h-14 w-14 items-center justify-center rounded-full"
      >
        <MailCheck size={26} className="text-secondary" />
      </div>
      <h2
        className="text-text-primary m-0 mb-2 text-[26px] font-semibold leading-9 sm:text-[28px]"
        style={{ fontFamily: 'var(--font-dm-sans), system-ui, sans-serif' }}
      >
        Check your inbox
      </h2>
      <p className="text-text-secondary m-0 text-[14px] leading-[1.5] sm:text-[15px]">
        We sent a sign-in link to{' '}
        <span
          className="text-text-primary font-mono font-semibold"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {email}
        </span>
        .
      </p>
      <p className="text-text-tertiary m-0 mt-1 text-[13px] leading-[1.5]">
        Click the link in the email to sign in. The link is valid for 10 minutes.
      </p>

      <div className="mt-8 flex flex-col gap-3">
        <button
          type="button"
          onClick={onResend}
          disabled={!canResend}
          className="text-text-secondary inline-flex h-10 min-h-[44px] w-full items-center justify-center gap-1.5 rounded-md border border-[var(--border-subtle)] bg-[var(--raised)] px-3 text-[13px] font-medium transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-0"
        >
          {canResend ? (
            <span>Resend the link</span>
          ) : (
            <span>
              Resend in <span className="font-mono">{resendCountdown}s</span>
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={onUseDifferentEmail}
          className="text-text-tertiary inline-flex h-9 items-center justify-center text-[12.5px] underline-offset-2 hover:text-[var(--text-primary)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
        >
          Use a different email
        </button>
      </div>

      <p className="text-text-tertiary mt-8 text-[12px] leading-[18px]">
        Didn&apos;t see the email? Check Spam or Promotions, or wait a moment and resend.
      </p>
    </div>
  );
}

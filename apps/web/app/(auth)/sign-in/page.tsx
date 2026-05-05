// F06 Sign In — magic-link Pattern A scaffold (Day-9, M1 close prep).
//
// Per Day-9 brief + BetterAuth research: the "verify the magic link
// click" route is owned by BetterAuth at `/api/auth/magic-link/verify`
// — there is NO custom verify page on the FE. The link auto-
// authenticates + redirects to the `callbackURL` we pass to
// `signIn.magicLink()`. So this file owns just the email-entry UX +
// "Check your inbox" success state.
//
// 4 view states (Pattern A):
//   - Initial:    email input + "Send magic link" button
//   - Submitting: button disabled + spinner
//   - Sent:       "Check your inbox at <email>" + 60 s resend timer
//   - Error:      Sonner toast (invalid email / rate-limit)
//
// Pattern A marker:
//   console.info('pattern-a:deferred:sign-in:send-magic-link', { email });
//
// Pattern B target (post BE T021 + ADR-007 land):
//   import { authClient } from '@/lib/auth/client';
//   await authClient.signIn.magicLink({
//     email,
//     callbackURL: '/home',
//     errorCallbackURL: '/sign-in?error=expired',
//   });
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
import { Button } from '@/components/ui/button';
import { Input, InputWrap, InputIcon } from '@/components/ui/input';
import { BrandMark } from '@/components/auth/brand-mark';
import { EvidenceMesh } from '@/components/auth/evidence-mesh';
import { useAuth } from '@/lib/auth/use-auth';

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();

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

    // PATTERN-A: send-magic-link deferred until M1 (T021) - real BetterAuth POST /api/auth/magic-link/sign-in
    console.info('pattern-a:deferred:sign-in:send-magic-link', { email: value });

    // Simulated network round-trip so loading state is observable.
    // Pattern B replaces this with the real `authClient.signIn.magicLink()`
    // call; the link click then redirects via BetterAuth's own verify
    // route — we don't see "Sent" in the real flow, the user sees a
    // server-issued "magic-link sent" page or this same Sent state if
    // the FE handles it.
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Pattern A side-effect: stamp a stub user into AuthProvider's
    // localStorage so subsequent route guards "see" us as signed-in
    // when we manually navigate to /home for visual gating. Pattern B
    // does NOT do this — the real flow gates on the link click + BE
    // session-cookie issuance.
    await signIn(value);

    setSentToEmail(value);
    setResendCountdown(RESEND_SECONDS);
    setState('sent');
  }

  function handleResend() {
    if (resendCountdown > 0 || state !== 'sent') return;
    // PATTERN-A: resend-magic-link deferred until M1 (T021) - real BetterAuth POST /api/auth/magic-link/sign-in
    console.info('pattern-a:deferred:sign-in:resend-magic-link', { email: sentToEmail });
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
              onSimulateInbox={() => router.push('/home')}
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
  /** Pattern A only — clicking "Open inbox" simulates the magic-link
   *  redirect to /home. Pattern B drops this — the real flow lands the
   *  user there via the BetterAuth verify route, not via this button. */
  onSimulateInbox: () => void;
}

function SentState({
  email,
  resendCountdown,
  onResend,
  onUseDifferentEmail,
  onSimulateInbox,
}: SentStateProps) {
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
        <Button type="button" variant="primary" className="w-full" onClick={onSimulateInbox}>
          <span>Simulate inbox click → /home</span>
          <ArrowRight size={18} aria-hidden="true" />
        </Button>

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

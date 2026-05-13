// Intermediate confirm page — magic-link Gmail prefetch fix
// (M3 close blocker, Day-18, PR #137).
//
// Why this page exists: Gmail's email-security scanner pre-fetches
// magic-link URLs to scan for phishing. BetterAuth ≥ 1.6.11 hardcoded
// atomic single-use via GHSA-hc7v-rggr-4hvx — the token is consumed
// on the scanner's GET, so the real user click hits `?error=invalid`.
//
// Canonical fix (Slack, Notion, Linear, GitHub all use this): the
// magic-link URL in the email points to THIS page (FE) with the token
// in the URL but NOT auto-consumed. The page renders a "Confirm Sign In"
// button that the scanner can't click. Real user clicks → POSTs the
// token to BetterAuth's verify endpoint via the client SDK → session
// cookie set → redirect to callbackURL.
//
// BE one-liner (sister change in apps/api/src/auth/auth.config.ts):
// `sendMagicLink` callback rewrites the email URL to point here
// instead of BA's verify endpoint. See PR #137 description for the
// exact server-side change.
//
// 3 view states:
//   - 'ready'   — initial render. Big "Confirm Sign In" button.
//   - 'loading' — after click. Spinner + "Signing you in…".
//   - 'error'   — token missing / expired / already-used. Inline
//                 message + "Back to sign-in" link. NO Sonner toast
//                 (this is a full-page error, not a transient).
//
// Hard Rule 14 exclusion: AdminShell NOT used — auth flow pages live
// outside the (app) shell. Layout mirrors the sign-in page's RIGHT
// auth panel (centered card, ≤440px max-width, brand mark on top).

'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Loader2, MailCheck, ShieldAlert } from 'lucide-react';
import { authClient } from '@/lib/auth/client';
import { Button } from '@/components/ui/button';
import { BrandMark } from '@/components/auth/brand-mark';

type ViewState = 'ready' | 'loading' | 'error';

// Next.js 15 + `output: 'export'` requires `useSearchParams()` inside
// a <Suspense> boundary at the route segment, otherwise the static
// prerender bails (same pattern as sign-in/page.tsx).
export default function VerifyMagicLinkPage() {
  return (
    <Suspense fallback={null}>
      <VerifyMagicLinkPageInner />
    </Suspense>
  );
}

function VerifyMagicLinkPageInner() {
  const params = useSearchParams();
  const router = useRouter();
  const [state, setState] = useState<ViewState>('ready');
  const [errorMsg, setErrorMsg] = useState('');

  const token = params?.get('token') ?? '';
  const callbackURL = params?.get('callbackURL') ?? '/home';

  // If the token is missing in the URL, jump straight to the error
  // state on mount — the user opened this page without a valid link.
  useEffect(() => {
    if (!token) {
      setState('error');
      setErrorMsg('No sign-in token found. Open the latest sign-in link from your email.');
    }
  }, [token]);

  const handleConfirm = useCallback(async () => {
    if (!token) {
      setState('error');
      setErrorMsg('No sign-in token found. Open the latest sign-in link from your email.');
      return;
    }
    setState('loading');
    try {
      // BetterAuth client's verify call — POSTs the token to the API,
      // consumes it atomically, and sets the session cookie on success.
      // The cookie domain + path are owned by BA + the API server config.
      const result = await authClient.magicLink.verify({ query: { token } });
      if (result?.error) {
        setState('error');
        setErrorMsg(
          result.error.message ||
            'This sign-in link is no longer valid. Request a new one from the sign-in page.',
        );
        return;
      }
      // Success — redirect to the callbackURL (defaults to /home).
      // Use a regex guard against open-redirect: only allow internal
      // (same-origin) paths starting with `/` OR explicit same-origin
      // URLs. Anything external (http(s)://other-origin) falls back
      // to /home defensively.
      const safeTarget = isInternalPath(callbackURL) ? callbackURL : '/home';
      router.replace(safeTarget);
    } catch (e) {
      setState('error');
      const message = e instanceof Error ? e.message : 'Sign in failed unexpectedly.';
      setErrorMsg(`${message} Request a new sign-in link.`);
    }
  }, [token, callbackURL, router]);

  return (
    <main
      aria-label="Confirm magic-link sign in"
      className="bg-canvas flex min-h-screen items-center justify-center px-4 py-12 sm:px-6"
    >
      <div className="w-full max-w-[440px]">
        <div className="mb-10 flex justify-center">
          <BrandMark />
        </div>

        {state === 'error' ? (
          <ErrorPanel message={errorMsg} />
        ) : (
          <ConfirmPanel state={state} onConfirm={handleConfirm} />
        )}

        <p className="text-text-tertiary mt-10 text-center text-[14px] font-normal sm:mt-12">
          Need a fresh link?{' '}
          <Link href="/sign-in" className="text-secondary no-underline hover:underline">
            Back to sign-in
          </Link>
        </p>
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// ConfirmPanel — 'ready' (button enabled) + 'loading' (spinner) states
// ---------------------------------------------------------------------------

interface ConfirmPanelProps {
  state: Exclude<ViewState, 'error'>;
  onConfirm: () => void;
}

function ConfirmPanel({ state, onConfirm }: ConfirmPanelProps) {
  const isLoading = state === 'loading';
  return (
    <div className="text-center">
      <div
        aria-hidden="true"
        className="bg-secondary/15 mx-auto mb-5 inline-flex h-14 w-14 items-center justify-center rounded-full"
      >
        <MailCheck size={26} className="text-secondary" />
      </div>
      <h1
        className="text-text-primary m-0 mb-2 text-[26px] font-semibold leading-9 sm:text-[28px]"
        style={{ fontFamily: 'var(--font-dm-sans), system-ui, sans-serif' }}
      >
        Confirm sign in
      </h1>
      <p className="text-text-secondary m-0 text-[14px] leading-[1.5] sm:text-[15px]">
        We&apos;ll finish signing you in once you tap the button below.
      </p>
      <p className="text-text-tertiary m-0 mt-2 text-[12.5px] leading-[1.5]">
        This extra step protects against email security scanners that pre-open sign-in links before
        you do.
      </p>

      <div className="mt-8 flex flex-col gap-3">
        <Button
          type="button"
          variant="primary"
          className="w-full"
          onClick={onConfirm}
          disabled={isLoading}
          aria-busy={isLoading || undefined}
        >
          {isLoading ? (
            <>
              <Loader2 size={18} aria-hidden="true" className="animate-spin" />
              <span>Signing you in…</span>
            </>
          ) : (
            <>
              <span>Confirm sign in</span>
              <ArrowRight size={18} aria-hidden="true" />
            </>
          )}
        </Button>
      </div>

      <p className="text-text-tertiary mt-8 text-[12px] leading-[18px]">
        Magic links expire 10 minutes after they&apos;re sent.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ErrorPanel — terminal failure state (missing/expired/used token)
// ---------------------------------------------------------------------------

interface ErrorPanelProps {
  message: string;
}

function ErrorPanel({ message }: ErrorPanelProps) {
  return (
    <div className="text-center">
      <div
        aria-hidden="true"
        className="bg-fail/15 mx-auto mb-5 inline-flex h-14 w-14 items-center justify-center rounded-full"
        style={{ background: 'rgba(248,113,113,0.15)' }}
      >
        <ShieldAlert size={26} style={{ color: 'var(--fail)' }} />
      </div>
      <h1
        className="text-text-primary m-0 mb-2 text-[26px] font-semibold leading-9 sm:text-[28px]"
        style={{ fontFamily: 'var(--font-dm-sans), system-ui, sans-serif' }}
      >
        Sign in failed
      </h1>
      <p role="alert" className="text-text-secondary m-0 text-[14px] leading-[1.5] sm:text-[15px]">
        {message}
      </p>

      <div className="mt-8 flex flex-col gap-3">
        <Link
          href="/sign-in"
          className="hover:bg-[var(--primary)]/90 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[4px] bg-[var(--primary)] px-6 text-[16px] font-semibold text-[var(--primary-ink)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--secondary)]"
        >
          <span>Request a new link</span>
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** True when `target` is a same-origin internal path (`/...` but NOT
 *  `//host` protocol-relative). Used to guard the post-verify redirect
 *  against open-redirect attacks via a hostile `?callbackURL=...`. */
function isInternalPath(target: string): boolean {
  if (!target) return false;
  // Protocol-relative URLs (//host/path) can redirect to external origins.
  if (target.startsWith('//')) return false;
  // Absolute paths only.
  if (!target.startsWith('/')) return false;
  return true;
}

// AdminGuard — client-side RBAC + auth fence for the M1 admin surface.
//
// P0-A (2026-06-13): in PRODUCTION an unauthenticated visitor must NOT reach
// the admin surface via the dev/CI Yogesh-Admin fallback (CurrentUserContext
// returns the Yogesh seed when there is no session — great for local preview +
// e2e smoke, but on the deployed app it meant a signed-out visitor passed the
// `role === 'Admin'` check). So in prod we require a REAL session
// (`isAuthenticated`) before the role check; no session → redirect to
// `/sign-in`. In dev/CI (`NODE_ENV !== 'production'`) the fallback persona
// stands so local preview + the smoke suite render without a live session.
//
// Two-layer fence:
//   1. session: prod + resolved-null-session → /sign-in
//   2. role:    authenticated non-Admin → /home?error=admin-required (existing)
//
// Server-side guard (true defence-in-depth) still lands with the BetterAuth
// middleware in M6 (MS0-T021) — this client fence is the cheapest correct guard
// for a statically-exported app (Cloudflare Pages, `output: 'export'`, no edge
// session read). The hook signature stays stable.

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser, useCurrentUserMeta } from '@/lib/contexts/CurrentUserContext';

interface AdminGuardProps {
  children: React.ReactNode;
}

const IS_PROD = process.env.NODE_ENV === 'production';

function GuardPlaceholder({ message }: { message: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-screen items-center justify-center bg-[var(--canvas)] px-4 text-center"
    >
      <p className="text-[13px] text-[var(--text-tertiary)]">{message}</p>
    </div>
  );
}

export function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const me = useCurrentUser();
  const { isLoading, isAuthenticated } = useCurrentUserMeta();

  // Layer 1 (prod only): no real session → unauthenticated. In dev/CI the
  // fallback persona is intentional, so this never trips there.
  const sessionBlocked = IS_PROD && !isLoading && !isAuthenticated;
  // Layer 2: authenticated (or dev fallback) but not an Admin.
  const roleBlocked = !sessionBlocked && me.role !== 'Admin';

  useEffect(() => {
    // Wait for the session to resolve before any redirect (prod only).
    if (IS_PROD && isLoading) return;
    if (sessionBlocked) {
      router.replace('/sign-in');
      return;
    }
    if (me.role !== 'Admin') {
      // PATTERN-A: non-Admin redirect; server guard lands MS0-T021 (M6).
      console.info('pattern-a:deferred:rbac-redirect', {
        from: '/admin',
        userId: me.id,
        userRole: me.role,
        reason: 'admin-required',
      });
      router.replace('/home?error=admin-required');
    }
  }, [sessionBlocked, isLoading, me.id, me.role, router]);

  // In prod, don't flash the admin surface while the session is resolving.
  if (IS_PROD && isLoading) {
    return <GuardPlaceholder message="Checking access…" />;
  }
  if (sessionBlocked) {
    return <GuardPlaceholder message="Sign in required. Redirecting…" />;
  }
  if (roleBlocked) {
    return <GuardPlaceholder message="Admin access required. Redirecting to home…" />;
  }

  return <>{children}</>;
}

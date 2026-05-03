// AdminGuard — client-side RBAC fence for the M1 admin surface.
//
// Pattern A: deferred routing only — fires `pattern-a:deferred:rbac-redirect`
// then `router.replace('/home?error=admin-required')`. The /home page
// SHOULD show a Sonner toast when `?error=admin-required` is present
// (TODO when Sonner ships in the FE locked stack — currently not yet
// installed; the query param is the structural hook).
//
// Server-side guard lands when MS0-T021 BetterAuth + middleware land.
// Until then this client-side fence is the cheapest correct guard for
// the visual gate; defence-in-depth is the BetterAuth middleware blocking
// the request before it reaches React.
//
// Why client-side now: the route is statically exported (Cloudflare Pages
// + Next `output: 'export'`) so we can't read the session cookie at the
// edge. Once BE auth lands and we move to a serverful render path, this
// guard relocates to a server component. The hook signature stays stable.

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/lib/contexts/CurrentUserContext';

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const me = useCurrentUser();
  const allowed = me.role === 'Admin';

  useEffect(() => {
    if (!allowed) {
      // PATTERN-A: redirect non-Admin user deferred until M1 (T030.5) - client fence; server guard lands MS0-T021
      console.info('pattern-a:deferred:rbac-redirect', {
        from: '/admin',
        userId: me.id,
        userRole: me.role,
        reason: 'admin-required',
      });
      router.replace('/home?error=admin-required');
    }
  }, [allowed, me.id, me.role, router]);

  if (!allowed) {
    // Render a minimal redirect placeholder. Avoids flashing the admin
    // surface to non-admins while the router replace happens.
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-screen items-center justify-center bg-[var(--canvas)] px-4 text-center"
      >
        <p className="text-[13px] text-[var(--text-tertiary)]">
          Admin access required. Redirecting to home…
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

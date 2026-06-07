// useSessionUser — thin wrapper over BetterAuth's authClient.useSession().
//
// P0-001 Pattern-B wire (Sun 2026-06-07). Source of truth for the real
// signed-in identity. The BetterAuth user model carries app fields
// (displayName / role / organizationalLabel) as additionalFields
// (BE apps/api/src/auth/auth.service.ts:31-43), so the session alone is
// enough to render the topbar + rail-foot identity — no extra /api/users/:id
// fetch needed.
//
// API verified (NOT the brief's P.4/P.5): `authClient.useSession()` returns
// `{ data: { user, session } | null, isPending, error }`. Already used by
// app/(auth)/sign-in/page.tsx for post-magic-link polling.

'use client';

import type { UserRole } from '@qa-nexus/shared';
import { authClient } from './client';

/** The identity subset the shell renders, sourced from the live session. */
export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  organizationalLabel: string | null;
}

interface UseSessionUserResult {
  /** The signed-in user, or null when there is no active session. */
  user: SessionUser | null;
  /** True while BetterAuth resolves the session cookie (first paint). */
  isLoading: boolean;
  /** True once a real session user is present. */
  isAuthenticated: boolean;
}

/**
 * Returns the real signed-in user from the BetterAuth session, or null.
 * Never throws. Loading is surfaced so consumers can show a skeleton.
 */
export function useSessionUser(): UseSessionUserResult {
  const session = authClient.useSession();
  const raw = session.data?.user as (Partial<SessionUser> & { name?: string }) | undefined;

  const user: SessionUser | null =
    raw && raw.id
      ? {
          id: raw.id,
          email: raw.email ?? '',
          // BetterAuth additionalField is `displayName`; fall back to core `name`.
          displayName: raw.displayName ?? raw.name ?? '',
          role: (raw.role ?? 'QAEngineer') as UserRole,
          organizationalLabel: raw.organizationalLabel ?? null,
        }
      : null;

  return {
    user,
    isLoading: session.isPending,
    isAuthenticated: user !== null,
  };
}

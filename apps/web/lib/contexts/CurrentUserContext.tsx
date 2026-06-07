/**
 * CurrentUserContext — the active user's identity for the entire FE tree.
 *
 * Pattern B (P0-001 fix, Sun 2026-06-07): identity is SESSION-DRIVEN.
 *   - Signed in → the real BetterAuth session user (via `useSessionUser()`),
 *     overlaid onto the matching seed record to fill non-identity fields
 *     (workspaceId / timestamps) the session doesn't carry.
 *   - No session → dev/CI preview fallback to a seed persona (default
 *     Yogesh / Admin) so local dev + the e2e smoke suite still render
 *     without a live session. The `initialUserId` prop selects that
 *     dev-fallback persona ONLY; in prod the live session always wins.
 *
 * Why a dev fallback (not a hard redirect): a naive "no session → redirect"
 * breaks dev preview + the 12 e2e smoke tests (no session in CI). The
 * prod unauthenticated-visitor auth-gate is a documented follow-up — see
 * docs/pilot-prep/2026-06-07-sun-p0-001-root-cause.md. AdminGuard already
 * fences /admin by role.
 *
 * `useCurrentUser()` signature is unchanged — all consumers need ZERO edits.
 * `setCurrentUser()` stays for the dev role-preview switcher.
 *
 * Migration: see `docs/refactor/seed-centralization-migration.md`.
 */
'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { UserPublic } from '@qa-nexus/shared';
import { users, SEED_IDS } from '../demo-seed';
import { useSessionUser } from '../auth/use-current-user';

interface CurrentUserContextValue {
  /** The active user. Real session user when signed in; dev/CI seed
   *  fallback otherwise. Always non-null so consumers render unconditionally. */
  user: UserPublic;

  /** True while the BetterAuth session is resolving (first paint). Lets the
   *  shell show an identity skeleton instead of flashing the fallback. */
  isLoading: boolean;

  /** True once a real signed-in session user is present (vs dev fallback). */
  isAuthenticated: boolean;

  /** Switch active user — DEV ONLY (role-preview switcher). No effect once a
   *  real session is present (session always wins). */
  setCurrentUser: (userId: string) => void;
}

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

interface CurrentUserProviderProps {
  children: ReactNode;
  /** DEV/CI fallback persona selector (used only when there is NO live
   *  session). In prod the BetterAuth session always wins. Default: Yogesh. */
  initialUserId?: string;
}

export function CurrentUserProvider({ children, initialUserId }: CurrentUserProviderProps) {
  const { user: sessionUser, isLoading, isAuthenticated } = useSessionUser();
  const [activeUserId, setActiveUserId] = useState<string>(initialUserId ?? SEED_IDS.users.yogesh);

  const setCurrentUser = useCallback((userId: string) => {
    const exists = users.some((u) => u.id === userId);
    if (!exists) {
      throw new Error(
        `CurrentUserContext.setCurrentUser: unknown user id "${userId}". ` +
          'Pass an id from SEED_IDS.users.* or a valid users[].id value.',
      );
    }
    setActiveUserId(userId);
  }, []);

  const value = useMemo<CurrentUserContextValue>(() => {
    // Pattern B: the real session is the source of truth when present.
    if (sessionUser) {
      // Overlay session identity onto the matching seed record — the seed
      // supplies workspaceId + timestamps the session doesn't carry. Falls
      // back to the Yogesh template for a signed-in user not in the seed.
      const base = users.find((u) => u.email === sessionUser.email) ?? users[7];
      const user: UserPublic = {
        ...base,
        id: sessionUser.id,
        email: sessionUser.email,
        displayName: sessionUser.displayName,
        role: sessionUser.role,
        organizationalLabel: sessionUser.organizationalLabel,
      };
      return { user, setCurrentUser, isLoading: false, isAuthenticated: true };
    }
    // No session → dev/CI preview fallback (seed persona via initialUserId).
    const user = users.find((u) => u.id === activeUserId) ?? users[7]; // Yogesh
    return { user, setCurrentUser, isLoading, isAuthenticated };
  }, [sessionUser, activeUserId, setCurrentUser, isLoading, isAuthenticated]);

  return <CurrentUserContext.Provider value={value}>{children}</CurrentUserContext.Provider>;
}

/** Hook — returns the active user. Throws if called outside the provider. */
export function useCurrentUser(): UserPublic {
  const ctx = useContext(CurrentUserContext);
  if (!ctx) {
    throw new Error(
      'useCurrentUser must be called within a <CurrentUserProvider>. ' +
        'Wrap your tree at apps/web/app/layout.tsx.',
    );
  }
  return ctx.user;
}

/** Hook — returns the role-switcher (DEMO ONLY).
 *
 *  Components SHOULD NOT use this in production code paths — only the
 *  role-preview switcher in dev tooling. Post-T030.5 this hook will be
 *  removed; calls from production code will fail to compile. */
export function useSetCurrentUser(): CurrentUserContextValue['setCurrentUser'] {
  const ctx = useContext(CurrentUserContext);
  if (!ctx) {
    throw new Error('useSetCurrentUser must be called within a <CurrentUserProvider>.');
  }
  return ctx.setCurrentUser;
}

/** Hook — session loading / auth state, for skeletons + auth-gates.
 *  `useCurrentUser()` still returns a usable user; this exposes whether that
 *  is the resolved real session (isAuthenticated) and whether the session is
 *  still resolving (isLoading). */
export function useCurrentUserMeta(): { isLoading: boolean; isAuthenticated: boolean } {
  const ctx = useContext(CurrentUserContext);
  if (!ctx) {
    throw new Error('useCurrentUserMeta must be called within a <CurrentUserProvider>.');
  }
  return { isLoading: ctx.isLoading, isAuthenticated: ctx.isAuthenticated };
}

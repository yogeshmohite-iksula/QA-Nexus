/**
 * CurrentUserContext — the active user's identity for the entire FE tree.
 *
 * Spec: followup (i) Phase 3(c). Pattern A compatible (no fetch / no
 * useMutation / no axios — pure local state until BE auth lands).
 *
 * In demo / pre-BE mode (today): defaults to Yogesh (Admin) per the
 *   F08b/c context. Role-switching via `setCurrentUser()` lets you preview
 *   other roles' dashboards (e.g., Akshay = Lead, Kishor = QA Engineer).
 *
 * Once BE auth lands (T021 + T030.5):
 *   1. Replace the demo-seed `users[]` import with a TanStack Query call
 *      against `GET /api/auth/session`.
 *   2. Drop `setCurrentUser` from the public API; identity is server-driven.
 *   3. Components require ZERO changes — `useCurrentUser()` hook signature
 *      is stable.
 *
 * Migration: see `docs/refactor/seed-centralization-migration.md`.
 */
'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { UserPublic } from '@qa-nexus/shared';
import { users, SEED_IDS } from '../demo-seed';

interface CurrentUserContextValue {
  /** The active user. Always non-null in demo mode (defaults to Yogesh).
   *  Post-T021, this can be null when the session has expired — components
   *  should handle null gracefully (redirect to /sign-in). */
  user: UserPublic;

  /** Switch active user — DEMO ONLY. Used by the role-switcher in dev.
   *  Throws an Error if called against an unknown user id (deliberate —
   *  silent failure would mask role-test bugs).
   *
   *  TODO(T030.5): drop this from the public API. Post-BE-auth, identity
   *  is server-driven via session cookie. */
  setCurrentUser: (userId: string) => void;
}

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

interface CurrentUserProviderProps {
  children: ReactNode;
  /** Override the default-active user (Yogesh). Useful in tests + storybook. */
  initialUserId?: string;
}

export function CurrentUserProvider({ children, initialUserId }: CurrentUserProviderProps) {
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
    const user = users.find((u) => u.id === activeUserId) ?? users[7]; // Yogesh fallback
    return { user, setCurrentUser };
  }, [activeUserId, setCurrentUser]);

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

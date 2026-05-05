// useAuth — Pattern A scaffold (BetterAuth flip target).
//
// Day-9 Task 3: localStorage-backed stub user object so the FE can
// render an "I'm signed in" state without the BE wired. Pattern B
// flip (post BE T021 + ADR-007 land):
//
//   import { authClient } from '@/lib/auth/client'
//   // authClient = createAuthClient({ plugins: [magicLinkClient()] })
//   const session = authClient.useSession();
//   ...
//
// At flip time, replace the AuthProvider body to delegate to
// `authClient.useSession()` + `authClient.signIn.magicLink()` +
// `authClient.signOut()`. Hook signature stays stable so call sites
// don't change.
//
// Storage key: `qa-nexus.auth.stub-user.v1` — bumped if shape changes.

'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const STORAGE_KEY = 'qa-nexus.auth.stub-user.v1';

/** Public-facing user shape — matches the subset of BetterAuth's
 *  `User` we surface to UI today. Pattern B will likely return more
 *  (e.g., `image`, `emailVerified`); add fields then. */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  /** ISO timestamp of when this stub session was created. */
  signedInAt: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  /** Pattern A: writes a stub user to localStorage. Pattern B: calls
   *  `authClient.signIn.magicLink({ email, callbackURL })`. */
  signIn: (email: string) => Promise<void>;
  /** Pattern A: clears localStorage. Pattern B: `authClient.signOut()`. */
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  // `isLoading` flips to false after the initial localStorage hydration
  // tick so SSR ↔ client state mismatch doesn't render the wrong UI on
  // first paint. Pattern B replaces this with `authClient.useSession()`'s
  // `isPending` flag.
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      if (typeof window === 'undefined') {
        setIsLoading(false);
        return;
      }
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AuthUser;
        // Lightweight shape check — drop if missing required fields.
        if (parsed?.id && parsed?.email && parsed?.name) {
          setUser(parsed);
        } else {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      // Corrupted JSON — clear and start fresh.
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signIn = useCallback(async (email: string) => {
    // Pattern A: synthesise a stub user. Pattern B will trigger the
    // magic-link email send + leave `user` null until the link is
    // clicked + the verify route lands the user back here.
    const stub: AuthUser = {
      id: `stub-${email.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      email,
      name: email.split('@')[0] ?? email,
      signedInAt: new Date().toISOString(),
    };
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stub));
      } catch {
        // ignore — quota / sandbox / SSR edge
      }
    }
    setUser(stub);
  }, []);

  const signOut = useCallback(async () => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    }
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      signIn,
      signOut,
    }),
    [user, isLoading, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Read the auth context. Throws if called outside `<AuthProvider>` so
 *  call-site bugs surface immediately instead of producing silent
 *  no-ops. */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error(
      'useAuth must be called within an <AuthProvider>. Wire it at apps/web/app/layout.tsx.',
    );
  }
  return ctx;
}

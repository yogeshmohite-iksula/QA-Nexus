// TanStack Query provider — single QueryClient per browser tab.
//
// Wired into the root layout so every route gets cache + dev-tools
// access. Pattern A→B prep: the F27 hooks in `lib/hooks/use-admin-
// users.ts` consume `useQuery` / `useMutation` against this client.
//
// Why useState (not module-level): React 18 strict-mode double-renders
// would otherwise create two QueryClient instances on first mount.
// `useState` initialiser runs once per component lifecycle, dodging
// that pitfall (per TanStack Query Next.js setup guide).

'use client';

import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Pattern B defaults — short stale + 1 retry. Per-hook
            // overrides (see `useAdminUsersList`) take precedence.
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false, // Iksula daily-use pilot —
            // tab-focus refetches felt
            // jumpy in F27 stub testing.
          },
          mutations: {
            // Default error toast lives in each individual hook so
            // copy can be action-specific. Mutation-level retry off
            // by default — let the hook decide.
            retry: 0,
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

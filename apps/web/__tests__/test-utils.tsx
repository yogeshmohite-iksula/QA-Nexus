// Test render helper — wraps the unit-under-test in the same provider
// stack the real /admin routes use, plus a fresh per-test
// `QueryClient` so TanStack Query state doesn't leak across tests.
//
// Pass `userId` to override which seed user is the active user (used by
// the AdminGuard test to flip Admin → non-Admin).

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { CurrentUserProvider } from '@/lib/contexts/CurrentUserContext';
import { TeamRosterProvider } from '@/lib/contexts/TeamRosterContext';
import { ProjectProvider } from '@/lib/contexts/ProjectContext';
import { SEED_IDS } from '@/lib/demo-seed';

interface ProvidersProps {
  children: ReactNode;
  userId?: string;
}

/** Build a fresh QueryClient with retries OFF so tests don't wait on
 *  fake-rejected promises. Each test gets its own client to avoid
 *  cache leak between tests. */
export function makeTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

export function AppProviders({ children, userId = SEED_IDS.users.yogesh }: ProvidersProps) {
  // Per-render fresh client (defensively — most tests pass `client`
  // explicitly via `renderWithProviders` to keep refs stable).
  const client = makeTestQueryClient();
  return (
    <QueryClientProvider client={client}>
      <CurrentUserProvider initialUserId={userId}>
        <TeamRosterProvider>
          <ProjectProvider>{children}</ProjectProvider>
        </TeamRosterProvider>
      </CurrentUserProvider>
    </QueryClientProvider>
  );
}

interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  userId?: string;
  /** Optional pre-built client so tests can pre-seed cache or assert on it. */
  queryClient?: QueryClient;
}

export function renderWithProviders(ui: ReactElement, options: RenderWithProvidersOptions = {}) {
  const { userId, queryClient, ...rest } = options;
  const client = queryClient ?? makeTestQueryClient();
  return {
    ...render(ui, {
      wrapper: ({ children }) => (
        <QueryClientProvider client={client}>
          <CurrentUserProvider initialUserId={userId ?? SEED_IDS.users.yogesh}>
            <TeamRosterProvider>
              <ProjectProvider>{children}</ProjectProvider>
            </TeamRosterProvider>
          </CurrentUserProvider>
        </QueryClientProvider>
      ),
      ...rest,
    }),
    queryClient: client,
  };
}

export { SEED_IDS };

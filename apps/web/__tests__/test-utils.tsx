// Test render helper — wraps the unit-under-test in the same provider
// stack the real /admin routes use. All three providers auto-seed from
// `apps/web/lib/demo-seed`, so tests don't need to inject fixtures.
//
// Pass `userId` to override which seed user is the active user (used by
// the AdminGuard test to flip Admin → non-Admin).

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

export function AppProviders({ children, userId = SEED_IDS.users.yogesh }: ProvidersProps) {
  return (
    <CurrentUserProvider initialUserId={userId}>
      <TeamRosterProvider>
        <ProjectProvider>{children}</ProjectProvider>
      </TeamRosterProvider>
    </CurrentUserProvider>
  );
}

interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  userId?: string;
}

export function renderWithProviders(ui: ReactElement, options: RenderWithProvidersOptions = {}) {
  const { userId, ...rest } = options;
  return render(ui, {
    wrapper: ({ children }) => <AppProviders userId={userId}>{children}</AppProviders>,
    ...rest,
  });
}

export { SEED_IDS };

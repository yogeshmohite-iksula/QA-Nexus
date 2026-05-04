// F27 Users & Roles unit tests — Pattern B (real BE wired).
//
// Day-8 PM flip: F27 now consumes `useAdminUsersList()` (TanStack Query
// against `GET /api/users`) instead of `useTeamRoster()` stub. Tests
// mock `@/lib/api/users-api` so `fetchAdminUsers` returns a known
// `ListUsersResponse` shape — the QueryClientProvider in `test-utils`
// wraps the render so the hook resolves cleanly.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock the API client BEFORE importing the page (vitest hoists vi.mock
// to the top, so the import order below is deliberate).
vi.mock('@/lib/api/users-api', async () => {
  const SEED = await import('@/lib/demo-seed');
  const mkUser = (
    id: string,
    name: string,
    email: string,
    role: 'Admin' | 'Lead' | 'QAEngineer' | 'Stakeholder',
    status: 'active' | 'invited' | 'disabled' = 'active',
  ) => ({
    id,
    name,
    email,
    role,
    status,
    createdAt: '2026-04-22T10:00:00.000Z',
    lastSeenAt: '2026-05-04T08:30:00.000Z',
  });
  return {
    fetchAdminUsers: vi.fn(async () => ({
      ok: true as const,
      users: [
        mkUser(SEED.SEED_IDS.users.akshay, 'Akshay Panchal', 'akshay.panchal@iksula.com', 'Lead'),
        mkUser(SEED.SEED_IDS.users.yogesh, 'Yogesh Mohite', 'yogesh.mohite@iksula.com', 'Admin'),
        mkUser(SEED.SEED_IDS.users.kishor, 'Kishor Kadam', 'kishor.kadam@iksula.com', 'QAEngineer'),
        mkUser(SEED.SEED_IDS.users.nitin, 'Nitin Gomle', 'nitin.gomle@iksula.com', 'QAEngineer'),
        mkUser(
          SEED.SEED_IDS.users.nadim,
          'Nadim Siddiqui',
          'nadim.siddiqui@iksula.com',
          'QAEngineer',
        ),
        mkUser(
          SEED.SEED_IDS.users.govind,
          'Govind Daware',
          'govind.daware@iksula.com',
          'QAEngineer',
        ),
        mkUser(SEED.SEED_IDS.users.mohanraj, 'Mohanraj K', 'mohanraj.k@iksula.com', 'QAEngineer'),
        mkUser(
          SEED.SEED_IDS.users.sagar,
          'Sagar Todankar',
          'sagar.todankar@iksula.com',
          'QAEngineer',
        ),
      ],
    })),
    patchUserRole: vi.fn(),
    patchUserStatus: vi.fn(),
  };
});

import { UsersRolesPage } from '@/components/admin/users-roles-page';
import { renderWithProviders } from '../test-utils';
import { mockPush } from '../setup';

describe('UsersRolesPage (F27, Pattern B)', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('renders all 4 sections after the BE list resolves (current team / pending invites / recent activity / role matrix)', async () => {
    renderWithProviders(<UsersRolesPage />);

    // Loading state appears first; wait for it to clear and the BE-fed
    // sections to mount.
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /current team/i })).toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: /pending invites/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /recent activity/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /role matrix/i })).toBeInTheDocument();
  });

  it('renders all 8 BE-served roster members in the team table', async () => {
    renderWithProviders(<UsersRolesPage />);
    const expected = [
      'Akshay',
      'Yogesh',
      'Kishor',
      'Nitin',
      'Nadim',
      'Govind',
      'Mohanraj',
      'Sagar',
    ];
    await waitFor(() => {
      // Wait for at least one BE-fed row to render.
      expect(screen.getAllByText(/Akshay/i).length).toBeGreaterThan(0);
    });
    for (const first of expected) {
      const matches = screen.getAllByText(new RegExp(first, 'i'));
      expect(matches.length, `expected to find at least one mention of ${first}`).toBeGreaterThan(
        0,
      );
    }
  });

  it('clicking the Invite CTA routes to /admin/users/invite', async () => {
    const user = userEvent.setup();
    renderWithProviders(<UsersRolesPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /current team/i })).toBeInTheDocument();
    });

    const inviteButtons = screen.getAllByRole('button', { name: /invite/i });
    expect(inviteButtons.length).toBeGreaterThan(0);
    await user.click(inviteButtons[0]);

    expect(mockPush).toHaveBeenCalledWith('/admin/users/invite');
  });

  it('shows the loading skeleton before the BE list resolves', () => {
    renderWithProviders(<UsersRolesPage />);
    // The skeleton uses role="status" with "Loading team members…" copy.
    expect(screen.getByRole('status', { name: /loading team members/i })).toBeInTheDocument();
  });
});

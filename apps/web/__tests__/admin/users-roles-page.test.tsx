// F27 Users & Roles unit tests.
//
// Scope: section navigation (Current team / Pending invites /
// Recent activity / Role matrix all render), invite-CTA routes to
// /admin/users/invite (Pattern A: router.push, no fetch), 8-member
// seed roster surfaces.

import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UsersRolesPage } from '@/components/admin/users-roles-page';
import { renderWithProviders } from '../test-utils';
import { mockPush } from '../setup';

describe('UsersRolesPage (F27)', () => {
  it('renders all 4 sections (current team / pending invites / recent activity / role matrix)', () => {
    renderWithProviders(<UsersRolesPage />);

    // Section headings — match the actual h2 copy verbatim
    expect(screen.getByRole('heading', { name: /current team/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /pending invites/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /recent activity/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /role matrix/i })).toBeInTheDocument();
  });

  it('renders all 8 seed roster members in the team table', () => {
    renderWithProviders(<UsersRolesPage />);
    // Spot-check the 8 named roster members from CLAUDE.md Iksula data canon
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
    for (const first of expected) {
      const matches = screen.getAllByText(new RegExp(first, 'i'));
      expect(matches.length, `expected to find at least one mention of ${first}`).toBeGreaterThan(
        0,
      );
    }
  });

  it('clicking the Invite CTA fires the deferred marker + routes to /admin/users/invite', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const user = userEvent.setup();

    renderWithProviders(<UsersRolesPage />);

    // The invite CTA — match the action label "Invite teammates" (header)
    // or "Invite by email" (panel CTA). Match permissively + click first.
    const inviteButtons = screen.getAllByRole('button', { name: /invite/i });
    expect(inviteButtons.length).toBeGreaterThan(0);
    await user.click(inviteButtons[0]);

    expect(infoSpy).toHaveBeenCalledWith(
      'pattern-a:deferred:users-invite-open',
      expect.objectContaining({ from: 'F27' }),
    );
    expect(mockPush).toHaveBeenCalledWith('/admin/users/invite');

    infoSpy.mockRestore();
  });

  it('fires users-list-load deferred marker on mount with workspaceId + counts', () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);

    renderWithProviders(<UsersRolesPage />);

    expect(infoSpy).toHaveBeenCalledWith(
      'pattern-a:deferred:users-list-load',
      expect.objectContaining({
        totalUsers: 8,
        pendingInvites: expect.any(Number),
      }),
    );

    infoSpy.mockRestore();
  });
});

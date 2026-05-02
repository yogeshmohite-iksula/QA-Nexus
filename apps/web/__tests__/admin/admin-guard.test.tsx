// AdminGuard unit tests — RBAC fence around the M1 admin surface.
//
// Pattern A: the guard fires `pattern-a:deferred:rbac-redirect` and
// then `router.replace('/home?error=admin-required')` for non-Admin
// users. Server-side guard lands MS0-T021 BetterAuth.

import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { AdminGuard } from '@/components/admin/admin-guard';
import { renderWithProviders, SEED_IDS } from '../test-utils';
import { mockReplace } from '../setup';

describe('AdminGuard (RBAC fence)', () => {
  it('renders children when active user has Admin role (Yogesh)', () => {
    renderWithProviders(
      <AdminGuard>
        <div data-testid="admin-child">admin-only-content</div>
      </AdminGuard>,
      { userId: SEED_IDS.users.yogesh },
    );
    expect(screen.getByTestId('admin-child')).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('redirects non-Admin user (Kishor = QA Engineer) to /home with error param', () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);

    renderWithProviders(
      <AdminGuard>
        <div data-testid="admin-child">should-not-render</div>
      </AdminGuard>,
      { userId: SEED_IDS.users.kishor },
    );

    // Children must NOT render — only the redirect placeholder
    expect(screen.queryByTestId('admin-child')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/admin access required/i);

    // router.replace fired with the error-param URL
    expect(mockReplace).toHaveBeenCalledWith('/home?error=admin-required');

    // Pattern A deferred marker fired with the right shape
    expect(infoSpy).toHaveBeenCalledWith(
      'pattern-a:deferred:rbac-redirect',
      expect.objectContaining({
        from: '/admin',
        userRole: 'QAEngineer',
        reason: 'admin-required',
      }),
    );

    infoSpy.mockRestore();
  });

  it('redirects Lead user (Akshay) — Lead is not Admin', () => {
    renderWithProviders(
      <AdminGuard>
        <div data-testid="admin-child">should-not-render</div>
      </AdminGuard>,
      { userId: SEED_IDS.users.akshay },
    );
    expect(screen.queryByTestId('admin-child')).not.toBeInTheDocument();
    expect(mockReplace).toHaveBeenCalledWith('/home?error=admin-required');
  });
});

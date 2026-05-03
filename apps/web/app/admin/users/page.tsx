// Implements F27 Users & Roles · /admin/users.
// See PM1_UI_v2/frames - claude code build (PM1 v2.6-v2.8)/F27 Users and Roles.html.
//
// Pattern A: ZERO fetch / useMutation / axios. All deferred markers fire
// client-side. Real /api/users + /api/invitations + /api/audit-log land
// MS0-T030.5+ once BE M1 schema (`feature/be-m1-users-schema`) merges.
//
// RBAC: Admin-only. `<AdminGuard>` redirects QA Engineer / Lead /
// Stakeholder roles to /home?error=admin-required. Server-side guard
// lands when MS0-T021 BetterAuth + middleware land.

import type { Metadata } from 'next';
import { CurrentUserProvider } from '@/lib/contexts/CurrentUserContext';
import { SEED_IDS } from '@/lib/demo-seed';
import { AdminGuard } from '@/components/admin/admin-guard';
import { UsersRolesPage } from '@/components/admin/users-roles-page';

export const metadata: Metadata = {
  title: 'Users & Roles · QA Nexus',
  description: 'Manage workspace membership, project access, and audit visibility. Admin-only.',
};

export default function UsersRolesRoute() {
  // Yogesh is the canonical Day-0 bootstrap Admin per CLAUDE.md. The
  // scoped provider switches the active user to Yogesh for this route
  // only — F27 is Admin-only and only renders if me.role === 'Admin'.
  return (
    <CurrentUserProvider initialUserId={SEED_IDS.users.yogesh}>
      <AdminGuard>
        <UsersRolesPage />
      </AdminGuard>
    </CurrentUserProvider>
  );
}

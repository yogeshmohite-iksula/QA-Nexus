// Implements F27m1 Invite User Modal · /admin/users/invite.
// See PM1_UI_v2/frames - claude code build (PM1 v2.6-v2.8)/F27m1 Invite User Modal.html.
//
// The route renders F27 underneath + the invite modal on top. Cancel /
// Esc / backdrop click / submit-success all route back to /admin/users
// so the modal feels like an overlay rather than a full page change.
//
// Pattern A: ZERO fetch / useMutation / axios. Real /api/invitations
// endpoint lands MS0-T030.5+ once BE M1 schema is merged.
// RBAC: Admin-only via `<AdminGuard>`.

import type { Metadata } from 'next';
import { CurrentUserProvider } from '@/lib/contexts/CurrentUserContext';
import { SEED_IDS } from '@/lib/demo-seed';
import { AdminGuard } from '@/components/admin/admin-guard';
import { UsersRolesWithModal } from '@/components/admin/users-roles-with-modal';

export const metadata: Metadata = {
  title: 'Invite teammates · QA Nexus',
  description: 'Send invites to join Iksula Services with role + project access. Admin-only.',
};

export default function InviteUserRoute() {
  return (
    <CurrentUserProvider initialUserId={SEED_IDS.users.yogesh}>
      <AdminGuard>
        <UsersRolesWithModal />
      </AdminGuard>
    </CurrentUserProvider>
  );
}

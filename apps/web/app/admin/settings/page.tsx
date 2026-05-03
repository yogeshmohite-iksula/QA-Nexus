// Implements F28 Settings & Audit · /admin/settings.
// See PM1_UI_v2/frames - claude code build (PM1 v2.6-v2.8)/F28 Settings and Audit.html.
//
// Hash-anchor support: /admin/settings#audit-log lands directly on the
// Audit Log tab (used by F27's `users-audit-open` deferred marker).
//
// Pattern A: ZERO fetch / useMutation / axios. Real /api/audit-log +
// /api/settings endpoints land MS0-T030.5+ post-merge of BE M1 schema.
// RBAC: Admin-only via `<AdminGuard>`.

import type { Metadata } from 'next';
import { CurrentUserProvider } from '@/lib/contexts/CurrentUserContext';
import { SEED_IDS } from '@/lib/demo-seed';
import { AdminGuard } from '@/components/admin/admin-guard';
import { SettingsAuditPage } from '@/components/admin/settings-audit-page';

export const metadata: Metadata = {
  title: 'Settings & Audit · QA Nexus',
  description: 'Workspace settings and the immutable HMAC-SHA256 chained audit log. Admin-only.',
};

export default function SettingsAuditRoute() {
  return (
    <CurrentUserProvider initialUserId={SEED_IDS.users.yogesh}>
      <AdminGuard>
        <SettingsAuditPage />
      </AdminGuard>
    </CurrentUserProvider>
  );
}

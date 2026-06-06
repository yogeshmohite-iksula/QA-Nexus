// Implements F26m2 Agent Model Assignment modal · /admin/agents/model-assignment.
// See PM1_UI_v2/Redesign Frame by claude design/F26m2 Agent Model Assignment Modal v2.html.
//
// The route renders F26 Agents underneath + the model-assignment modal on top.
// Cancel / Esc / backdrop click route back to /admin/agents so the modal feels
// like an overlay rather than a full page change.
//
// Per-agent selection via ?agent=<composer|curator|sherlock> query param
// (Lesson 7 — query-param mode > demo toggle). Default: composer.
//
// Pattern A: static modal, no fetch/useMutation. Real PUT lands MS0-T030.5+.
// RBAC: Admin-only via <AdminGuard>.

import { Suspense } from 'react';
import type { Metadata } from 'next';
import { CurrentUserProvider } from '@/lib/contexts/CurrentUserContext';
import { SEED_IDS } from '@/lib/demo-seed';
import { AdminGuard } from '@/components/admin/admin-guard';
import { AgentsWithModelAssignmentModal } from '@/components/admin/agents-with-model-assignment-modal';
import { F26M2_PAGE_TITLE } from '@/components/admin/agent-model-modal.canned-data';

export const metadata: Metadata = {
  title: F26M2_PAGE_TITLE,
  description:
    'Configure per-agent model assignment + routing (Primary / Long-context / Fallback). Admin-only.',
};

export default function AgentModelAssignmentRoute() {
  return (
    <CurrentUserProvider initialUserId={SEED_IDS.users.yogesh}>
      <AdminGuard>
        {/* Suspense required by Next.js 15 for client useSearchParams inside the wrapper. */}
        <Suspense fallback={null}>
          <AgentsWithModelAssignmentModal />
        </Suspense>
      </AdminGuard>
    </CurrentUserProvider>
  );
}

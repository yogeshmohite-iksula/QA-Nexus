// Implements F26 Agents · /admin/agents.
// See PM1_UI_v2/Redesign Frame by claude design/F26 Agents v2.html.
//
// Hard Rule 18: scaffolded strictly from
// .claude/skills/frame-port/specs/F26.spec.json + agents-page.canned-data.ts.
// NEVER from the HTML directly.
//
// Pattern A: ZERO fetch / useMutation / axios. Real /api/agents +
// /api/llm-providers endpoints land post-merge of BE Reports backend.
// RBAC: Admin-only via `<AdminGuard>`.

import type { Metadata } from 'next';
import { CurrentUserProvider } from '@/lib/contexts/CurrentUserContext';
import { SEED_IDS } from '@/lib/demo-seed';
import { AdminGuard } from '@/components/admin/admin-guard';
import { AgentsPage } from '@/components/admin/agents-page';
import { F26_PAGE_TITLE } from '@/components/admin/agents-page.canned-data';

export const metadata: Metadata = {
  title: F26_PAGE_TITLE,
  description:
    'Agents governance: Composer / Curator / Sherlock — permissions, autonomy, guardrails, eval harness.',
};

export default function AgentsRoute() {
  return (
    <CurrentUserProvider initialUserId={SEED_IDS.users.yogesh}>
      <AdminGuard>
        <AgentsPage />
      </AdminGuard>
    </CurrentUserProvider>
  );
}

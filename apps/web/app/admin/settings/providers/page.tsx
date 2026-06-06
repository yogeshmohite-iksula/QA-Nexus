// Implements F28m1 LLM Provider Configuration modal · /admin/settings/providers.
// See PM1_UI_v2/Redesign Frame by claude design/F28m1 LLM Provider Configuration Modal v2.html.
// Pattern A: static render for VG. Admin-only.

import type { Metadata } from 'next';
import { CurrentUserProvider } from '@/lib/contexts/CurrentUserContext';
import { SEED_IDS } from '@/lib/demo-seed';
import { AdminGuard } from '@/components/admin/admin-guard';
import { LlmProviderConfigModal } from '@/components/admin/llm-provider-config-modal';
import { F28M1_PAGE_TITLE } from '@/components/admin/llm-provider-config-modal.canned-data';

export const metadata: Metadata = {
  title: F28M1_PAGE_TITLE,
  description: 'Workspace LLM providers + model directory. Admin-only.',
};

export default function ProviderConfigRoute() {
  return (
    <CurrentUserProvider initialUserId={SEED_IDS.users.yogesh}>
      <AdminGuard>
        <LlmProviderConfigModal />
      </AdminGuard>
    </CurrentUserProvider>
  );
}

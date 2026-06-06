// Implements F26m1 Configure LLM Provider modal · /admin/agents/provider-setup.
// See PM1_UI_v2/Redesign Frame by claude design/F26m1 LLM Provider Setup Modal v2.html.
// Pattern A: static render for VG. Admin-only via AdminGuard.

import { Suspense } from 'react';
import type { Metadata } from 'next';
import { CurrentUserProvider } from '@/lib/contexts/CurrentUserContext';
import { SEED_IDS } from '@/lib/demo-seed';
import { AdminGuard } from '@/components/admin/admin-guard';
import { LlmProviderSetupModal } from '@/components/admin/llm-provider-setup-modal';
import { F26M1_PAGE_TITLE } from '@/components/admin/llm-provider-setup-modal.canned-data';

export const metadata: Metadata = {
  title: F26M1_PAGE_TITLE,
  description:
    'Configure LLM provider (Groq / Gemini / Custom) for Composer + Sherlock agents. Admin-only.',
};

export default function ProviderSetupRoute() {
  return (
    <CurrentUserProvider initialUserId={SEED_IDS.users.yogesh}>
      <AdminGuard>
        {/* Suspense required by Next.js 15 because the modal uses useSearchParams. */}
        <Suspense fallback={null}>
          <LlmProviderSetupModal />
        </Suspense>
      </AdminGuard>
    </CurrentUserProvider>
  );
}

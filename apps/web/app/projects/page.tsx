// Implements F09 Projects List · see PM1_UI_v2/frame  html view/F09 Projects List.html
//
// Pattern A (PM1_PRD §F09): mount fires
//   pattern-a:deferred:projects-list-load { projectCount, pinnedCount, role }
// Each row click fires
//   pattern-a:deferred:projects-route { target, projectKey }
// "+ New project" fires
//   pattern-a:deferred:open-modal { modal: 'F10' }
// ZERO fetch / useMutation / axios.
//
// Iksula canon: 5 projects per CLAUDE.md (Iksula Returns RET anchor pinned;
// Iksula Commerce CART, Iksula Payments PAY, Iksula Mobile App AUTH,
// Iksula Internal Ops OPS in the grid). Locked source has 3 example
// projects; CLAUDE.md spec wins on data.

import { Suspense } from 'react';
import type { Metadata } from 'next';
import { CurrentUserProvider } from '@/lib/contexts/CurrentUserContext';
import { SEED_IDS } from '@/lib/demo-seed';
import { ProjectsListPage } from '@/components/projects/projects-list-page';

export const metadata: Metadata = {
  title: 'All projects · QA Nexus',
  description:
    'Pick a project to work on or create a new one. Pinned, active, and archived projects.',
};

export default function ProjectsPage() {
  // F09 is the Admin's project picker. Yogesh is the canonical Day-0
  // bootstrap Admin per CLAUDE.md; this scoped provider switches the
  // active user to Yogesh for this route only (matches the legacy
  // SIGNED_IN_USER intent — original data.ts hardcoded Yogesh M.).
  return (
    <CurrentUserProvider initialUserId={SEED_IDS.users.yogesh}>
      <Suspense fallback={null}>
        <ProjectsListPage />
      </Suspense>
    </CurrentUserProvider>
  );
}

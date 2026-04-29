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
import { ProjectsListPage } from '@/components/projects/projects-list-page';

export const metadata: Metadata = {
  title: 'All projects · QA Nexus',
  description:
    'Pick a project to work on or create a new one. Pinned, active, and archived projects.',
};

export default function ProjectsPage() {
  return (
    <Suspense fallback={null}>
      <ProjectsListPage />
    </Suspense>
  );
}

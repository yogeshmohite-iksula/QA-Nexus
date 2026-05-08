// F14 Requirements — list view (M3 Pattern A scaffold).
//
// Spec: PM1_UI_v2/Redesign Frame by claude design/F14 Requirements v2.html
// Mounted at: /requirements
//
// Pattern A: ZERO real fetch. Stub data hardcoded; every interactive
// site fires a `pattern-a:deferred:requirements:*` console marker.
// Pattern B (Day-16 / TASK 4) wires GET /api/projects/:projectId/requirements
// + POST/PATCH/DELETE per BE+1's Day-13 controller.
//
// Shell: AdminShell v2 with active="requirements" → highlights the
// PLAN > Requirements rail item, expands the PLAN section on mount.

import type { Metadata } from 'next';
import { RequirementsListPage } from '@/components/requirements/requirements-list-page';

export const metadata: Metadata = {
  title: 'Requirements · QA Nexus',
  description: 'Source of truth for what must be tested. Generate test cases from any requirement.',
};

export default function RequirementsRoute() {
  return <RequirementsListPage />;
}

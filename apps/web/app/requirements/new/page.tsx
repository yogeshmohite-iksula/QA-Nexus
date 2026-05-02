// Implements F14m1 Add Requirement Modal · /requirements/new.
// See PM1_UI_v2/frame  html view/F14m1 Edit Requirement Modal.html.
//
// Renders the F14 list page underneath + the modal on top. Cancel /
// Esc / backdrop / successful save all route back to /requirements.
//
// Pattern A: ZERO fetch / useMutation / axios. Real
// /api/projects/:slug/requirements POST wires at MS0-T030.5+ post-merge
// of BE M2 schema.

import type { Metadata } from 'next';
import { RequirementsWithFormModal } from '@/components/requirements/requirements-with-form-modal';

export const metadata: Metadata = {
  title: 'New requirement · QA Nexus',
  description: 'Create a new requirement for the active project.',
};

export default function NewRequirementRoute() {
  return <RequirementsWithFormModal />;
}

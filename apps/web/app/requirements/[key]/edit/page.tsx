// Implements F14m1 Edit Requirement Modal · /requirements/<key>/edit.
// See PM1_UI_v2/frame  html view/F14m1 Edit Requirement Modal.html.
//
// Pre-fills from the matched seed RET-### row. Cancel / Esc / backdrop
// / successful save all route back to /requirements (NOT to the
// /requirements/<key> detail view — that's F14m2 territory, M3+).
//
// Pattern A: ZERO fetch / useMutation / axios. Real
// /api/projects/:slug/requirements/:id PATCH wires at MS0-T030.5+
// post-merge of BE M2 schema.

import type { Metadata } from 'next';
import { REQUIREMENTS } from '@/lib/data/requirements';
import { RequirementsWithFormModal } from '@/components/requirements/requirements-with-form-modal';

export const metadata: Metadata = {
  title: 'Edit requirement · QA Nexus',
  description: 'Edit an existing requirement for the active project.',
};

// Required for `output: 'export'` (Cloudflare Pages static export).
// Pre-generates one static page per seed RET-### key. When BE M2
// schema lands at MS0-T030.5+, swap this for an SSR/serverful route
// since unbounded dynamic params won't be statically pre-buildable.
export function generateStaticParams() {
  return REQUIREMENTS.map((r) => ({ key: r.key.toLowerCase() }));
}

interface EditRequirementRouteProps {
  params: Promise<{ key: string }>;
}

export default async function EditRequirementRoute({ params }: EditRequirementRouteProps) {
  const { key } = await params;
  return <RequirementsWithFormModal reqKey={key} />;
}

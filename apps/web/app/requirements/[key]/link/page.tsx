// Implements F14m2 Link Test Case Modal · /requirements/<key>/link.
// See PM1_UI_v2/frames - claude code build (PM1 v2.6-v2.8)/F14m2 Link Test Case Modal.html.
//
// Renders the F14 list page underneath + the link-modal on top. Cancel
// / Esc / backdrop / Done all route back to /requirements.
//
// Pattern A: ZERO fetch / useMutation / axios. Real
// /api/requirements/:key/links POST + DELETE wires at MS0-T030.5+
// post-merge of BE M2 schema.

import type { Metadata } from 'next';
import { REQUIREMENTS } from '@/lib/data/requirements';
import { RequirementsWithLinkModal } from '@/components/requirements/requirements-with-link-modal';

export const metadata: Metadata = {
  title: 'Link test cases · QA Nexus',
  description: 'Link existing test cases to a requirement (Pattern A).',
};

// `output: 'export'` requires generateStaticParams for dynamic routes.
// Pre-generate one static page per seed RET-### key.
export function generateStaticParams() {
  return REQUIREMENTS.map((r) => ({ key: r.key.toLowerCase() }));
}

interface LinkRequirementRouteProps {
  params: Promise<{ key: string }>;
}

export default async function LinkRequirementRoute({ params }: LinkRequirementRouteProps) {
  const { key } = await params;
  return <RequirementsWithLinkModal reqKey={key} />;
}

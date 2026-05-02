// Implements F14m3 Convert to Jira Story · /requirements/<key>/convert-to-jira.
// See PM1_UI_v2/frames - claude code build (PM1 v2.6-v2.8)/F14m3 Convert to Jira Story Modal.html.
//
// Pattern A: ZERO fetch / useMutation / axios. Real
// /api/requirements/:key/convert-to-jira POST wires in PM3 (Jira
// 2-way sync milestone — NOT M2). The F14m3 simulated 800 ms +
// mock issue-key generation prove out the UX surface.

import type { Metadata } from 'next';
import { REQUIREMENTS } from '@/lib/data/requirements';
import { RequirementsWithConvertModal } from '@/components/requirements/requirements-with-convert-modal';

export const metadata: Metadata = {
  title: 'Convert to Jira · QA Nexus',
  description: 'Convert a QA Nexus requirement into a Jira Story (Pattern A).',
};

// `output: 'export'` requires generateStaticParams for dynamic routes.
export function generateStaticParams() {
  return REQUIREMENTS.map((r) => ({ key: r.key.toLowerCase() }));
}

interface ConvertJiraRouteProps {
  params: Promise<{ key: string }>;
}

export default async function ConvertJiraRoute({ params }: ConvertJiraRouteProps) {
  const { key } = await params;
  return <RequirementsWithConvertModal reqKey={key} />;
}

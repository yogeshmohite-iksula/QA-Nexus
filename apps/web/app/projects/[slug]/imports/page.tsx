// Implements F13 Imported Files List.
// See PM1_UI_v2/frame  html view/F13 Imported Files List.html.
//
// Pattern A: ZERO fetch / useMutation / axios. Real /api/imports lands
// with MS0-T030.5+. Sample rows live as a view fixture in
// `components/imports/imports-page.tsx`; uploader names resolve via
// `useTeamMember()` against the seed roster.

import type { Metadata } from 'next';
import { CurrentUserProvider } from '@/lib/contexts/CurrentUserContext';
import { projects, SEED_IDS } from '@/lib/demo-seed';
import { getProjectStaticParams } from '@/lib/project-slug';
import { ImportsPage } from '@/components/imports/imports-page';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const metadata: Metadata = {
  title: 'Imported files · QA Nexus',
  description:
    'Track every import into a project, monitor A1 extraction status, and re-run failed imports.',
};

// `output: 'export'` requires this to enumerate every reachable [slug]
// at build time. Slug = project name-slug (`iksula-returns`) via the shared
// helper — BUG-001 standardization (Day-1), Yogesh ruling. Pre-build covers
// the 5 Iksula seed projects; once BE M2 schema lands this becomes a DB lookup.
export function generateStaticParams() {
  return getProjectStaticParams(projects);
}

export default async function ImportsRoute({ params }: PageProps) {
  const { slug } = await params;
  return (
    <CurrentUserProvider initialUserId={SEED_IDS.users.yogesh}>
      <ImportsPage projectSlug={slug} />
    </CurrentUserProvider>
  );
}

// Implements F15 Knowledge Base · /projects/[slug]/kb.
// See PM1_UI_v2/Redesign Frame by claude design/F15 Knowledge Base v2.html.
//
// Pattern A → B BE-gated. The page calls `useKbSearch()` which today
// hits a stub fetcher (lib/api/kb-api.ts). Once BE+1 swaps the
// kb.controller body to real pgvector HNSW search (M2 Day-9/10), this
// file doesn't change — only the fetcher body inside `kb-api.ts`.

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { projects } from '@/lib/demo-seed';
import { getProjectStaticParams, projectFromSlug } from '@/lib/project-slug';
import { KbPage } from '@/components/kb/kb-page';

export const metadata: Metadata = {
  title: 'Knowledge Base · QA Nexus',
  description:
    'Search across uploaded specs, runbooks, defect RCAs, and KB articles. Semantic match by default.',
};

// `output: 'export'` requires this to enumerate every reachable [slug]
// at build time. Slug = project name-slug (`iksula-returns`) via the shared
// helper — BUG-001 standardization (Day-1), Yogesh ruling.
export function generateStaticParams() {
  return getProjectStaticParams(projects);
}

interface KbRouteProps {
  params: Promise<{ slug: string }>;
}

export default async function KbRoute({ params }: KbRouteProps) {
  const { slug } = await params;
  const project = projectFromSlug(slug, projects);
  if (!project) {
    notFound();
  }
  return <KbPage projectId={project.id} projectKey={project.key} projectName={project.name} />;
}

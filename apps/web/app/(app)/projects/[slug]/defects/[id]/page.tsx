// F22 Defect Detail — route shell.
//
// Authenticated route at /projects/[slug]/defects/[id].
// Hard Rule 14: AdminShell is mounted inside F22DefectDetail.
// Hard Rule 18: bundle workflow rejected (Day-23 visual gate); re-ported
// from canonical v2 HTML — see CHANGELOG entry for the re-port.
// Step 3 approval 2026-05-20: route is project-scoped.
//
// `output: 'export'` requires generateStaticParams for [slug]+[id].
// BE+1 will wire TanStack Query in a later milestone; PM1 pilot uses
// verbatim canned data sourced from F22 v2 HTML.

import { F22DefectDetail } from '@/components/f22-defect-detail/F22DefectDetail';
import { defect, projectAnchor } from '@/components/f22-defect-detail/canned-data';

export function generateStaticParams() {
  return [{ slug: projectAnchor.slug, id: defect.id }];
}

// Next.js 15: `params` is now a Promise — must await it.
export default async function DefectDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  // id will drive TanStack Query in a future milestone; ignored in canned-data mode.
  void id;
  return <F22DefectDetail slug={slug} />;
}

// F20 Run Results — route shell.
//
// Authenticated route at /projects/[slug]/runs/[runId]/results.
// `output: 'export'` next config (Cloudflare Pages target) requires
// generateStaticParams for any dynamic [param] in the path. We bake
// the Iksula anchor pair (slug=iksula-returns, runId=RUN-RET-2026-04-
// 25-002) per the Day-18 brief; additional slugs/runs are added when
// the BE list endpoint ships in Pattern B.

import { ResultsPage } from '@/components/results/results-page';

export function generateStaticParams() {
  return [{ slug: 'iksula-returns', runId: 'RUN-RET-2026-04-25-002' }];
}

export default function Page() {
  return <ResultsPage />;
}

// F19 Run Console route — thin server-component shell that hands off
// to the client RunConsolePage. Pattern A (M4 Day-17 TASK 1).
//
// Reached from F18 Run Sessions list (when ported) → click a run row.
// Direct URL: /projects/<slug>/runs/<runId>.

import { RunConsolePage } from '@/components/runs/run-console-page';

// Static export needs explicit generateStaticParams for dynamic segments.
// Pattern A: emit one canonical params combo matching the canned-data
// fixture. Day-18+ will switch to dynamic per-runId rendering.
export function generateStaticParams() {
  return [{ slug: 'iksula-returns', runId: 'RUN-RET-2026-04-25-002' }];
}

interface PageProps {
  params: Promise<{ slug: string; runId: string }>;
}

export default async function RunConsoleRoute({ params }: PageProps) {
  const { slug, runId } = await params;
  return <RunConsolePage projectSlug={slug} runId={runId} />;
}

// Implements F11c Source Connect Jira · Step 3 — Verify.
// See PM1_UI_v2/frame  html view/F11c Source Connect Jira · Step 3 Verify.html.
//
// Pattern A: ZERO fetch / useMutation / axios. All console.info markers
// fired client-side. The "Test fetch successful" + 4-card health grid
// are stubbed visuals; real verification + 142-issue backfill land with
// MS0-T030.5+ (BetterAuth + Atlassian REST + webhook listener).

import type { Metadata } from 'next';
import { projects } from '@/lib/demo-seed';
import { getProjectStaticParams } from '@/lib/project-slug';
import { ConnectJiraStep3Page } from '@/components/sources-jira/connect-jira-step3-page';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const metadata: Metadata = {
  title: 'Verify Jira · QA Nexus',
  description: 'Confirm the Jira connection + preview sample data. Step 3 of 3.',
};

// `output: 'export'` requires this to enumerate every reachable [slug]
// at build time. Slug = project name-slug (`iksula-returns`) via the shared
// helper — BUG-001 standardization (Day-1), Yogesh ruling.
export function generateStaticParams() {
  return getProjectStaticParams(projects);
}

export default async function JiraConnectStep3Page({ params }: PageProps) {
  const { slug } = await params;
  return <ConnectJiraStep3Page projectSlug={slug} />;
}

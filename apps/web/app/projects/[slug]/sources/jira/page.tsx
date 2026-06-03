// Implements F11a Source Connect Jira · Step 1 — Authorize.
// See PM1_UI_v2/frame  html view/F11 Source Connect Jira.html.
//
// Pattern A: ZERO fetch / useMutation / axios. Mount + auth + continue
// fire `pattern-a:deferred:jira-*` markers only. Real wiring lands with
// MS0-T030.5+ (BetterAuth + Atlassian OAuth 2.0 3LO client).
//
// Route shape: /projects/[slug]/sources/jira — slug is the project's
// URL slug (e.g. `iksula-returns` or `ret`). Steps 2 + 3 ship Day 4+
// at /step-2 and /step-3 respectively.

import type { Metadata } from 'next';
import { projects } from '@/lib/demo-seed';
import { getProjectStaticParams } from '@/lib/project-slug';
import { ConnectJiraStep1Page } from '@/components/sources-jira/connect-jira-step1-page';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const metadata: Metadata = {
  title: 'Connect Jira · QA Nexus',
  description:
    'Authorize QA Nexus to read your Jira workspace. Step 1 of 3: Authorize, Map, Verify.',
};

// `output: 'export'` requires this to enumerate every reachable [slug]
// at build time. Slug = project name-slug (`iksula-returns`) via the shared
// helper — BUG-001 standardization (Day-1), Yogesh ruling.
export function generateStaticParams() {
  return getProjectStaticParams(projects);
}

export default async function JiraConnectPage({ params }: PageProps) {
  const { slug } = await params;
  return <ConnectJiraStep1Page projectSlug={slug} />;
}

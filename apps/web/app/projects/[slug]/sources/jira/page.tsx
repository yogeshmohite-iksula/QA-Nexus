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
// at build time. Slug shape = lowercased project `key` (matches the
// URL convention: /projects/ret/sources/jira, /projects/cart/...,
// etc.). Pre-build covers the 5 Iksula seed projects; once BE M2 schema
// lands + projects table is populated, this becomes a build-time DB
// lookup. Closes followup (y) — surfaced 2026-05-04 PR #31 visual gate.
export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.key.toLowerCase() }));
}

export default async function JiraConnectPage({ params }: PageProps) {
  const { slug } = await params;
  return <ConnectJiraStep1Page projectSlug={slug} />;
}

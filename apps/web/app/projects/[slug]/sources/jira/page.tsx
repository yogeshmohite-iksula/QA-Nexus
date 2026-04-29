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
import { ConnectJiraStep1Page } from '@/components/sources-jira/connect-jira-step1-page';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const metadata: Metadata = {
  title: 'Connect Jira · QA Nexus',
  description:
    'Authorize QA Nexus to read your Jira workspace. Step 1 of 3: Authorize, Map, Verify.',
};

// Required by Next.js `output: 'export'` for dynamic routes — enumerate
// the slugs that should be pre-rendered. The list below mirrors the F09
// stub canon for now so the visual gate compiles statically.
//
// TODO: replace with the central seed module's project slugs once
// seed-centralization (Day-4 P1 followup i) lands. Until then this is the
// only acceptable hardcoded slug list — the UI itself accepts any slug
// at runtime via the [slug] param, so newly-created projects still work
// in dev mode (`pnpm dev`).
export function generateStaticParams() {
  return [
    { slug: 'iksula-returns' },
    { slug: 'iksula-commerce' },
    { slug: 'iksula-payments' },
    { slug: 'iksula-mobile' },
    { slug: 'iksula-ops' },
  ];
}

export default async function JiraConnectPage({ params }: PageProps) {
  const { slug } = await params;
  return <ConnectJiraStep1Page projectSlug={slug} />;
}

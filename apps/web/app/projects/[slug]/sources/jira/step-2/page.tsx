// Implements F11b Source Connect Jira · Step 2 — Map.
// See PM1_UI_v2/frame  html view/F11b Source Connect Jira · Step 2 Map.html.
//
// Pattern A: ZERO fetch / useMutation / axios. All console.info markers
// fired client-side. Real Jira project enumeration + mapping persistence
// land with MS0-T030.5+ (BetterAuth + Atlassian OAuth + REST API client).

import type { Metadata } from 'next';
import { ConnectJiraStep2Page } from '@/components/sources-jira/connect-jira-step2-page';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const metadata: Metadata = {
  title: 'Map Jira · QA Nexus',
  description:
    'Map Jira issue types, priorities, and custom fields to QA Nexus entities. Step 2 of 3.',
};

// Required for Next.js `output: 'export'` on dynamic routes. Mirrors the
// F11a slug list — TODO: replace with central seed module post-followup-i.
export function generateStaticParams() {
  return [
    { slug: 'iksula-returns' },
    { slug: 'iksula-commerce' },
    { slug: 'iksula-payments' },
    { slug: 'iksula-mobile' },
    { slug: 'iksula-ops' },
  ];
}

export default async function JiraConnectStep2Page({ params }: PageProps) {
  const { slug } = await params;
  return <ConnectJiraStep2Page projectSlug={slug} />;
}

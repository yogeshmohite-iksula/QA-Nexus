// Implements F12 Upload Requirements & Test Cases.
// See PM1_UI_v2/frame  html view/F12 Upload Requirements · Test Cases.html.
//
// Pattern A: ZERO fetch / useMutation / axios. The R2 presigned-URL
// service from ADR-005 is on main but its call-site lands with MS0-T030.5+;
// this page stores file metadata in pure local state for visual gating
// only.

import type { Metadata } from 'next';
import { CurrentUserProvider } from '@/lib/contexts/CurrentUserContext';
import { SEED_IDS } from '@/lib/demo-seed';
import { UploadPage } from '@/components/upload/upload-page';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const metadata: Metadata = {
  title: 'Import requirements & test cases · QA Nexus',
  description:
    'Upload XLSX, CSV, PDF, or video files. Optionally let A1 enrich them into test cases.',
};

// Required for Next.js `output: 'export'` on dynamic routes.
// TODO: replace with central seed-derived enumeration post-followup-i closes.
export function generateStaticParams() {
  return [
    { slug: 'iksula-returns' },
    { slug: 'iksula-commerce' },
    { slug: 'iksula-payments' },
    { slug: 'iksula-mobile' },
    { slug: 'iksula-ops' },
  ];
}

export default async function UploadRoute({ params }: PageProps) {
  const { slug } = await params;
  // Yogesh as the active Admin matches the F09 / F10 / F08c pattern: the
  // Admin is the canonical user in the demo flow that lands here from
  // F10's "Upload files" data-source choice.
  return (
    <CurrentUserProvider initialUserId={SEED_IDS.users.yogesh}>
      <UploadPage projectSlug={slug} />
    </CurrentUserProvider>
  );
}

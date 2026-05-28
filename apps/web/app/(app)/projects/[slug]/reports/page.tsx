// F23 Reports Studio route — thin server-component shell.
//
// Source: PM1_UI_v2/Redesign Frame by claude design/F23 Reports Studio v4.html
// Bundle: handoff/F23/ (Day-20 2026-05-20).
// Target route per spec: /projects/<slug>/reports.

import { F23ReportsStudio } from '@/components/f23-reports-studio/F23ReportsStudio';

// Pattern A: static export needs one canonical params combo.
// Day-26+ swap point: query route via project slug from BE.
export function generateStaticParams() {
  return [{ slug: 'iksula-returns' }];
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ReportsStudioRoute({ params }: PageProps) {
  const { slug } = await params;
  return <F23ReportsStudio projectSlug={slug} />;
}

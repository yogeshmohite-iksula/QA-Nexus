// F21 Defects Hub — route shell.
//
// Authenticated route at /projects/[slug]/defects. `output: 'export'`
// requires generateStaticParams for any [param]. Iksula RET anchor.

import { DefectsPage } from '@/components/defects/defects-page';

export function generateStaticParams() {
  return [{ slug: 'iksula-returns' }];
}

export default function Page() {
  return <DefectsPage />;
}

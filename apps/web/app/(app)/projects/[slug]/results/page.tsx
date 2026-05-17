// F20 Run Results route — /projects/[slug]/results
// Mounts the ResultsPage component (Pattern A scaffold).
// Hard Rule 17 applied from start — all strings from canned-data.ts.

import { ResultsPage } from '@/components/results/results-page';

// Static iksula-returns slug per F09 Projects List canon.
export function generateStaticParams() {
  return [{ slug: 'iksula-returns' }];
}

export default function Page() {
  return <ResultsPage />;
}

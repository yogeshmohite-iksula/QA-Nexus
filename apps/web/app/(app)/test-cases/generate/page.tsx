// F16b A1 Generate from Requirement — route shell.
//
// Implements F16b A1 Generate from Requirement v2.html. Reached from
// the F16a Test Case Method Chooser modal "AI Generated" card.
// Pattern A: source pre-selected to RET-247 + canned 5-case dataset.

import type { Metadata } from 'next';
import { GeneratePage } from '@/components/test-cases/generate/generate-page';

export const metadata: Metadata = {
  title: 'Generate from Requirement · QA Nexus',
  description: 'Compose test cases from a Jira requirement, KB-grounded by the Composer agent.',
};

export default function GenerateRoute() {
  return <GeneratePage />;
}

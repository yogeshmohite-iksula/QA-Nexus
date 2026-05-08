// F22 Test Case Library (placeholder) — minimal route to host the F16a
// Test Case Method Chooser modal (M3 Day-13 evening TASK 6 stretch).
//
// Full F22 page lands later in M3. For now this route renders the
// AdminShell-wrapped page header + a "+ New test case" CTA that
// triggers the F16a modal via `?new-test-case=1` URL param.
//
// Once F22 ships, this file becomes a thin route shell delegating to
// the full TestCaseLibraryPage component (same pattern as F12/F13).

import type { Metadata } from 'next';
import { TestCaseLibraryPlaceholder } from '@/components/test-cases/test-case-library-placeholder';

export const metadata: Metadata = {
  title: 'Test Cases · QA Nexus',
  description: 'Author and manage test cases for the project.',
};

export default function TestCasesRoute() {
  return <TestCaseLibraryPlaceholder />;
}

// Implements F08c Home · Empty Project First-Run · see PM1_UI_v2/frame  html view/F08c Home · Empty Project First-Run.html
//
// Backend wiring deferred to MS0-T030.5+ once T021 BetterAuth + the
// home queries are ready. For now all data is hard-coded TS constants
// in components/home-empty/data.ts (Pattern A enforcement).
//
// Pattern A (PM1_PRD §F08c):
//   Mount → console.info('pattern-a:deferred:home-empty-load', {...})
//   Each setup-card CTA + skip link + checklist interaction →
//     console.info('pattern-a:deferred:home-empty-route', { target })
//   ZERO fetch / useMutation / axios anywhere in the home-empty/ tree.
//
// This is the empty state shown immediately AFTER F07 Founder Onboarding
// completes (atomic commit succeeds + Pattern A data-source flow has not
// yet been triggered) but BEFORE the user has connected Jira / uploaded
// any docs / created any test cases.
//
// Locked-source deviation (one): the locked frame's left-rail footer
// labels Yogesh as 'QA LEAD'. CLAUDE.md Day-0 bootstrap defines
// Yogesh as Admin. Honoring CLAUDE.md (binding spec). Documented in
// components/home-empty/data.ts.

import type { Metadata } from 'next';
import { FounderEmptyHome } from '@/components/home-empty/founder-empty-home';

export const metadata: Metadata = {
  title: "Iksula Returns is ready — let's get it set up · QA Nexus",
  description:
    'First-run empty state for the Iksula Returns project. Connect a source, upload materials, or let A1 generate your first test cases.',
};

export default function HomeEmptyPage() {
  return <FounderEmptyHome />;
}

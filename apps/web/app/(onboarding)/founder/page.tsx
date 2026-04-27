// Implements F07 First-Run Onboarding · see PM1_UI_v2/frame  html view/F07 First-Run Onboarding.html
// Backend wiring deferred to MS0-T021 (BetterAuth) + MS0-T020 (Prisma schema)
//
// 3-step wizard with Pattern A deferred routing (PM1_PRD §F07):
//   Step 1: Project name + description + glyph + (optional) Jira key
//   Step 2: Data source choice (Jira / Upload) — STORE selection in wizard
//           state; do NOT trigger the data-source flow yet (Pattern A).
//   Step 3: Team invite (email rows) — atomic commit on Submit. Only AFTER
//           the atomic commit succeeds do we trigger the data-source flow.
//
// RESPONSIVE LAYOUT (CLAUDE.md Rule 12):
//   Mobile-first. Form max-width 640 px. Stepper labels collapse below sm.
//   Footer CTAs become column-reverse on mobile so the primary action
//   (Continue / Create workspace) stays at the bottom of the viewport.
//   No fixed pixel widths on layout containers; min-h-screen, not min-h-[1024px].
//
// VISUAL GATE (CLAUDE.md Rule 13):
//   /ui-check /founder?step=1 (etc.) — wait for explicit "looks good" approval
//   per the frame-port protocol established 2026-04-26 (F06 incident).
//
// Anti-drift: TEAL #2DD4BF for ALL system actions (Continue, Save as draft,
// Create workspace) — F07 has zero AI surfaces, so VIOLET appears only inside
// the brand-mark gradient on the avatar (a visual flourish, not a CTA).

import { Suspense } from 'react';
import type { Metadata } from 'next';

import { FounderWizard } from '@/components/onboarding/founder-wizard';

export const metadata: Metadata = {
  title: 'Set up your workspace · QA Nexus',
  description: 'Create your first QA Nexus project, choose a data source, and invite your team.',
};

export default function FounderOnboardingPage() {
  return (
    <Suspense fallback={null}>
      <FounderWizard />
    </Suspense>
  );
}

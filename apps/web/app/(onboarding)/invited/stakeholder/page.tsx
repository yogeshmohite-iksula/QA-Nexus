// Implements F07c Invited Stakeholder First-Run · see PM1_UI_v2/frames - claude code build (PM1 v2.6-v2.8)/F07c Invited Stakeholder First-Run.html
// Backend wiring deferred to MS0-T021 (BetterAuth) + MS0-T022 (invite acceptance endpoint).
//
// Pattern A (PM1_PRD §6.7c): page mount IS the implicit acceptance for the
// stakeholder email-link flow. ZERO network calls — only console.info markers
// (pattern-a:deferred:invited-stakeholder-*).
//
// ROLE SCOPE:
//   Stakeholders are AI-adjacent, not AI-operational. Per the locked frame's
//   validation check #9, NO violet appears on any content surface — violet
//   is retained ONLY on :focus-visible rings for a11y, and on the brand-mark
//   gradient (chrome, not content). Read-only badge is prominent in the hero
//   so the role's reduced scope is unambiguous on first paint.

import { Suspense } from 'react';
import type { Metadata } from 'next';

import { StakeholderInvited } from '@/components/onboarding/invited/stakeholder-invited';

export const metadata: Metadata = {
  title: 'Welcome · QA Nexus',
  description:
    "You've been added as a Stakeholder. Read-only access to your team's quality posture on QA Nexus.",
};

export default function InvitedStakeholderPage() {
  return (
    <Suspense fallback={null}>
      <StakeholderInvited />
    </Suspense>
  );
}

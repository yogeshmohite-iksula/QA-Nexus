// Implements F07d Invited Lead / Admin First-Run · see PM1_UI_v2/frames - claude code build (PM1 v2.6-v2.8)/F07d Invited Lead Admin First-Run.html
// Backend wiring deferred to MS0-T021 (BetterAuth) + MS0-T022 (invite acceptance).
//
// NOTE on user brief vs locked frame: the CHAT 2 brief described F07d as a
// "2-step wizard pre-filled from the founder context" reusing the Founder
// (F07) Step 2 + Step 3. The locked HTML frame is actually the same 5-region
// pattern as F07b PLUS a new Govern Access Strip — it is NOT a 2-step
// wizard. CLAUDE.md hard rule #3 says the locked frame is the source of
// truth, so this port follows the locked frame structure (Regions 1, 2, 3,
// 3b Govern, 4, 5).
//
// Pattern A: page mount fires console.info('pattern-a:deferred:invited-lead-admin-accept', payload).

import { Suspense } from 'react';
import type { Metadata } from 'next';

import { LeadAdminInvited } from '@/components/onboarding/invited/lead-admin-invited';

export const metadata: Metadata = {
  title: 'Welcome · QA Nexus',
  description:
    "You've been invited to QA Nexus as a Lead/Admin. Govern your team, set agent policy, and lead the QA practice.",
};

export default function InvitedLeadAdminPage() {
  return (
    <Suspense fallback={null}>
      <LeadAdminInvited />
    </Suspense>
  );
}

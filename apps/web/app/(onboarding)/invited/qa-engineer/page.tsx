// Implements F07b Invited QA Engineer First-Run · see PM1_UI_v2/frames - claude code build (PM1 v2.6-v2.8)/F07b Invited QA Engineer First-Run.html
// Backend wiring deferred to MS0-T021 (BetterAuth) + MS0-T022 (invite acceptance endpoint).
//
// Pattern A (PM1_PRD §6.7b): the page render IS the implicit invite acceptance
// for the email-link landing flow. We do NOT POST anywhere — instead we fire
// `console.info('pattern-a:deferred:invited-qa-engineer-accept', payload)`
// on mount so log-grep tooling can verify no network side-effects shipped
// from FE in M0. Each first-action CTA fires its own deferred-route marker.
//
// RESPONSIVE LAYOUT (CLAUDE.md Rule 12):
//   Mobile-first. Hero centers, workspace strip wraps to column on < md,
//   AI agent tour stacks 1-col on mobile / 2-col sm / 3-col lg+, first-action
//   picker cards stack 1-col → 3-col at lg+. No fixed pixel widths on layout
//   containers. min-h-screen, not min-h-[1024px].

import { Suspense } from 'react';
import type { Metadata } from 'next';

import { QaEngineerInvited } from '@/components/onboarding/invited/qa-engineer-invited';

export const metadata: Metadata = {
  title: 'Welcome · QA Nexus',
  description:
    "You've been invited to QA Nexus as a QA Engineer. Pick your first action or take a quick tour of the AI teammates.",
};

export default function InvitedQaEngineerPage() {
  return (
    <Suspense fallback={null}>
      <QaEngineerInvited />
    </Suspense>
  );
}

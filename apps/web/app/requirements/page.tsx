// Implements F14 Requirements List · /requirements.
// See PM1_UI_v2/frame  html view/F14 Requirements.html.
//
// Hash-anchor support: /requirements#status=draft, #sprint=Sprint%2042,
// #source=jira (combinable via &). Used by F08a/F08b dashboard cards
// to deeplink straight into a filtered slice.
//
// Pattern A: ZERO fetch / useMutation / axios. Real
// /api/projects/:slug/requirements GET wires at MS0-T030.5+ post-merge
// of BE M2 schema (Milestone_M2_Docs_KB.md).
//
// RBAC: F14 is QA Engineer accessible — no AdminGuard wrap.
// Root layout already wires CurrentUser / Project / TeamRoster
// providers (defaults to Yogesh as active user).

import type { Metadata } from 'next';
import { RequirementsListPage } from '@/components/requirements/requirements-list-page';

export const metadata: Metadata = {
  title: 'Requirements · QA Nexus',
  description: 'Track and manage requirements for the active project.',
};

export default function RequirementsRoute() {
  return <RequirementsListPage />;
}

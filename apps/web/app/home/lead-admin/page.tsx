// Implements F08b Home Dashboard (QA Lead) · see PM1_UI_v2/frame  html view/F08b Home Dashboard.html
// Backend wiring deferred to MS0-T030.5+ once T021 BetterAuth + T027 Audit
// log + the home queries are ready.
//
// Pattern A (PM1_PRD §F08b): page mount fires
//   pattern-a:deferred:home-lead-load
// Each Approve/Request changes/Reject fires
//   pattern-a:deferred:home-lead-action { action, entity_id }
// Each route click fires
//   pattern-a:deferred:home-route { target }
// ZERO fetch / useMutation / axios anywhere in this tree.
//
// RESPONSIVE LAYOUT (CLAUDE.md Rule 12):
//   < lg (< 1024 px): top bar + main content (single column)
//   lg+ (1024+):     + left navigation rail (240 px)
//   xl+ (1280+):     + right rail (380 px) sticky aside
//
// Iksula canon (this is the QA Lead post-login landing for Yogesh M. per
// the locked source). Sister page to /home (F08a, QA Engineer) and
// future /home/stakeholder (F08-stakeholder, no locked frame yet — P2).

import type { Metadata } from 'next';
import { QaLeadHome } from '@/components/home-lead/qa-lead-home';

export const metadata: Metadata = {
  title: 'Home · QA Nexus',
  description:
    'Team quality posture, AI-value KPIs, per-project cockpit, and approvals queue for QA Lead on Iksula Returns Sprint 42.',
};

export default function HomeLeadAdminPage() {
  return <QaLeadHome />;
}

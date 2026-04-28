// Implements F08a Home (QA Engineer) · see PM1_UI_v2/frame  html view/F08a Home (QA Engineer).html
// Backend wiring deferred to MS0-T030.5+ once T021 BetterAuth + the home
// queries are ready.
//
// Pattern A (PM1_PRD §F08a): page mount fires
//   pattern-a:deferred:home-qa-engineer-load
// with project + sprint + day + role payload. Each interactive route
// click fires
//   pattern-a:deferred:home-route { target, entity? }
// ZERO network calls — all data is hard-coded TS constants from the
// Iksula canon (CLAUDE.md roster + Sprint 42 anchor).
//
// RESPONSIVE LAYOUT (CLAUDE.md Rule 12):
//   < lg   (< 1024 px): top bar + main content (single column)
//   lg+    (1024 px+): + left navigation rail (240 px)
//   xl+    (1280 px+): + right rail (360 px) becomes a sticky aside;
//                       below xl it stacks under the queue
//
// Role-gating: this page is the QA Engineer view. F08b (Stakeholder) and
// F08c (Lead/Admin) variants will share the route in a future iteration
// via a server-side role check; for now /home shows only the QA Engineer
// surface.

import type { Metadata } from 'next';
import { QaEngineerHome } from '@/components/home/qa-engineer-home';

export const metadata: Metadata = {
  title: 'Home · QA Nexus',
  description:
    'Your action queue, active runs, release risk, and AI agent activity for Iksula Returns Sprint 42.',
};

export default function HomePage() {
  return <QaEngineerHome />;
}

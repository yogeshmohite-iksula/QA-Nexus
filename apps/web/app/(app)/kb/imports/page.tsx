// F13 KB Imports — Knowledge Base imported-files list (M2 Pattern A scaffold).
//
// Spec: PM1_UI_v2/frame  html view/F13 Imported Files List.html
// Mounted at: /kb/imports
//
// Pattern A: ZERO real fetch. 5 stub rows in mixed states; row actions
// (view / delete / retry) fire console.info Pattern A markers only.
// Pattern B (Thu 7 May, TASK 4) wires GET /api/kb/imports + DELETE
// /api/kb/imports/:id + retry via POST /api/kb/imports/:id/retry.
//
// Status states: ready · processing · failed
// Row actions: view (all rows) · delete (all rows) · retry (failed only)
// Delete confirmation: 480×360 confirm modal (desktop) / drawer (mobile)
//   per 01_SYSTEM.md §4.4 + CLAUDE.md Rule 12. Modal is also Pattern A —
//   "Delete" button fires the marker and closes the modal optimistically.

import type { Metadata } from 'next';
import { KbImportsPage } from '@/components/kb/kb-imports-page';

export const metadata: Metadata = {
  title: 'Imported files · QA Nexus KB',
  description: 'Review documents imported into the QA Nexus knowledge base.',
};

export default function KbImportsRoute() {
  return <KbImportsPage />;
}

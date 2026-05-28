// F25 Executive Dashboard — route shell.
//
// Authenticated route at /dashboard/executive.
// Hard Rule 14: AdminShell is mounted inside F25Page.
// Hard Rule 18: bundle workflow PASSED pre-Step-3 sanity check (8/8 region
// match + content-faithful spot-check on quality-posture). First successful
// bundle-workflow port (F22 was the rejection precedent).
//
// Theme: dark (matches canonical v2 HTML "F25 Executive Dashboard v2 -Dark-.html").
// f25.css scopes Prove-mode tokens (--p-*) to `.f25-shell` wrapper; dark theme
// uses the same dark canvas/border/text shades as the rest of the workspace.
// Light variant (ivory boardroom) remains the F25Page bundle default —
// pass `theme="light"` to render that variant.

import { F25Page } from '@/components/executive/F25Page';

export default function ExecutiveDashboardPage() {
  return <F25Page theme="dark" />;
}

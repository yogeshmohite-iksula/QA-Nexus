// QA Nexus PM1 — @ProjectScopedRoles decorator.
//
// Spec: PM1_ERD §3.4 + M1 Users & Roles milestone.
//
// **STATUS — M1 PREVIEW.** ProjectScopedRolesGuard is NOT registered in
// any Module today; the decorator is metadata-only. M1 final PR wires the
// guard via `@UseGuards(ProjectScopedRolesGuard)` on Project / TestCase /
// TestRun / Defect controllers.
//
// Difference from @Roles:
//   - `@Roles(Role.Admin, Role.Lead)` checks the user's WORKSPACE-level role
//     (TB-002.users.role). One value per user across the whole workspace.
//   - `@ProjectScopedRoles(Role.Lead)` ALSO accepts the workspace role but
//     PREFERS the per-project override (TB-004.project_members.role_override)
//     when the request hits a project-scoped route (`:slug`, `:projectKey`,
//     `:projectId`). Effective role = override ?? workspace role.
//
// Use this on M1+ routes that operate inside a single project context
// (e.g., `POST /api/projects/:slug/test-runs/:id/sign-off` — Lead-of-the-
// project, NOT necessarily workspace-Lead).
//
// Resolution rules (implemented in ProjectScopedRolesGuard):
//   1. Find the project ID from the route — try @Param('slug'),
//      @Param('projectKey'), @Param('projectId') in that order.
//   2. Look up TB-004.project_members.role_override for (user, project).
//   3. effectiveRole = override ?? user.role
//   4. Allow if effectiveRole ∈ requiredRoles.
//   5. If no project ID is in the route, fall back to workspace-role check
//      (degenerates to @Roles behaviour). This makes the decorator safe to
//      apply at controller-class level.

import { SetMetadata } from '@nestjs/common';
import type { Role } from '@qa-nexus/shared';

export const PROJECT_SCOPED_ROLES_KEY = 'qa-nexus:rbac:project-scoped-roles';

/** Mark a route handler as requiring one of the listed effective roles
 *  WITHIN the project identified by the route param. */
export const ProjectScopedRoles = (...roles: Role[]) =>
  SetMetadata(PROJECT_SCOPED_ROLES_KEY, roles);

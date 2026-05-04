// F27 Users & Roles — API client scaffolding (Pattern A→B flip prep).
//
// Day-8 BE-gated: real `GET /api/admin/users` + role/status PATCH
// endpoints land in BE+1's PR. This file ships the schema + fetcher
// SHAPES so the FE side can wire TanStack Query against them now,
// then flip the in-memory stub fetcher to a real `fetch()` in 30 min
// once the endpoint is confirmed live.
//
// PAUSE points are explicitly marked with `// PAUSE — wait BE+1 …`
// comments so the swap-out is mechanical when BE+1 ships.
//
// Schema canon (subject to confirmation when packages/shared
// publishes the BE Zod schema):
// - PM1_ERD §3.4 TB-001 `user`
// - PM1_ERD §3.5 TB-002 `team_member` (project-scoped role +
//     deactivation — joined onto user for the F27 list view)
// - PM1_ERD §3.6 TB-003 `invitation` (separate endpoint)

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Schemas — match the expected BE shape per ERD §3.4 / §3.5.
//
// PAUSE — wait BE+1 confirmation that `packages/shared` publishes the
// canonical Zod schema. Once it does:
//   1. Replace these local schemas with `import { userListItemSchema } from '@qa-nexus/shared'`
//   2. Delete this file's local definition.
//   3. Run `pnpm --filter web typecheck` to confirm zero diff.
// ---------------------------------------------------------------------------

export const adminUserRoleValues = ['Admin', 'Lead', 'QAEngineer', 'Stakeholder'] as const;
export type AdminUserRole = (typeof adminUserRoleValues)[number];

export const adminUserStatusValues = ['active', 'pending', 'inactive'] as const;
export type AdminUserStatus = (typeof adminUserStatusValues)[number];

export const adminUserListItemSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string().min(1),
  role: z.enum(adminUserRoleValues),
  status: z.enum(adminUserStatusValues),
  projectKeys: z.array(z.string()),
  lastActiveAt: z.string().nullable(), // ISO timestamp or null for never-active invites
  createdAt: z.string(),
});

export type AdminUserListItem = z.infer<typeof adminUserListItemSchema>;

export const adminUserListResponseSchema = z.object({
  users: z.array(adminUserListItemSchema),
  total: z.number().int().min(0),
});

export type AdminUserListResponse = z.infer<typeof adminUserListResponseSchema>;

// Mutation request schemas — for `useRoleChange` + `useStatusToggle`
// optimistic-update hooks (defined in `use-user-mutations.ts`).
export const roleChangeRequestSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(adminUserRoleValues),
});
export type RoleChangeRequest = z.infer<typeof roleChangeRequestSchema>;

export const statusToggleRequestSchema = z.object({
  userId: z.string().uuid(),
  action: z.enum(['deactivate', 'reactivate']),
});
export type StatusToggleRequest = z.infer<typeof statusToggleRequestSchema>;

// ---------------------------------------------------------------------------
// Fetchers — currently STUBS returning seed data. Real fetch swaps in
// at the connection point.
// ---------------------------------------------------------------------------

/** Stub fetcher — returns the seed roster as a Promise so the
 *  TanStack Query hook can call `await fetcher()` without changing
 *  shape when the real fetch swaps in.
 *
 *  PAUSE — wait BE+1 confirmation that GET /api/admin/users is live
 *  + Zod schema published in packages/shared. Then replace this body
 *  with:
 *
 *      const res = await fetch('/api/admin/users', { credentials: 'include' });
 *      if (!res.ok) throw new Error(`HTTP ${res.status}`);
 *      const json = await res.json();
 *      return adminUserListResponseSchema.parse(json);
 *
 *  No other call site needs to change. The hook + the F27 component
 *  consume the parsed shape, not the raw response.
 */
export async function fetchAdminUsers(): Promise<AdminUserListResponse> {
  // Lazy-import the seed roster only inside the stub so production
  // bundles can drop this entire branch via tree-shaking once the
  // real fetch lands.
  const { stubAdminUserList } = await import('./users-stub-data');
  // Mimic a brief network round-trip so loading-state UI actually
  // renders during dev. Real fetch will replace this latency.
  await new Promise((resolve) => setTimeout(resolve, 250));
  return adminUserListResponseSchema.parse(stubAdminUserList);
}

/** Stub role-change mutator. PAUSE — replace with a real
 *  `PATCH /api/admin/users/:id/role` once BE+1 ships. The optimistic
 *  update layer in `use-user-mutations.ts` does NOT change. */
export async function patchUserRole(req: RoleChangeRequest): Promise<AdminUserListItem> {
  roleChangeRequestSchema.parse(req); // validate request shape
  await new Promise((resolve) => setTimeout(resolve, 400));
  // Stub: pull the seed row, swap the role, return.
  const { stubAdminUserList } = await import('./users-stub-data');
  const user = stubAdminUserList.users.find((u) => u.id === req.userId);
  if (!user) throw new Error(`User ${req.userId} not found in stub`);
  return adminUserListItemSchema.parse({ ...user, role: req.role });
}

/** Stub deactivate / reactivate mutator. PAUSE — replace with a real
 *  `PATCH /api/admin/users/:id/status` once BE+1 ships. */
export async function patchUserStatus(req: StatusToggleRequest): Promise<AdminUserListItem> {
  statusToggleRequestSchema.parse(req);
  await new Promise((resolve) => setTimeout(resolve, 400));
  const { stubAdminUserList } = await import('./users-stub-data');
  const user = stubAdminUserList.users.find((u) => u.id === req.userId);
  if (!user) throw new Error(`User ${req.userId} not found in stub`);
  const nextStatus: AdminUserStatus = req.action === 'deactivate' ? 'inactive' : 'active';
  return adminUserListItemSchema.parse({ ...user, status: nextStatus });
}

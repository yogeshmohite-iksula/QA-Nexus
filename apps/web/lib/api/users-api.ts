// F27 Users & Roles — REAL BE-wired API client (Pattern B).
//
// Day-8 PM flip. PR #36 (`e70c227`) shipped the canonical Zod schemas
// + `GET/PATCH /api/users[/:id/role|status]` endpoints. This file now
// imports the wire schemas directly from `@qa-nexus/shared` and hits
// the real BE — the previous Day-8 morning stub layer is gone.
//
// Endpoints:
//   - GET   /api/users                    → ListUsersResponse
//   - PATCH /api/users/:id/role           → ChangeUserRoleResponse
//   - PATCH /api/users/:id/status         → ChangeUserStatusResponse
//
// Connection-pause recipe in `users-roles-page.connection-pause.md`
// is now CLOSED — this PR is the swap-in.

import {
  ChangeUserRoleInput,
  ChangeUserRoleResponse,
  ChangeUserStatusInput,
  ChangeUserStatusResponse,
  ListUsersResponse,
  type UserListItem,
  type UserStatus,
  type UserRole,
} from '@qa-nexus/shared';

export type {
  ChangeUserRoleInput,
  ChangeUserRoleResponse,
  ChangeUserStatusInput,
  ChangeUserStatusResponse,
  ListUsersResponse,
  UserListItem,
  UserStatus,
  UserRole,
};

// Re-export schema values for runtime parsing in the fetchers below
// (so the FE types stay in lockstep with the BE wire shape).
export {
  ChangeUserRoleInput as ChangeUserRoleInputSchema,
  ChangeUserRoleResponse as ChangeUserRoleResponseSchema,
  ChangeUserStatusInput as ChangeUserStatusInputSchema,
  ChangeUserStatusResponse as ChangeUserStatusResponseSchema,
  ListUsersResponse as ListUsersResponseSchema,
} from '@qa-nexus/shared';

// ---------------------------------------------------------------------------
// Fetchers
// ---------------------------------------------------------------------------

/** GET /api/users — list every user in the active workspace.
 *  Cookie session; cross-workspace + auth-missing get 401/403 from the
 *  RolesGuard. */
export async function fetchAdminUsers(): Promise<ListUsersResponse> {
  const res = await fetch('/api/users', {
    credentials: 'include',
    headers: { accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`GET /api/users → HTTP ${res.status}`);
  }
  const json = await res.json();
  return ListUsersResponse.parse(json);
}

/** PATCH /api/users/:id/role — change a user's workspace-level role.
 *  Service-side guards: cannot change own role, cannot demote last
 *  Admin, cannot change role of an invited (un-accepted) user. The FE
 *  surfaces those rejections via the mutation `onError` toast. */
export async function patchUserRole(req: ChangeUserRoleInput): Promise<ChangeUserRoleResponse> {
  ChangeUserRoleInput.parse(req); // validate request shape pre-flight
  const res = await fetch(`/api/users/${req.userId}/role`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ newRole: req.newRole }),
  });
  if (!res.ok) {
    // Surface the BE error message verbatim when the body is JSON.
    let msg = `PATCH /api/users/${req.userId}/role → HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (body && typeof body.message === 'string') msg = body.message;
    } catch {
      // ignore non-JSON bodies; keep the generic message
    }
    throw new Error(msg);
  }
  const json = await res.json();
  return ChangeUserRoleResponse.parse(json);
}

/** PATCH /api/users/:id/status — disable / re-enable a user. Disabling
 *  purges BetterAuth sessions (the response carries `sessionsRevoked`).
 *  Service-side guards: cannot disable self, cannot disable last Admin. */
export async function patchUserStatus(
  req: ChangeUserStatusInput,
): Promise<ChangeUserStatusResponse> {
  ChangeUserStatusInput.parse(req);
  const res = await fetch(`/api/users/${req.userId}/status`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ newStatus: req.newStatus }),
  });
  if (!res.ok) {
    let msg = `PATCH /api/users/${req.userId}/status → HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (body && typeof body.message === 'string') msg = body.message;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }
  const json = await res.json();
  return ChangeUserStatusResponse.parse(json);
}

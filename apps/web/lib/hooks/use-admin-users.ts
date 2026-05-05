// F27 admin-users TanStack Query hooks — Pattern B (real BE).
//
// Three hooks:
// - useAdminUsersList()      → query (cached `GET /api/users`)
// - useRoleChangeMutation()  → optimistic role swap (PATCH .../role)
// - useStatusToggleMutation() → optimistic deactivate/reactivate (PATCH .../status)
//
// Wire shape: `@qa-nexus/shared` `ListUsersResponse` + `ChangeUser{Role,Status}Input/Response`.
// Optimistic-update + Sonner toast + cache rollback all wired here so
// the F27 component just calls `mutation.mutate(req)`.

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchAdminUsers,
  patchUserRole,
  patchUserStatus,
  type ChangeUserRoleInput,
  type ChangeUserRoleResponse,
  type ChangeUserStatusInput,
  type ChangeUserStatusResponse,
  type ListUsersResponse,
  type UserListItem,
} from '@/lib/api/users-api';

// Single source of truth for the cache key. Mutations reach into the
// cache via this key for optimistic updates.
export const adminUsersListQueryKey = ['admin', 'users', 'list'] as const;

/**
 * Read-side hook. Returns the standard
 * `{ data, isLoading, isError, error, refetch }` envelope.
 *
 * F27 component:
 *   const { data, isLoading, isError, error, refetch } = useAdminUsersList();
 *   if (isLoading) return <UsersListSkeleton />;
 *   if (isError) return <UsersListError onRetry={() => refetch()} />;
 *   const users = data?.users ?? [];
 *   if (users.length === 0) return <UsersListEmpty onInvite={…} />;
 */
export function useAdminUsersList() {
  return useQuery<ListUsersResponse, Error>({
    queryKey: adminUsersListQueryKey,
    queryFn: fetchAdminUsers,
    staleTime: 30_000, // 30 s — short enough that role changes from
    // other admins surface fast, long enough that
    // tab-switch doesn't refetch every time.
    retry: 1,
  });
}

/**
 * Role-change mutation with optimistic update + Sonner toast on
 * success / error.
 *
 * Optimistic flow:
 * 1. onMutate — snapshot current cache, write the next role into
 *    the cache so the row updates immediately.
 * 2. mutationFn — PATCH to BE.
 * 3. onError — roll the cache back to the snapshot + fire error toast
 *    (uses the BE-provided `message` when present — service guards
 *    return human-readable failures like "Cannot demote last Admin").
 * 4. onSuccess — fire success toast + cache the BE-authoritative row.
 * 5. onSettled — invalidate to reconcile any out-of-band changes.
 */
export function useRoleChangeMutation() {
  const qc = useQueryClient();

  return useMutation<
    ChangeUserRoleResponse,
    Error,
    ChangeUserRoleInput,
    { snapshot: ListUsersResponse | undefined }
  >({
    mutationFn: patchUserRole,

    onMutate: async (req) => {
      // Cancel in-flight queries so the optimistic write doesn't get
      // clobbered by a stale fetch landing mid-mutation.
      await qc.cancelQueries({ queryKey: adminUsersListQueryKey });
      const snapshot = qc.getQueryData<ListUsersResponse>(adminUsersListQueryKey);
      if (snapshot) {
        qc.setQueryData<ListUsersResponse>(adminUsersListQueryKey, {
          ...snapshot,
          users: snapshot.users.map(
            (u): UserListItem => (u.id === req.userId ? { ...u, role: req.newRole } : u),
          ),
        });
      }
      return { snapshot };
    },

    onError: (err, _req, ctx) => {
      // Roll back to the pre-mutate snapshot.
      if (ctx?.snapshot) {
        qc.setQueryData(adminUsersListQueryKey, ctx.snapshot);
      }
      toast.error('Could not change role', {
        description: err.message || 'Try again or contact support if it persists.',
      });
    },

    onSuccess: (resp, req) => {
      // BE returned the authoritative row — write it back so cache
      // matches `roleChangedAt` etc. (UserDetailItem is a superset of
      // UserListItem; strip extras to keep the list-row shape).
      qc.setQueryData<ListUsersResponse>(adminUsersListQueryKey, (prev) =>
        prev
          ? {
              ...prev,
              users: prev.users.map(
                (u): UserListItem =>
                  u.id === req.userId
                    ? {
                        id: resp.user.id,
                        email: resp.user.email,
                        name: resp.user.name,
                        role: resp.user.role,
                        status: resp.user.status,
                        createdAt: resp.user.createdAt,
                        lastSeenAt: resp.user.lastSeenAt,
                      }
                    : u,
              ),
            }
          : prev,
      );
      toast.success(`Role updated to ${req.newRole}`, {
        description: `${resp.user.name} now has ${req.newRole} access.`,
      });
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: adminUsersListQueryKey });
    },
  });
}

/**
 * Status-toggle mutation (active ⇌ disabled). Same optimistic +
 * rollback + toast pattern as role-change. The response also reports
 * `sessionsRevoked` (number) — surfaced in the success-toast description
 * when ≥1 (otherwise omitted to keep the toast quiet on first-time
 * disables of users who never signed in).
 */
export function useStatusToggleMutation() {
  const qc = useQueryClient();

  return useMutation<
    ChangeUserStatusResponse,
    Error,
    ChangeUserStatusInput,
    { snapshot: ListUsersResponse | undefined }
  >({
    mutationFn: patchUserStatus,

    onMutate: async (req) => {
      await qc.cancelQueries({ queryKey: adminUsersListQueryKey });
      const snapshot = qc.getQueryData<ListUsersResponse>(adminUsersListQueryKey);
      if (snapshot) {
        qc.setQueryData<ListUsersResponse>(adminUsersListQueryKey, {
          ...snapshot,
          users: snapshot.users.map(
            (u): UserListItem => (u.id === req.userId ? { ...u, status: req.newStatus } : u),
          ),
        });
      }
      return { snapshot };
    },

    onError: (err, req, ctx) => {
      if (ctx?.snapshot) {
        qc.setQueryData(adminUsersListQueryKey, ctx.snapshot);
      }
      toast.error(
        req.newStatus === 'disabled' ? 'Could not disable user' : 'Could not re-enable user',
        { description: err.message || 'Try again or contact support if it persists.' },
      );
    },

    onSuccess: (resp, req) => {
      qc.setQueryData<ListUsersResponse>(adminUsersListQueryKey, (prev) =>
        prev
          ? {
              ...prev,
              users: prev.users.map(
                (u): UserListItem =>
                  u.id === req.userId
                    ? {
                        id: resp.user.id,
                        email: resp.user.email,
                        name: resp.user.name,
                        role: resp.user.role,
                        status: resp.user.status,
                        createdAt: resp.user.createdAt,
                        lastSeenAt: resp.user.lastSeenAt,
                      }
                    : u,
              ),
            }
          : prev,
      );

      const action = req.newStatus === 'disabled' ? 'disabled' : 're-enabled';
      const sessionPart =
        resp.sessionsRevoked > 0
          ? ` ${resp.sessionsRevoked} session${resp.sessionsRevoked === 1 ? '' : 's'} revoked.`
          : '';
      toast.success(`${resp.user.name} ${action}`, {
        description:
          (req.newStatus === 'disabled'
            ? 'They no longer have access to this workspace.'
            : 'Access restored — user must magic-link in to start a new session.') + sessionPart,
      });
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: adminUsersListQueryKey });
    },
  });
}

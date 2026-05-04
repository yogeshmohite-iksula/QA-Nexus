// F27 admin-users TanStack Query hooks — Pattern A→B flip layer.
//
// Three hooks:
// - useAdminUsersList()      → query (cached list)
// - useRoleChangeMutation()  → optimistic role swap
// - useStatusToggleMutation() → optimistic deactivate / reactivate
//
// PAUSE points marked inline. Real BE wires lands at MS0-T030.5+
// via the BE+1 PR. The optimistic-update plumbing is wired NOW
// (commented invocations) so the swap-out is mechanical.

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchAdminUsers,
  patchUserRole,
  patchUserStatus,
  type AdminUserListItem,
  type AdminUserListResponse,
  type AdminUserRole,
  type RoleChangeRequest,
  type StatusToggleRequest,
} from '@/lib/api/users-api';

// Single source of truth for the cache key. Mutations reach into
// the cache via this key for optimistic updates.
export const adminUsersListQueryKey = ['admin', 'users', 'list'] as const;

/**
 * Read-side hook. Returns `{ data, isLoading, isError, error, refetch }`.
 *
 * F27 component uses:
 *   const { data, isLoading, isError } = useAdminUsersList();
 *   if (isLoading) return <UsersListSkeleton />;
 *   if (isError) return <UsersListError onRetry={refetch} />;
 *   const users = data?.users ?? [];
 *
 * PAUSE — wait BE+1 confirmation that GET /api/admin/users is live +
 * Zod schema published in packages/shared. Then update
 * `fetchAdminUsers` to do a real `fetch()` (see comment in
 * `users-api.ts`). NO change required at this hook level.
 */
export function useAdminUsersList() {
  return useQuery<AdminUserListResponse, Error>({
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
 * 2. mutationFn — POST/PATCH to BE.
 * 3. onError — roll the cache back to the snapshot + fire error toast.
 * 4. onSuccess — fire success toast.
 * 5. onSettled — refetch to reconcile against authoritative BE state.
 */
export function useRoleChangeMutation() {
  const qc = useQueryClient();

  return useMutation<
    AdminUserListItem,
    Error,
    RoleChangeRequest,
    { snapshot: AdminUserListResponse | undefined }
  >({
    mutationFn: patchUserRole,

    onMutate: async (req) => {
      // Cancel in-flight queries so the optimistic write doesn't get
      // clobbered by a stale fetch landing mid-mutation.
      await qc.cancelQueries({ queryKey: adminUsersListQueryKey });
      const snapshot = qc.getQueryData<AdminUserListResponse>(adminUsersListQueryKey);
      if (snapshot) {
        qc.setQueryData<AdminUserListResponse>(adminUsersListQueryKey, {
          ...snapshot,
          users: snapshot.users.map((u) =>
            u.id === req.userId ? { ...u, role: req.role as AdminUserRole } : u,
          ),
        });
      }
      return { snapshot };
    },

    onError: (err, req, ctx) => {
      // Roll back to the pre-mutate snapshot.
      if (ctx?.snapshot) {
        qc.setQueryData(adminUsersListQueryKey, ctx.snapshot);
      }
      toast.error('Could not change role', {
        description: err.message || 'Try again or contact support if it persists.',
      });
    },

    onSuccess: (updated, req) => {
      toast.success(`Role updated to ${req.role}`, {
        description: `${updated.displayName} now has ${req.role} access.`,
      });
    },

    onSettled: () => {
      // Reconcile cache against BE — drops the optimistic write +
      // pulls the authoritative row.
      // PAUSE — invalidate is correct shape but currently triggers
      // a stub re-fetch that returns the unchanged seed. Once BE+1
      // lands, this becomes the real reconcile call.
      qc.invalidateQueries({ queryKey: adminUsersListQueryKey });
    },
  });
}

/**
 * Status-toggle mutation (deactivate / reactivate). Same optimistic
 * + rollback + toast pattern as role-change.
 */
export function useStatusToggleMutation() {
  const qc = useQueryClient();

  return useMutation<
    AdminUserListItem,
    Error,
    StatusToggleRequest,
    { snapshot: AdminUserListResponse | undefined }
  >({
    mutationFn: patchUserStatus,

    onMutate: async (req) => {
      await qc.cancelQueries({ queryKey: adminUsersListQueryKey });
      const snapshot = qc.getQueryData<AdminUserListResponse>(adminUsersListQueryKey);
      if (snapshot) {
        const nextStatus = req.action === 'deactivate' ? 'inactive' : 'active';
        qc.setQueryData<AdminUserListResponse>(adminUsersListQueryKey, {
          ...snapshot,
          users: snapshot.users.map((u) =>
            u.id === req.userId ? { ...u, status: nextStatus } : u,
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
        req.action === 'deactivate' ? 'Could not deactivate user' : 'Could not reactivate user',
        { description: err.message || 'Try again or contact support if it persists.' },
      );
    },

    onSuccess: (updated, req) => {
      toast.success(
        req.action === 'deactivate'
          ? `${updated.displayName} deactivated`
          : `${updated.displayName} reactivated`,
        {
          description:
            req.action === 'deactivate'
              ? 'They no longer have access to this workspace.'
              : 'Access restored — invite email sent on next sign-in.',
        },
      );
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: adminUsersListQueryKey });
    },
  });
}

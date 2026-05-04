# F27 Pattern A → B connection-point recipe

> **PAUSE — wait BE+1 confirmation that GET /api/admin/users is live + Zod schema published in `packages/shared`.**

This file documents the mechanical swap-in to flip F27 from Pattern A
(deferred markers, no fetch) to Pattern B (TanStack Query against real
BE). Day-8 morning ships the scaffolding; the swap-in below is a 30-min
operation when BE+1 reports endpoint live.

---

## Pre-flight checks (do BEFORE editing F27)

1. **BE+1 endpoint live:**

   ```bash
   curl -i -H 'Cookie: ...' http://localhost:4000/api/admin/users
   ```

   Expect 200 + JSON matching `AdminUserListResponse` shape.

2. **Schema published in `packages/shared`:**

   ```bash
   grep -nE 'adminUserListItemSchema|AdminUserListItem' packages/shared/src/**/*.ts
   ```

   Expect at least one match. Then:
   - Open `apps/web/lib/api/users-api.ts`
   - Replace local `adminUserListItemSchema` / `adminUserListResponseSchema`
     with `import { ... } from '@qa-nexus/shared'`
   - Delete the local schema definitions.
   - Run `pnpm --filter web typecheck` → expect 0 errors.

3. **Real fetcher swap-in** (`apps/web/lib/api/users-api.ts`):

   ```ts
   // Replace the body of fetchAdminUsers():
   export async function fetchAdminUsers(): Promise<AdminUserListResponse> {
     const res = await fetch('/api/admin/users', { credentials: 'include' });
     if (!res.ok) throw new Error(`HTTP ${res.status}`);
     const json = await res.json();
     return adminUserListResponseSchema.parse(json);
   }
   ```

   Same for `patchUserRole` (PATCH /api/admin/users/:id/role) +
   `patchUserStatus` (PATCH /api/admin/users/:id/status).

4. **Drop stub data** (`apps/web/lib/api/users-stub-data.ts`):
   - Delete the file.
   - The `await import('./users-stub-data')` lines in `users-api.ts`
     get removed in step 3 — no other call sites reference it.

---

## F27 component swap-in (`users-roles-page.tsx`)

Replace the current Pattern A block:

```tsx
// CURRENT (Pattern A — deferred markers only):
const me = useCurrentUser();
const { members } = useTeamRoster(); // ← stub: 8-user seed roster
// ... renders against `members` directly
```

With Pattern B:

```tsx
// PATTERN B — TanStack Query against real BE:
import {
  useAdminUsersList,
  useRoleChangeMutation,
  useStatusToggleMutation,
} from '@/lib/hooks/use-admin-users';
import {
  UsersListSkeleton,
  UsersListError,
  UsersListEmpty,
} from './users-list-view-states';

const me = useCurrentUser();
const { data, isLoading, isError, error, refetch } = useAdminUsersList();
const roleMutation = useRoleChangeMutation();
const statusMutation = useStatusToggleMutation();

if (isLoading) return <UsersListSkeleton />;
if (isError)
  return <UsersListError message={error?.message} onRetry={() => refetch()} />;

const users = data?.users ?? [];
if (users.length === 0) return <UsersListEmpty onInvite={onInviteOpen} />;

// ... render against `users` (renamed from `members`)
```

Then update the per-row handlers:

```tsx
function onRoleChange(userId: string, oldRole: string, newRole: string) {
  // Pattern A: console.info('pattern-a:deferred:users-role-change', { userId, oldRole, newRole });
  // Pattern B:
  roleMutation.mutate({ userId, role: newRole as AdminUserRole });
}

function onStatusToggle(userId: string, action: 'deactivate' | 'reactivate') {
  // Pattern A: console.info('pattern-a:deferred:users-status-toggle', { userId, action });
  // Pattern B:
  statusMutation.mutate({ userId, action });
}
```

Optimistic update + Sonner toast + cache rollback are all wired
inside the mutation hooks (`use-admin-users.ts`). NO change required
at the F27 component level.

---

## Test updates

The four F27 admin-frame tests (`__tests__/admin/users-roles-page.test.tsx`)
currently mock the seed roster via `useTeamRoster()`. After swap-in:

1. Wrap the test render in a `QueryClientProvider` from
   `@tanstack/react-query` — easiest via the existing `renderWithProviders`
   helper (`__tests__/test-utils.tsx`). Add a `QueryClient` factory there
   that returns a fresh client per test (avoids cache-leak across tests).

2. Mock `fetch` (or `vi.mock('@/lib/api/users-api')`) to return the
   stub `AdminUserListResponse`.

3. The 4 existing test assertions stay the same — list-load marker
   becomes either:
   - REMOVED (Pattern A → B means the marker no longer fires; test
     drops the assertion), OR
   - KEPT but moved into the mutation hooks if BE+1 wants client-side
     analytics.

   Yogesh decides per-marker before the swap.

---

## Smoke test after swap-in

1. `pnpm --filter web dev`
2. Open `/admin/users` — should see Loading skeleton briefly, then
   the real BE-served roster.
3. Change a role in the dropdown — row updates instantly (optimistic),
   Sonner success toast fires, `pnpm --filter api dev` log shows the
   PATCH request.
4. Network tab → throttle to "Slow 3G" + revoke a status → row updates
   instantly, then BE responds → Sonner success toast.
5. To test rollback: temporarily make the BE return 500 on PATCH →
   row rolls back to old value, Sonner error toast fires.

---

## Rollback / kill switch

If Pattern B causes regressions, revert the F27 component edit. The
scaffolding files (`users-api.ts`, `users-stub-data.ts`,
`use-admin-users.ts`, `users-list-view-states.tsx`, `QueryProvider.tsx`)
can stay — they're side-effect-free imports.

---

## Day-8 status (this PR — `feature/fe-m1-f27-real-wiring`)

Scaffolding shipped. F27 component NOT modified. Ready for swap-in
when BE+1 reports endpoint live. Estimated time-to-ship after green
light: 30 min (this recipe + a 4-test update + smoke test).

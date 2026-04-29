/**
 * TeamRosterContext — workspace-wide user roster + lookup helpers.
 *
 * Spec: followup (i) Phase 3(e). Pattern A compatible (no fetch).
 *
 * In demo / pre-BE mode (today): reads `users[]` from `lib/demo-seed`.
 *
 * Once BE lands (T021 + F27):
 *   1. Replace the demo-seed import with a TanStack Query call against
 *      `GET /api/users?workspaceId=...`.
 *   2. Hook signatures stay stable; components require ZERO changes.
 *
 * Depends on CurrentUserContext (for the "exclude self from teammates"
 * computation in `useTeammates`). Wire order in layout.tsx must be:
 *
 *   <CurrentUserProvider>          ← outermost
 *     <ProjectProvider>
 *       <TeamRosterProvider>       ← innermost (depends on CurrentUser)
 *         {children}
 *
 * Migration: see `docs/refactor/seed-centralization-migration.md`.
 */
'use client';

import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { TeamRoster, UserPublic } from '@qa-nexus/shared';
import { users as seedUsers } from '../demo-seed';
import { useCurrentUser } from './CurrentUserContext';

interface TeamRosterContextValue {
  /** Full roster — { members, lead, admin } per the TeamRoster type contract. */
  roster: TeamRoster;
}

const TeamRosterContext = createContext<TeamRosterContextValue | null>(null);

interface TeamRosterProviderProps {
  children: ReactNode;
}

export function TeamRosterProvider({ children }: TeamRosterProviderProps) {
  const value = useMemo<TeamRosterContextValue>(() => {
    const members = seedUsers;
    const lead = members.find((u) => u.role === 'Lead') ?? null;
    const admin = members.find((u) => u.role === 'Admin') ?? null;
    return { roster: { members, lead, admin } };
  }, []);

  return <TeamRosterContext.Provider value={value}>{children}</TeamRosterContext.Provider>;
}

/** Hook — returns the full team roster (members + lead + admin). */
export function useTeamRoster(): TeamRoster {
  const ctx = useContext(TeamRosterContext);
  if (!ctx) {
    throw new Error(
      'useTeamRoster must be called within a <TeamRosterProvider>. ' +
        'Wrap your tree at apps/web/app/layout.tsx.',
    );
  }
  return ctx.roster;
}

/** Hook — single user lookup by id. Returns `null` if not found.
 *
 *  Use cases:
 *  - Defect.assigneeId → render "Assigned to: <displayName>" badge.
 *  - TestCase.createdBy → render "Created by <displayName>" footer.
 *  - Audit-log row.actorId → render actor name in F28 audit log view.
 *
 *  Returns `null` (not throw) for unknown ids — common when an actor was
 *  deactivated / deleted but their id still appears on historical rows.
 */
export function useTeamMember(id: string | null | undefined): UserPublic | null {
  const ctx = useContext(TeamRosterContext);
  if (!ctx) {
    throw new Error('useTeamMember must be called within a <TeamRosterProvider>.');
  }
  if (!id) return null;
  return ctx.roster.members.find((u) => u.id === id) ?? null;
}

/** Hook — current user's teammates (roster minus self). Useful for assignee
 *  pickers, "share with team" UI, etc. — anywhere the current user shouldn't
 *  see themselves as an option.
 *
 *  Order matches the underlying roster (alphabetical by displayName).
 */
export function useTeammates(): UserPublic[] {
  const ctx = useContext(TeamRosterContext);
  if (!ctx) {
    throw new Error('useTeammates must be called within a <TeamRosterProvider>.');
  }
  const me = useCurrentUser();
  return useMemo(
    () => ctx.roster.members.filter((u) => u.id !== me.id),
    [ctx.roster.members, me.id],
  );
}

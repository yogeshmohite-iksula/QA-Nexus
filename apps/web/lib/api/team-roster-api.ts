// Team-roster adapter — F27 "Current team" section (Fri WIRE batch-1, 2026-06-19).
//
// Reuses the ALREADY-WRITTEN `useAdminUsersList()` TanStack-Query hook
// (`lib/hooks/use-admin-users.ts`) — Hard Rule 11 is honored upstream there.
// This file is the pure shape adapter: API `UserPublic[]` → F27 `TeamRosterRow[]`
// matching the canonical TeamRoster render contract.
//
// Decision E (canon-only): the API has no per-user `projects` membership
// (data model is workspace-scoped), so we display "All projects" — honest,
// matches the Sweep-C pending-invites pattern for scope-less rows.

import type { UserListItem, UserRole } from '@qa-nexus/shared';

/** Display shape the canonical TeamRoster table renders.
 *  All keys mirror `F27_TEAM_MEMBERS` exactly (Hard Rule 17). */
export interface TeamRosterRow {
  initials: string;
  name: string;
  nameSuffix: string;
  email: string;
  role: string;
  roleKey: 'admin' | 'qa_lead' | 'qa_engineer' | 'stakeholder';
  projects: readonly string[];
  status: 'Active' | 'Invited' | 'Disabled';
  lastActive: string;
  joined: string;
}

const ROLE_DISPLAY: Record<UserRole, string> = {
  Admin: 'ADMIN',
  Lead: 'QA LEAD',
  QAEngineer: 'QA ENGINEER',
  Stakeholder: 'STAKEHOLDER',
};
const ROLE_KEY: Record<UserRole, TeamRosterRow['roleKey']> = {
  Admin: 'admin',
  Lead: 'qa_lead',
  QAEngineer: 'qa_engineer',
  Stakeholder: 'stakeholder',
};

function shortInitials(displayName: string, email: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  if (parts.length === 1 && parts[0].length >= 2) return parts[0].slice(0, 2).toUpperCase();
  const local = email.split('@')[0] ?? email;
  return (local.replace(/[^a-zA-Z]/g, '').slice(0, 2) || local.slice(0, 2)).toUpperCase();
}

/** Returns "Just now" / "Xm ago" / "Xh ago" / "Xd ago" / "Never". */
function lastActiveOf(lastSeenAt: string | null): string {
  if (!lastSeenAt) return 'Never';
  const ms = Date.now() - new Date(lastSeenAt).getTime();
  if (!Number.isFinite(ms) || ms < 0) return 'Just now';
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return 'Just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  return `${days}d ago`;
}

/** Date-only YYYY-MM-DD, matches canned `joined: '2026-03-02'` format. */
function joinedDate(createdAt: string): string {
  const iso = new Date(createdAt).toISOString();
  return iso.slice(0, 10);
}

interface AdaptCtx {
  /** Current user's id → adds "(you)" suffix to that row. */
  meId?: string;
}

const STATUS_DISPLAY: Record<'active' | 'invited' | 'disabled', TeamRosterRow['status']> = {
  active: 'Active',
  invited: 'Invited',
  disabled: 'Disabled',
};

/** API users → F27 display rows. Yogesh's row floats to the top + gets "(you)";
 *  rest preserve the API order. Empty input passes through as empty. */
export function usersToRoster(users: readonly UserListItem[], ctx: AdaptCtx = {}): TeamRosterRow[] {
  const rows = users.map<TeamRosterRow>((u) => ({
    initials: shortInitials(u.name, u.email),
    name: u.name,
    nameSuffix: u.id === ctx.meId ? '(you)' : '',
    email: u.email,
    role: ROLE_DISPLAY[u.role] ?? u.role,
    roleKey: ROLE_KEY[u.role] ?? 'qa_engineer',
    // API has no per-user projects (workspace-scoped). Truthful default.
    projects: ['All projects'],
    status: STATUS_DISPLAY[u.status] ?? 'Active',
    lastActive: lastActiveOf(u.lastSeenAt),
    joined: joinedDate(u.createdAt),
  }));
  // Float current user to top (matches canonical Yogesh-first ordering).
  if (ctx.meId) {
    const meIdx = rows.findIndex((r) => r.nameSuffix === '(you)');
    if (meIdx > 0) {
      const [me] = rows.splice(meIdx, 1);
      rows.unshift(me);
    }
  }
  return rows;
}

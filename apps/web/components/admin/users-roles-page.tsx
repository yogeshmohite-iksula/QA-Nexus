// F27 Users & Roles page composer — Phase-2 polish iteration.
// Pattern A markers preserved as TODOs.

'use client';

import './users-roles-page.css';

import { useEffect, useState } from 'react';

import { AdminShell } from '@/components/admin/admin-shell';
import { useCurrentUser } from '@/lib/contexts/CurrentUserContext';
import { useAdminUsersList } from '@/lib/hooks/use-admin-users';
import { fetchPendingInvites, type PendingInviteRow } from '@/lib/api/pending-invites-api';
import { usersToRoster, type TeamRosterRow } from '@/lib/api/team-roster-api';
import { auditEntryToActivity, fetchAuditEntries, type F27ActivityRow } from '@/lib/api/audit-api';
import {
  F27_RAW,
  F27_STATS,
  F27_SYNC,
  F27_CTA_BANNER,
  F27_TEAM_MEMBERS,
  F27_PENDING_INVITES,
  F27_RECENT_ACTIVITY,
  F27_ROLE_MATRIX,
} from '@/components/admin/users-roles-page.canned-data';

import { StatsStrip } from '@/components/admin/users-roles/StatsStrip';
import { CtaBanner } from '@/components/admin/users-roles/CtaBanner';
import { TeamRoster } from '@/components/admin/users-roles/TeamRoster';
import { PendingInvites } from '@/components/admin/users-roles/PendingInvites';
import { RecentActivity } from '@/components/admin/users-roles/RecentActivity';
import { RoleMatrix } from '@/components/admin/users-roles/RoleMatrix';

const H1 = F27_RAW.headings.h1[0];

export function UsersRolesPage() {
  // Sweep C: live pending invites from GET /api/invitations. null = fetch
  // failed → keep canned fallback; [] = real empty workspace → "No pending
  // invites". Yogesh's real invite appears here once the API is reachable.
  const me = useCurrentUser();
  const [pending, setPending] = useState<PendingInviteRow[] | null>(null);
  useEffect(() => {
    let alive = true;
    void fetchPendingInvites({ meId: me.id, meName: me.displayName }).then((rows) => {
      if (alive && rows) setPending(rows);
    });
    return () => {
      alive = false;
    };
  }, [me.id, me.displayName]);

  // Fri WIRE batch 1: live team roster via the existing useAdminUsersList
  // hook (TanStack Query, 30s staleTime). isError / undefined → canned
  // fallback. Empty API users → empty roster (honest empty state).
  const { data: usersResp } = useAdminUsersList();
  const liveRoster: TeamRosterRow[] | null = usersResp
    ? usersToRoster(usersResp.users, { meId: me.id })
    : null;
  const roster = liveRoster && liveRoster.length > 0 ? liveRoster : F27_TEAM_MEMBERS;

  // Fri WIRE batch 4: live "Recent activity" feed from /api/audit. null →
  // canned fallback; empty → also canned (a real M1 workspace has invite +
  // role-change rows day one, so a true 0-row case is "fetch hasn't completed").
  const [liveActivity, setLiveActivity] = useState<F27ActivityRow[] | null>(null);
  useEffect(() => {
    let alive = true;
    void fetchAuditEntries(50).then((res) => {
      if (!alive || !res) return;
      const rows = res.items.map(auditEntryToActivity);
      if (rows.length > 0) setLiveActivity(rows.slice(0, 6));
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <AdminShell active="users-roles">
      <main className="center" aria-label="Users & Roles page">
        <nav className="crumb" aria-label="Breadcrumb">
          <a href="#">Home</a>
          <span aria-hidden="true">›</span>
          <a href="#">Govern</a>
          <span aria-hidden="true">›</span>
          <span aria-current="page">Users & Roles</span>
        </nav>

        <header className="phead">
          <div className="lead">
            <h1>{H1}</h1>
            <StatsStrip data={F27_STATS} sync={F27_SYNC} />
          </div>
        </header>

        <CtaBanner data={F27_CTA_BANNER} />
        <TeamRoster data={roster} />
        <PendingInvites data={pending ?? F27_PENDING_INVITES} />
        <RecentActivity data={liveActivity ?? F27_RECENT_ACTIVITY} />
        <RoleMatrix data={F27_ROLE_MATRIX} />
      </main>
    </AdminShell>
  );
}

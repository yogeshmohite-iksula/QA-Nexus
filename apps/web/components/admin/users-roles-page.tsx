// F27 Users & Roles page composer — Phase-2 polish iteration.
// Pattern A markers preserved as TODOs.

'use client';

import './users-roles-page.css';

import { useEffect, useState } from 'react';

import { AdminShell } from '@/components/admin/admin-shell';
import { useCurrentUser } from '@/lib/contexts/CurrentUserContext';
import { fetchPendingInvites, type PendingInviteRow } from '@/lib/api/pending-invites-api';
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
        <TeamRoster data={F27_TEAM_MEMBERS} />
        <PendingInvites data={pending ?? F27_PENDING_INVITES} />
        <RecentActivity data={F27_RECENT_ACTIVITY} />
        <RoleMatrix data={F27_ROLE_MATRIX} />
      </main>
    </AdminShell>
  );
}

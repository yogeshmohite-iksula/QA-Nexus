// F27 Users & Roles — main orchestrator.
//
// Locked source: PM1_UI_v2/frames - claude code build (PM1 v2.6-v2.8)/F27 Users and Roles.html
// Mounted at /admin/users (Admin-only — see `AdminGuard`).
//
// Pattern A enforcement (PM1_PRD §F27) — 9 deferred markers:
// - Mount → `pattern-a:deferred:users-list-load`
//     { workspaceId, totalUsers, pendingInvites, statusBreakdown }.
// - Invite-CTA click → `pattern-a:deferred:users-invite-open` { from }
//     + route to /admin/users/invite (F27m1 modal).
// - Role-cell change → `pattern-a:deferred:users-role-change`
//     { userId, oldRole, newRole }.
// - Status toggle → `pattern-a:deferred:users-status-toggle`
//     { userId, action: 'deactivate' | 'reactivate' }.
// - Project-chip click → `pattern-a:deferred:users-project-assign`
//     { userId, projectKey, action: 'add' | 'remove' }.
// - Pending invite resend → `pattern-a:deferred:users-invite-resend`
//     { invitationId, email }.
// - Pending invite revoke → `pattern-a:deferred:users-invite-revoke`
//     { invitationId, email }.
// - Filter/sort change → `pattern-a:deferred:users-filter-change`
//     { kind, value }.
// - Audit-feed link click → `pattern-a:deferred:users-audit-open`
//     { eventId } + route to /admin/settings#audit-log (F28).
// - ZERO fetch / useMutation / axios. Real /api/users + /api/invitations +
//   /api/audit-log land MS0-T030.5+ once BE M1 schema (`feature/be-m1-users-schema`)
//   is merged.
//
// ADR-006 hooks: identity comes from `useCurrentUser()` + `useTeamRoster()`
// + `useProjectList()` + `useTeamMember(actorId)` for audit-row attribution.
// NO local data.ts entries for user / project / actor names.

'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { UserPublic } from '@qa-nexus/shared';
import { useCurrentUser } from '@/lib/contexts/CurrentUserContext';
import { useTeamRoster, useTeamMember } from '@/lib/contexts/TeamRosterContext';
import { useProjectList } from '@/lib/contexts/ProjectContext';
import { SEED_IDS } from '@/lib/demo-seed';
import { AdminShell } from './admin-shell';

// ---------------------------------------------------------------------------
// View-fixture stubs — Pattern A.
//
// Pending invites + audit-feed entries are display-only rows. Each row's
// actor / target / invited-by IDs reference `SEED_IDS.users.*`; names
// resolve at render time via `useTeamMember()`. NO inline name strings.
// ---------------------------------------------------------------------------

interface PendingInviteRow {
  invitationId: string;
  email: string;
  role: 'lead' | 'admin' | 'qa-engineer' | 'stakeholder';
  invitedById: string;
  invitedAtRelative: string;
  expiresInDays: number;
  projectKeys: string[];
}

const PENDING_INVITES: PendingInviteRow[] = [
  {
    invitationId: 'inv-001',
    email: 'priya.menon@iksula.com',
    role: 'qa-engineer',
    invitedById: SEED_IDS.users.yogesh,
    invitedAtRelative: '2h ago',
    expiresInDays: 6,
    projectKeys: ['RET'],
  },
  {
    invitationId: 'inv-002',
    email: 'rohit.bansal@iksula.com',
    role: 'qa-engineer',
    invitedById: SEED_IDS.users.akshay,
    invitedAtRelative: 'yesterday',
    expiresInDays: 5,
    projectKeys: ['RET', 'CART'],
  },
  {
    invitationId: 'inv-003',
    email: 'meera.iyer@iksula.com',
    role: 'lead',
    invitedById: SEED_IDS.users.yogesh,
    invitedAtRelative: '2d ago',
    expiresInDays: 4,
    projectKeys: ['PAY'],
  },
];

type AuditEventKind =
  | 'invite_sent'
  | 'invite_accepted'
  | 'role_updated'
  | 'project_assigned'
  | 'user_deactivated';

interface AuditEventRow {
  eventId: string;
  kind: AuditEventKind;
  actorId: string;
  targetId?: string;
  detailA?: string;
  detailB?: string;
  ts: string;
}

// View-fixture audit feed — references real seed user IDs only. Replaces
// the locked source's placeholder names (Ravi/Priya/Meera/Amit/Neha) with
// canonical CLAUDE.md roster IDs resolved at render time.
const AUDIT_EVENTS: AuditEventRow[] = [
  {
    eventId: 'evt-1',
    kind: 'invite_sent',
    actorId: SEED_IDS.users.yogesh,
    targetId: SEED_IDS.users.akshay,
    detailA: 'QA Lead',
    ts: '2026-04-29 · 10:32',
  },
  {
    eventId: 'evt-2',
    kind: 'invite_accepted',
    actorId: SEED_IDS.users.akshay,
    ts: '2026-04-29 · 10:48',
  },
  {
    eventId: 'evt-3',
    kind: 'invite_sent',
    actorId: SEED_IDS.users.yogesh,
    targetId: SEED_IDS.users.kishor,
    detailA: 'QA Engineer',
    ts: '2026-04-28 · 09:12',
  },
  {
    eventId: 'evt-4',
    kind: 'role_updated',
    actorId: SEED_IDS.users.yogesh,
    targetId: SEED_IDS.users.nitin,
    detailA: 'QA Engineer',
    detailB: 'QA Engineer (Senior QA)',
    ts: '2026-04-26 · 16:45',
  },
  {
    eventId: 'evt-5',
    kind: 'project_assigned',
    actorId: SEED_IDS.users.akshay,
    targetId: SEED_IDS.users.nadim,
    detailA: 'Iksula Commerce',
    ts: '2026-04-24 · 11:20',
  },
  {
    eventId: 'evt-6',
    kind: 'invite_accepted',
    actorId: SEED_IDS.users.govind,
    ts: '2026-04-23 · 14:05',
  },
  {
    eventId: 'evt-7',
    kind: 'project_assigned',
    actorId: SEED_IDS.users.yogesh,
    targetId: SEED_IDS.users.mohanraj,
    detailA: 'Iksula Mobile App',
    ts: '2026-04-22 · 09:30',
  },
];

interface UserViewMeta {
  projectKeys: string[];
  lastActiveRelative: string;
  status: 'active' | 'pending';
}

const USER_META: Record<string, UserViewMeta> = {
  [SEED_IDS.users.yogesh]: {
    projectKeys: ['RET', 'CART', 'PAY', 'AUTH', 'OPS'],
    lastActiveRelative: 'Now',
    status: 'active',
  },
  [SEED_IDS.users.akshay]: {
    projectKeys: ['RET', 'CART', 'PAY'],
    lastActiveRelative: '12 min ago',
    status: 'active',
  },
  [SEED_IDS.users.kishor]: {
    projectKeys: ['RET', 'CART'],
    lastActiveRelative: '1h ago',
    status: 'active',
  },
  [SEED_IDS.users.nitin]: {
    projectKeys: ['RET', 'PAY'],
    lastActiveRelative: '2h ago',
    status: 'active',
  },
  [SEED_IDS.users.nadim]: {
    projectKeys: ['RET', 'CART', 'PAY'],
    lastActiveRelative: '3h ago',
    status: 'active',
  },
  [SEED_IDS.users.govind]: {
    projectKeys: ['AUTH', 'CART'],
    lastActiveRelative: 'yesterday',
    status: 'active',
  },
  [SEED_IDS.users.mohanraj]: {
    projectKeys: ['AUTH', 'OPS'],
    lastActiveRelative: '2d ago',
    status: 'active',
  },
  [SEED_IDS.users.sagar]: {
    projectKeys: ['RET', 'OPS'],
    lastActiveRelative: '1d ago',
    status: 'active',
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function shortName(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];
  if (parts[1].endsWith('.')) return `${parts[0]} ${parts[1]}`;
  return `${parts[0]} ${parts[1][0]}.`;
}

function initialsOf(displayName: string): string {
  return displayName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

type RoleClass = 'admin' | 'lead' | 'engineer' | 'stakeholder';
function roleClassOf(role: string): RoleClass {
  const r = role.toLowerCase();
  if (r === 'admin') return 'admin';
  if (r === 'lead') return 'lead';
  if (r === 'stakeholder') return 'stakeholder';
  return 'engineer';
}

function roleLabelOf(role: string): string {
  const r = role.toLowerCase();
  if (r === 'admin') return 'Admin';
  if (r === 'lead') return 'QA Lead';
  if (r === 'stakeholder') return 'Stakeholder';
  return 'QA Engineer';
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function UsersRolesPage() {
  const router = useRouter();
  const me = useCurrentUser();
  const { members } = useTeamRoster();
  const projects = useProjectList();

  const totalUsers = members.length;
  const pendingCount = PENDING_INVITES.length;
  const slotsTotal = 25;
  const slotsRemaining = slotsTotal - totalUsers - pendingCount;

  useEffect(() => {
    const statusBreakdown = members.reduce<Record<string, number>>((acc, m) => {
      const status = USER_META[m.id]?.status ?? 'active';
      acc[status] = (acc[status] ?? 0) + 1;
      return acc;
    }, {});
    // PATTERN-A: load users list deferred until M1 (T030.5) - real /api/users GET on mount
    console.info('pattern-a:deferred:users-list-load', {
      workspaceId: me.workspaceId,
      totalUsers,
      pendingInvites: pendingCount,
      statusBreakdown,
    });
  }, [me.workspaceId, totalUsers, pendingCount, members]);

  function onInviteOpen() {
    // PATTERN-A: open invite modal deferred until M1 (T030.5) - navigate to /admin/users/invite
    console.info('pattern-a:deferred:users-invite-open', { from: 'F27' });
    router.push('/admin/users/invite');
  }
  function onRoleChange(userId: string, oldRole: string, newRole: string) {
    // PATTERN-A: change user role deferred until M1 (T030.5) - real /api/users/:id PATCH role
    console.info('pattern-a:deferred:users-role-change', { userId, oldRole, newRole });
  }
  function onStatusToggle(userId: string, action: 'deactivate' | 'reactivate') {
    // PATTERN-A: toggle user status deferred until M1 (T030.5) - real /api/users/:id PATCH status
    console.info('pattern-a:deferred:users-status-toggle', { userId, action });
  }
  function onProjectAssign(userId: string, projectKey: string, action: 'add' | 'remove') {
    // PATTERN-A: assign user project deferred until M1 (T030.5) - real /api/users/:id/projects PUT
    console.info('pattern-a:deferred:users-project-assign', { userId, projectKey, action });
  }
  function onInviteResend(invitationId: string, email: string) {
    // PATTERN-A: resend invitation deferred until M1 (T030.5) - real /api/invitations/:id/resend POST
    console.info('pattern-a:deferred:users-invite-resend', { invitationId, email });
  }
  function onInviteRevoke(invitationId: string, email: string) {
    // PATTERN-A: revoke invitation deferred until M1 (T030.5) - real /api/invitations/:id DELETE
    console.info('pattern-a:deferred:users-invite-revoke', { invitationId, email });
  }
  function onFilterChange(kind: string, value: string) {
    // PATTERN-A: change users filter deferred until M1 (T030.5) - client-only filter state, no BE call
    console.info('pattern-a:deferred:users-filter-change', { kind, value });
  }
  function onAuditOpen(eventId: string) {
    // PATTERN-A: open audit detail deferred until M1 (T030.5) - deeplink to /admin/settings#audit-log
    console.info('pattern-a:deferred:users-audit-open', { eventId });
    router.push('/admin/settings#audit-log');
  }

  const roleCounts = useMemo(() => {
    return members.reduce<Record<RoleClass, number>>(
      (acc, m) => {
        const cls = roleClassOf(m.role);
        acc[cls] = (acc[cls] ?? 0) + 1;
        return acc;
      },
      { admin: 0, lead: 0, engineer: 0, stakeholder: 0 },
    );
  }, [members]);

  return (
    <AdminShell active="users-roles">
      <main className="flex flex-1 flex-col gap-7 px-4 py-6 sm:px-6 sm:py-8 lg:gap-8 lg:px-8 xl:px-10">
        <PageHeader totalUsers={totalUsers} pendingCount={pendingCount} />
        <InvitePanel
          slotsRemaining={slotsRemaining}
          slotsTotal={slotsTotal}
          onInvite={onInviteOpen}
        />
        <CurrentTeamSection
          members={members}
          projects={projects}
          onRoleChange={onRoleChange}
          onStatusToggle={onStatusToggle}
          onProjectAssign={onProjectAssign}
          onFilterChange={onFilterChange}
        />
        <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
          <PendingInvitesSection
            rows={PENDING_INVITES}
            onResend={onInviteResend}
            onRevoke={onInviteRevoke}
          />
          <AuditFeedSection events={AUDIT_EVENTS} onOpen={onAuditOpen} />
        </div>
        <RoleMatrixSection counts={roleCounts} />
      </main>
    </AdminShell>
  );
}

// ---------------------------------------------------------------------------
// Page header
// ---------------------------------------------------------------------------

function PageHeader({ totalUsers, pendingCount }: { totalUsers: number; pendingCount: number }) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-[22px] font-bold leading-[28px] tracking-[-0.01em] text-[var(--text-primary)] sm:text-[26px] sm:leading-[34px]">
          Who has access to what, and what changed recently?
        </h1>
        <p className="max-w-[680px] text-[13px] leading-[20px] text-[var(--text-secondary)] sm:text-[14px] sm:leading-[22px]">
          Manage workspace membership, project access, and audit visibility for Iksula Services.
          Admin-only.
        </p>
      </div>
      <div className="flex items-center gap-3 pt-1 font-mono text-[12px] text-[var(--text-tertiary)]">
        <span>
          <span className="font-semibold text-[var(--text-primary)]">{totalUsers}</span> active
        </span>
        <span aria-hidden="true">·</span>
        <span>
          <span className="font-semibold text-[var(--text-primary)]">{pendingCount}</span> pending
        </span>
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Invite panel
// ---------------------------------------------------------------------------

function InvitePanel({
  slotsRemaining,
  slotsTotal,
  onInvite,
}: {
  slotsRemaining: number;
  slotsTotal: number;
  onInvite: () => void;
}) {
  return (
    <section
      aria-labelledby="invite-head"
      className="relative flex flex-col gap-5 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--base)] px-5 py-5 sm:flex-row sm:items-center sm:gap-7 sm:px-6 sm:py-6"
    >
      <span
        aria-hidden="true"
        className="absolute bottom-0 left-0 top-0 w-[3px] opacity-70"
        style={{ background: 'linear-gradient(to bottom, #2DD4BF, #A78BFA)' }}
      />
      <div className="flex flex-1 items-center gap-4 sm:gap-5">
        <span
          aria-hidden="true"
          className="border-[var(--primary)]/30 bg-[var(--primary)]/15 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border text-[var(--primary)]"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M16 11V7a4 4 0 0 0-8 0v4M5 11h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path d="M12 14v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <h2
            id="invite-head"
            className="font-display text-[16px] font-bold leading-[22px] text-[var(--text-primary)] sm:text-[18px] sm:leading-[24px]"
          >
            Add people to Iksula Services
          </h2>
          <p className="text-[12.5px] leading-[18px] text-[var(--text-secondary)] sm:text-[13px] sm:leading-[20px]">
            Invite teammates by email. Pick a role and assign project access in one step.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-5 border-t border-[var(--border-subtle)] pt-4 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
        <StatTile label="Slots remaining" value={`${slotsRemaining}`} sub={`of ${slotsTotal}`} />
        <StatTile label="Expires after" value="7" sub="days" />
      </div>
      <button
        type="button"
        onClick={onInvite}
        className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-md bg-[var(--primary)] px-5 text-[14px] font-semibold text-[var(--primary-ink)] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        Invite teammates
      </button>
    </section>
  );
}

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex min-w-[88px] flex-col gap-1">
      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
        {label}
      </span>
      <span className="font-mono text-[18px] font-semibold leading-[22px] text-[var(--text-primary)] sm:text-[20px] sm:leading-[24px]">
        {value}
        {sub && (
          <span className="ml-1 text-[12px] font-normal text-[var(--text-tertiary)]">{sub}</span>
        )}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Current team section
// ---------------------------------------------------------------------------

interface CurrentTeamSectionProps {
  members: UserPublic[];
  projects: Array<{ id: string; key: string; name: string }>;
  onRoleChange: (userId: string, oldRole: string, newRole: string) => void;
  onStatusToggle: (userId: string, action: 'deactivate' | 'reactivate') => void;
  onProjectAssign: (userId: string, projectKey: string, action: 'add' | 'remove') => void;
  onFilterChange: (kind: string, value: string) => void;
}

function CurrentTeamSection({
  members,
  onRoleChange,
  onStatusToggle,
  onProjectAssign,
  onFilterChange,
}: CurrentTeamSectionProps) {
  return (
    <section className="flex flex-col gap-3">
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-display inline-flex items-center gap-2.5 text-[15px] font-bold text-[var(--text-primary)]">
          Current team
          <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--raised)] px-2 py-0.5 font-mono text-[10px] font-semibold text-[var(--text-tertiary)]">
            {members.length}
          </span>
        </h2>
        <div className="flex items-center gap-2">
          <FilterChip label="Role" value="All" onClick={() => onFilterChange('role', 'all')} />
          <FilterChip
            label="Project"
            value="All"
            onClick={() => onFilterChange('project', 'all')}
          />
          <FilterChip
            label="Status"
            value="Active"
            onClick={() => onFilterChange('status', 'active')}
          />
        </div>
      </header>
      <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--base)]">
        <TeamTableHeader />
        <ul className="flex flex-col">
          {members.map((m) => (
            <TeamRow
              key={m.id}
              member={m}
              onRoleChange={(oldRole, newRole) => onRoleChange(m.id, oldRole, newRole)}
              onStatusToggle={(action) => onStatusToggle(m.id, action)}
              onProjectAssign={(projectKey, action) => onProjectAssign(m.id, projectKey, action)}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}

function TeamTableHeader() {
  return (
    <div className="hidden grid-cols-[minmax(0,1.6fr)_140px_minmax(0,1.4fr)_120px_120px_60px] items-center gap-3 border-b border-[var(--border-subtle)] bg-[var(--raised)] px-5 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)] lg:grid">
      <span>User</span>
      <span>Role</span>
      <span>Projects</span>
      <span>Status</span>
      <span>Last active</span>
      <span className="text-right">Actions</span>
    </div>
  );
}

function TeamRow({
  member,
  onRoleChange,
  onStatusToggle,
  onProjectAssign,
}: {
  member: UserPublic;
  onRoleChange: (oldRole: string, newRole: string) => void;
  onStatusToggle: (action: 'deactivate' | 'reactivate') => void;
  onProjectAssign: (projectKey: string, action: 'add' | 'remove') => void;
}) {
  const meta = USER_META[member.id] ?? {
    projectKeys: [],
    lastActiveRelative: '—',
    status: 'active' as const,
  };
  const cls = roleClassOf(member.role);
  return (
    <li className="grid grid-cols-1 gap-2 border-b border-[var(--border-subtle)] px-4 py-3 last:border-b-0 lg:grid-cols-[minmax(0,1.6fr)_140px_minmax(0,1.4fr)_120px_120px_60px] lg:items-center lg:gap-3 lg:px-5 lg:py-3.5">
      <div className="flex items-center gap-3">
        <Avatar initials={initialsOf(member.displayName)} tone={cls} />
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-[13px] font-medium text-[var(--text-primary)]">
            {member.displayName}
          </span>
          <span className="truncate font-mono text-[11px] text-[var(--text-tertiary)]">
            {member.email}
          </span>
        </div>
      </div>
      <div>
        <RoleChip role={member.role} />
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {meta.projectKeys.slice(0, 3).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => onProjectAssign(k, 'remove')}
            className="inline-flex h-6 items-center rounded border border-[var(--border-subtle)] bg-[var(--overlay)] px-2 text-[11px] font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
          >
            {k}
          </button>
        ))}
        {meta.projectKeys.length > 3 && (
          <span className="font-mono text-[10px] text-[var(--text-tertiary)]">
            +{meta.projectKeys.length - 3}
          </span>
        )}
        {meta.projectKeys.length === 0 && (
          <span className="text-[11px] italic text-[var(--text-tertiary)]">No projects</span>
        )}
      </div>
      <div>
        <StatusChip status={meta.status} />
      </div>
      <div className="font-mono text-[11px] text-[var(--text-tertiary)]">
        {meta.lastActiveRelative}
      </div>
      <div className="flex items-center justify-end gap-1">
        <RowActionButton
          ariaLabel={`Change role for ${member.displayName}`}
          onClick={() => onRoleChange(member.role, member.role)}
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <path
              d="M11 4l3 3-7 7H4v-3l7-7z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        </RowActionButton>
        <RowActionButton
          ariaLabel={`Deactivate ${member.displayName}`}
          onClick={() => onStatusToggle(meta.status === 'active' ? 'deactivate' : 'reactivate')}
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </RowActionButton>
      </div>
    </li>
  );
}

function Avatar({ initials, tone }: { initials: string; tone: RoleClass }) {
  // Whitelisted-only tones: admin → warn (locked source's red avatar swap),
  // lead → secondary, engineer → primary, stakeholder → overlay.
  const cls = {
    admin: 'bg-[var(--warn)] text-[var(--primary-ink)]',
    lead: 'bg-[var(--secondary)] text-[var(--primary-ink)]',
    engineer: 'bg-[var(--primary)] text-[var(--primary-ink)]',
    stakeholder: 'bg-[var(--overlay)] text-[var(--text-primary)]',
  }[tone];
  return (
    <span
      aria-hidden="true"
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${cls}`}
    >
      {initials}
    </span>
  );
}

function RoleChip({ role }: { role: string }) {
  const cls = roleClassOf(role);
  const label = roleLabelOf(role);
  // admin uses --fail (whitelisted token) — locked source's admin red is
  // not on the CLAUDE.md hex whitelist, so we substitute with the
  // whitelisted fail-tone while preserving the visual intent.
  const map: Record<RoleClass, string> = {
    admin: 'border-[var(--fail)]/30 bg-[var(--fail)]/15 text-[var(--fail)]',
    lead: 'border-[var(--secondary)]/30 bg-[var(--secondary)]/15 text-[var(--secondary)]',
    engineer: 'border-[var(--primary)]/30 bg-[var(--primary)]/15 text-[var(--primary)]',
    stakeholder: 'border-[var(--border-subtle)] bg-[var(--overlay)] text-[var(--text-tertiary)]',
  };
  return (
    <span
      className={`inline-flex h-6 w-fit items-center rounded border px-2 font-mono text-[10px] font-semibold uppercase tracking-[0.06em] ${map[cls]}`}
    >
      {label}
    </span>
  );
}

function StatusChip({ status }: { status: 'active' | 'pending' }) {
  if (status === 'pending') {
    return (
      <span className="border-[var(--warn)]/30 bg-[var(--warn)]/15 inline-flex h-[22px] w-fit items-center gap-1.5 rounded-full border px-2 text-[11px] font-medium text-[var(--warn)]">
        <span
          aria-hidden="true"
          className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--warn)]"
        />
        Pending
      </span>
    );
  }
  return (
    <span className="border-[var(--pass)]/30 bg-[var(--pass)]/15 inline-flex h-[22px] w-fit items-center gap-1.5 rounded-full border px-2 text-[11px] font-medium text-[var(--pass)]">
      <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--pass)]" />
      Active
    </span>
  );
}

function RowActionButton({
  ariaLabel,
  onClick,
  children,
}: {
  ariaLabel: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--border-subtle)] text-[var(--text-tertiary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
    >
      {children}
    </button>
  );
}

function FilterChip({
  label,
  value,
  onClick,
}: {
  label: string;
  value: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[var(--border-subtle)] bg-[var(--overlay)] px-3 text-[12px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--raised)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
    >
      <span className="font-medium text-[var(--text-tertiary)]">{label}:</span>
      <span>{value}</span>
      <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Pending invites
// ---------------------------------------------------------------------------

function PendingInvitesSection({
  rows,
  onResend,
  onRevoke,
}: {
  rows: PendingInviteRow[];
  onResend: (id: string, email: string) => void;
  onRevoke: (id: string, email: string) => void;
}) {
  return (
    <section className="flex flex-col gap-3">
      <header className="flex items-center justify-between">
        <h2 className="font-display inline-flex items-center gap-2.5 text-[15px] font-bold text-[var(--text-primary)]">
          Pending invites
          <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--raised)] px-2 py-0.5 font-mono text-[10px] font-semibold text-[var(--text-tertiary)]">
            {rows.length}
          </span>
        </h2>
      </header>
      <div className="flex flex-col rounded-xl border border-[var(--border-subtle)] bg-[var(--base)] p-2">
        {rows.length === 0 ? (
          <p className="px-3 py-4 text-center text-[12px] text-[var(--text-tertiary)]">
            No pending invites.
          </p>
        ) : (
          rows.map((r, idx) => (
            <PendingInviteCard
              key={r.invitationId}
              row={r}
              isFirst={idx === 0}
              onResend={() => onResend(r.invitationId, r.email)}
              onRevoke={() => onRevoke(r.invitationId, r.email)}
            />
          ))
        )}
      </div>
    </section>
  );
}

function PendingInviteCard({
  row,
  isFirst,
  onResend,
  onRevoke,
}: {
  row: PendingInviteRow;
  isFirst: boolean;
  onResend: () => void;
  onRevoke: () => void;
}) {
  const inviter = useTeamMember(row.invitedById);
  const inviterShort = inviter ? shortName(inviter.displayName) : '—';
  return (
    <div
      className={[
        'flex flex-wrap items-center gap-3 rounded-lg px-3 py-3 hover:bg-[var(--raised)]',
        isFirst ? '' : 'border-t border-[var(--border-subtle)]',
      ].join(' ')}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate font-mono text-[12px] font-medium text-[var(--text-primary)]">
          {row.email}
        </span>
        <span className="flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--text-tertiary)]">
          <RoleChip role={row.role} />
          <span aria-hidden="true" className="text-[var(--text-disabled)]">
            ·
          </span>
          <span>{row.projectKeys.join(', ')}</span>
          <span aria-hidden="true" className="text-[var(--text-disabled)]">
            ·
          </span>
          <span>
            invited by {inviterShort} {row.invitedAtRelative}
          </span>
          <span aria-hidden="true" className="text-[var(--text-disabled)]">
            ·
          </span>
          <span>expires in {row.expiresInDays}d</span>
        </span>
      </div>
      <div className="inline-flex items-center gap-1.5">
        <TinyButton onClick={onResend}>Resend</TinyButton>
        <TinyButton onClick={onRevoke} danger>
          Revoke
        </TinyButton>
      </div>
    </div>
  );
}

function TinyButton({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'inline-flex h-7 items-center rounded-md border px-2.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]',
        danger
          ? 'hover:border-[var(--fail)]/30 hover:bg-[var(--fail)]/10 border-[var(--border-subtle)] text-[var(--fail)]'
          : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--raised)] hover:text-[var(--text-primary)]',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Audit feed
// ---------------------------------------------------------------------------

function AuditFeedSection({
  events,
  onOpen,
}: {
  events: AuditEventRow[];
  onOpen: (eventId: string) => void;
}) {
  return (
    <section className="flex flex-col gap-3">
      <header className="flex items-center justify-between">
        <h2 className="font-display inline-flex items-center gap-2.5 text-[15px] font-bold text-[var(--text-primary)]">
          Recent activity
          <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--raised)] px-2 py-0.5 font-mono text-[10px] font-semibold text-[var(--text-tertiary)]">
            {events.length}
          </span>
        </h2>
        <button
          type="button"
          onClick={() => onOpen('all')}
          className="text-[12px] text-[var(--text-tertiary)] transition-colors hover:text-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
        >
          View full audit log →
        </button>
      </header>
      <ol className="flex max-h-[420px] flex-col overflow-y-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--base)] p-2">
        {events.map((e, idx) => (
          <AuditRow
            key={e.eventId}
            event={e}
            isFirst={idx === 0}
            onOpen={() => onOpen(e.eventId)}
          />
        ))}
      </ol>
    </section>
  );
}

function AuditRow({
  event,
  isFirst,
  onOpen,
}: {
  event: AuditEventRow;
  isFirst: boolean;
  onOpen: () => void;
}) {
  const actor = useTeamMember(event.actorId);
  const target = useTeamMember(event.targetId ?? null);
  const actorShort = actor ? shortName(actor.displayName) : '—';
  const targetShort = target ? shortName(target.displayName) : '';

  const dotTone =
    event.kind === 'role_updated'
      ? 'warn'
      : event.kind === 'invite_accepted'
        ? 'pass'
        : event.kind === 'project_assigned' || event.kind === 'invite_sent'
          ? 'primary'
          : 'secondary';
  const dotClass = {
    primary: 'bg-[var(--primary)]',
    secondary: 'bg-[var(--secondary)]',
    pass: 'bg-[var(--pass)]',
    warn: 'bg-[var(--warn)]',
  }[dotTone];

  let primary: React.ReactNode;
  switch (event.kind) {
    case 'invite_sent':
      primary = (
        <>
          <span className="font-semibold text-[var(--text-primary)]">{actorShort}</span>{' '}
          <span className="text-[var(--text-tertiary)]">invited</span>{' '}
          <span className="font-medium text-[var(--primary)]">{targetShort}</span>{' '}
          <span className="text-[var(--text-tertiary)]">as</span>{' '}
          <span className="text-[var(--text-secondary)]">{event.detailA}</span>
        </>
      );
      break;
    case 'invite_accepted':
      primary = (
        <>
          <span className="font-semibold text-[var(--text-primary)]">{actorShort}</span>{' '}
          <span className="text-[var(--text-tertiary)]">accepted invite and set password</span>
        </>
      );
      break;
    case 'role_updated':
      primary = (
        <>
          <span className="font-semibold text-[var(--text-primary)]">{actorShort}</span>{' '}
          <span className="text-[var(--text-tertiary)]">changed</span>{' '}
          <span className="font-medium text-[var(--primary)]">{targetShort}</span>{' '}
          <span className="text-[var(--text-tertiary)]">role —</span>{' '}
          <span className="text-[var(--text-secondary)]">{event.detailA}</span>{' '}
          <span className="text-[var(--text-tertiary)]">→</span>{' '}
          <span className="font-medium text-[var(--secondary)]">{event.detailB}</span>
        </>
      );
      break;
    case 'project_assigned':
      primary = (
        <>
          <span className="font-semibold text-[var(--text-primary)]">{actorShort}</span>{' '}
          <span className="text-[var(--text-tertiary)]">added</span>{' '}
          <span className="font-medium text-[var(--primary)]">{targetShort}</span>{' '}
          <span className="text-[var(--text-tertiary)]">to</span>{' '}
          <span className="text-[var(--text-secondary)]">{event.detailA}</span>
        </>
      );
      break;
    default:
      primary = <span className="text-[var(--text-secondary)]">{event.kind}</span>;
  }

  return (
    <li
      className={[
        'flex gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-[var(--raised)]',
        isFirst ? '' : 'border-t border-[var(--border-subtle)]',
      ].join(' ')}
    >
      <span aria-hidden="true" className="mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full">
        <span className={`block h-full w-full rounded-full ${dotClass}`} />
      </span>
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 flex-col gap-0.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
      >
        <span className="text-[12.5px] leading-[18px] text-[var(--text-secondary)]">{primary}</span>
        <span className="font-mono text-[10.5px] text-[var(--text-tertiary)]">
          {event.ts} · {event.kind}
        </span>
      </button>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Role matrix
// ---------------------------------------------------------------------------

interface RoleMatrixSectionProps {
  counts: Record<RoleClass, number>;
}

function RoleMatrixSection({ counts }: RoleMatrixSectionProps) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-[15px] font-bold text-[var(--text-primary)]">Role matrix</h2>
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--base)] p-4 sm:grid-cols-2 lg:grid-cols-4">
        <RoleMatrixCard
          tone="engineer"
          title="QA Engineer"
          count={counts.engineer}
          perms={[
            'Author & edit test cases',
            'Run tests, log defects',
            'Review AI agent drafts',
            'Cannot manage team or Govern',
          ]}
        />
        <RoleMatrixCard
          tone="lead"
          title="QA Lead"
          count={counts.lead}
          perms={[
            'Everything QA Engineer can',
            'Invite users (not Admin role)',
            'Approve agent policy',
            'Read-only audit + QA Value access',
          ]}
        />
        <RoleMatrixCard
          tone="admin"
          title="Admin"
          count={counts.admin}
          perms={[
            'Everything QA Lead can',
            'Assign any role (incl. Admin)',
            'Full Settings & Audit control',
            'Billing & workspace owner',
          ]}
        />
        <RoleMatrixCard
          tone="stakeholder"
          title="Stakeholder"
          count={counts.stakeholder}
          perms={[
            'Read-only dashboards',
            'View Run Results + Reports',
            'No write access anywhere',
            'Project-scoped visibility',
          ]}
        />
      </div>
    </section>
  );
}

function RoleMatrixCard({
  tone,
  title,
  count,
  perms,
}: {
  tone: RoleClass;
  title: string;
  count: number;
  perms: string[];
}) {
  const borderClass = {
    engineer: 'border-[var(--primary)]/25',
    lead: 'border-[var(--secondary)]/25',
    admin: 'border-[var(--fail)]/25',
    stakeholder: 'border-[var(--border-strong)]',
  }[tone];
  return (
    <article
      className={`flex flex-col gap-2.5 rounded-lg border bg-[var(--canvas)] p-4 ${borderClass}`}
    >
      <header className="flex items-center justify-between">
        <h3 className="font-display text-[13px] font-bold text-[var(--text-primary)]">{title}</h3>
        <span className="font-mono text-[11px] text-[var(--text-tertiary)]">
          {count} {count === 1 ? 'member' : 'members'}
        </span>
      </header>
      <ul className="flex flex-col gap-1 text-[11px] leading-[17px] text-[var(--text-secondary)]">
        {perms.map((p, idx) => (
          <li key={idx} className="flex items-start gap-1.5">
            <span aria-hidden="true" className="text-[var(--text-disabled)]">
              ·
            </span>
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

// F27 Users & Roles — semantic prop types (typeof-derived from canned-data).

import type {
  F27_STATS,
  F27_SYNC,
  F27_CTA_BANNER,
  F27_TEAM_MEMBERS,
  F27_PENDING_INVITES,
  F27_RECENT_ACTIVITY,
  F27_ROLE_MATRIX,
} from '@/components/admin/users-roles-page.canned-data';

export type F27StatsData = typeof F27_STATS;
export type F27SyncData = typeof F27_SYNC;
export type F27CtaBannerData = typeof F27_CTA_BANNER;
export type F27TeamData = typeof F27_TEAM_MEMBERS;
export type F27TeamMember = F27TeamData[number];
export type F27InvitesData = typeof F27_PENDING_INVITES;
export type F27InviteEntry = F27InvitesData[number];
export type F27ActivityData = typeof F27_RECENT_ACTIVITY;
export type F27ActivityEntry = F27ActivityData[number];
export type F27RoleMatrixData = typeof F27_ROLE_MATRIX;
export type F27RoleRow = F27RoleMatrixData[number];

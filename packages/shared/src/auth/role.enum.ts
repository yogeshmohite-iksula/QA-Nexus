// QA Nexus PM1 — RBAC role enum.
//
// Spec: PM1_ERD §3.4 (4-role RBAC) + MS0-T022. Used by:
//   - apps/api: RolesGuard + @Roles decorator
//   - apps/web: client-side route gating + UI conditional rendering
//
// This is the runtime-value version. The Zod-validated string enum lives at
// `packages/shared/src/schemas/enums.ts` (UserRole) — keep them in lockstep.
// Postgres CREATE TYPE is the binding source of truth; both this file and the
// Zod enum mirror it.

export const Role = {
  Admin: 'Admin',
  Lead: 'Lead',
  QAEngineer: 'QAEngineer',
  Stakeholder: 'Stakeholder',
} as const;

export type Role = (typeof Role)[keyof typeof Role];

/** All valid role values, in ascending privilege order. */
export const ALL_ROLES: readonly Role[] = [
  Role.Stakeholder,
  Role.QAEngineer,
  Role.Lead,
  Role.Admin,
] as const;

/** Privilege rank — higher = more privileged. Use for hierarchical guards
 *  ("at least Lead"); strict guards use Set membership instead. */
export const ROLE_RANK: Readonly<Record<Role, number>> = {
  [Role.Stakeholder]: 0,
  [Role.QAEngineer]: 1,
  [Role.Lead]: 2,
  [Role.Admin]: 3,
};

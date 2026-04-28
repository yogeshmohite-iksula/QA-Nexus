// @Roles(...) decorator — declares the minimum-privilege set required to hit
// a controller method. Read by RolesGuard at request time. Strict membership
// (Admin doesn't auto-include Lead etc) — explicit listing is intentional so
// the policy is greppable.
//
// Spec: MS0-T022 + PM1_ERD §3.4.
import { SetMetadata } from '@nestjs/common';
import type { Role } from '@qa-nexus/shared';

export const ROLES_KEY = 'qa-nexus:rbac:roles';

/** Mark a controller method as requiring one of the listed roles. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

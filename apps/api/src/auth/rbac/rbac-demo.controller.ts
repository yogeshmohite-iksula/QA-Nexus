// Tiny demo controller proving RolesGuard works end-to-end. Two endpoints
// declared admin-only and lead-or-admin via @Roles. The e2e spec
// (test/rbac.e2e-spec.ts) hits these with seeded user sessions to verify
// 200 / 403 outcomes.
//
// This is throwaway scaffold code. When real workspace / project /
// user-management endpoints land in M1, they will reuse @Roles + RolesGuard
// directly and this demo file can be deleted (leaving the guard + decorator
// + tests).
//
// Spec: MS0-T022.
import { Controller, Get, UseGuards } from '@nestjs/common';
import { Role } from '@qa-nexus/shared';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';

@Controller('rbac-demo')
@UseGuards(RolesGuard)
export class RbacDemoController {
  @Get('admin-only')
  @Roles(Role.Admin)
  adminOnly() {
    return { ok: true, message: 'you are Admin' };
  }

  @Get('lead-or-admin')
  @Roles(Role.Admin, Role.Lead)
  leadOrAdmin() {
    return { ok: true, message: 'you are Admin or Lead' };
  }

  @Get('any-authenticated')
  // No @Roles → any authenticated session passes (guard still checks session).
  anyAuthed() {
    return { ok: true, message: 'any authenticated user' };
  }
}

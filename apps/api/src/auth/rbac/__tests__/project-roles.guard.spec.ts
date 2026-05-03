// Stub the auth.service module so jest doesn't try to load better-auth
// (ESM-only package). The guard receives its AuthService dep via Nest DI;
// we inject a hand-rolled stub via the constructor in tests anyway.
jest.mock('../../auth.service', () => ({ AuthService: class {} }));

// Unit tests for ProjectScopedRolesGuard — M1 Users & Roles preview.
//
// Spec: PM1_ERD §3.4 (per-project role overrides via TB-004).
//
// Strategy: stub Reflector + AuthService + AuditService + PrismaService.
// Build a minimal ExecutionContext that returns a fake Express request
// with route params + a session cookie. Tests cover:
//   1. no @ProjectScopedRoles() → allow
//   2. no session → 401
//   3. project not in route → fall back to workspace role
//   4. project in route + override row → effective = override
//   5. project in route + NO override → effective = workspace role
//   6. cross-workspace project ID → fall back (project not found)
//   7. denial path writes 'rbac_project_denied' audit + throws 403

import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ProjectScopedRolesGuard } from '../project-roles.guard';

function makeCtx({
  params = {},
  headers = { cookie: 'better-auth.session_token=valid' },
}: {
  /** Note: required roles are passed via Reflector mock, not the request. */
  params?: Record<string, string>;
  headers?: Record<string, string>;
}): ExecutionContext {
  const req = {
    params,
    headers,
    path: '/api/projects/RET/runs/x',
    method: 'POST',
  };
  return {
    getHandler: () => () => {},
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => req }) as any,
  } as unknown as ExecutionContext;
}

function makeReflector(required?: string[]): Reflector {
  return {
    getAllAndOverride: jest.fn().mockReturnValue(required),
  } as any;
}

const ADMIN_SESSION = {
  appUser: {
    id: 'user-admin',
    email: 'yogesh.mohite@iksula.com',
    role: 'Admin',
    workspaceId: 'ws-1',
    displayName: 'Yogesh',
    organizationalLabel: null,
  },
  authUser: { id: 'auth-1', email: 'yogesh.mohite@iksula.com', name: 'Yogesh' },
  expiresAt: new Date(Date.now() + 60_000).toISOString(),
};
const QA_ENG_SESSION = {
  ...ADMIN_SESSION,
  appUser: { ...ADMIN_SESSION.appUser, id: 'user-qa', role: 'QAEngineer' },
};

describe('ProjectScopedRolesGuard', () => {
  let auth: { resolveSession: jest.Mock };
  let audit: { writeNonBlocking: jest.Mock };
  let prisma: {
    project: { findFirst: jest.Mock; findUnique: jest.Mock };
    projectMember: { findUnique: jest.Mock };
  };

  beforeEach(() => {
    auth = { resolveSession: jest.fn() };
    audit = { writeNonBlocking: jest.fn() };
    prisma = {
      project: { findFirst: jest.fn(), findUnique: jest.fn() },
      projectMember: { findUnique: jest.fn() },
    };
  });

  function makeGuard(required?: string[]): ProjectScopedRolesGuard {
    return new ProjectScopedRolesGuard(
      makeReflector(required),
      auth as any,
      audit as any,
      prisma as any,
    );
  }

  it('no required roles → allow (decorator absent or empty)', async () => {
    auth.resolveSession.mockResolvedValueOnce(ADMIN_SESSION);
    const g = makeGuard(undefined);
    const ctx = makeCtx({});
    await expect(g.canActivate(ctx)).resolves.toBe(true);
  });

  it('no session → 401', async () => {
    auth.resolveSession.mockResolvedValueOnce(null);
    const g = makeGuard(['Admin']);
    const ctx = makeCtx({});
    await expect(g.canActivate(ctx)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('no project in route → fall back to workspace role (Admin allowed)', async () => {
    auth.resolveSession.mockResolvedValueOnce(ADMIN_SESSION);
    const g = makeGuard(['Admin']);
    const ctx = makeCtx({ params: {} });
    await expect(g.canActivate(ctx)).resolves.toBe(true);
    // No DB lookup needed
    expect(prisma.project.findUnique).not.toHaveBeenCalled();
  });

  it('project in route + Admin via workspace role → allow', async () => {
    auth.resolveSession.mockResolvedValueOnce(ADMIN_SESSION);
    prisma.project.findUnique.mockResolvedValueOnce({
      id: 'proj-1',
      key: 'RET',
    });
    prisma.projectMember.findUnique.mockResolvedValueOnce(null); // no override
    const g = makeGuard(['Admin', 'Lead']);
    const ctx = makeCtx({ params: { slug: 'RET' } });
    await expect(g.canActivate(ctx)).resolves.toBe(true);
  });

  it('project in route + override Lead beats workspace QAEngineer → Lead allowed', async () => {
    auth.resolveSession.mockResolvedValueOnce(QA_ENG_SESSION);
    prisma.project.findUnique.mockResolvedValueOnce({
      id: 'proj-1',
      key: 'RET',
    });
    prisma.projectMember.findUnique.mockResolvedValueOnce({
      roleOverride: 'Lead',
    });
    const g = makeGuard(['Lead']);
    const ctx = makeCtx({ params: { slug: 'RET' } });
    await expect(g.canActivate(ctx)).resolves.toBe(true);
  });

  it('project in route + no override + workspace QAEngineer asked for Lead → 403 + audit', async () => {
    auth.resolveSession.mockResolvedValueOnce(QA_ENG_SESSION);
    prisma.project.findUnique.mockResolvedValueOnce({
      id: 'proj-1',
      key: 'RET',
    });
    prisma.projectMember.findUnique.mockResolvedValueOnce(null);
    const g = makeGuard(['Lead']);
    const ctx = makeCtx({ params: { slug: 'RET' } });
    await expect(g.canActivate(ctx)).rejects.toBeInstanceOf(ForbiddenException);
    expect(audit.writeNonBlocking).toHaveBeenCalledTimes(1);
    const a = audit.writeNonBlocking.mock.calls[0][0];
    expect(a.action).toBe('rbac_project_denied');
    expect(a.entityType).toBe('rbac');
    expect(a.payload.required_roles).toEqual(['Lead']);
    expect(a.payload.effective_role).toBe('QAEngineer');
    expect(a.payload.workspace_role).toBe('QAEngineer');
    expect(a.payload.override_role).toBeNull();
    expect(a.payload.project_key).toBe('RET');
  });

  it('cross-workspace projectId → falls back to workspace role (project not found)', async () => {
    auth.resolveSession.mockResolvedValueOnce(QA_ENG_SESSION);
    prisma.project.findFirst.mockResolvedValueOnce(null); // not in our workspace
    const g = makeGuard(['QAEngineer']);
    // Use projectId path; cross-workspace project misses → workspace role
    const ctx = makeCtx({
      params: { projectId: 'cross-ws-uuid' },
    });
    await expect(g.canActivate(ctx)).resolves.toBe(true); // QAEng workspace-role matches
    expect(prisma.projectMember.findUnique).not.toHaveBeenCalled();
  });

  it('override "Stakeholder" demotes Admin in a single project → 403 (least-privilege wins)', async () => {
    // Real-world case: temporarily restrict an Admin to read-only on a
    // sensitive project (e.g., audit-frozen project under investigation).
    auth.resolveSession.mockResolvedValueOnce(ADMIN_SESSION);
    prisma.project.findUnique.mockResolvedValueOnce({
      id: 'proj-1',
      key: 'AUDIT',
    });
    prisma.projectMember.findUnique.mockResolvedValueOnce({
      roleOverride: 'Stakeholder',
    });
    const g = makeGuard(['Admin', 'Lead']);
    const ctx = makeCtx({ params: { slug: 'AUDIT' } });
    await expect(g.canActivate(ctx)).rejects.toBeInstanceOf(ForbiddenException);
    const a = audit.writeNonBlocking.mock.calls[0][0];
    expect(a.payload.effective_role).toBe('Stakeholder');
    expect(a.payload.workspace_role).toBe('Admin');
    expect(a.payload.override_role).toBe('Stakeholder');
  });
});

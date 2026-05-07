// QA Nexus PM1 — RequirementsController skeleton spec.
//
// Spec: M3 TASK BE-03 (Day-12). Coverage targets (6 minimum):
//   1. POST → 501
//   2. GET list → 501
//   3. GET detail → 501
//   4. PATCH → 501
//   5. DELETE → 501
//   6. Zod 400 — invalid CreateRequirementInput rejected before 501
//   7. Zod 400 — pageSize > 100 rejected before 501
//   8. RBAC — write endpoints @Roles include the 3 write roles
//   9. RBAC — read endpoints @Roles include all 4 roles incl. Stakeholder

// Stub the auth.service module so jest doesn't try to load better-auth
// (ESM-only — would otherwise SyntaxError on `export`).
jest.mock('../../auth/auth.service', () => ({ AuthService: class {} }));

import 'reflect-metadata';
import { NotImplementedException } from '@nestjs/common';
import { ZodError } from 'zod';
import {
  RequirementsProjectScopedController,
  RequirementsReqScopedController,
} from '../requirements.controller';
import {
  RequirementsService,
  type ActorContext,
} from '../requirements.service';
import { Role } from '@qa-nexus/shared';

const FAKE_REQ = {
  headers: { 'x-test-actor': 'yogesh' },
} as unknown as Parameters<RequirementsProjectScopedController['create']>[2];

const FAKE_ACTOR: ActorContext = {
  workspaceId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  actorId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  actorEmail: 'yogesh.mohite@iksula.com',
  role: 'Admin',
};

function makeProjectController() {
  const service = new RequirementsService();
  const auth = {
    resolveSession: jest.fn().mockResolvedValue({
      appUser: {
        workspaceId: FAKE_ACTOR.workspaceId,
        id: FAKE_ACTOR.actorId,
        email: FAKE_ACTOR.actorEmail,
        role: FAKE_ACTOR.role,
      },
    }),
  };

  const ctrl = new RequirementsProjectScopedController(service, auth as any);
  return { ctrl, service };
}

function makeReqController() {
  const service = new RequirementsService();
  const auth = {
    resolveSession: jest.fn().mockResolvedValue({
      appUser: {
        workspaceId: FAKE_ACTOR.workspaceId,
        id: FAKE_ACTOR.actorId,
        email: FAKE_ACTOR.actorEmail,
        role: FAKE_ACTOR.role,
      },
    }),
  };

  const ctrl = new RequirementsReqScopedController(service, auth as any);
  return { ctrl, service };
}

const VALID_CREATE_BODY = {
  key: 'REQ-RET-100',
  title: 'Skeleton smoke requirement',
  description: 'Body of the requirement.',
  priority: 'P1',
};

describe('[@M3-BE-03] Requirements skeleton — 501 surface + RBAC + Zod', () => {
  describe('Endpoints — all 5 throw 501 NOT IMPLEMENTED', () => {
    it('POST /api/projects/:projectId/requirements → 501', async () => {
      const { ctrl } = makeProjectController();
      await expect(
        ctrl.create('proj-xyz', VALID_CREATE_BODY, FAKE_REQ),
      ).rejects.toBeInstanceOf(NotImplementedException);
    });

    it('GET /api/projects/:projectId/requirements → 501', async () => {
      const { ctrl } = makeProjectController();
      await expect(
        ctrl.list('proj-xyz', { page: 1, pageSize: 20 }, FAKE_REQ),
      ).rejects.toBeInstanceOf(NotImplementedException);
    });

    it('GET /api/requirements/:reqId → 501', async () => {
      const { ctrl } = makeReqController();
      await expect(ctrl.detail('req-xyz', FAKE_REQ)).rejects.toBeInstanceOf(
        NotImplementedException,
      );
    });

    it('PATCH /api/requirements/:reqId → 501', async () => {
      const { ctrl } = makeReqController();
      await expect(
        ctrl.update('req-xyz', { title: 'Renamed' }, FAKE_REQ),
      ).rejects.toBeInstanceOf(NotImplementedException);
    });

    it('DELETE /api/requirements/:reqId → 501', async () => {
      const { ctrl } = makeReqController();
      await expect(ctrl.remove('req-xyz', FAKE_REQ)).rejects.toBeInstanceOf(
        NotImplementedException,
      );
    });
  });

  describe('Zod validation — 400s surface BEFORE the 501', () => {
    it('POST rejects invalid CreateRequirementInput', async () => {
      const { ctrl } = makeProjectController();
      // Missing required `description` + `priority`.
      await expect(
        ctrl.create('proj-xyz', { key: 'REQ', title: 'no desc' }, FAKE_REQ),
      ).rejects.toBeInstanceOf(ZodError);
    });

    it('LIST rejects pageSize > 100', async () => {
      const { ctrl } = makeProjectController();
      await expect(
        ctrl.list('proj-xyz', { page: 1, pageSize: 999 }, FAKE_REQ),
      ).rejects.toBeInstanceOf(ZodError);
    });

    it('PATCH rejects empty title', async () => {
      const { ctrl } = makeReqController();
      await expect(
        ctrl.update('req-xyz', { title: '' }, FAKE_REQ),
      ).rejects.toBeInstanceOf(ZodError);
    });
  });

  describe('RBAC — @Roles metadata matches the M3 v2 plan §RBAC matrix', () => {
    const allFour = [Role.Admin, Role.Lead, Role.QAEngineer, Role.Stakeholder];
    const writeOnly = [Role.Admin, Role.Lead, Role.QAEngineer];

    /// `qa-nexus:rbac:roles` = ROLES_KEY constant from
    /// auth/rbac/roles.decorator.ts.
    function rolesOn(target: object, method: string): unknown {
      return Reflect.getMetadata(
        'qa-nexus:rbac:roles',
        (target as any)[method],
      );
    }

    it('POST /api/projects/:projectId/requirements — 3 write roles', () => {
      expect(
        rolesOn(RequirementsProjectScopedController.prototype, 'create'),
      ).toEqual(writeOnly);
    });

    it('GET /api/projects/:projectId/requirements — all 4 roles', () => {
      expect(
        rolesOn(RequirementsProjectScopedController.prototype, 'list'),
      ).toEqual(allFour);
    });

    it('GET /api/requirements/:reqId — all 4 roles', () => {
      expect(
        rolesOn(RequirementsReqScopedController.prototype, 'detail'),
      ).toEqual(allFour);
    });

    it('PATCH /api/requirements/:reqId — 3 write roles', () => {
      expect(
        rolesOn(RequirementsReqScopedController.prototype, 'update'),
      ).toEqual(writeOnly);
    });

    it('DELETE /api/requirements/:reqId — 3 write roles', () => {
      expect(
        rolesOn(RequirementsReqScopedController.prototype, 'remove'),
      ).toEqual(writeOnly);
    });
  });
});

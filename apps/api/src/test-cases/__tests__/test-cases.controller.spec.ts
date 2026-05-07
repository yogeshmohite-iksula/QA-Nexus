// QA Nexus PM1 — TestCasesController skeleton spec.
//
// Spec: M3 TASK BE-02 (Day-12). Coverage targets (8 minimum):
//   1. POST → 501 (write path stub)
//   2. GET list → 501 (read path stub)
//   3. GET detail → 501 (read path stub)
//   4. PATCH → 501 (write path stub)
//   5. DELETE → 501 (write path stub)
//   6. POST Zod 400 — invalid CreateTestCaseInput rejected before 501
//   7. PATCH Zod 400 — invalid UpdateTestCaseInput rejected before 501
//   8. List Zod 400 — pageSize > 100 rejected before 501
//   9. RBAC — POST/PATCH/DELETE @Roles include the 3 write roles
//   10. RBAC — GET endpoints @Roles include all 4 roles incl. Stakeholder
//
// RBAC introspection uses Reflect.getMetadata('roles', ...) the same way
// every prior controller spec in the repo does (see e.g. KbDocuments
// controller spec, RBAC sweep).

// Stub the auth.service module so jest doesn't try to load better-auth
// (ESM-only — would otherwise SyntaxError on `export`).
jest.mock('../../auth/auth.service', () => ({ AuthService: class {} }));

import 'reflect-metadata';
import { NotImplementedException } from '@nestjs/common';
import { ZodError } from 'zod';
import {
  TestCasesProjectScopedController,
  TestCasesCaseScopedController,
} from '../test-cases.controller';
import { TestCasesService, type ActorContext } from '../test-cases.service';
import { Role } from '@qa-nexus/shared';

const FAKE_REQ = {
  headers: { 'x-test-actor': 'yogesh' },
} as unknown as Parameters<TestCasesProjectScopedController['create']>[2];

const FAKE_ACTOR: ActorContext = {
  workspaceId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  actorId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  actorEmail: 'yogesh.mohite@iksula.com',
  role: 'Admin',
};

function makeProjectController() {
  const service = new TestCasesService();
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

  const ctrl = new TestCasesProjectScopedController(service, auth as any);
  return { ctrl, service, auth };
}

function makeCaseController() {
  const service = new TestCasesService();
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

  const ctrl = new TestCasesCaseScopedController(service, auth as any);
  return { ctrl, service, auth };
}

const VALID_CREATE_BODY = {
  key: 'TC-RET-100',
  title: 'Skeleton smoke test',
  expectedResult: 'OK',
  priority: 'P1',
};

describe('[@M3-BE-02] TestCases skeleton — 501 surface + RBAC + Zod', () => {
  describe('TestCasesProjectScopedController — POST + LIST', () => {
    it('POST /api/projects/:projectId/test-cases throws 501 NOT IMPLEMENTED', async () => {
      const { ctrl } = makeProjectController();
      await expect(
        ctrl.create('proj-xyz', VALID_CREATE_BODY, FAKE_REQ),
      ).rejects.toBeInstanceOf(NotImplementedException);
    });

    it('GET /api/projects/:projectId/test-cases throws 501 NOT IMPLEMENTED', async () => {
      const { ctrl } = makeProjectController();
      await expect(
        ctrl.list('proj-xyz', { page: 1, pageSize: 20 }, FAKE_REQ),
      ).rejects.toBeInstanceOf(NotImplementedException);
    });

    it('POST rejects invalid CreateTestCaseInput with Zod 400 BEFORE the 501', async () => {
      const { ctrl } = makeProjectController();
      // Missing required `expectedResult` + `priority`.
      await expect(
        ctrl.create('proj-xyz', { key: 'TC', title: 'no priority' }, FAKE_REQ),
      ).rejects.toBeInstanceOf(ZodError);
    });

    it('LIST rejects pageSize > 100 with Zod 400 BEFORE the 501', async () => {
      const { ctrl } = makeProjectController();
      await expect(
        ctrl.list('proj-xyz', { page: 1, pageSize: 999 }, FAKE_REQ),
      ).rejects.toBeInstanceOf(ZodError);
    });

    it('POST gherkin format with empty body rejected by refine', async () => {
      const { ctrl } = makeProjectController();
      await expect(
        ctrl.create(
          'proj-xyz',
          { ...VALID_CREATE_BODY, format: 'gherkin', gherkin: '' },
          FAKE_REQ,
        ),
      ).rejects.toBeInstanceOf(ZodError);
    });
  });

  describe('TestCasesCaseScopedController — GET / PATCH / DELETE', () => {
    it('GET /api/test-cases/:caseId throws 501 NOT IMPLEMENTED', async () => {
      const { ctrl } = makeCaseController();
      await expect(ctrl.detail('case-xyz', FAKE_REQ)).rejects.toBeInstanceOf(
        NotImplementedException,
      );
    });

    it('PATCH /api/test-cases/:caseId throws 501 NOT IMPLEMENTED', async () => {
      const { ctrl } = makeCaseController();
      await expect(
        ctrl.update('case-xyz', { title: 'Renamed' }, FAKE_REQ),
      ).rejects.toBeInstanceOf(NotImplementedException);
    });

    it('DELETE /api/test-cases/:caseId throws 501 NOT IMPLEMENTED', async () => {
      const { ctrl } = makeCaseController();
      await expect(ctrl.remove('case-xyz', FAKE_REQ)).rejects.toBeInstanceOf(
        NotImplementedException,
      );
    });

    it('PATCH rejects invalid UpdateTestCaseInput with Zod 400 BEFORE the 501', async () => {
      const { ctrl } = makeCaseController();
      await expect(
        ctrl.update(
          'case-xyz',
          { title: '', priority: 'P9' as unknown as 'P0' },
          FAKE_REQ,
        ),
      ).rejects.toBeInstanceOf(ZodError);
    });
  });

  describe('RBAC — @Roles metadata matches the M3 v2 plan §RBAC matrix', () => {
    /// Stakeholder = read-only across the entire surface. Mirrors
    /// KbDocumentsController's list/detail-vs-delete split.
    const allFour = [Role.Admin, Role.Lead, Role.QAEngineer, Role.Stakeholder];
    const writeOnly = [Role.Admin, Role.Lead, Role.QAEngineer];

    /// `qa-nexus:rbac:roles` is the metadata key set by the `@Roles(...)`
    /// decorator (see auth/rbac/roles.decorator.ts → ROLES_KEY).
    function rolesOn(target: object, method: string): unknown {
      return Reflect.getMetadata(
        'qa-nexus:rbac:roles',
        (target as any)[method],
      );
    }

    it('POST /api/projects/:projectId/test-cases — 3 write roles', () => {
      expect(
        rolesOn(TestCasesProjectScopedController.prototype, 'create'),
      ).toEqual(writeOnly);
    });

    it('GET /api/projects/:projectId/test-cases — all 4 roles', () => {
      expect(
        rolesOn(TestCasesProjectScopedController.prototype, 'list'),
      ).toEqual(allFour);
    });

    it('GET /api/test-cases/:caseId — all 4 roles', () => {
      expect(
        rolesOn(TestCasesCaseScopedController.prototype, 'detail'),
      ).toEqual(allFour);
    });

    it('PATCH /api/test-cases/:caseId — 3 write roles', () => {
      expect(
        rolesOn(TestCasesCaseScopedController.prototype, 'update'),
      ).toEqual(writeOnly);
    });

    it('DELETE /api/test-cases/:caseId — 3 write roles', () => {
      expect(
        rolesOn(TestCasesCaseScopedController.prototype, 'remove'),
      ).toEqual(writeOnly);
    });
  });
});

// QA Nexus PM1 — Day-24 P0 ADR-021 — ReportsController spec.
//
// Tests:
//   - Zod-validation rejects malformed body (400 InvalidReportRequest)
//   - Happy path returns { ok: true, report: <envelope> }
//   - Template creation requires actor (workspace + actorId injected from session)
//   - Template listing returns owner+shared rows
//
// Auth resolution is mocked at AuthService MODULE boundary so jest never
// imports better-auth's ESM entry (Day-21/22 pattern: jest CJS transformer
// chokes on `import { betterAuth } from 'better-auth'`).

jest.mock('../../auth/auth.service', () => ({
  AuthService: class FakeAuthService {
    resolveSession = jest.fn();
  },
}));

import { Test } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { ReportsController } from '../reports.controller';
import { ReportsService } from '../reports.service';
import { AuthService } from '../../auth/auth.service';
import { AuditService } from '../../audit/audit.service';

// Valid v4 UUIDs (hex-only segments). Don't be cute with embedded names —
// Zod's z.string().uuid() rejects anything outside [0-9a-fA-F].
const WS = '11111111-1111-4111-8111-111111111111';
const PROJ = '22222222-2222-4222-8222-222222222222';
const ACTOR = '33333333-3333-4333-8333-333333333333';

describe('ReportsController', () => {
  let ctrl: ReportsController;
  let reports: {
    run: jest.Mock;
    createTemplate: jest.Mock;
    listTemplates: jest.Mock;
  };
  let auth: { resolveSession: jest.Mock };

  beforeEach(async () => {
    reports = {
      run: jest.fn().mockResolvedValue({
        kind: 'defect_age',
        projectId: PROJ,
        timeRange: { kind: '7d' },
        aggregatedAt: '2026-05-21T11:00:00.000Z',
        source: 'computed',
        isStale: false,
        data: { buckets: [], medianAgeDays: 0 },
      }),
      createTemplate: jest.fn().mockResolvedValue({
        id: 'tpl-1',
        workspaceId: WS,
        projectId: PROJ,
        ownerUserId: ACTOR,
        name: 't',
        config: {
          kind: 'defect_age',
          projectId: PROJ,
          timeRange: { kind: '7d' },
        },
        isShared: false,
        createdAt: '2026-05-21T00:00:00.000Z',
        updatedAt: '2026-05-21T00:00:00.000Z',
      }),
      listTemplates: jest.fn().mockResolvedValue([]),
    };
    auth = {
      resolveSession: jest.fn().mockResolvedValue({
        appUser: {
          workspaceId: WS,
          id: ACTOR,
          email: 'x@y',
          role: 'QAEngineer',
        },
      }),
    };
    const moduleRef = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        { provide: ReportsService, useValue: reports },
        { provide: AuthService, useValue: auth },
        // RolesGuard depends on AuditService (rbac_denied audit row).
        // Tests inject all happy-path sessions so the guard accepts; the
        // mock just needs the writeNonBlocking signature.
        {
          provide: AuditService,
          useValue: { writeNonBlocking: jest.fn(), write: jest.fn() },
        },
      ],
    }).compile();
    ctrl = moduleRef.get(ReportsController);
  });

  describe('POST /api/reports — runReport', () => {
    it('happy path returns ok + report envelope', async () => {
      const res = await ctrl.runReport(
        {
          kind: 'defect_age',
          projectId: PROJ,
          timeRange: { kind: '7d' },
        },
        { headers: {} } as never,
      );
      expect(res.ok).toBe(true);
      expect(res.report.kind).toBe('defect_age');
      expect(reports.run).toHaveBeenCalledWith(
        WS,
        expect.objectContaining({ kind: 'defect_age' }),
        ACTOR,
      );
    });

    it('throws 400 HttpException on missing kind', async () => {
      await expect(
        ctrl.runReport({ projectId: PROJ }, { headers: {} } as never),
      ).rejects.toThrow(HttpException);
    });

    it('throws 400 HttpException on bad timeRange discriminator', async () => {
      await expect(
        ctrl.runReport(
          {
            kind: 'defect_age',
            projectId: PROJ,
            timeRange: { kind: 'invalid_window' },
          },
          { headers: {} } as never,
        ),
      ).rejects.toThrow(HttpException);
    });

    it('throws 400 HttpException on custom range with end < start', async () => {
      await expect(
        ctrl.runReport(
          {
            kind: 'defect_age',
            projectId: PROJ,
            timeRange: {
              kind: 'custom',
              start: 'not-an-iso-date',
              end: '2026-05-01T00:00:00Z',
            },
          },
          { headers: {} } as never,
        ),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('POST /api/reports/templates — createTemplate', () => {
    it('persists + returns template', async () => {
      const res = await ctrl.createTemplate(
        {
          projectId: PROJ,
          name: 'My template',
          config: {
            kind: 'defect_age',
            projectId: PROJ,
            timeRange: { kind: '7d' },
          },
          isShared: false,
        },
        { headers: {} } as never,
      );
      expect(res.ok).toBe(true);
      expect(reports.createTemplate).toHaveBeenCalledWith(
        WS,
        ACTOR,
        expect.objectContaining({ name: 'My template' }),
      );
    });

    it('rejects empty name with 400', async () => {
      await expect(
        ctrl.createTemplate(
          {
            projectId: PROJ,
            name: '',
            config: {
              kind: 'defect_age',
              projectId: PROJ,
              timeRange: { kind: '7d' },
            },
          },
          { headers: {} } as never,
        ),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('GET /api/projects/:projectId/reports/templates — listTemplates', () => {
    it('returns owner + shared', async () => {
      const res = await ctrl.listTemplates(PROJ, { headers: {} } as never);
      expect(res.ok).toBe(true);
      expect(res.templates).toEqual([]);
      expect(reports.listTemplates).toHaveBeenCalledWith(WS, PROJ, ACTOR);
    });
  });
});

// QA Nexus PM1 — Day-24 P0 ADR-021 — ReportsService spec.
//
// Coverage:
//   - SWR cache layer (miss → compute, hit → cached, stale → serve + refresh)
//   - 6 per-kind builders (defensive empty-data return shapes)
//   - Audit writes per ADR-021 §3 (synchronous, in-handler)
//   - UPSERT idempotency on (project, kind, time_range_key)
//   - invalidate() flips is_stale + clears in-process cache

import { Test } from '@nestjs/testing';
import { ReportsService } from '../reports.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CACHE_TTL_MS } from '../cache-ttl';

const WS = '00000000-0000-0000-0000-00000000ws01';
const PROJ = '00000000-0000-0000-0000-0000000proj1';
const ACTOR = '00000000-0000-0000-0000-0000000actor';

function makePrismaMock() {
  return {
    reportAggregate: {
      findUnique: jest.fn(),
      upsert: jest.fn().mockResolvedValue({ id: 'agg-1' }),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    reportTemplate: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    $queryRaw: jest.fn().mockResolvedValue([]),
  };
}

describe('ReportsService', () => {
  let svc: ReportsService;
  let prisma: ReturnType<typeof makePrismaMock>;
  let audit: { write: jest.Mock };

  beforeEach(async () => {
    prisma = makePrismaMock();
    audit = {
      write: jest.fn().mockResolvedValue({ id: 'aud-1', thisHash: 'h' }),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();
    svc = moduleRef.get(ReportsService);
  });

  describe('run() — SWR cache flow', () => {
    it('cache MISS + persisted MISS → computes + UPSERTs + audits', async () => {
      prisma.reportAggregate.findUnique.mockResolvedValue(null);
      const res = await svc.run(
        WS,
        { kind: 'defect_age', projectId: PROJ, timeRange: { kind: '30d' } },
        ACTOR,
      );
      expect(res.source).toBe('computed');
      expect(prisma.reportAggregate.upsert).toHaveBeenCalledTimes(1);
      expect(audit.write).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'report.computed' }),
      );
    });

    it('cache HIT (fresh) → returns cached + audits cache_hit + no DB compute', async () => {
      prisma.reportAggregate.findUnique.mockResolvedValue(null);
      await svc.run(
        WS,
        { kind: 'defect_age', projectId: PROJ, timeRange: { kind: '7d' } },
        ACTOR,
      );
      jest.clearAllMocks();
      prisma.reportAggregate.findUnique.mockResolvedValue(null);
      const res = await svc.run(
        WS,
        { kind: 'defect_age', projectId: PROJ, timeRange: { kind: '7d' } },
        ACTOR,
      );
      expect(res.source).toBe('cache_fresh');
      expect(prisma.reportAggregate.upsert).not.toHaveBeenCalled();
      expect(audit.write).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'report.cache_hit' }),
      );
    });

    it('persisted layer HIT (no in-memory cache) → returns precomputed envelope', async () => {
      prisma.reportAggregate.findUnique.mockResolvedValue({
        id: 'agg-existing',
        aggregatedAt: new Date('2026-05-21T11:00:00Z'),
        data: { totalCases: 10, executed: 8, passRate: 0.75, gaps: [] },
        timeRange: { kind: '7d' },
        isStale: false,
      });
      const res = await svc.run(
        WS,
        { kind: 'test_coverage', projectId: PROJ, timeRange: { kind: '7d' } },
        ACTOR,
      );
      expect(res.source).toBe('precomputed');
      expect(prisma.reportAggregate.upsert).not.toHaveBeenCalled();
      expect(audit.write).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'report.persisted_hit' }),
      );
    });

    it('SWR stale hit → serves stale + isStale=true + audits cache_stale_swr', async () => {
      // First call seeds cache.
      prisma.reportAggregate.findUnique.mockResolvedValue(null);
      await svc.run(
        WS,
        { kind: 'agent_cost', projectId: PROJ, timeRange: { kind: '90d' } },
        ACTOR,
      );
      // Fast-forward computedAt by reaching into the private cache via any-cast.
      const cache = (
        svc as unknown as { cache: Map<string, { computedAt: number }> }
      ).cache;
      for (const [k, v] of cache) {
        cache.set(k, {
          ...v,
          computedAt: Date.now() - CACHE_TTL_MS.agent_cost - 1,
        });
      }
      jest.clearAllMocks();
      prisma.reportAggregate.findUnique.mockResolvedValue(null);
      const res = await svc.run(
        WS,
        { kind: 'agent_cost', projectId: PROJ, timeRange: { kind: '90d' } },
        ACTOR,
      );
      expect(res.source).toBe('cache_stale_swr');
      expect(res.isStale).toBe(true);
      expect(audit.write).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'report.cache_stale_swr' }),
      );
    });
  });

  describe('builders — defensive empty-data shape', () => {
    it('cycle_pass_rate empty → series=[] kpi={0,0}', async () => {
      prisma.reportAggregate.findUnique.mockResolvedValue(null);
      prisma.$queryRaw.mockResolvedValue([]);
      const res = await svc.run(
        WS,
        { kind: 'cycle_pass_rate', projectId: PROJ, timeRange: { kind: '7d' } },
        ACTOR,
      );
      expect(res.data).toEqual({ series: [], kpi: { current: 0, avg30d: 0 } });
    });

    it('defect_age empty → buckets=[] medianAgeDays=0', async () => {
      prisma.reportAggregate.findUnique.mockResolvedValue(null);
      prisma.$queryRaw
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ median: null }]);
      const res = await svc.run(
        WS,
        { kind: 'defect_age', projectId: PROJ, timeRange: { kind: '7d' } },
        ACTOR,
      );
      expect(res.data).toEqual({ buckets: [], medianAgeDays: 0 });
    });

    it('sprint_progress no current sprint → sprintId=null + zeros', async () => {
      prisma.reportAggregate.findUnique.mockResolvedValue(null);
      prisma.$queryRaw.mockResolvedValue([
        { sprint_id: null, done: 0n, total: 0n },
      ]);
      const res = await svc.run(
        WS,
        {
          kind: 'sprint_progress',
          projectId: PROJ,
          timeRange: { kind: 'sprint' },
        },
        ACTOR,
      );
      expect(res.data).toEqual({
        sprintId: null,
        pointsCompleted: 0,
        pointsRemaining: 0,
        velocity: 0,
      });
    });

    it('test_coverage divides safely when executed=0', async () => {
      prisma.reportAggregate.findUnique.mockResolvedValue(null);
      prisma.$queryRaw.mockResolvedValue([
        { total_cases: 5n, executed: 0n, passed: 0n },
      ]);
      const res = await svc.run(
        WS,
        { kind: 'test_coverage', projectId: PROJ, timeRange: { kind: '7d' } },
        ACTOR,
      );
      expect(res.data).toEqual({
        totalCases: 5,
        executed: 0,
        passRate: 0,
        gaps: [],
      });
    });

    it('requirement_coverage zero requirements → totalReqs=0', async () => {
      prisma.reportAggregate.findUnique.mockResolvedValue(null);
      prisma.$queryRaw.mockResolvedValue([{ total: 0n, covered: 0n }]);
      const res = await svc.run(
        WS,
        {
          kind: 'requirement_coverage',
          projectId: PROJ,
          timeRange: { kind: '30d' },
        },
        ACTOR,
      );
      expect(res.data).toEqual({ totalReqs: 0, covered: 0, gaps: [] });
    });

    it('agent_cost no runs → byProvider={} totals=0', async () => {
      prisma.reportAggregate.findUnique.mockResolvedValue(null);
      prisma.$queryRaw.mockResolvedValue([]);
      const res = await svc.run(
        WS,
        { kind: 'agent_cost', projectId: PROJ, timeRange: { kind: '30d' } },
        ACTOR,
      );
      expect(res.data).toEqual({
        byProvider: {},
        totalUsd: 0,
        totalTokens: 0,
      });
    });
  });

  describe('invalidate()', () => {
    it('flips is_stale=true via updateMany + drops in-process cache for project', async () => {
      // Seed cache for two projects.
      prisma.reportAggregate.findUnique.mockResolvedValue(null);
      await svc.run(
        WS,
        { kind: 'defect_age', projectId: PROJ, timeRange: { kind: '7d' } },
        ACTOR,
      );
      const OTHER_PROJ = '00000000-0000-0000-0000-0000000othr1';
      await svc.run(
        WS,
        {
          kind: 'defect_age',
          projectId: OTHER_PROJ,
          timeRange: { kind: '7d' },
        },
        ACTOR,
      );
      prisma.reportAggregate.updateMany.mockResolvedValue({ count: 4 });
      const n = await svc.invalidate(PROJ, ['defect_age']);
      expect(n).toBe(4);
      expect(prisma.reportAggregate.updateMany).toHaveBeenCalledWith({
        where: {
          projectId: PROJ,
          reportKind: { in: ['defect_age'] },
          isStale: false,
        },
        data: { isStale: true },
      });
      // Other project's cache entry survives.
      const cache = (svc as unknown as { cache: Map<string, unknown> }).cache;
      const keys = [...cache.keys()];
      expect(keys.some((k) => k.startsWith(`${PROJ}:`))).toBe(false);
      expect(keys.some((k) => k.startsWith(`${OTHER_PROJ}:`))).toBe(true);
    });
  });

  describe('templates', () => {
    it('createTemplate persists + audits report_template.created', async () => {
      prisma.reportTemplate.create.mockResolvedValue({
        id: 'tpl-1',
        workspaceId: WS,
        projectId: PROJ,
        ownerUserId: ACTOR,
        name: 'My pass-rate template',
        config: {
          kind: 'cycle_pass_rate',
          projectId: PROJ,
          timeRange: { kind: '30d' },
        },
        isShared: false,
        createdAt: new Date('2026-05-21T00:00:00Z'),
        updatedAt: new Date('2026-05-21T00:00:00Z'),
      });
      const dto = await svc.createTemplate(WS, ACTOR, {
        projectId: PROJ,
        name: 'My pass-rate template',
        config: {
          kind: 'cycle_pass_rate',
          projectId: PROJ,
          timeRange: { kind: '30d' },
        },
        isShared: false,
      });
      expect(dto.id).toBe('tpl-1');
      expect(audit.write).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'report_template.created' }),
      );
    });

    it('listTemplates returns owner-owned + shared, hides others', async () => {
      prisma.reportTemplate.findMany.mockResolvedValue([
        {
          id: 't1',
          workspaceId: WS,
          projectId: PROJ,
          ownerUserId: ACTOR,
          name: 'Mine',
          config: {
            kind: 'defect_age',
            projectId: PROJ,
            timeRange: { kind: '7d' },
          },
          isShared: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      const list = await svc.listTemplates(WS, PROJ, ACTOR);
      expect(list).toHaveLength(1);
      expect(prisma.reportTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            workspaceId: WS,
            projectId: PROJ,
            OR: [{ ownerUserId: ACTOR }, { isShared: true }],
          }),
        }),
      );
    });
  });
});

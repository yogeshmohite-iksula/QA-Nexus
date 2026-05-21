// QA Nexus PM1 — Day-24 P0 ADR-021 — ReportsRefreshCron spec.
//
// Tests:
//   - aggregateAllReports iterates (project × kind × window) serially
//   - Builder failure in one cell does NOT crash the cron (continue + log)
//   - sweepStaleAggregates flips is_stale=true on rows >24h old
//   - cron completion audit fired (only if projects exist)

import { Test } from '@nestjs/testing';
import { ReportsRefreshCron } from '../reports-refresh.cron';
import { ReportsService } from '../reports.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';

const WS = '00000000-0000-0000-0000-00000000ws01';

describe('ReportsRefreshCron', () => {
  let cron: ReportsRefreshCron;
  let prisma: {
    project: { findMany: jest.Mock };
    reportAggregate: { upsert: jest.Mock; updateMany: jest.Mock };
  };
  let audit: { write: jest.Mock };
  let reports: { buildData: jest.Mock };

  beforeEach(async () => {
    prisma = {
      project: {
        findMany: jest.fn().mockResolvedValue([{ id: 'p1', workspaceId: WS }]),
      },
      reportAggregate: {
        upsert: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({ count: 3 }),
      },
    };
    audit = { write: jest.fn().mockResolvedValue({ id: 'a', thisHash: 'h' }) };
    reports = { buildData: jest.fn().mockResolvedValue({ stub: true }) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ReportsRefreshCron,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
        { provide: ReportsService, useValue: reports },
      ],
    }).compile();
    cron = moduleRef.get(ReportsRefreshCron);
  });

  describe('aggregateAllReports', () => {
    it('upserts 24 rows per project (6 kinds × 4 windows)', async () => {
      await cron.aggregateAllReports();
      expect(reports.buildData).toHaveBeenCalledTimes(24);
      expect(prisma.reportAggregate.upsert).toHaveBeenCalledTimes(24);
    });

    it('continues past a single cell failure + counts it as failed', async () => {
      let calls = 0;
      reports.buildData.mockImplementation(() => {
        calls++;
        if (calls === 3) throw new Error('synthetic builder failure');
        return Promise.resolve({ stub: true });
      });
      await expect(cron.aggregateAllReports()).resolves.toBeUndefined();
      expect(reports.buildData).toHaveBeenCalledTimes(24);
      // One failed → 23 upserts.
      expect(prisma.reportAggregate.upsert).toHaveBeenCalledTimes(23);
    });

    it('audits cron_aggregation_complete with counts', async () => {
      await cron.aggregateAllReports();
      expect(audit.write).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'report.cron_aggregation_complete',
          payload: expect.objectContaining({ computed: 24, failed: 0 }),
        }),
      );
    });

    it('skips audit + does not crash when zero projects exist', async () => {
      prisma.project.findMany.mockResolvedValue([]);
      await expect(cron.aggregateAllReports()).resolves.toBeUndefined();
      expect(audit.write).not.toHaveBeenCalled();
      expect(reports.buildData).not.toHaveBeenCalled();
    });
  });

  describe('sweepStaleAggregates', () => {
    it('updates rows older than 24h to is_stale=true', async () => {
      await cron.sweepStaleAggregates();
      expect(prisma.reportAggregate.updateMany).toHaveBeenCalledWith({
        where: {
          aggregatedAt: { lt: expect.any(Date) },
          isStale: false,
        },
        data: { isStale: true },
      });
    });

    it('swallows updateMany failure (defensive)', async () => {
      prisma.reportAggregate.updateMany.mockRejectedValue(new Error('db down'));
      await expect(cron.sweepStaleAggregates()).resolves.toBeUndefined();
    });
  });
});

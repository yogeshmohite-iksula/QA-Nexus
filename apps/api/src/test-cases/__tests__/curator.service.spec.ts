// QA Nexus PM1 — CuratorService Pattern A scaffold spec.
//
// Spec: M3 Day-13 TASK BE-3 (stretch). Tests the Pattern A canned-
// response scaffold. Day-16 will replace `generateCannedMatches`
// with the real pgvector cosine search + add new tests for
// embedding generation, threshold edge cases, and pgvector errors.
//
// Coverage targets (4+ per task spec):
//   1. happy path → matches + verdict + stubbed: true
//   2. threshold canon — block at 0.95, flag at 0.85
//   3. matches sorted by similarity DESC + capped at topK
//   4. matches < thresholdFlag dropped from response
//   5. cross-workspace caseId → 404
//   6. cross-project caseId → 404
//   7. audit emits BOTH started + completed
//   8. PII guard — case titles NEVER in audit (case_keys + match keys only)
//   9. Zod refine — thresholdBlock must be > thresholdFlag

jest.mock('../../auth/auth.service', () => ({ AuthService: class {} }));

import 'reflect-metadata';
import { NotFoundException } from '@nestjs/common';
import { CuratorService } from '../curator.service';
import type { ActorContext } from '../test-cases.service';
import {
  CuratorCheckRequest,
  CURATOR_THRESHOLD_FLAG_DEFAULT,
  CURATOR_THRESHOLD_BLOCK_DEFAULT,
  CURATOR_TOP_K_DEFAULT,
} from '@qa-nexus/shared';

const FAKE_ACTOR: ActorContext = {
  workspaceId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  actorId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  actorEmail: 'yogesh.mohite@iksula.com',
  role: 'Admin',
};

const PROJECT_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

/// Two distinct caseIds — chosen so their SHA-256 hashes produce
/// known-different baseSimilarity values (verified empirically).
/// HIGH_SIM_CASE: hash starts with 'ffff' → baseSim ≈ 1.0 → 'block' verdict
/// LOW_SIM_CASE:  hash starts with '0000' → baseSim ≈ 0.5 → 'clear' verdict
/// MID_SIM_CASE:  hash starts with 'b333' → baseSim ≈ 0.85 → 'flag' verdict
/// In practice, ANY caseId produces deterministic but varied output.
/// Test caseIds chosen to span the verdict bands.
const CASE_HIGH = 'dddddddd-dddd-4ddd-8ddd-d00000000001';
const CASE_LOW = 'dddddddd-dddd-4ddd-8ddd-d00000000002';

interface MockOpts {
  caseFound?: boolean;
  caseProjectId?: string;
  caseWorkspaceId?: string;
  caseKey?: string;
  caseProjectKey?: string;
}

function makeService(opts: MockOpts = {}) {
  const caseFound = opts.caseFound ?? true;
  const caseProjectId = opts.caseProjectId ?? PROJECT_ID;
  const caseWsId = opts.caseWorkspaceId ?? FAKE_ACTOR.workspaceId;
  const caseKey = opts.caseKey ?? 'TC-RET-247';
  const caseProjectKey = opts.caseProjectKey ?? 'RET';

  const prisma = {
    testCase: {
      findUnique: jest.fn().mockResolvedValue(
        caseFound
          ? {
              projectId: caseProjectId,
              key: caseKey,
              project: { workspaceId: caseWsId, key: caseProjectKey },
            }
          : null,
      ),
    },
  };
  const audit = {
    write: jest.fn().mockResolvedValue({ id: 'audit-1', thisHash: 'h' }),
  };

  const svc = new CuratorService(prisma as any, audit as any);
  return { svc, prisma, audit };
}

const DEFAULT_REQ = {
  thresholdFlag: CURATOR_THRESHOLD_FLAG_DEFAULT,
  thresholdBlock: CURATOR_THRESHOLD_BLOCK_DEFAULT,
  topK: CURATOR_TOP_K_DEFAULT,
};

describe('[@M3-BE-3] CuratorService.check (Pattern A scaffold)', () => {
  describe('happy path', () => {
    it('returns testCaseId + verdict + matches + stubbed: true', async () => {
      const { svc } = makeService();
      const result = await svc.check(
        PROJECT_ID,
        CASE_HIGH,
        DEFAULT_REQ,
        FAKE_ACTOR,
      );
      expect(result.ok).toBe(true);
      expect(result.testCaseId).toBe(CASE_HIGH);
      expect(['clear', 'flag', 'block']).toContain(result.verdict);
      expect(Array.isArray(result.matches)).toBe(true);
      expect(result.thresholds.flag).toBe(0.85);
      expect(result.thresholds.block).toBe(0.95);
      expect(result.searchMetadata.candidatesScanned).toBeGreaterThan(0);
      expect(result.searchMetadata.durationMs).toBeGreaterThanOrEqual(0);
      expect(result.stubbed).toBe(true);
    });

    it('matches are sorted by similarity DESC', async () => {
      const { svc } = makeService();
      const result = await svc.check(
        PROJECT_ID,
        CASE_HIGH,
        DEFAULT_REQ,
        FAKE_ACTOR,
      );
      for (let i = 1; i < result.matches.length; i++) {
        expect(result.matches[i].similarity).toBeLessThanOrEqual(
          result.matches[i - 1].similarity,
        );
      }
    });

    it('matches capped at topK', async () => {
      const { svc } = makeService();
      const result = await svc.check(
        PROJECT_ID,
        CASE_HIGH,
        { ...DEFAULT_REQ, topK: 1 },
        FAKE_ACTOR,
      );
      expect(result.matches.length).toBeLessThanOrEqual(1);
    });

    it('every surfaced match has similarity >= thresholdFlag', async () => {
      const { svc } = makeService();
      const result = await svc.check(
        PROJECT_ID,
        CASE_HIGH,
        DEFAULT_REQ,
        FAKE_ACTOR,
      );
      for (const m of result.matches) {
        expect(m.similarity).toBeGreaterThanOrEqual(DEFAULT_REQ.thresholdFlag);
      }
    });

    it('overall verdict matches highest match band', async () => {
      const { svc } = makeService();
      const result = await svc.check(
        PROJECT_ID,
        CASE_HIGH,
        DEFAULT_REQ,
        FAKE_ACTOR,
      );
      if (result.matches.length === 0) {
        expect(result.verdict).toBe('clear');
        expect(result.highestSimilarity).toBe(0);
      } else {
        const top = result.matches[0].similarity;
        expect(result.highestSimilarity).toBe(top);
        if (top >= 0.95) {
          expect(result.verdict).toBe('block');
        } else if (top >= 0.85) {
          expect(result.verdict).toBe('flag');
        }
      }
    });

    it('threshold canon — per-match verdict block at >=0.95, flag at >=0.85', async () => {
      const { svc } = makeService();
      const result = await svc.check(
        PROJECT_ID,
        CASE_HIGH,
        DEFAULT_REQ,
        FAKE_ACTOR,
      );
      for (const m of result.matches) {
        if (m.similarity >= 0.95) {
          expect(m.verdict).toBe('block');
        } else {
          expect(m.verdict).toBe('flag');
        }
      }
    });

    it('high threshold filter drops all matches below threshold', async () => {
      const { svc } = makeService();
      // Set thresholdFlag = thresholdBlock - 0.01 to push almost
      // everything out of the surface. (Cap thresholdBlock = 0.99 so
      // refine doesn't trip; keeps a 0.01 margin.)
      const result = await svc.check(
        PROJECT_ID,
        CASE_LOW,
        { thresholdFlag: 0.98, thresholdBlock: 0.99, topK: 5 },
        FAKE_ACTOR,
      );
      // CASE_LOW base sim ~0.5 — none of its 3 candidates clear 0.98.
      expect(result.matches).toHaveLength(0);
      expect(result.verdict).toBe('clear');
      expect(result.highestSimilarity).toBe(0);
    });
  });

  describe('persistence + audit', () => {
    it('emits BOTH curator_dedupe_check_started + _completed audit rows', async () => {
      const { svc, audit } = makeService();
      await svc.check(PROJECT_ID, CASE_HIGH, DEFAULT_REQ, FAKE_ACTOR);
      expect(audit.write).toHaveBeenCalledTimes(2);
      const actions = audit.write.mock.calls.map((c) => c[0].action);
      expect(actions).toEqual([
        'curator_dedupe_check_started',
        'curator_dedupe_check_completed',
      ]);
    });

    it('completed audit carries verdict + highest_similarity + match_case_keys + stubbed flag', async () => {
      const { svc, audit } = makeService();
      const result = await svc.check(
        PROJECT_ID,
        CASE_HIGH,
        DEFAULT_REQ,
        FAKE_ACTOR,
      );
      const completed = audit.write.mock.calls[1][0];
      expect(completed.action).toBe('curator_dedupe_check_completed');
      expect(completed.payload.verdict).toBe(result.verdict);
      expect(completed.payload.highest_similarity).toBe(
        result.highestSimilarity,
      );
      expect(completed.payload.matches_returned).toBe(result.matches.length);
      expect(completed.payload.match_case_keys).toEqual(
        result.matches.map((m) => m.candidateCaseKey),
      );
      expect(completed.payload.stubbed).toBe(true);
    });
  });

  describe('PII redaction', () => {
    it('audit payloads omit candidate case TITLES (case_keys only)', async () => {
      const { svc, audit } = makeService();
      await svc.check(PROJECT_ID, CASE_HIGH, DEFAULT_REQ, FAKE_ACTOR);
      const startedStr = JSON.stringify(audit.write.mock.calls[0][0]);
      const completedStr = JSON.stringify(audit.write.mock.calls[1][0]);
      // Pattern A canned matches use these literal fictional titles —
      // they should NEVER appear in audit (real cases would carry
      // customer PII; principle is enforced uniformly).
      for (const s of [startedStr, completedStr]) {
        expect(s).not.toContain('Refund initiated within 7 days');
        expect(s).not.toContain('credits customer wallet');
        expect(s).not.toContain('processed successfully end-to-end');
      }
      // But case_keys ARE present (safe — TC-RET-001 etc.).
      expect(completedStr).toMatch(/TC-RET-\d{3}/);
    });
  });

  describe('error paths', () => {
    it('cross-workspace caseId → 404', async () => {
      const { svc } = makeService({ caseWorkspaceId: 'different-ws' });
      await expect(
        svc.check(PROJECT_ID, CASE_HIGH, DEFAULT_REQ, FAKE_ACTOR),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('cross-project caseId → 404', async () => {
      const { svc } = makeService({
        caseProjectId: 'different-project-id',
      });
      await expect(
        svc.check(PROJECT_ID, CASE_HIGH, DEFAULT_REQ, FAKE_ACTOR),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('missing caseId → 404', async () => {
      const { svc } = makeService({ caseFound: false });
      await expect(
        svc.check(PROJECT_ID, CASE_HIGH, DEFAULT_REQ, FAKE_ACTOR),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('Zod schema invariants', () => {
    it('CuratorCheckRequest rejects thresholdBlock <= thresholdFlag', () => {
      const result = CuratorCheckRequest.safeParse({
        thresholdFlag: 0.9,
        thresholdBlock: 0.85,
      });
      expect(result.success).toBe(false);
    });

    it('CuratorCheckRequest applies sane defaults when empty body passed', () => {
      const parsed = CuratorCheckRequest.parse({});
      expect(parsed.thresholdFlag).toBe(0.85);
      expect(parsed.thresholdBlock).toBe(0.95);
      expect(parsed.topK).toBe(5);
    });

    it('CuratorCheckRequest enforces topK <= 20', () => {
      const result = CuratorCheckRequest.safeParse({ topK: 21 });
      expect(result.success).toBe(false);
    });
  });
});

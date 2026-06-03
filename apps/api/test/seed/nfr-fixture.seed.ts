#!/usr/bin/env ts-node
// QA Nexus PM1 — NFR-003 latency seed fixture (Day-1 PM pilot-push, Task L).
// =============================================================================
// Seeds the MINIMUM data so Composer.generate() + Curator.check() run without
// throwing assertReqWorkspace / assertCaseWorkspace errors (the 7th reality-check:
// both are workspace-scoped, not pure functions). Enables Wed's full A1/A2 probes.
//
// USAGE:
//   SEED_DRY_RUN=1 pnpm --filter @qa-nexus/api seed:nfr   # validate plan, NO writes
//   pnpm --filter @qa-nexus/api seed:nfr                  # real writes (TEST DB only)
//
// SAFETY: real writes go ONLY to TEST_DATABASE_URL (a separate Neon test branch); the
// PrismaClient is constructed with that URL explicitly and NEVER the pilot DATABASE_URL.
// The gate refuses if TEST_DATABASE_URL's host equals the pilot host — a substring
// "neon.tech" check is insufficient because the test branch is also on neon.tech (different
// `ep-*` endpoint). Pilot data is sacred (Hard Rule: "Neon pilot data is sacred").
//
// EMBEDDINGS: TestCase.embedding is `Unsupported("vector(384)")` — Prisma's typed
// client CANNOT write it. After seeding the rows below, Wed populates embeddings via
// a raw-SQL step (mirror KbEmbeddingService): for each test case, EmbeddingService
// .embed(text) → `UPDATE test_cases SET embedding = $1::vector WHERE id = $2`. Without
// that step Curator.check's pgvector search scans 0 candidates. Documented, not faked.
// =============================================================================

import { PrismaClient, UserRole, Priority } from '@prisma/client';

const SEED_DRY_RUN = process.env.SEED_DRY_RUN === '1';
const TEST_DB_URL = process.env.TEST_DATABASE_URL ?? '';
const PILOT_DB_URL = process.env.DATABASE_URL ?? '';

function hostOf(u: string): string {
  try {
    return new URL(u).host;
  } catch {
    return '';
  }
}

// Safety gate — real writes target ONLY TEST_DATABASE_URL, and its host MUST differ
// from the pilot DATABASE_URL host. The pilot DB and the Neon TEST BRANCH are both on
// neon.tech (different `ep-*` endpoints), so a substring check on "neon.tech" is
// insufficient (it would wrongly refuse the legitimate test branch) — compare hosts.
if (!SEED_DRY_RUN) {
  if (!TEST_DB_URL) {
    console.error(
      '[seed:nfr] REFUSED — TEST_DATABASE_URL is not set. Real writes need a separate test DB.',
    );
    process.exit(2);
  }
  if (PILOT_DB_URL && hostOf(TEST_DB_URL) === hostOf(PILOT_DB_URL)) {
    console.error(
      '[seed:nfr] REFUSED — TEST_DATABASE_URL host equals the pilot DATABASE_URL host. Pilot data is sacred.',
    );
    process.exit(2);
  }
}

// ── Fixture plan (verified against schema.prisma: Workspace/User/Project/
// ProjectMember/Requirement/TestCase; UserRole.Admin; Priority.P0–P3). ─────────
const FIXTURE = {
  workspace: { name: 'NFR Latency Fixture' },
  user: {
    email: 'nfr-actor@test.local',
    displayName: 'NFR Test Actor',
    role: UserRole.Admin,
    organizationalLabel: 'NFR Probe',
  },
  project: {
    key: 'NFR',
    name: 'NFR Test Project',
    description: 'A1/A2 latency probe fixture',
  },
  requirement: {
    key: 'REQ-NFR-001',
    title: 'NFR test requirement for Composer.generate latency probe',
    description:
      'As a QA engineer, I want the returns refund flow validated so that A1 Composer ' +
      'has a realistic requirement body to generate test cases from during latency probes.',
    priority: Priority.P1,
  },
  testCases: [
    {
      key: 'TC-NFR-001',
      title: 'Refund issued for valid return',
      expectedResult: 'Refund processed to original payment method',
    },
    {
      key: 'TC-NFR-002',
      title: 'Refund blocked for expired return window',
      expectedResult: 'Refund rejected with window-expired error',
    },
    {
      key: 'TC-NFR-003',
      title: 'Partial refund on partial return',
      expectedResult: 'Refund equals returned-item subtotal',
    },
  ],
};

async function main(): Promise<void> {
  console.log(
    `[seed:nfr] mode: ${SEED_DRY_RUN ? 'DRY-RUN (no writes)' : 'WRITE'}`,
  );
  console.log(
    `[seed:nfr] target (TEST_DATABASE_URL): ${TEST_DB_URL.replace(/:[^:@]+@/, ':***@') || '(unset)'}`,
  );

  if (SEED_DRY_RUN) {
    console.log('[seed:nfr] would seed (verified schema shapes):');
    console.log(JSON.stringify(FIXTURE, null, 2));
    console.log(
      '[seed:nfr] + embeddings for the 3 test cases via a separate raw-SQL step (Wed).',
    );
    console.log(
      '[seed:nfr] DRY-RUN complete — 0 DB writes, pilot DB untouched. ✅',
    );
    return;
  }

  const prisma = new PrismaClient({
    datasources: { db: { url: TEST_DB_URL } },
  });
  try {
    // Workspace (no @@unique on name — pre-check, mirror prisma/seed.ts).
    const existingWs = await prisma.workspace.findFirst({
      where: { name: FIXTURE.workspace.name },
    });
    const ws =
      existingWs ??
      (await prisma.workspace.create({
        data: { name: FIXTURE.workspace.name, createdBy: null, settings: {} },
      }));

    const user = await prisma.user.upsert({
      where: { email: FIXTURE.user.email },
      update: { workspaceId: ws.id, role: FIXTURE.user.role },
      create: {
        workspaceId: ws.id,
        email: FIXTURE.user.email,
        displayName: FIXTURE.user.displayName,
        role: FIXTURE.user.role,
        organizationalLabel: FIXTURE.user.organizationalLabel,
        passwordHash: 'NFR_FIXTURE_NO_LOGIN',
      },
    });

    if (ws.createdBy !== user.id) {
      await prisma.workspace.update({
        where: { id: ws.id },
        data: { createdBy: user.id },
      });
    }

    const project = await prisma.project.upsert({
      where: {
        workspaceId_key: { workspaceId: ws.id, key: FIXTURE.project.key },
      },
      update: {},
      create: {
        workspaceId: ws.id,
        key: FIXTURE.project.key,
        name: FIXTURE.project.name,
        description: FIXTURE.project.description,
        createdBy: user.id,
      },
    });

    await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: project.id, userId: user.id } },
      update: { roleOverride: UserRole.Admin },
      create: {
        projectId: project.id,
        userId: user.id,
        roleOverride: UserRole.Admin,
      },
    });

    await prisma.requirement.upsert({
      where: {
        projectId_key: { projectId: project.id, key: FIXTURE.requirement.key },
      },
      update: {},
      create: {
        projectId: project.id,
        key: FIXTURE.requirement.key,
        title: FIXTURE.requirement.title,
        description: FIXTURE.requirement.description,
        priority: FIXTURE.requirement.priority,
        createdBy: user.id,
      },
    });

    for (const tc of FIXTURE.testCases) {
      await prisma.testCase.upsert({
        where: { projectId_key: { projectId: project.id, key: tc.key } },
        update: {},
        create: {
          projectId: project.id,
          key: tc.key,
          title: tc.title,
          expectedResult: tc.expectedResult,
          priority: Priority.P1,
          createdBy: user.id,
        },
      });
    }

    console.log(
      `[seed:nfr] SEED complete — ws=${ws.id} project=${project.key} (${project.id}), ` +
        `1 requirement + ${FIXTURE.testCases.length} test cases.`,
    );
    console.log(
      '[seed:nfr] NEXT (Wed): populate test_cases.embedding via raw SQL + EmbeddingService, ' +
        'then run the A1/A2 latency probes.',
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('[seed:nfr] error:', err);
  process.exit(1);
});

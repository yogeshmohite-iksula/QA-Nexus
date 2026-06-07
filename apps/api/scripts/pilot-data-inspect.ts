// QA Nexus PM1 — read-only pilot-DB data inventory (Sun deep-audit Bucket 5.1).
//
// Verifies the pilot DB has the expected Iksula seed data so the FE shows REAL
// data to pilot users, not stubs. READ-ONLY (counts + project/user lists). No
// writes (the audit_log immutability triggers would block them anyway).
//
// USAGE:
//   DATABASE_URL="$(grep ^DATABASE_URL= apps/api/.env | cut -d= -f2-)" \
//     pnpm --filter @qa-nexus/api exec ts-node --transpile-only -P tsconfig.json scripts/pilot-data-inspect.ts

import { PrismaClient } from '@prisma/client';

async function main(): Promise<void> {
  const p = new PrismaClient();
  try {
    const [ws, u, pr, req, tc, ts, def, al, projects, users] =
      await Promise.all([
        p.workspace.count(),
        p.user.count(),
        p.project.count(),
        p.requirement.count(),
        p.testCase.count(),
        p.testSuite.count(),
        p.defect.count(),
        p.auditLog.count(),
        p.project.findMany({ select: { key: true, name: true } }),
        p.user.findMany({
          select: { email: true, displayName: true, role: true },
        }),
      ]);
    console.log('=== PILOT DATA COUNTS ===');
    console.log(
      JSON.stringify(
        {
          workspace: ws,
          user: u,
          project: pr,
          requirement: req,
          testCase: tc,
          testSuite: ts,
          defect: def,
          auditLog: al,
        },
        null,
        2,
      ),
    );
    console.log('=== PROJECTS ===');
    console.table(projects);
    console.log('=== USERS (pilot roster, per CLAUDE.md canon) ===');
    console.table(users);
  } finally {
    await p.$disconnect();
  }
}

main().catch((e) => {
  console.error('[pilot-data] fatal:', e instanceof Error ? e.message : e);
  process.exit(1);
});

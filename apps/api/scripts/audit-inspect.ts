// QA Nexus PM1 — read-only audit_log inspector (Sun deep audit Bucket 1.1/1.2).
//
// psql is not installed locally, so `\d audit_log` is substituted with a live
// information_schema query (proves the deployed table shape) + COUNT + the 5
// most-recent rows (metadata only — id/action/created_at, NO payload → no PII).
//
// READ-ONLY: only SELECTs. Never writes. Connects to whatever DATABASE_URL is
// injected (pilot for the audit). USAGE:
//   DATABASE_URL="$(grep ^DATABASE_URL= apps/api/.env | cut -d= -f2-)" \
//     pnpm --filter @qa-nexus/api exec ts-node --transpile-only -P tsconfig.json scripts/audit-inspect.ts

import { PrismaClient } from '@prisma/client';

async function main(): Promise<void> {
  const prisma = new PrismaClient();
  try {
    const url = process.env.DATABASE_URL ?? '';
    console.log(
      'DB host:',
      (() => {
        try {
          return new URL(url).host;
        } catch {
          return '(unparseable)';
        }
      })(),
    );

    console.log('\n=== 1.1 audit_log columns (information_schema) ===');
    const cols = await prisma.$queryRawUnsafe<
      Array<{ column_name: string; data_type: string; is_nullable: string }>
    >(
      `SELECT column_name, data_type, is_nullable
       FROM information_schema.columns
       WHERE table_name ILIKE '%audit_log%'
       ORDER BY table_name, ordinal_position`,
    );
    console.table(cols);

    console.log('=== 1.2 row count ===');
    const cnt = await prisma.$queryRawUnsafe<Array<{ n: number }>>(
      `SELECT COUNT(*)::int AS n FROM audit_log`,
    );
    console.log('audit_log rows:', cnt[0]?.n);

    console.log('=== 1.2 most-recent 5 (metadata only) ===');
    const recent = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      `SELECT id, action, created_at FROM audit_log ORDER BY created_at DESC LIMIT 5`,
    );
    console.table(recent);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error('[audit-inspect] fatal:', e instanceof Error ? e.message : e);
  process.exit(1);
});

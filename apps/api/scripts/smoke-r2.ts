// QA Nexus PM1 — R2 storage infra smoke (Day-3 Task 4 / F.5).
//
// Exercises the REAL production upload path end-to-end with a single 1 KB blob:
//   1. presignedUpload()         → signed PUT URL + key (what the FE receives)
//   2. HTTP PUT to the signed URL → uploads bytes direct-to-R2 (FE flow)
//   3. getObject(key)            → server-side readback (ChunkingService flow)
//   4. sha256 compare            → integrity check
//   5. deleteObject(key)         → cleanup
//   6. getObject(key) again      → confirm gone (informational)
//
// R2Service has no direct putObject — presigned PUT IS the production path, so
// this smoke mirrors exactly what pilot uploads do. Refuses if R2 is in
// DEFERRED mode (env not configured).
//
// USAGE: pnpm --filter @qa-nexus/api smoke:r2   (auto-loads apps/api/.env)

import { NestFactory } from '@nestjs/core';
import { Module, Logger } from '@nestjs/common';
import { randomBytes, createHash } from 'node:crypto';
import { loadEnvFile } from './_env';
import { R2Service } from '../src/storage/r2.service';

@Module({ providers: [R2Service] })
class SmokeR2Module {}

function sha256(b: Buffer): string {
  return createHash('sha256').update(b).digest('hex');
}

async function main(): Promise<void> {
  const logger = new Logger('SmokeR2');
  const loaded = loadEnvFile();
  logger.log(`Loaded ${loaded.length} env keys from apps/api/.env`);

  const app = await NestFactory.createApplicationContext(SmokeR2Module, {
    logger: ['warn', 'error', 'log'],
  });
  const r2 = app.get(R2Service);

  if (!r2.isConfigured()) {
    logger.error(
      'REFUSED — R2 in DEFERRED mode (R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / ' +
        'R2_ENDPOINT missing in apps/api/.env).',
    );
    await app.close();
    process.exit(2);
  }
  logger.log(`R2 configured: bucket=${r2.getBucket()}`);

  const blob = randomBytes(1024);
  const srcHash = sha256(blob);
  const t: Record<string, number> = {};

  // 1) presign
  let tp = Date.now();
  const pres = await r2.presignedUpload({
    contentType: 'application/octet-stream',
    filename: '2026-06-04-day-3.bin',
    prefix: 'smoke',
    expiresIn: 300,
  });
  t.presign = Date.now() - tp;

  // 2) PUT to the signed URL (Content-Type MUST match the signed header).
  tp = Date.now();
  const putResp = await fetch(pres.url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: blob,
  });
  t.put = Date.now() - tp;
  if (!putResp.ok) {
    const body = await putResp.text().catch(() => '');
    logger.error(
      `PUT failed: ${putResp.status} ${putResp.statusText} — ${body.slice(0, 240)}`,
    );
    await app.close();
    process.exit(1);
  }

  // 3) GET (server-side) + 4) integrity
  tp = Date.now();
  const got = await r2.getObject(pres.key);
  t.get = Date.now() - tp;
  const dstHash = sha256(got);
  const match = srcHash === dstHash && got.length === blob.length;

  // 5) DELETE (throws → outer catch if it fails) + 6) verify gone
  tp = Date.now();
  await r2.deleteObject(pres.key);
  t.delete = Date.now() - tp;
  let deleteConfirmed = false;
  try {
    await r2.getObject(pres.key);
  } catch {
    deleteConfirmed = true; // NoSuchKey — expected
  }
  await app.close();

  console.log('\n=== Task 4 — R2 smoke (PUT/GET/DELETE) ===');
  console.log(`bucket    : ${r2.getBucket()}`);
  console.log(`key       : ${pres.key}`);
  console.log(`bytes     : ${blob.length} src / ${got.length} readback`);
  console.log(`presign   : ${t.presign} ms`);
  console.log(`PUT       : ${t.put} ms  [HTTP ${putResp.status}]`);
  console.log(`GET       : ${t.get} ms`);
  console.log(
    `DELETE    : ${t.delete} ms  (confirmed gone: ${deleteConfirmed})`,
  );
  console.log(`sha256    : ${match ? 'MATCH ✅' : 'MISMATCH ❌'}`);
  const pass = match && putResp.ok;
  console.log(`verdict   : ${pass ? 'PASS ✅' : 'FAIL ❌'}`);
  process.exit(pass ? 0 : 1);
}

main().catch((err) => {
  console.error('[smoke-r2] fatal:', err);
  process.exit(1);
});

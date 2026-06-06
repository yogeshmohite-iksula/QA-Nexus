// QA Nexus PM1 — Resend email infra smoke (Day-3 Task 3 / F.5).
//
// Sends ONE real email via EmailService.send() (ADR-018 Resend HTTPS path) to
// verify production email delivery post env-unblock. REAL mode only — refuses
// if EmailService is 'capture' (NODE_ENV=test) or 'deferred' (bad RESEND env).
//
// Recipient: yogesh.mohite@iksula.com — Resend free tier with the
// onboarding@resend.dev sender delivers ONLY to the Resend account owner
// (Day-3 correction #1; the May-23 delivery to that address confirms it is the
// owner). Override with SMOKE_TO=… if needed.
//
// BCC isolation: the smoke deletes RESEND_BCC_EMAIL before boot so it sends a
// single owner recipient. On the free tier the onboarding@resend.dev sender
// rejects non-owner recipients, so a BCC to a corporate address would FAIL the
// send for a reason unrelated to core infra. (Real BCC delivery unlocks once
// the verified mail.qanexus.iksula.com domain is live — Yogesh's Sat task.)
//
// USAGE: pnpm --filter @qa-nexus/api smoke:resend   (auto-loads apps/api/.env)

import { NestFactory } from '@nestjs/core';
import { Module, Logger } from '@nestjs/common';
import { loadEnvFile } from './_env';
import { EmailService } from '../src/email/email.service';

@Module({ providers: [EmailService] })
class SmokeEmailModule {}

async function main(): Promise<void> {
  const logger = new Logger('SmokeResend');
  const loaded = loadEnvFile();
  logger.log(`Loaded ${loaded.length} env keys from apps/api/.env`);
  // Isolate to a single owner recipient (see header).
  delete process.env.RESEND_BCC_EMAIL;

  const TO = process.env.SMOKE_TO ?? 'yogesh.mohite@iksula.com';
  const subject = 'QA Nexus Resend smoke — Day-3 2026-06-04';
  const bodyText =
    'Resend infra smoke test. Past delivery 2026-05-23 confirmed working. ' +
    'This re-verifies post env unblock. Pilot launch Mon Jun 8 ready when ' +
    'mail.qanexus.iksula.com domain is verified.';
  const html = `<p>${bodyText}</p>`;

  const app = await NestFactory.createApplicationContext(SmokeEmailModule, {
    logger: ['warn', 'error', 'log'],
  });
  const email = app.get(EmailService);
  const health = email.getHealth();
  logger.log(
    `EmailService mode=${health.mode} from=${health.from ?? '(none)'} bccEnabled=${health.bccEnabled}`,
  );

  if (health.mode !== 'real') {
    logger.error(
      `REFUSED — EmailService is '${health.mode}', not 'real'. ` +
        (health.mode === 'capture'
          ? 'NODE_ENV=test or EMAIL_TEST_CAPTURE=true is set — unset and re-run.'
          : 'RESEND_API_KEY missing/invalid in apps/api/.env (DEFERRED mode).'),
    );
    await app.close();
    process.exit(2);
  }

  const t0 = Date.now();
  const res = await email.send({ to: TO, subject, html, text: bodyText });
  const ms = Date.now() - t0;
  await app.close();

  const failed = res.id.startsWith('failed-') || res.id.startsWith('deferred-');
  console.log('\n=== Task 3 — Resend smoke ===');
  console.log(`to       : ${TO}`);
  console.log(`from     : ${health.from}`);
  console.log(`subject  : ${subject}`);
  console.log(`messageId: ${res.id}`);
  console.log(`latency  : ${ms} ms (send → Resend API accept)`);
  console.log(
    `verdict  : ${
      failed
        ? 'FAIL ❌ (see EmailService error log above — Resend rejected the send)'
        : 'PASS ✅ — accepted by Resend; confirm inbox receipt at ' + TO
    }`,
  );
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error('[smoke-resend] fatal:', err);
  process.exit(1);
});

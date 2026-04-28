// BetterAuth instance for QA Nexus PM1 — magic-link only, Prisma adapter,
// Postgres tables prefixed `auth_*` to avoid clashing with TB-002 `users`.
//
// Spec: MS0-T021. Resend account is a parallel task (T014); the magic-link
// `sendMagicLink` callback uses our EmailService which stubs to console.log
// when RESEND_API_KEY is missing/placeholder.
//
// The instance is constructed lazily by `buildAuth(prisma, email)` so the
// NestJS module can inject the shared PrismaService + EmailService rather
// than each calling `new PrismaClient()`.
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { magicLink } from 'better-auth/plugins';
import type { PrismaClient } from '@prisma/client';
import type { EmailService } from '../email/email.service';

export type AuthInstance = ReturnType<typeof buildAuth>;

export function buildAuth(prisma: PrismaClient, email: EmailService) {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'BETTER_AUTH_SECRET missing or too short (need ≥32 chars).',
    );
  }
  const baseUrl = process.env.BETTER_AUTH_URL ?? 'http://localhost:3001';

  return betterAuth({
    secret,
    baseURL: baseUrl,
    basePath: '/auth',
    database: prismaAdapter(prisma, { provider: 'postgresql' }),
    // Map BetterAuth's internal model names to our prefixed Postgres tables.
    user: { modelName: 'authUser' },
    session: { modelName: 'authSession' },
    account: { modelName: 'authAccount' },
    verification: { modelName: 'authVerification' },
    emailAndPassword: { enabled: false }, // PM1 = magic-link only
    advanced: {
      // Our auth_* tables use Postgres UUID columns (@db.Uuid in schema.prisma).
      // BetterAuth defaults to nanoid-style IDs which Postgres rejects as
      // invalid UUIDs. Override to crypto.randomUUID() so inserts succeed.
      generateId: () => globalThis.crypto.randomUUID(),
      cookies: {
        session_token: {
          attributes: {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
          },
        },
      },
    },
    plugins: [
      magicLink({
        // 7d for invites, 1h for resets per ERD §3 TB-005 expires_at.
        expiresIn: 60 * 60, // 1h default for sign-in
        sendMagicLink: async ({ email: to, url, token, metadata }) => {
          const subject = 'Your QA Nexus sign-in link';
          const text =
            `Click to sign in to QA Nexus:\n\n${url}\n\n` +
            `This link expires in 1 hour. Token: ${token.slice(0, 8)}…\n\n` +
            (metadata && Object.keys(metadata).length > 0
              ? `Context: ${JSON.stringify(metadata)}\n\n`
              : '') +
            `If you didn't request this, ignore this email.`;
          const html =
            `<p>Click to sign in to QA Nexus:</p>` +
            `<p><a href="${url}">${url}</a></p>` +
            `<p style="color:#888;font-size:12px">This link expires in 1 hour.</p>`;
          await email.send({ to, subject, html, text });
        },
      }),
    ],
  });
}

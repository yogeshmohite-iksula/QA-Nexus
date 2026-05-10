// QA Nexus PM1 — NestJS API entry.
//
// Critical sequence (per better-auth/node docs):
//   0. Initialize OpenTelemetry SDK (traces + logs) BEFORE
//      NestFactory.create. Auto-instrumentations need to monkey-patch
//      http/express/pg before those modules are required by Nest's
//      bootstrap. Logs SDK must be ready so NestOtelLogger can emit.
//   1. Create Nest app with bodyParser DISABLED.
//   2. Mount BetterAuth's catch-all on `/auth/*` BEFORE any body parser
//      (BetterAuth needs raw req body to sign the magic-link cookies).
//   3. Re-enable JSON body parsing for all OTHER routes (incl. our wrapper
//      controllers under /auth/sign-up etc — they live at narrower paths
//      that match BEFORE the catch-all because Express routing is order-
//      dependent and Nest's controllers register first).
import {
  initOtelTraces,
  shutdownOtelTraces,
} from './observability/otel.config';
import {
  initOtelLogs,
  shutdownOtelLogs,
  NestOtelLogger,
} from './observability/otel-logs.config';

// MUST run before any other Nest/Express imports — auto-instrumentations
// patch require() results.
initOtelTraces();
initOtelLogs();

import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { WsAdapter } from '@nestjs/platform-ws';
import express from 'express';
import cors from 'cors';
import { toNodeHandler } from 'better-auth/node';
import { AppModule } from './app.module';
import { AuthService } from './auth/auth.service';

/// Allowed origins for CORS preflight on /auth/*. Sister to the
/// `trustedOrigins` list in `auth/auth.config.ts` (which BetterAuth
/// uses for CSRF). Per BetterAuth issues #7657 / #4720 / #4052, the
/// 1.4.x line silently drops the Access-Control-Allow-Origin header
/// on OPTIONS preflight responses even when `trustedOrigins` is set —
/// so we install explicit Express CORS middleware in front of the
/// BetterAuth mount. Day-15 P0 cascade fix on top of PR #123.
const AUTH_CORS_BASE_ORIGINS = [
  'https://qa-nexus-web.pages.dev',
  'https://app.qanexus.iksula.com',
  'https://api.qanexus.iksula.com',
  'http://localhost:3000',
  'http://localhost:3001',
];

/// Cloudflare Pages preview-deployment hashes look like
/// `https://89c44180.qa-nexus-web.pages.dev`. Allow any hash-prefixed
/// subdomain (lowercase hex). Mirrors followup (bd) intent — a
/// principled wildcard in BetterAuth's trustedOrigins lands in M5;
/// here we keep it CORS-only so BetterAuth's own CSRF list stays
/// strict (preview hashes still need AUTH_TRUSTED_ORIGINS env-var
/// append for BetterAuth to accept the request body).
const PAGES_PREVIEW_RE = /^https:\/\/[a-f0-9]+\.qa-nexus-web\.pages\.dev$/;

function isAuthCorsOriginAllowed(origin: string): boolean {
  if (AUTH_CORS_BASE_ORIGINS.includes(origin)) return true;
  if (PAGES_PREVIEW_RE.test(origin)) return true;
  // AUTH_TRUSTED_ORIGINS env (sister to PR #123) appends extras for
  // staging aliases / one-off testing — honor them here too so the
  // CORS layer + BetterAuth's CSRF layer stay in sync.
  const envExtras = (process.env.AUTH_TRUSTED_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return envExtras.includes(origin);
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false, // we manage parsing ourselves so BetterAuth gets raw bodies
    logger: new NestOtelLogger(),
  });

  // Mount BetterAuth's catch-all for routes the wrapper controllers don't own.
  // Order: this runs AFTER Nest registers /auth/sign-up, /auth/sign-in,
  // /auth/callback, /auth/sign-out, /auth/session — so requests to
  // /auth/magic-link/verify, /auth/get-session, etc. fall through to here.
  const authService = app.get(AuthService);
  // Force eager init so authService.auth is populated before the first request.
  authService.onModuleInit?.();
  const expressApp = app.getHttpAdapter().getInstance();

  // Explicit Express CORS middleware on /auth/* — MUST run BEFORE the
  // BetterAuth mount below. BetterAuth 1.4.x has a known regression
  // (issues #7657 / #4720 / #4052) where OPTIONS preflight responses
  // omit the Access-Control-Allow-Origin + -Allow-Credentials headers
  // even when `trustedOrigins` is set in the betterAuth() config. The
  // browser then blocks the actual POST → "CORS error" with 0 bytes
  // transferred. Express CORS middleware in front of the handler
  // handles preflight cleanly + injects the right headers on the
  // POST response too. BetterAuth's `trustedOrigins` (PR #123 + the
  // env-var extras) still runs for CSRF — defense in depth.
  // Day-15 P0 — see CHANGELOG ### Fixed entry for full RCA.
  expressApp.use(
    '/auth/*',
    cors({
      origin: (
        origin: string | undefined,
        callback: (err: Error | null, allow?: boolean) => void,
      ) => {
        // Same-origin requests + non-browser tools (curl/Postman) have
        // no Origin header — pass through (BetterAuth's CSRF layer
        // owns same-origin trust decisions, not this middleware).
        if (!origin) return callback(null, true);
        if (isAuthCorsOriginAllowed(origin)) return callback(null, true);
        // Reject — express-cors translates this to a 5xx OR drops
        // the Allow-Origin header (browser blocks request). We log
        // for diagnostics; never echo the origin back to the client.
        return callback(new Error(`CORS: origin not allowed (${origin})`));
      },
      credentials: true, // BetterAuth uses cookies — required
      methods: ['GET', 'POST', 'OPTIONS', 'PATCH', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Cookie', 'Authorization'],
      optionsSuccessStatus: 204,
    }),
  );

  // BetterAuth catch-all per the standard pattern (basePath=/auth set in
  // AuthService) — let BetterAuth own its entire base path. Previously
  // narrow mount (only /auth/magic-link/* + /auth/get-session) silently
  // 404'd /auth/sign-in/magic-link + any future BetterAuth endpoint.
  // Surfaced Day-15 when FE flipped to a new sign-in flow per Pattern B.
  // See followup (bb) for full RCA + (bc) for FE-side prefix coordination.
  expressApp.all('/auth/*', toNodeHandler(authService.auth));

  // Body parsers for all other Nest controllers (incl. our wrapper auth endpoints).
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // T026: bind the @nestjs/websockets gateway to the `ws` library (NOT
  // socket.io — locked PM1 stack per CLAUDE.md). RealtimeGateway uses
  // path: /realtime, so connect via ws://localhost:3001/realtime.
  app.useWebSocketAdapter(new WsAdapter(app));

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
  logger.log(`QA Nexus API listening on http://localhost:${port}`);

  // Graceful shutdown for Render redeploys / SIGTERM. Flushes any
  // pending OTel batches so we don't drop the last few spans/logs.
  const shutdown = async (signal: string) => {
    logger.log(`Received ${signal} — flushing OTel exporters`);
    await Promise.allSettled([shutdownOtelTraces(), shutdownOtelLogs()]);
    await app.close();
    process.exit(0);
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}
bootstrap().catch((e) => {
  console.error('Bootstrap failed:', e);
  process.exit(1);
});

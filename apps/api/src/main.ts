// QA Nexus PM1 — NestJS API entry.
//
// Critical sequence (per better-auth/node docs):
//   1. Create Nest app with bodyParser DISABLED.
//   2. Mount BetterAuth's catch-all on `/auth/*` BEFORE any body parser
//      (BetterAuth needs raw req body to sign the magic-link cookies).
//   3. Re-enable JSON body parsing for all OTHER routes (incl. our wrapper
//      controllers under /auth/sign-up etc — they live at narrower paths
//      that match BEFORE the catch-all because Express routing is order-
//      dependent and Nest's controllers register first).
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { WsAdapter } from '@nestjs/platform-ws';
import express from 'express';
import { toNodeHandler } from 'better-auth/node';
import { AppModule } from './app.module';
import { AuthService } from './auth/auth.service';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false, // we manage parsing ourselves so BetterAuth gets raw bodies
  });

  // Mount BetterAuth's catch-all for routes the wrapper controllers don't own.
  // Order: this runs AFTER Nest registers /auth/sign-up, /auth/sign-in,
  // /auth/callback, /auth/sign-out, /auth/session — so requests to
  // /auth/magic-link/verify, /auth/get-session, etc. fall through to here.
  const authService = app.get(AuthService);
  // Force eager init so authService.auth is populated before the first request.
  authService.onModuleInit?.();
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.all('/auth/magic-link/*', toNodeHandler(authService.auth));
  expressApp.all('/auth/get-session', toNodeHandler(authService.auth));

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
}
bootstrap().catch((e) => {
  console.error('Bootstrap failed:', e);
  process.exit(1);
});

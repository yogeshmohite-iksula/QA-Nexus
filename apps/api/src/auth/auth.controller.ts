// Public auth endpoints, exposed at the URL shape the brief specifies:
//   POST /auth/sign-up
//   POST /auth/sign-in
//   GET  /auth/callback?token=…   (BetterAuth's verify path is mounted via
//                                  the catch-all in main.ts; this controller
//                                  exposes a thin redirect wrapper for clarity)
//   POST /auth/sign-out
//   GET  /auth/session
//
// BetterAuth's native paths (e.g. /auth/sign-in/magic-link, /auth/get-session,
// /auth/magic-link/verify) remain reachable via the catch-all in main.ts —
// these wrapper controllers exist so the FE/curl surface matches PM1's
// documented public contract without callers having to know BetterAuth's
// internal route layout.
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { z } from 'zod';
import type { AuthService } from './auth.service';

const SignUpBody = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(120).optional(),
  callbackURL: z.string().optional(),
});
const SignInBody = z.object({
  email: z.string().email(),
  callbackURL: z.string().optional(),
});

function reqHeaders(req: Request): Headers {
  const h = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (Array.isArray(v)) v.forEach((vv) => h.append(k, vv));
    else if (typeof v === 'string') h.set(k, v);
  }
  return h;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
  @HttpCode(HttpStatus.OK)
  async signUp(@Body() body: unknown, @Req() req: Request) {
    const parsed = SignUpBody.parse(body);
    const result = await this.authService.sendMagicLink({
      email: parsed.email,
      name: parsed.name,
      callbackURL: parsed.callbackURL,
      headers: reqHeaders(req),
    });
    const audit = await this.authService.writeAuthAudit({
      actorEmail: parsed.email,
      actorAuthUserId: null, // user may not exist yet — sign-up creates on verify
      action: 'sign_up_link_sent',
      payload: {
        email: parsed.email,
        name: parsed.name ?? null,
        callbackURL: parsed.callbackURL ?? null,
      },
    });
    return {
      ok: result.status,
      message:
        'Magic link sent (check inbox; in dev, see console for stubbed link).',
      audit_log_id: audit.id,
    };
  }

  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  async signIn(@Body() body: unknown, @Req() req: Request) {
    const parsed = SignInBody.parse(body);
    const result = await this.authService.sendMagicLink({
      email: parsed.email,
      callbackURL: parsed.callbackURL,
      headers: reqHeaders(req),
    });
    const audit = await this.authService.writeAuthAudit({
      actorEmail: parsed.email,
      actorAuthUserId: null,
      action: 'sign_in_link_sent',
      payload: { email: parsed.email, callbackURL: parsed.callbackURL ?? null },
    });
    return {
      ok: result.status,
      message:
        'Magic link sent (check inbox; in dev, see console for stubbed link).',
      audit_log_id: audit.id,
    };
  }

  @Get('callback')
  async callback(
    @Query('token') token: string | undefined,
    @Query('callbackURL') callbackURL: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    if (!token) {
      res.status(400).json({ ok: false, message: 'missing token query param' });
      return;
    }
    // Reuse BetterAuth's native verifier. We forward to its canonical path
    // so cookies are set correctly.
    const verifyUrl =
      `/auth/magic-link/verify?token=${encodeURIComponent(token)}` +
      (callbackURL ? `&callbackURL=${encodeURIComponent(callbackURL)}` : '');
    res.redirect(307, verifyUrl);
  }

  @Post('sign-out')
  @HttpCode(HttpStatus.OK)
  async signOut(@Req() req: Request) {
    const headers = reqHeaders(req);
    // Capture session BEFORE sign-out so we can audit who signed out.
    const session = await this.authService.resolveSession(headers);
    const result = await this.authService.signOut(headers);
    if (session) {
      await this.authService.writeAuthAudit({
        actorEmail: session.appUser.email,
        actorAuthUserId: session.authUser.id,
        action: 'sign_out',
        payload: { email: session.appUser.email },
      });
    }
    return { ok: result.status };
  }

  @Get('session')
  async session(@Req() req: Request) {
    const session = await this.authService.resolveSession(reqHeaders(req));
    if (!session) return { authenticated: false };
    return {
      authenticated: true,
      user: session.appUser,
      authUserId: session.authUser.id,
      expiresAt: session.expiresAt,
    };
  }
}

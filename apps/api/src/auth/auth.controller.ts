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
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  OnModuleInit,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { SignUpBodySchema, SignInBodySchema } from '@qa-nexus/shared';
import { AuthService } from './auth.service';
import { isTrustedCallbackUrl, parseTrustedOrigins } from './callback-url';

// Day-21 Kimi-K2 HIGH triage (d): SignUp/SignIn body schemas extracted to
// `packages/shared/src/schemas/auth.ts` so the FE form validation uses
// the SAME Zod schema this controller uses for inbound body parsing.
// Prevents drift where FE accepts inputs the BE rejects (or vice versa).
//
// Day-21 Kimi-K2 HIGH triage (a): callbackURL is validated against an
// allowlist (TRUSTED_CALLBACK_ORIGINS env var) at TWO points:
//   1. sign-up/sign-in intake — reject 400 if untrusted (don't mint a
//      magic link pointing at an attacker-controlled origin)
//   2. callback redirect — rewrite to /home if untrusted (in case an
//      attacker crafted the verify URL directly)

function reqHeaders(req: Request): Headers {
  const h = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (Array.isArray(v)) v.forEach((vv) => h.append(k, vv));
    else if (typeof v === 'string') h.set(k, v);
  }
  return h;
}

@Controller('auth')
export class AuthController implements OnModuleInit {
  private readonly logger = new Logger(AuthController.name);
  /** Day-21 Kimi-K2 HIGH triage (a): boot-loaded trusted origins for
   *  callbackURL validation. NEVER read process.env elsewhere in this
   *  controller. */
  private trustedOrigins!: Set<string>;

  constructor(private readonly authService: AuthService) {}

  onModuleInit(): void {
    this.trustedOrigins = parseTrustedOrigins(
      process.env.TRUSTED_CALLBACK_ORIGINS,
    );
    this.logger.log(
      `trusted callback origins loaded: ${[...this.trustedOrigins].join(', ')}`,
    );
  }

  /** Validate callbackURL on intake (sign-up/sign-in). REJECTS with 400
   *  rather than silently rewriting — the FE built the URL, so a mismatch
   *  is a programming error worth surfacing. */
  private assertTrustedCallback(callbackURL: string | undefined): void {
    if (!isTrustedCallbackUrl(callbackURL, this.trustedOrigins)) {
      throw new BadRequestException({
        ok: false,
        error: 'UntrustedCallbackURL',
        message:
          'callbackURL must be a same-origin path (/...) or match an entry in TRUSTED_CALLBACK_ORIGINS.',
      });
    }
  }

  @Post('sign-up')
  @HttpCode(HttpStatus.OK)
  async signUp(@Body() body: unknown, @Req() req: Request) {
    const parsed = SignUpBodySchema.parse(body);
    this.assertTrustedCallback(parsed.callbackURL);
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
    const parsed = SignInBodySchema.parse(body);
    this.assertTrustedCallback(parsed.callbackURL);
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
    // Day-21 Kimi-K2 HIGH triage (a) — open-redirect protection.
    // If callbackURL is untrusted, REWRITE to /home instead of forwarding
    // it through to BetterAuth's verifier (which would redirect there
    // after setting the session cookie — an attacker's phishing chain).
    // We rewrite (not reject) on the callback path because the user clicked
    // a magic link in good faith; failing the redirect would lock them out.
    let safeCallbackURL = callbackURL;
    if (!isTrustedCallbackUrl(callbackURL, this.trustedOrigins)) {
      this.logger.warn(
        `rejected untrusted callbackURL on /auth/callback: ${callbackURL?.slice(0, 200)} — rewriting to /home`,
      );
      safeCallbackURL = '/home';
    }
    // Reuse BetterAuth's native verifier. We forward to its canonical path
    // so cookies are set correctly.
    const verifyUrl =
      `/auth/magic-link/verify?token=${encodeURIComponent(token)}` +
      (safeCallbackURL
        ? `&callbackURL=${encodeURIComponent(safeCallbackURL)}`
        : '');
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

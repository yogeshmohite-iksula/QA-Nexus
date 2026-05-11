// QA Nexus PM1 — EmailService.
//
// Spec: ADR-018 (Day-16) — migration from nodemailer/Gmail SMTP to
// Resend HTTPS API. Render Free tier silently blocks outbound SMTP
// connections (Sept 2025 policy), so the ADR-008 SMTP path stopped
// delivering email in production. Resend's HTTPS POST to api.resend.com
// bypasses the block; free tier 3,000 emails/month is sufficient for
// the 8-user pilot. Public API contract from Day-6 (sendInvitation /
// sendMagicLink / sendPasswordReset / send / getCapturedEmails /
// clearCapturedEmails) is preserved verbatim — only the underlying
// transport changed.
//
// Modes (DEFERRED-pattern, mirrors LLMGateway / R2Service):
//   - REAL    : RESEND_API_KEY parsed OK + NODE_ENV != test. Calls
//               resend.emails.send().
//   - DEFERRED: RESEND_API_KEY missing OR Zod parse failure. Logs body
//               to stdout + returns { messageId: 'deferred-<uuid>',
//               stubbed: true }. Visible-warning at boot. Same shape as
//               ADR-008 to keep operator muscle memory.
//   - CAPTURE : NODE_ENV=test OR EMAIL_TEST_CAPTURE=true. In-memory
//               queue, no transport calls. Tests assert via
//               getCapturedEmails().
//
// BCC discipline (Day-8 follow-up, retained): every send sets
// `bcc: RESEND_BCC_EMAIL` (when set) so Yogesh's work email gets a
// silent pilot-tracking copy. Recipient does NOT see this in headers
// (BCC is hidden by RFC). Without BCC the audit log is the only
// ground-truth — adding BCC gives Yogesh a human-readable inbox view
// without adding any FE work.
//
// Error policy: Resend SDK failures are LOGGED + RETURNED with
// { messageId, error }, never thrown. Caller (invitations service)
// captures the error in its audit row — invite still committed,
// user can resend. RESEND_API_KEY is redacted from any error message
// before logging (defence-in-depth, mirrors SMTP_PASSWORD redaction).

import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Resend } from 'resend';
import { parseResendEnv, type ResendEnv } from '@qa-nexus/shared';
import {
  renderInvitationSubject,
  renderInvitationHtml,
  renderInvitationText,
  type InvitationTemplateParams,
} from './templates/invitation';

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendResult {
  messageId: string;
  stubbed: boolean;
  error?: string;
}

/** Backwards-compat alias for legacy auth.config.ts call-site. */
export interface SendResultLegacy {
  id: string;
  stubbed: boolean;
}

export interface CapturedEmail extends SendEmailParams {
  capturedAt: string;
  messageId: string;
  /** BCC value at time of capture — proves the BCC wiring is live in tests. */
  bcc?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend | null = null;
  private resendEnv: ResendEnv | null = null;
  private mode: 'real' | 'deferred' | 'capture' = 'deferred';
  private captureQueue: CapturedEmail[] = [];

  constructor() {
    this.initialize();
  }

  /** Re-readable from tests so env changes between tests take effect. */
  initialize(): void {
    // Capture mode wins for test isolation.
    if (
      process.env.NODE_ENV === 'test' ||
      process.env.EMAIL_TEST_CAPTURE === 'true'
    ) {
      this.mode = 'capture';
      this.resend = null;
      this.resendEnv = null;
      return;
    }

    try {
      this.resendEnv = parseResendEnv(process.env);
      this.mode = 'real';
      this.resend = new Resend(this.resendEnv.RESEND_API_KEY);
      // Boot log — NEVER includes the API key.
      this.logger.log(
        `EmailService REAL: Resend HTTPS API · ` +
          `from="${this.resendEnv.RESEND_FROM_NAME}" <${this.resendEnv.RESEND_FROM_EMAIL}>` +
          (this.resendEnv.RESEND_REPLY_TO
            ? ` reply-to=${this.resendEnv.RESEND_REPLY_TO}`
            : '') +
          (this.resendEnv.RESEND_BCC_EMAIL
            ? ` bcc=${this.resendEnv.RESEND_BCC_EMAIL}`
            : ' bcc=(none)'),
      );
      // Compatibility hint: SMTP_* env vars from ADR-008 are no longer
      // consumed. Warn so operators can clean them up (followup (bh)).
      if (process.env.SMTP_HOST || process.env.SMTP_USER) {
        this.logger.warn(
          `SMTP_* env vars detected but unused — ADR-018 superseded ADR-008. ` +
            `Remove SMTP_HOST/PORT/SECURE/USER/PASSWORD/FROM_NAME/FROM_EMAIL/` +
            `REPLY_TO/BCC_EMAIL from Render env vars (followup (bh)).`,
        );
      }
    } catch (err) {
      // Validation failure → deferred mode, NOT a hard crash. The API
      // still boots; invitations + magic-links log to stdout instead
      // of sending. /health surfaces deferred state.
      this.mode = 'deferred';
      this.resend = null;
      this.resendEnv = null;
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `EmailService DEFERRED — Resend env invalid: ${msg}. ` +
          `Magic-links + invites will be logged to stdout. Set RESEND_API_KEY ` +
          `(plus optional RESEND_FROM_EMAIL/NAME/REPLY_TO/BCC_EMAIL) on Render ` +
          `to enable real sending. (See ADR-018.)`,
      );
    }
  }

  /** Snapshot for /health. Boolean-only — no env values leak. */
  getHealth(): {
    mode: 'real' | 'deferred' | 'capture';
    from: string | null;
    bccEnabled: boolean;
  } {
    return {
      mode: this.mode,
      from: this.resendEnv?.RESEND_FROM_EMAIL ?? null,
      bccEnabled: !!this.resendEnv?.RESEND_BCC_EMAIL,
    };
  }

  // ────────────────────────────────────────────────────────────────────
  // High-level methods (M1 contract; preserved verbatim from Day-6).
  // ────────────────────────────────────────────────────────────────────

  async sendInvitation(params: InvitationTemplateParams): Promise<SendResult> {
    const subject = renderInvitationSubject({
      inviterName: params.inviterName,
      workspaceName: params.workspaceName,
    });
    const html = renderInvitationHtml(params);
    const text = renderInvitationText(params);
    return this.sendInternal({ to: params.to, subject, html, text });
  }

  async sendMagicLink(params: {
    to: string;
    magicLinkUrl: string;
    expiresAt: string;
  }): Promise<SendResult> {
    const subject = 'Your QA Nexus sign-in link';
    const text = [
      `Sign in to QA Nexus:`,
      ``,
      params.magicLinkUrl,
      ``,
      `This link expires ${params.expiresAt}.`,
      `If you didn't request this, ignore the email.`,
    ].join('\n');
    const html =
      `<p>Sign in to QA Nexus:</p>` +
      `<p><a href="${params.magicLinkUrl}">${params.magicLinkUrl}</a></p>` +
      `<p>This link expires ${params.expiresAt}.</p>`;
    return this.sendInternal({ to: params.to, subject, html, text });
  }

  async sendPasswordReset(params: {
    to: string;
    resetUrl: string;
    expiresAt: string;
  }): Promise<SendResult> {
    const subject = 'Reset your QA Nexus password';
    const text = [
      `Reset your QA Nexus password:`,
      ``,
      params.resetUrl,
      ``,
      `This link expires ${params.expiresAt}.`,
      `If you didn't request this, ignore the email.`,
    ].join('\n');
    const html =
      `<p>Reset your QA Nexus password:</p>` +
      `<p><a href="${params.resetUrl}">${params.resetUrl}</a></p>` +
      `<p>This link expires ${params.expiresAt}.</p>`;
    return this.sendInternal({ to: params.to, subject, html, text });
  }

  /** Backwards-compat for auth.config.ts (BetterAuth magic-link callback). */
  async send(params: SendEmailParams): Promise<SendResultLegacy> {
    const result = await this.sendInternal(params);
    return { id: result.messageId, stubbed: result.stubbed };
  }

  // ────────────────────────────────────────────────────────────────────
  // Test-mode capture queue.
  // ────────────────────────────────────────────────────────────────────

  getCapturedEmails(): CapturedEmail[] {
    return [...this.captureQueue];
  }
  clearCapturedEmails(): void {
    this.captureQueue = [];
  }

  // ────────────────────────────────────────────────────────────────────
  // Internal — single send path used by every public method.
  // ────────────────────────────────────────────────────────────────────

  private async sendInternal(params: SendEmailParams): Promise<SendResult> {
    if (this.mode === 'capture') {
      const messageId = `captured-${randomUUID()}`;
      // Capture the BCC value the real path WOULD have used so tests
      // can assert wiring without Resend mocking. In capture mode we
      // read RESEND_BCC_EMAIL directly from env if set; otherwise
      // undefined (tests that need to assert the field can set the env).
      this.captureQueue.push({
        ...params,
        messageId,
        capturedAt: new Date().toISOString(),
        bcc: process.env.RESEND_BCC_EMAIL,
      });
      return { messageId, stubbed: true };
    }

    if (this.mode === 'deferred' || !this.resend || !this.resendEnv) {
      this.logger.log(
        `\n  ==== DEFERRED EMAIL (Resend env invalid) ====` +
          `\n    to:      ${params.to}` +
          `\n    subject: ${params.subject}` +
          `\n    text:    ${params.text ?? '(html-only)'}` +
          `\n  =============================================`,
      );
      return { messageId: `deferred-${randomUUID()}`, stubbed: true };
    }

    try {
      // Resend SDK shape: emails.send({ from, to, subject, html, text,
      // bcc?, reply_to? }) → { data: { id } | null, error: ... | null }.
      // Note: SDK uses snake_case `reply_to` per Resend HTTP API.
      const response = await this.resend.emails.send({
        from: `${this.resendEnv.RESEND_FROM_NAME} <${this.resendEnv.RESEND_FROM_EMAIL}>`,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
        ...(this.resendEnv.RESEND_BCC_EMAIL
          ? { bcc: this.resendEnv.RESEND_BCC_EMAIL }
          : {}),
        ...(this.resendEnv.RESEND_REPLY_TO
          ? { replyTo: this.resendEnv.RESEND_REPLY_TO }
          : {}),
      });

      // Resend returns { data, error } — error is non-null on API
      // failures (invalid API key, rate limit, malformed payload, etc.).
      // We translate to our { messageId, error } shape for symmetry
      // with the nodemailer path callers already handle.
      if (response.error) {
        const safeMsg = this.redact(
          typeof response.error === 'object' && 'message' in response.error
            ? String(response.error.message)
            : JSON.stringify(response.error),
        );
        this.logger.error(`Resend send failed for to=${params.to}: ${safeMsg}`);
        return {
          messageId: `failed-${randomUUID()}`,
          stubbed: false,
          error: safeMsg,
        };
      }

      const messageId = response.data?.id ?? 'unknown';
      return { messageId, stubbed: false };
    } catch (err) {
      // Network failure / SDK throw / unexpected runtime error.
      const msg = err instanceof Error ? err.message : String(err);
      const safeMsg = this.redact(msg);
      this.logger.error(`Resend send threw for to=${params.to}: ${safeMsg}`);
      return {
        messageId: `failed-${randomUUID()}`,
        stubbed: false,
        error: safeMsg,
      };
    }
  }

  /** Defence-in-depth: NEVER let RESEND_API_KEY leak into a logged
   *  message. Resend SDK error messages can sometimes echo back the
   *  bearer token from the failed request — strip it if present. */
  private redact(msg: string): string {
    if (!this.resendEnv?.RESEND_API_KEY) return msg;
    return msg.split(this.resendEnv.RESEND_API_KEY).join('<redacted>');
  }
}

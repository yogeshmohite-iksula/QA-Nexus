// QA Nexus PM1 — EmailService.
//
// Spec: ADR-008 (Day-8) — swap from Resend stub to Gmail SMTP via
// nodemailer. Resend custom-domain wiring blocked by IT in Day-7
// follow-up; Gmail App Password is the pilot bridge.
//
// Modes (DEFERRED-pattern, mirrors LLMGateway / R2Service):
//   - REAL    : Full SMTP env present + parsed. Calls nodemailer.sendMail.
//   - DEFERRED: SMTP env partially missing OR parse failure. Logs body
//               to stdout + returns { messageId: 'deferred-<uuid>',
//               stubbed: true }. Visible-warning at boot.
//   - CAPTURE : NODE_ENV=test OR EMAIL_TEST_CAPTURE=true. In-memory
//               queue, no transport calls. Tests assert via getCapturedEmails().
//
// BCC discipline (Day-8 follow-up): every send sets `bcc: SMTP_BCC_EMAIL`
// so Yogesh's work email gets a silent pilot-tracking copy. Recipient
// does NOT see this in headers (BCC is hidden by RFC). Without BCC,
// the audit log is the only ground-truth — adding BCC gives Yogesh a
// human-readable inbox view without adding any FE work.
//
// Error policy: nodemailer failures are LOGGED + RETURNED with
// { messageId, error }, never thrown. Caller (invitations service)
// captures the error in its audit row — invite still committed,
// user can resend.
//
// Public API contract preserved from Day-6 (Resend version):
//   - sendInvitation / sendMagicLink / sendPasswordReset / send / getHealth
//   - getCapturedEmails / clearCapturedEmails for tests

import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { createTransport, type Transporter } from 'nodemailer';
import { parseSmtpEnv, type SmtpEnv } from '@qa-nexus/shared';
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
  private transporter: Transporter | null = null;
  private smtpEnv: SmtpEnv | null = null;
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
      this.transporter = null;
      this.smtpEnv = null;
      return;
    }

    try {
      this.smtpEnv = parseSmtpEnv(process.env);
      this.mode = 'real';
      this.transporter = createTransport({
        host: this.smtpEnv.SMTP_HOST,
        port: this.smtpEnv.SMTP_PORT,
        secure: this.smtpEnv.SMTP_SECURE, // false for 587 STARTTLS
        auth: {
          user: this.smtpEnv.SMTP_USER,
          pass: this.smtpEnv.SMTP_PASSWORD,
        },
      });
      // Boot log — NEVER includes the password.
      this.logger.log(
        `EmailService REAL: ${this.smtpEnv.SMTP_HOST}:${this.smtpEnv.SMTP_PORT} ` +
          `secure=${this.smtpEnv.SMTP_SECURE} from=${this.smtpEnv.SMTP_FROM_EMAIL} ` +
          `bcc=${this.smtpEnv.SMTP_BCC_EMAIL}`,
      );
    } catch (err) {
      // Validation failure → deferred mode, NOT a hard crash. The API
      // still boots; invitations + magic-links log to stdout instead
      // of sending. /health surfaces deferred state.
      this.mode = 'deferred';
      this.transporter = null;
      this.smtpEnv = null;
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `EmailService DEFERRED — SMTP env invalid: ${msg}. ` +
          `Magic-links + invites will be logged to stdout. Set the SMTP_* ` +
          `env vars on Render to enable real sending. (See ADR-008.)`,
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
      from: this.smtpEnv?.SMTP_FROM_EMAIL ?? null,
      bccEnabled: !!this.smtpEnv?.SMTP_BCC_EMAIL,
    };
  }

  // ────────────────────────────────────────────────────────────────────
  // High-level methods (M1 contract; preserved from Day-6).
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
      // can assert wiring without nodemailer mocking. In capture mode
      // we read SMTP_BCC_EMAIL directly from env if set; otherwise
      // undefined (tests that need to assert the field can set the env).
      this.captureQueue.push({
        ...params,
        messageId,
        capturedAt: new Date().toISOString(),
        bcc: process.env.SMTP_BCC_EMAIL,
      });
      return { messageId, stubbed: true };
    }

    if (this.mode === 'deferred' || !this.transporter || !this.smtpEnv) {
      this.logger.log(
        `\n  ==== DEFERRED EMAIL (SMTP env invalid) ====` +
          `\n    to:      ${params.to}` +
          `\n    subject: ${params.subject}` +
          `\n    text:    ${params.text ?? '(html-only)'}` +
          `\n  ===========================================`,
      );
      return { messageId: `deferred-${randomUUID()}`, stubbed: true };
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"${this.smtpEnv.SMTP_FROM_NAME}" <${this.smtpEnv.SMTP_FROM_EMAIL}>`,
        to: params.to,
        bcc: this.smtpEnv.SMTP_BCC_EMAIL, // silent pilot-tracking copy
        replyTo: this.smtpEnv.SMTP_REPLY_TO,
        subject: params.subject,
        html: params.html,
        text: params.text,
      });
      // nodemailer's sendMail resolves with { messageId, accepted, rejected, ... }
      return { messageId: info.messageId ?? 'unknown', stubbed: false };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // Defensive: NEVER let SMTP_PASSWORD or full env leak into the
      // logged message. nodemailer's error.message can sometimes
      // include parts of the auth header — trim if so.
      const safeMsg = this.smtpEnv?.SMTP_PASSWORD
        ? msg.replace(this.smtpEnv.SMTP_PASSWORD, '<redacted>')
        : msg;
      this.logger.error(`SMTP send failed for to=${params.to}: ${safeMsg}`);
      return {
        messageId: `failed-${randomUUID()}`,
        stubbed: false,
        error: safeMsg,
      };
    }
  }
}

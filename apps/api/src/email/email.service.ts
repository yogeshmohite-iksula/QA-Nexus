// Email send abstraction. PM1 uses Resend (free tier — 3000 emails/month
// for the upgraded pilot account; 100/day on the dev account).
//
// Modes (DEFERRED-pattern, mirrors LLMGateway / R2Service from M0):
//   - REAL    : RESEND_API_KEY set + non-placeholder. Calls
//               resend.emails.send(); returns Resend's message id.
//   - DEFERRED: key missing or placeholder. Returns
//               { messageId: 'deferred-<uuid>', stubbed: true } and
//               logs the email body to stdout (so dev can copy magic links).
//   - CAPTURE : NODE_ENV=test OR EMAIL_TEST_CAPTURE=true. In-memory
//               queue, no SDK calls. Tests assert via getCapturedEmails().
//
// Error policy (M1 Day-6 PM brief): Resend failures are LOGGED + RETURNED
// with `{ messageId, error }` instead of thrown. Callers (e.g. invitations
// service) capture the error in their audit row — invite is still
// committed, user can resend. This trades fail-fast for "don't lose the
// invitation just because Resend has a bad afternoon".
//
// Spec: M1 Day-6 PM Block 1.
import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Resend } from 'resend';
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

/** Result shape of all send methods. `error` is set on Resend failures
 *  WITHOUT throwing; `stubbed` flags deferred / capture mode. */
export interface SendResult {
  messageId: string;
  stubbed: boolean;
  error?: string;
}

/** Backwards-compat alias for existing call-sites (auth.config.ts).
 *  New code should prefer SendResult. */
export interface SendResultLegacy {
  id: string;
  stubbed: boolean;
}

/** In-memory entry shape for CAPTURE mode (test assertions only). */
export interface CapturedEmail extends SendEmailParams {
  capturedAt: string;
  messageId: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend | null = null;
  private fromAddress = 'noreply@qa-nexus.iksula.com';
  private mode: 'real' | 'deferred' | 'capture' = 'deferred';
  private captureQueue: CapturedEmail[] = [];

  constructor() {
    this.initialize();
  }

  /** Re-readable from tests so changes to env between tests take effect. */
  initialize(): void {
    this.fromAddress =
      process.env.RESEND_FROM_EMAIL ?? 'noreply@qa-nexus.iksula.com';

    // Capture mode wins (test isolation requirement) over real-vs-deferred.
    if (
      process.env.NODE_ENV === 'test' ||
      process.env.EMAIL_TEST_CAPTURE === 'true'
    ) {
      this.mode = 'capture';
      this.resend = null;
      return;
    }

    const apiKey = process.env.RESEND_API_KEY;
    const isPlaceholder =
      !apiKey || apiKey === 'REPLACE_ME' || apiKey.startsWith('re_REPLACE');
    if (isPlaceholder) {
      this.mode = 'deferred';
      this.resend = null;
      this.logger.warn(
        'EmailService running in DEFERRED MODE — RESEND_API_KEY missing or placeholder. ' +
          'Magic-link URLs will be logged to stdout.',
      );
    } else {
      this.mode = 'real';
      this.resend = new Resend(apiKey);
    }
  }

  /** Snapshot for /health. Boolean-only — no env values leak. */
  getHealth(): { mode: 'real' | 'deferred' | 'capture'; from: string } {
    return { mode: this.mode, from: this.fromAddress };
  }

  // ────────────────────────────────────────────────────────────────────
  // High-level methods (M1 Day-6 PM Block 1).
  // ────────────────────────────────────────────────────────────────────

  /** Invitation email — wraps the canonical template + send path. */
  async sendInvitation(params: InvitationTemplateParams): Promise<SendResult> {
    const subject = renderInvitationSubject({
      inviterName: params.inviterName,
      workspaceName: params.workspaceName,
    });
    const html = renderInvitationHtml(params);
    const text = renderInvitationText(params);
    return this.sendInternal({ to: params.to, subject, html, text });
  }

  /** Magic-link email — STUB until T021 BetterAuth wiring lands.
   *  Body still renders + sends so dev can verify the wiring end-to-end. */
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

  /** Password-reset email — STUB. M1.5+ when password flow lands. */
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

  // ────────────────────────────────────────────────────────────────────
  // Backwards-compat send() — kept so auth.config.ts (BetterAuth magic-
  // link callback) keeps working without a touch. New code MUST prefer
  // the high-level methods above.
  // ────────────────────────────────────────────────────────────────────

  async send(params: SendEmailParams): Promise<SendResultLegacy> {
    const result = await this.sendInternal(params);
    return { id: result.messageId, stubbed: result.stubbed };
  }

  // ────────────────────────────────────────────────────────────────────
  // Test-mode capture queue.
  // ────────────────────────────────────────────────────────────────────

  /** Returns a defensive copy of captured emails. Empty if not in
   *  capture mode. Use in tests after triggering an email-sending op. */
  getCapturedEmails(): CapturedEmail[] {
    return [...this.captureQueue];
  }

  /** Clear the capture queue between tests. Idempotent. */
  clearCapturedEmails(): void {
    this.captureQueue = [];
  }

  // ────────────────────────────────────────────────────────────────────
  // Internal — single send path used by every public method.
  // ────────────────────────────────────────────────────────────────────

  private async sendInternal(params: SendEmailParams): Promise<SendResult> {
    if (this.mode === 'capture') {
      const messageId = `captured-${randomUUID()}`;
      this.captureQueue.push({
        ...params,
        messageId,
        capturedAt: new Date().toISOString(),
      });
      return { messageId, stubbed: true };
    }

    if (this.mode === 'deferred' || !this.resend) {
      this.logger.log(
        `\n  ==== DEFERRED EMAIL (no RESEND_API_KEY) ====` +
          `\n    to:      ${params.to}` +
          `\n    subject: ${params.subject}` +
          `\n    text:    ${params.text ?? '(html-only)'}` +
          `\n  ============================================`,
      );
      return { messageId: `deferred-${randomUUID()}`, stubbed: true };
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromAddress,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
      });
      if (error) {
        this.logger.error(
          `Resend send failed for to=${params.to}: ${error.message}`,
        );
        return {
          messageId: `failed-${randomUUID()}`,
          stubbed: false,
          error: error.message,
        };
      }
      return { messageId: data?.id ?? 'unknown', stubbed: false };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Resend SDK threw for to=${params.to}: ${msg}`);
      return {
        messageId: `failed-${randomUUID()}`,
        stubbed: false,
        error: msg,
      };
    }
  }
}

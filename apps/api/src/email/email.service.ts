// QA Nexus PM1 — EmailService (provider-strategy; ADR-025 supersedes ADR-018
// for the pilot transport).
//
// Public API (sendInvitation / sendMagicLink / sendPasswordReset / send /
// getCapturedEmails / clearCapturedEmails / getHealth) is preserved VERBATIM
// from Day-6 — BetterAuth's magic-link callback + the invitations service are
// untouched. Only the transport became pluggable.
//
// ADR-025 (Day-3+4 pilot): EMAIL_PROVIDER selects the active provider
// (default 'apps-script'); the other is a fallback if the primary is
// unconfigured. apps-script = Google Apps Script Web App (Workspace sender
// yogesh.mohite@iksula.com, 1500/day, $0, no DNS DKIM/SPF) for the pilot;
// resend = the ADR-018 path, re-enabled with EMAIL_PROVIDER=resend once
// mail.qanexus.iksula.com is verified — a pure env swap, no code change.
//
// Modes:
//   - CAPTURE  : NODE_ENV=test or EMAIL_TEST_CAPTURE=true. In-memory queue.
//   - REAL     : an active provider isReady(). Delegates to it.
//   - DEFERRED : no provider ready. Logs the body to stdout, returns a stub.
//
// Error policy unchanged: provider failures are LOGGED + RETURNED with
// { messageId: 'failed-…', error }, never thrown — the caller (invitations)
// captures the error in its audit row. Secrets (RESEND_API_KEY / Apps Script
// shared secret) are redacted inside each provider before the error surfaces.

import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  renderInvitationSubject,
  renderInvitationHtml,
  renderInvitationText,
  type InvitationTemplateParams,
} from './templates/invitation';
import type { EmailProvider } from './providers/email-provider.interface';
import { AppsScriptEmailProvider } from './providers/apps-script.provider';
import { ResendEmailProvider } from './providers/resend.provider';

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

type Mode = 'real' | 'deferred' | 'capture';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private mode: Mode = 'deferred';
  private active: EmailProvider | null = null;
  private providerName: string | null = null;
  private captureQueue: CapturedEmail[] = [];

  constructor(
    private readonly appsScript: AppsScriptEmailProvider,
    private readonly resend: ResendEmailProvider,
  ) {
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
      this.active = null;
      this.providerName = null;
      return;
    }

    const want = (process.env.EMAIL_PROVIDER ?? 'apps-script').toLowerCase();
    const primary = want === 'resend' ? this.resend : this.appsScript;
    const fallback = want === 'resend' ? this.appsScript : this.resend;

    if (primary.isReady()) {
      this.active = primary;
    } else if (fallback.isReady()) {
      this.active = fallback;
      this.logger.warn(
        `EmailService: requested provider '${want}' not configured — ` +
          `falling back to '${fallback.name}'.`,
      );
    } else {
      this.active = null;
    }

    if (this.active) {
      this.mode = 'real';
      this.providerName = this.active.name;
      this.logger.log(
        `EmailService REAL · provider=${this.active.name} · ${this.active.describe()}`,
      );
    } else {
      this.mode = 'deferred';
      this.providerName = null;
      this.logger.warn(
        `EmailService DEFERRED — no email provider configured ` +
          `(EMAIL_PROVIDER='${want}'). Magic-links + invites log to stdout. ` +
          `Set APPS_SCRIPT_EMAIL_URL + APPS_SCRIPT_EMAIL_SECRET (apps-script) or ` +
          `RESEND_API_KEY (resend) on Render. (See ADR-025.)`,
      );
    }
  }

  /** Snapshot for /health. Boolean-only — no env values leak. Shape preserved
   *  from ADR-018 so the /health readout + its tests are untouched. */
  getHealth(): {
    mode: Mode;
    from: string | null;
    bccEnabled: boolean;
  } {
    return {
      mode: this.mode,
      from: this.active?.fromAddress() ?? null,
      // BCC is a Resend-only capability; the Apps Script bridge has no BCC field.
      bccEnabled:
        this.providerName === 'resend' && !!process.env.RESEND_BCC_EMAIL,
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
      this.captureQueue.push({
        ...params,
        messageId,
        capturedAt: new Date().toISOString(),
        bcc: process.env.RESEND_BCC_EMAIL,
      });
      return { messageId, stubbed: true };
    }

    if (this.mode === 'deferred' || !this.active) {
      this.logger.log(
        `\n  ==== DEFERRED EMAIL (no provider configured) ====` +
          `\n    to:      ${params.to}` +
          `\n    subject: ${params.subject}` +
          `\n    text:    ${params.text ?? '(html-only)'}` +
          `\n  =================================================`,
      );
      return { messageId: `deferred-${randomUUID()}`, stubbed: true };
    }

    const result = await this.active.send(params);
    if (result.error) {
      this.logger.error(
        `Email send failed via ${this.active.name} for to=${params.to}: ${result.error}`,
      );
      return {
        messageId: result.messageId,
        stubbed: false,
        error: result.error,
      };
    }
    return { messageId: result.messageId, stubbed: false };
  }
}

// QA Nexus PM1 — Resend email provider (ADR-018 transport behind ADR-025 strategy).
//
// The original EmailService Resend logic, extracted behind EmailProvider so it
// can be selected via EMAIL_PROVIDER=resend — the post-pilot migration target
// once mail.qanexus.iksula.com is verified in Resend. Preserved verbatim: env
// parsing, BCC, reply-to, and RESEND_API_KEY redaction in errors.

import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Resend } from 'resend';
import { parseResendEnv, type ResendEnv } from '@qa-nexus/shared';
import type {
  EmailProvider,
  ProviderSendArgs,
  ProviderSendResult,
} from './email-provider.interface';

@Injectable()
export class ResendEmailProvider implements EmailProvider {
  readonly name = 'resend';
  private resend: Resend | null = null;
  private env: ResendEnv | null = null;

  constructor() {
    try {
      this.env = parseResendEnv(process.env);
      this.resend = new Resend(this.env.RESEND_API_KEY);
    } catch {
      // Not configured (e.g. RESEND_API_KEY absent) — isReady() stays false;
      // EmailService surfaces the reason at boot.
      this.env = null;
      this.resend = null;
    }
  }

  isReady(): boolean {
    return this.resend !== null && this.env !== null;
  }

  fromAddress(): string | null {
    return this.env?.RESEND_FROM_EMAIL ?? null;
  }

  describe(): string {
    if (!this.env) return 'Resend (not configured)';
    return (
      `Resend HTTPS · from="${this.env.RESEND_FROM_NAME}" <${this.env.RESEND_FROM_EMAIL}>` +
      (this.env.RESEND_REPLY_TO
        ? ` reply-to=${this.env.RESEND_REPLY_TO}`
        : '') +
      (this.env.RESEND_BCC_EMAIL
        ? ` bcc=${this.env.RESEND_BCC_EMAIL}`
        : ' bcc=(none)')
    );
  }

  async send(args: ProviderSendArgs): Promise<ProviderSendResult> {
    if (!this.resend || !this.env) {
      return {
        messageId: `failed-${randomUUID()}`,
        error: 'Resend not configured',
      };
    }
    try {
      const response = await this.resend.emails.send({
        from: `${this.env.RESEND_FROM_NAME} <${this.env.RESEND_FROM_EMAIL}>`,
        to: args.to,
        subject: args.subject,
        html: args.html,
        text: args.text,
        ...(this.env.RESEND_BCC_EMAIL
          ? { bcc: this.env.RESEND_BCC_EMAIL }
          : {}),
        ...(this.env.RESEND_REPLY_TO
          ? { replyTo: this.env.RESEND_REPLY_TO }
          : {}),
      });
      if (response.error) {
        const safeMsg = this.redact(
          typeof response.error === 'object' && 'message' in response.error
            ? String(response.error.message)
            : JSON.stringify(response.error),
        );
        return { messageId: `failed-${randomUUID()}`, error: safeMsg };
      }
      return { messageId: response.data?.id ?? 'unknown' };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { messageId: `failed-${randomUUID()}`, error: this.redact(msg) };
    }
  }

  /** Defence-in-depth: never let RESEND_API_KEY leak into a returned/logged error. */
  private redact(msg: string): string {
    if (!this.env?.RESEND_API_KEY) return msg;
    return msg.split(this.env.RESEND_API_KEY).join('<redacted>');
  }
}

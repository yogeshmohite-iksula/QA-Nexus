// QA Nexus PM1 — Apps Script email provider (ADR-025).
//
// Pilot magic-link + invite transport. POSTs to a Google Apps Script Web App
// deployed "Execute as: yogesh.mohite@iksula.com" (Workspace, 1500 recipients/
// day). The envelope sender is fixed by the deployment; this provider supplies a
// display fromName + reply-to. Chosen over Resend for the pilot because every
// transactional-email service needs DNS DKIM/SPF on iksula.com (Iksula
// IT-controlled, blocked) and Resend Pro ($20/mo) violates the $0 gate. Swap to
// Resend with EMAIL_PROVIDER=resend once mail.qanexus.iksula.com verifies.

import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  AppsScriptEmailResponse,
  type AppsScriptEmailRequest,
} from '@qa-nexus/shared';
import type {
  EmailProvider,
  ProviderSendArgs,
  ProviderSendResult,
} from './email-provider.interface';

const TIMEOUT_MS = 10_000;

@Injectable()
export class AppsScriptEmailProvider implements EmailProvider {
  readonly name = 'apps-script';
  private readonly url = process.env.APPS_SCRIPT_EMAIL_URL ?? '';
  private readonly secret = process.env.APPS_SCRIPT_EMAIL_SECRET ?? '';
  private readonly fromName = process.env.APPS_SCRIPT_FROM_NAME ?? 'QA Nexus';
  private readonly replyTo =
    process.env.APPS_SCRIPT_REPLY_TO ?? 'yogesh.mohite@iksula.com';

  isReady(): boolean {
    return this.url.length > 0 && this.secret.length > 0;
  }

  fromAddress(): string {
    // Envelope sender is fixed by the deploy (Execute as: yogesh.mohite@…);
    // reply-to is the address pilot users' replies land in.
    return this.replyTo;
  }

  describe(): string {
    if (!this.isReady()) return 'Apps Script (not configured)';
    let host = '(invalid url)';
    try {
      host = new URL(this.url).host;
    } catch {
      /* keep placeholder */
    }
    return `Apps Script bridge · from="${this.fromName}" reply-to=${this.replyTo} · host=${host}`;
  }

  async send(args: ProviderSendArgs): Promise<ProviderSendResult> {
    if (!this.isReady()) {
      return {
        messageId: `failed-${randomUUID()}`,
        error:
          'Apps Script bridge not configured (APPS_SCRIPT_EMAIL_URL/SECRET missing)',
      };
    }

    const body: AppsScriptEmailRequest = {
      secret: this.secret,
      to: args.to,
      subject: args.subject,
      htmlBody: args.html,
      textBody: args.text,
      fromName: this.fromName,
      replyTo: this.replyTo,
    };

    // Manual AbortController + clearTimeout (not AbortSignal.timeout) so the
    // timer is cancelled the moment the request settles — no dangling timer.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(this.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
        redirect: 'follow', // Apps Script /exec issues a 302 to script.googleusercontent.com
      });

      const rawText = await res.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(rawText);
      } catch {
        return {
          messageId: `failed-${randomUUID()}`,
          error: this.sanitize(
            `non-JSON response (HTTP ${res.status}): ${rawText.slice(0, 160)}`,
          ),
        };
      }

      const json = AppsScriptEmailResponse.safeParse(parsed);
      if (!json.success) {
        return {
          messageId: `failed-${randomUUID()}`,
          error: this.sanitize(
            `unexpected response shape (HTTP ${res.status})`,
          ),
        };
      }
      if (!res.ok || !json.data.ok) {
        return {
          messageId: `failed-${randomUUID()}`,
          error: this.sanitize(json.data.error ?? `HTTP ${res.status}`),
        };
      }

      const remaining =
        json.data.remaining !== undefined ? `-${json.data.remaining}` : '';
      return { messageId: `apps-script-ok${remaining}` };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { messageId: `failed-${randomUUID()}`, error: this.sanitize(msg) };
    } finally {
      clearTimeout(timer);
    }
  }

  /** Never let the shared secret leak into a returned/logged error. */
  private sanitize(msg: string): string {
    if (!this.secret) return msg;
    return msg.split(this.secret).join('<redacted>');
  }
}

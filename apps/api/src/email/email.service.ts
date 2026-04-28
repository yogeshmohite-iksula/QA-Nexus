// Email send abstraction. In PM1 we use Resend (free tier, 100 emails/day).
// Spec: MS0-T014 (Resend account provisioning) is a parallel task; until it
// lands, we stub to console.log so dev work isn't blocked. The wiring (this
// service injected into auth + future modules) is what matters for T021;
// flipping the stub to a real send is a 1-line change once RESEND_API_KEY
// is set in env.
import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null;
  private readonly fromAddress: string;
  private readonly stubMode: boolean;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.fromAddress =
      process.env.RESEND_FROM_EMAIL ?? 'noreply@qa-nexus.iksula.com';
    // Stub if key missing OR if key is a placeholder (T014 not yet provisioned).
    this.stubMode =
      !apiKey || apiKey === 'REPLACE_ME' || apiKey.startsWith('re_REPLACE');
    this.resend = this.stubMode ? null : new Resend(apiKey);
    if (this.stubMode) {
      this.logger.warn(
        'EmailService running in STUB MODE — RESEND_API_KEY missing or placeholder. ' +
          'Magic-link URLs will be logged to stdout. Set a real Resend key (T014) to enable sending.',
      );
    }
  }

  async send(
    params: SendEmailParams,
  ): Promise<{ id: string; stubbed: boolean }> {
    if (this.stubMode || !this.resend) {
      // Highly visible log so devs can copy the magic link.
      this.logger.log(
        `\n  ==== STUB EMAIL (T014 deferred) ====` +
          `\n    to:      ${params.to}` +
          `\n    subject: ${params.subject}` +
          `\n    text:    ${params.text ?? '(html-only)'}` +
          `\n  =====================================`,
      );
      return { id: `stub-${Date.now()}`, stubbed: true };
    }
    const { data, error } = await this.resend.emails.send({
      from: this.fromAddress,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });
    if (error) {
      this.logger.error(`Resend send failed: ${error.message}`);
      throw new Error(`Resend send failed: ${error.message}`);
    }
    return { id: data?.id ?? 'unknown', stubbed: false };
  }
}

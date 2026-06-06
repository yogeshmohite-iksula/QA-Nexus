// QA Nexus PM1 — EmailProvider strategy interface (ADR-025).
//
// EmailService selects an active provider at boot from EMAIL_PROVIDER (default
// 'apps-script'), with the other as a fallback. Each provider owns its own
// transport + from/reply-to config (read from env in its constructor) and
// reports readiness — so the post-pilot swap to Resend is a pure env change.

export interface ProviderSendArgs {
  to: string;
  subject: string;
  /** HTML body. */
  html: string;
  /** Plain-text alternative (deliverability — lowers spam scoring). */
  text?: string;
}

export interface ProviderSendResult {
  /** Transport message id on success; a `failed-<uuid>` marker on failure. */
  messageId: string;
  /** Sanitized (secret-free) error string when the send failed; absent on success. */
  error?: string;
}

export interface EmailProvider {
  /** Stable provider key: 'apps-script' | 'resend'. */
  readonly name: string;
  /** True when the provider has the env it needs to actually send. */
  isReady(): boolean;
  /** Sender/reply-to address surfaced in /health; null if not ready. */
  fromAddress(): string | null;
  /** One-line, secret-free description for the boot log. */
  describe(): string;
  /** Send one email. MUST NOT throw on transport/HTTP failure — return
   *  `{ error }` instead (EmailService translates to a non-throwing result). */
  send(args: ProviderSendArgs): Promise<ProviderSendResult>;
}

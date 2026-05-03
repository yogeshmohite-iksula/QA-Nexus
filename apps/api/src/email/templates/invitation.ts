// QA Nexus PM1 — invitation email template.
//
// Spec: M1 Day-6 PM brief Block 1 (Email service + wire into invitations).
//
// Plain string-template functions — no React Email / MJML / HBS.
// Produces both HTML (with minimal inline styles for Gmail dark-mode
// compatibility) and a plain-text fallback (every modern client falls
// back to text/plain when html fails to render).
//
// Iksula brand: teal accent (#0D9488 — matches PM1_UI_v2/01_SYSTEM.md
// "system" color), violet accent (#7C3AED) reserved for AI-generated
// content (NOT used in transactional emails).

export interface InvitationTemplateParams {
  /** Recipient email — used for the greeting prefix only (NOT logged). */
  to: string;
  /** Workspace name displayed in the subject + body — e.g. "Iksula QA Nexus". */
  workspaceName: string;
  /** Display name of the user who sent the invite — e.g. "Akshay Panchal". */
  inviterName: string;
  /** Workspace role the invitee will receive on accept — e.g. "QAEngineer". */
  role: string;
  /** Magic-link URL the invitee clicks to accept. */
  magicLinkUrl: string;
  /** ISO-8601 expiry timestamp shown to the invitee. */
  expiresAt: string;
}

export function renderInvitationSubject(p: {
  inviterName: string;
  workspaceName: string;
}): string {
  return `${p.inviterName} invited you to ${p.workspaceName} on QA Nexus`;
}

/** Inline-styled HTML. Width 600px (email-safe). Teal CTA button. */
export function renderInvitationHtml(p: InvitationTemplateParams): string {
  // Compact human date for the body — keep ISO in the audit/log.
  const expiresHuman = formatHumanDate(p.expiresAt);
  // Minimal escaping for fields that flow into HTML.
  const safe = (s: string) => htmlEscape(s);

  return `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1c1917;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f5f4;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background:#ffffff;border-radius:8px;border:1px solid #e7e5e4;">
        <tr><td style="padding:32px 32px 16px 32px;">
          <h1 style="margin:0;font-size:20px;font-weight:600;color:#0d9488;">QA Nexus</h1>
        </td></tr>
        <tr><td style="padding:0 32px 24px 32px;">
          <p style="margin:0 0 16px 0;font-size:16px;line-height:1.5;">
            <strong>${safe(p.inviterName)}</strong> invited you to join
            <strong>${safe(p.workspaceName)}</strong> on QA Nexus.
          </p>
          <p style="margin:0 0 24px 0;font-size:14px;line-height:1.5;color:#57534e;">
            Your role on accept: <strong>${safe(p.role)}</strong>
          </p>
          <table role="presentation" cellspacing="0" cellpadding="0">
            <tr><td style="background:#0d9488;border-radius:6px;">
              <a href="${safe(p.magicLinkUrl)}" style="display:inline-block;padding:12px 24px;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;">Accept invitation</a>
            </td></tr>
          </table>
          <p style="margin:24px 0 0 0;font-size:12px;line-height:1.5;color:#78716c;">
            This invitation expires <strong>${safe(expiresHuman)}</strong>.<br>
            If the button doesn't work, copy this URL: <br>
            <span style="font-family:ui-monospace,Menlo,Consolas,monospace;font-size:11px;word-break:break-all;color:#1c1917;">${safe(p.magicLinkUrl)}</span>
          </p>
        </td></tr>
        <tr><td style="padding:16px 32px 24px 32px;border-top:1px solid #e7e5e4;">
          <p style="margin:0;font-size:11px;line-height:1.5;color:#a8a29e;">
            QA Nexus — AI-Native QA Workspace for Iksula.<br>
            You received this because someone with admin access on QA Nexus invited you.
            If this was unexpected, you can safely ignore the email.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/** Plain-text fallback. Every body line ≤72 chars. */
export function renderInvitationText(p: InvitationTemplateParams): string {
  const expiresHuman = formatHumanDate(p.expiresAt);
  return [
    `${p.inviterName} invited you to ${p.workspaceName} on QA Nexus.`,
    ``,
    `Your role on accept: ${p.role}`,
    ``,
    `Accept your invitation:`,
    p.magicLinkUrl,
    ``,
    `This invitation expires ${expiresHuman}.`,
    ``,
    `--`,
    `QA Nexus — AI-Native QA Workspace for Iksula.`,
    `You received this because someone with admin access on QA Nexus`,
    `invited you. If this was unexpected, you can safely ignore the email.`,
  ].join('\n');
}

// ─────────────────────────────────────────────────────────────────────
// Helpers (private — exported only for tests via __tests__/imports).
// ─────────────────────────────────────────────────────────────────────

export function htmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatHumanDate(iso: string): string {
  // Format: "Mon May 5, 14:30 UTC". Keeps it parseable + zone-explicit.
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const opts: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
    hour12: false,
  };
  return new Intl.DateTimeFormat('en-US', opts).format(d) + ' UTC';
}

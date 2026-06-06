// Unit tests for EmailService (ADR-018 — Resend HTTPS API).
//
// Strategy: jest.mock the 'resend' package so no real HTTP request ever
// fires. Pins: capture mode, deferred mode, env validation, graceful
// errors (Resend `error` field + SDK throw), BCC wiring on every send
// (Day-8 Yogesh follow-up retained), template content, API-key
// redaction in error logs (security guarantee, mirrors ADR-008
// SMTP_PASSWORD redaction).
//
// Migration note: ADR-018 supersedes ADR-008 (nodemailer/Gmail SMTP)
// because Render Free tier blocks outbound SMTP. The public API
// surface (sendInvitation / sendMagicLink / sendPasswordReset / send /
// getCapturedEmails / clearCapturedEmails) is unchanged — only the
// underlying transport flipped — so behavioural assertions below
// mirror the pre-migration spec line-for-line where possible.

const mockSend = jest.fn();
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}));

import { EmailService } from '../email.service';
import { AppsScriptEmailProvider } from '../providers/apps-script.provider';
import { ResendEmailProvider } from '../providers/resend.provider';
import { Resend } from 'resend';
import {
  renderInvitationSubject,
  renderInvitationHtml,
  renderInvitationText,
} from '../templates/invitation';

/** ADR-025: EmailService now takes the two provider strategies. Build them
 *  fresh per construction so each reads the current env (providers read env in
 *  their constructors). */
function makeService(): EmailService {
  return new EmailService(
    new AppsScriptEmailProvider(),
    new ResendEmailProvider(),
  );
}

const baseInv = {
  to: 'kishor.kadam@iksula.com',
  workspaceName: 'Iksula QA Nexus',
  inviterName: 'Akshay Panchal',
  role: 'QAEngineer',
  magicLinkUrl: 'https://qa-nexus.pages.dev/accept?token=abc123',
  expiresAt: '2026-05-09T12:00:00Z',
};

/** Set the Resend env (1 required + 4 optional). Used by real-mode tests. */
function setRealEnv(overrides: Partial<Record<string, string>> = {}): void {
  process.env.NODE_ENV = 'production';
  process.env.EMAIL_PROVIDER = 'resend';
  process.env.RESEND_API_KEY = 're_test_qa_nexus_pm1_local_test_only';
  process.env.RESEND_FROM_EMAIL = 'noreply@qanexus.iksula.com';
  process.env.RESEND_FROM_NAME = 'QA Nexus';
  process.env.RESEND_REPLY_TO = 'yogesh.mohite@iksula.com';
  process.env.RESEND_BCC_EMAIL = 'yogesh.mohite@iksula.com';
  for (const [k, v] of Object.entries(overrides)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
}

function clearAllResendEnv(): void {
  delete process.env.RESEND_API_KEY;
  delete process.env.RESEND_FROM_EMAIL;
  delete process.env.RESEND_FROM_NAME;
  delete process.env.RESEND_REPLY_TO;
  delete process.env.RESEND_BCC_EMAIL;
}

describe('EmailService (ADR-018 Resend HTTPS API)', () => {
  const ORIG_ENV = { ...process.env };
  beforeEach(() => {
    mockSend.mockReset();
    (Resend as unknown as jest.Mock).mockClear();
    clearAllResendEnv();
    delete process.env.EMAIL_TEST_CAPTURE;
    delete process.env.EMAIL_PROVIDER;
    delete process.env.APPS_SCRIPT_EMAIL_URL;
    delete process.env.APPS_SCRIPT_EMAIL_SECRET;
    process.env.NODE_ENV = 'test';
  });
  afterAll(() => {
    process.env = ORIG_ENV;
  });

  describe('mode detection', () => {
    it('NODE_ENV=test → capture mode', () => {
      const svc = makeService();
      expect(svc.getHealth().mode).toBe('capture');
      expect(Resend).not.toHaveBeenCalled();
    });

    it('EMAIL_TEST_CAPTURE=true overrides production-looking env', () => {
      setRealEnv();
      process.env.EMAIL_TEST_CAPTURE = 'true';
      const svc = makeService();
      expect(svc.getHealth().mode).toBe('capture');
    });

    it('Resend env complete in production → real mode', () => {
      setRealEnv();
      const svc = makeService();
      expect(svc.getHealth().mode).toBe('real');
      expect(svc.getHealth().from).toBe('noreply@qanexus.iksula.com');
      expect(svc.getHealth().bccEnabled).toBe(true);
      // Resend client constructed with the right key.
      expect(Resend).toHaveBeenCalledTimes(1);
      expect((Resend as unknown as jest.Mock).mock.calls[0][0]).toBe(
        're_test_qa_nexus_pm1_local_test_only',
      );
    });

    it('RESEND_API_KEY missing in production → deferred mode (no crash)', () => {
      process.env.NODE_ENV = 'production';
      // No RESEND_* env at all
      const svc = makeService();
      expect(svc.getHealth().mode).toBe('deferred');
      expect(Resend).not.toHaveBeenCalled();
    });

    it('RESEND_API_KEY without "re_" prefix → deferred mode', () => {
      setRealEnv({ RESEND_API_KEY: 'invalid-format-token-1234567890' });
      const svc = makeService();
      expect(svc.getHealth().mode).toBe('deferred');
    });

    it('only RESEND_API_KEY set → real mode with default from/name (no BCC)', () => {
      process.env.NODE_ENV = 'production';
      process.env.RESEND_API_KEY = 're_minimal_set_for_pilot_bootstrap';
      const svc = makeService();
      expect(svc.getHealth().mode).toBe('real');
      expect(svc.getHealth().from).toBe('onboarding@resend.dev');
      expect(svc.getHealth().bccEnabled).toBe(false);
    });

    it('invalid RESEND_FROM_EMAIL → deferred', () => {
      setRealEnv({ RESEND_FROM_EMAIL: 'not-an-email' });
      const svc = makeService();
      expect(svc.getHealth().mode).toBe('deferred');
    });

    it('EMAIL_PROVIDER=apps-script + bridge configured → real via apps-script', () => {
      process.env.NODE_ENV = 'production';
      process.env.APPS_SCRIPT_EMAIL_URL =
        'https://script.google.com/macros/s/AKfTest/exec';
      process.env.APPS_SCRIPT_EMAIL_SECRET = 'x'.repeat(64);
      const svc = makeService();
      expect(svc.getHealth().mode).toBe('real');
      // apps-script fromAddress() is the reply-to (envelope sender fixed by deploy).
      expect(svc.getHealth().from).toBe('yogesh.mohite@iksula.com');
      // No Resend client built when apps-script is active + RESEND env absent.
      expect(Resend).not.toHaveBeenCalled();
    });

    it('apps-script default but unconfigured + Resend set → falls back to resend', () => {
      process.env.NODE_ENV = 'production';
      process.env.RESEND_API_KEY = 're_fallback_pilot_bootstrap_key';
      const svc = makeService();
      expect(svc.getHealth().mode).toBe('real');
      expect(svc.getHealth().from).toBe('onboarding@resend.dev');
    });
  });

  describe('template content (preserved from Day-6)', () => {
    it('subject is correct', () => {
      const subj = renderInvitationSubject({
        inviterName: baseInv.inviterName,
        workspaceName: baseInv.workspaceName,
      });
      expect(subj).toBe(
        'Akshay Panchal invited you to Iksula QA Nexus on QA Nexus',
      );
    });

    it('text fallback contains key fields', () => {
      const text = renderInvitationText(baseInv);
      expect(text).toContain('Akshay Panchal');
      expect(text).toContain('Iksula QA Nexus');
      expect(text).toContain('QAEngineer');
      expect(text).toContain(baseInv.magicLinkUrl);
      expect(text).toMatch(/UTC/);
    });

    it('html escapes XSS-style input', () => {
      const html = renderInvitationHtml({
        ...baseInv,
        inviterName: '<script>alert(1)</script>',
      });
      expect(html).not.toContain('<script>alert(1)');
      expect(html).toContain('&lt;script&gt;');
    });
  });

  describe('capture mode', () => {
    it('sendInvitation captures into queue (no Resend call)', async () => {
      const svc = makeService();
      const result = await svc.sendInvitation(baseInv);
      expect(result.messageId).toMatch(/^captured-/);
      expect(result.stubbed).toBe(true);
      expect(mockSend).not.toHaveBeenCalled();
      const captured = svc.getCapturedEmails();
      expect(captured).toHaveLength(1);
      expect(captured[0].to).toBe(baseInv.to);
      expect(captured[0].html).toContain(baseInv.magicLinkUrl);
    });

    it('capture records RESEND_BCC_EMAIL when set in env (so wire-tests can assert)', async () => {
      process.env.RESEND_BCC_EMAIL = 'yogesh.mohite@iksula.com';
      const svc = makeService();
      await svc.sendInvitation(baseInv);
      const captured = svc.getCapturedEmails();
      expect(captured[0].bcc).toBe('yogesh.mohite@iksula.com');
    });

    it('clearCapturedEmails empties the queue', async () => {
      const svc = makeService();
      await svc.sendInvitation(baseInv);
      expect(svc.getCapturedEmails()).toHaveLength(1);
      svc.clearCapturedEmails();
      expect(svc.getCapturedEmails()).toHaveLength(0);
    });

    it('sendMagicLink + sendPasswordReset capture with right subjects', async () => {
      const svc = makeService();
      await svc.sendMagicLink({
        to: 'x@iksula.com',
        magicLinkUrl: 'https://x.example/?t=t',
        expiresAt: '2026-05-04T12:00:00Z',
      });
      await svc.sendPasswordReset({
        to: 'x@iksula.com',
        resetUrl: 'https://x.example/reset?t=t',
        expiresAt: '2026-05-04T12:00:00Z',
      });
      const cap = svc.getCapturedEmails();
      expect(cap[0].subject).toBe('Your QA Nexus sign-in link');
      expect(cap[1].subject).toBe('Reset your QA Nexus password');
    });
  });

  describe('deferred mode', () => {
    it('sendInvitation returns deferred-prefixed messageId, no Resend call', async () => {
      process.env.NODE_ENV = 'production';
      // No RESEND env → deferred
      const svc = makeService();
      const result = await svc.sendInvitation(baseInv);
      expect(result.messageId).toMatch(/^deferred-/);
      expect(result.stubbed).toBe(true);
      expect(mockSend).not.toHaveBeenCalled();
    });
  });

  describe('real mode + BCC wiring + graceful errors', () => {
    it('happy path — emails.send called with from/to/bcc/replyTo/subject/html/text', async () => {
      mockSend.mockResolvedValueOnce({
        data: { id: 'resend-id-789' },
        error: null,
      });
      setRealEnv();
      const svc = makeService();
      const result = await svc.sendInvitation(baseInv);
      expect(result.messageId).toBe('resend-id-789');
      expect(result.stubbed).toBe(false);

      expect(mockSend).toHaveBeenCalledTimes(1);
      const arg = mockSend.mock.calls[0][0];
      expect(arg.from).toBe('QA Nexus <noreply@qanexus.iksula.com>');
      expect(arg.to).toBe(baseInv.to);
      // CRITICAL: every send carries the silent BCC to Yogesh's work email.
      expect(arg.bcc).toBe('yogesh.mohite@iksula.com');
      expect(arg.replyTo).toBe('yogesh.mohite@iksula.com');
      expect(arg.subject).toContain('Akshay Panchal');
      expect(arg.html).toContain(baseInv.magicLinkUrl);
      expect(arg.text).toContain(baseInv.magicLinkUrl);
    });

    it('every public method (invite/magic-link/reset) carries the BCC field', async () => {
      mockSend.mockResolvedValue({ data: { id: 'x' }, error: null });
      setRealEnv();
      const svc = makeService();
      await svc.sendInvitation(baseInv);
      await svc.sendMagicLink({
        to: 'x@iksula.com',
        magicLinkUrl: 'https://x.example/?t=t',
        expiresAt: '2026-05-04T12:00:00Z',
      });
      await svc.sendPasswordReset({
        to: 'x@iksula.com',
        resetUrl: 'https://x.example/reset?t=t',
        expiresAt: '2026-05-04T12:00:00Z',
      });
      // 3 calls — verify BCC on each.
      expect(mockSend).toHaveBeenCalledTimes(3);
      for (const call of mockSend.mock.calls) {
        expect(call[0].bcc).toBe('yogesh.mohite@iksula.com');
      }
    });

    it('without RESEND_BCC_EMAIL — bcc field is OMITTED, not undefined', async () => {
      mockSend.mockResolvedValueOnce({ data: { id: 'no-bcc' }, error: null });
      setRealEnv({ RESEND_BCC_EMAIL: undefined });
      const svc = makeService();
      await svc.sendInvitation(baseInv);
      const arg = mockSend.mock.calls[0][0];
      expect('bcc' in arg).toBe(false);
    });

    it('without RESEND_REPLY_TO — replyTo field is OMITTED', async () => {
      mockSend.mockResolvedValueOnce({ data: { id: 'no-rt' }, error: null });
      setRealEnv({ RESEND_REPLY_TO: undefined });
      const svc = makeService();
      await svc.sendInvitation(baseInv);
      const arg = mockSend.mock.calls[0][0];
      expect('replyTo' in arg).toBe(false);
    });

    it('Resend returns { error } — caught, logged, returned as failed result', async () => {
      mockSend.mockResolvedValueOnce({
        data: null,
        error: { message: 'rate_limit_exceeded', name: 'RateLimitError' },
      });
      setRealEnv();
      const svc = makeService();
      const result = await svc.sendInvitation(baseInv);
      expect(result.messageId).toMatch(/^failed-/);
      expect(result.stubbed).toBe(false);
      expect(result.error).toBe('rate_limit_exceeded');
    });

    it('Resend SDK throws — caught, logged, returned as failed result', async () => {
      mockSend.mockRejectedValueOnce(new Error('network unreachable'));
      setRealEnv();
      const svc = makeService();
      const result = await svc.sendInvitation(baseInv);
      expect(result.messageId).toMatch(/^failed-/);
      expect(result.stubbed).toBe(false);
      expect(result.error).toBe('network unreachable');
    });

    it('RESEND_API_KEY never appears in returned error (defence-in-depth)', async () => {
      // Simulate a hostile error message that includes the API key.
      mockSend.mockRejectedValueOnce(
        new Error(
          'auth failure: token=re_test_qa_nexus_pm1_local_test_only rejected',
        ),
      );
      setRealEnv();
      const svc = makeService();
      const result = await svc.sendInvitation(baseInv);
      expect(result.error).toBeDefined();
      expect(result.error).not.toContain(
        're_test_qa_nexus_pm1_local_test_only',
      );
      expect(result.error).toContain('<redacted>');
    });

    it('legacy send() shape still works (auth.config.ts compat)', async () => {
      mockSend.mockResolvedValueOnce({
        data: { id: 'legacy-id' },
        error: null,
      });
      setRealEnv();
      const svc = makeService();
      const result = await svc.send({
        to: 'x@iksula.com',
        subject: 'subj',
        html: '<p>h</p>',
        text: 'h',
      });
      expect(result).toEqual({ id: 'legacy-id', stubbed: false });
      // Legacy path still gets BCC.
      expect(mockSend.mock.calls[0][0].bcc).toBe('yogesh.mohite@iksula.com');
    });
  });
});

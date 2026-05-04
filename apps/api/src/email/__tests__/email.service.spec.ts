// Unit tests for EmailService (Day-8 Gmail SMTP via nodemailer).
//
// Strategy: jest.mock 'nodemailer' so no real SMTP connection ever opens.
// Pins: capture mode, deferred mode, env validation, graceful errors,
// BCC wiring on every send (Day-8 Yogesh follow-up), template content,
// password redaction in error logs (security guarantee).

jest.mock('nodemailer');

import { EmailService } from '../email.service';
import { createTransport } from 'nodemailer';
import {
  renderInvitationSubject,
  renderInvitationHtml,
  renderInvitationText,
} from '../templates/invitation';

const mockSendMail = jest.fn();
(createTransport as unknown as jest.Mock).mockImplementation(() => ({
  sendMail: mockSendMail,
}));

const baseInv = {
  to: 'kishor.kadam@iksula.com',
  workspaceName: 'Iksula QA Nexus',
  inviterName: 'Akshay Panchal',
  role: 'QAEngineer',
  magicLinkUrl: 'https://qa-nexus.pages.dev/accept?token=abc123',
  expiresAt: '2026-05-09T12:00:00Z',
};

/** Set the full 9-var SMTP env. Used by real-mode tests. */
function setRealEnv(overrides: Partial<Record<string, string>> = {}): void {
  process.env.NODE_ENV = 'production';
  process.env.SMTP_HOST = 'smtp.gmail.com';
  process.env.SMTP_PORT = '587';
  process.env.SMTP_SECURE = 'false';
  process.env.SMTP_USER = 'yogesh.ybm999@gmail.com';
  process.env.SMTP_PASSWORD = 'app-password-1234567890abcd';
  process.env.SMTP_FROM_NAME = 'QA Nexus';
  process.env.SMTP_FROM_EMAIL = 'yogesh.ybm999@gmail.com';
  process.env.SMTP_REPLY_TO = 'yogesh.mohite@iksula.com';
  process.env.SMTP_BCC_EMAIL = 'yogesh.mohite@iksula.com';
  for (const [k, v] of Object.entries(overrides)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
}

function clearAllSmtpEnv(): void {
  delete process.env.SMTP_HOST;
  delete process.env.SMTP_PORT;
  delete process.env.SMTP_SECURE;
  delete process.env.SMTP_USER;
  delete process.env.SMTP_PASSWORD;
  delete process.env.SMTP_FROM_NAME;
  delete process.env.SMTP_FROM_EMAIL;
  delete process.env.SMTP_REPLY_TO;
  delete process.env.SMTP_BCC_EMAIL;
}

describe('EmailService (Day-8 Gmail SMTP)', () => {
  const ORIG_ENV = { ...process.env };
  beforeEach(() => {
    mockSendMail.mockReset();
    (createTransport as unknown as jest.Mock).mockClear();
    clearAllSmtpEnv();
    delete process.env.EMAIL_TEST_CAPTURE;
    process.env.NODE_ENV = 'test';
  });
  afterAll(() => {
    process.env = ORIG_ENV;
  });

  describe('mode detection', () => {
    it('NODE_ENV=test → capture mode', () => {
      const svc = new EmailService();
      expect(svc.getHealth().mode).toBe('capture');
    });

    it('EMAIL_TEST_CAPTURE=true overrides production-looking env', () => {
      setRealEnv();
      process.env.EMAIL_TEST_CAPTURE = 'true';
      const svc = new EmailService();
      expect(svc.getHealth().mode).toBe('capture');
    });

    it('SMTP env complete in production → real mode', () => {
      setRealEnv();
      const svc = new EmailService();
      expect(svc.getHealth().mode).toBe('real');
      expect(svc.getHealth().from).toBe('yogesh.ybm999@gmail.com');
      expect(svc.getHealth().bccEnabled).toBe(true);
      // Transport built with the right config
      const cfg = (createTransport as unknown as jest.Mock).mock.calls[0][0];
      expect(cfg.host).toBe('smtp.gmail.com');
      expect(cfg.port).toBe(587);
      expect(cfg.secure).toBe(false); // STARTTLS
      expect(cfg.auth.user).toBe('yogesh.ybm999@gmail.com');
      expect(cfg.auth.pass).toBe('app-password-1234567890abcd');
    });

    it('SMTP env missing in production → deferred mode (no crash)', () => {
      process.env.NODE_ENV = 'production';
      // No SMTP_* env at all
      const svc = new EmailService();
      expect(svc.getHealth().mode).toBe('deferred');
      expect(createTransport).not.toHaveBeenCalled();
    });

    it('SMTP env partial (missing SMTP_BCC_EMAIL) → deferred mode', () => {
      setRealEnv({ SMTP_BCC_EMAIL: undefined });
      const svc = new EmailService();
      expect(svc.getHealth().mode).toBe('deferred');
    });

    it('SMTP_PORT not numeric → deferred (Zod coerce fails)', () => {
      setRealEnv({ SMTP_PORT: 'not-a-number' });
      const svc = new EmailService();
      expect(svc.getHealth().mode).toBe('deferred');
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
    it('sendInvitation captures into queue (no nodemailer call)', async () => {
      const svc = new EmailService();
      const result = await svc.sendInvitation(baseInv);
      expect(result.messageId).toMatch(/^captured-/);
      expect(result.stubbed).toBe(true);
      expect(mockSendMail).not.toHaveBeenCalled();
      const captured = svc.getCapturedEmails();
      expect(captured).toHaveLength(1);
      expect(captured[0].to).toBe(baseInv.to);
      expect(captured[0].html).toContain(baseInv.magicLinkUrl);
    });

    it('capture records SMTP_BCC_EMAIL when set in env (so wire-tests can assert)', async () => {
      process.env.SMTP_BCC_EMAIL = 'yogesh.mohite@iksula.com';
      const svc = new EmailService();
      await svc.sendInvitation(baseInv);
      const captured = svc.getCapturedEmails();
      expect(captured[0].bcc).toBe('yogesh.mohite@iksula.com');
    });

    it('clearCapturedEmails empties the queue', async () => {
      const svc = new EmailService();
      await svc.sendInvitation(baseInv);
      expect(svc.getCapturedEmails()).toHaveLength(1);
      svc.clearCapturedEmails();
      expect(svc.getCapturedEmails()).toHaveLength(0);
    });

    it('sendMagicLink + sendPasswordReset capture with right subjects', async () => {
      const svc = new EmailService();
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
    it('sendInvitation returns deferred-prefixed messageId, no SMTP call', async () => {
      process.env.NODE_ENV = 'production';
      // No SMTP env → deferred
      const svc = new EmailService();
      const result = await svc.sendInvitation(baseInv);
      expect(result.messageId).toMatch(/^deferred-/);
      expect(result.stubbed).toBe(true);
      expect(mockSendMail).not.toHaveBeenCalled();
    });
  });

  describe('real mode + BCC wiring + graceful errors', () => {
    it('happy path — sendMail called with from/to/bcc/replyTo/subject/html/text', async () => {
      mockSendMail.mockResolvedValueOnce({
        messageId: '<gmail-id-789@smtp.gmail.com>',
      });
      setRealEnv();
      const svc = new EmailService();
      const result = await svc.sendInvitation(baseInv);
      expect(result.messageId).toBe('<gmail-id-789@smtp.gmail.com>');
      expect(result.stubbed).toBe(false);

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      const arg = mockSendMail.mock.calls[0][0];
      expect(arg.from).toBe('"QA Nexus" <yogesh.ybm999@gmail.com>');
      expect(arg.to).toBe(baseInv.to);
      // CRITICAL: every send carries the silent BCC to Yogesh's work email.
      expect(arg.bcc).toBe('yogesh.mohite@iksula.com');
      expect(arg.replyTo).toBe('yogesh.mohite@iksula.com');
      expect(arg.subject).toContain('Akshay Panchal');
      expect(arg.html).toContain(baseInv.magicLinkUrl);
      expect(arg.text).toContain(baseInv.magicLinkUrl);
    });

    it('every public method (invite/magic-link/reset) carries the BCC field', async () => {
      mockSendMail.mockResolvedValue({ messageId: 'x' });
      setRealEnv();
      const svc = new EmailService();
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
      expect(mockSendMail).toHaveBeenCalledTimes(3);
      for (const call of mockSendMail.mock.calls) {
        expect(call[0].bcc).toBe('yogesh.mohite@iksula.com');
      }
    });

    it('nodemailer throws — caught, logged, returned as failed result', async () => {
      mockSendMail.mockRejectedValueOnce(new Error('connection refused'));
      setRealEnv();
      const svc = new EmailService();
      const result = await svc.sendInvitation(baseInv);
      expect(result.messageId).toMatch(/^failed-/);
      expect(result.stubbed).toBe(false);
      expect(result.error).toBe('connection refused');
    });

    it('SMTP_PASSWORD never appears in returned error (defence-in-depth)', async () => {
      // Simulate a hostile error message that includes the password.
      mockSendMail.mockRejectedValueOnce(
        new Error('auth failure: pass=app-password-1234567890abcd rejected'),
      );
      setRealEnv();
      const svc = new EmailService();
      const result = await svc.sendInvitation(baseInv);
      expect(result.error).toBeDefined();
      expect(result.error).not.toContain('app-password-1234567890abcd');
      expect(result.error).toContain('<redacted>');
    });

    it('legacy send() shape still works (auth.config.ts compat)', async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: 'legacy-id' });
      setRealEnv();
      const svc = new EmailService();
      const result = await svc.send({
        to: 'x@iksula.com',
        subject: 'subj',
        html: '<p>h</p>',
        text: 'h',
      });
      expect(result).toEqual({ id: 'legacy-id', stubbed: false });
      // Legacy path still gets BCC.
      expect(mockSendMail.mock.calls[0][0].bcc).toBe(
        'yogesh.mohite@iksula.com',
      );
    });
  });

  describe('Zod env validation (parseSmtpEnv contract)', () => {
    // Verifies the schema parses what we expect and rejects what we don't.
    // The full ZodError messages are exercised via the deferred-mode tests
    // above; this section adds focused field-level coverage.

    it('non-email SMTP_USER → deferred', () => {
      setRealEnv({ SMTP_USER: 'not-an-email' });
      const svc = new EmailService();
      expect(svc.getHealth().mode).toBe('deferred');
    });

    it('SMTP_PORT > 65535 → deferred', () => {
      setRealEnv({ SMTP_PORT: '99999' });
      const svc = new EmailService();
      expect(svc.getHealth().mode).toBe('deferred');
    });

    it('SMTP_SECURE="true" → real mode + secure=true (SSL/465 path)', () => {
      setRealEnv({ SMTP_SECURE: 'true', SMTP_PORT: '465' });
      const svc = new EmailService();
      expect(svc.getHealth().mode).toBe('real');
      const cfg = (createTransport as unknown as jest.Mock).mock.calls[0][0];
      expect(cfg.secure).toBe(true);
      expect(cfg.port).toBe(465);
    });
  });
});

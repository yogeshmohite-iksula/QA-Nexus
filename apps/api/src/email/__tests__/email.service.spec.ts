// Unit tests for EmailService — M1 Day-6 PM Block 1.
//
// Strategy: jest.mock the 'resend' SDK so no network ever fires.
// Pins: capture mode, deferred mode, graceful errors, template content.

jest.mock('resend');

import { EmailService } from '../email.service';
import { Resend } from 'resend';
import {
  renderInvitationSubject,
  renderInvitationHtml,
  renderInvitationText,
} from '../templates/invitation';

const mockSend = jest.fn();
(Resend as unknown as jest.Mock).mockImplementation(() => ({
  emails: { send: mockSend },
}));

const baseInv = {
  to: 'kishor.kadam@iksula.com',
  workspaceName: 'Iksula QA Nexus',
  inviterName: 'Akshay Panchal',
  role: 'QAEngineer',
  magicLinkUrl: 'https://qa-nexus.pages.dev/accept?token=abc123',
  expiresAt: '2026-05-09T12:00:00Z',
};

describe('EmailService', () => {
  const ORIG_ENV = { ...process.env };
  beforeEach(() => {
    mockSend.mockReset();
    // Reset env to a known baseline before each test.
    delete process.env.RESEND_API_KEY;
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
      process.env.NODE_ENV = 'production';
      process.env.RESEND_API_KEY = 're_real_LIVE_key';
      process.env.EMAIL_TEST_CAPTURE = 'true';
      const svc = new EmailService();
      expect(svc.getHealth().mode).toBe('capture');
    });

    it('no key in non-test env → deferred mode', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.RESEND_API_KEY;
      const svc = new EmailService();
      expect(svc.getHealth().mode).toBe('deferred');
    });

    it('placeholder key → deferred mode', () => {
      process.env.NODE_ENV = 'production';
      process.env.RESEND_API_KEY = 're_REPLACE_ME_LATER';
      const svc = new EmailService();
      expect(svc.getHealth().mode).toBe('deferred');
    });

    it('real key in non-test env → real mode', () => {
      process.env.NODE_ENV = 'production';
      process.env.RESEND_API_KEY = 're_AbCdEfGh1234567890_real';
      const svc = new EmailService();
      expect(svc.getHealth().mode).toBe('real');
    });
  });

  describe('sendInvitation() — template content', () => {
    it('produces correct subject', () => {
      const subj = renderInvitationSubject({
        inviterName: baseInv.inviterName,
        workspaceName: baseInv.workspaceName,
      });
      expect(subj).toBe(
        'Akshay Panchal invited you to Iksula QA Nexus on QA Nexus',
      );
    });

    it('plain-text fallback contains key fields', () => {
      const text = renderInvitationText(baseInv);
      expect(text).toContain('Akshay Panchal');
      expect(text).toContain('Iksula QA Nexus');
      expect(text).toContain('QAEngineer');
      expect(text).toContain(baseInv.magicLinkUrl);
      // Expiry rendered humanly
      expect(text).toMatch(/UTC/);
    });

    it('html contains the magic-link URL + role + escapes inputs', () => {
      const html = renderInvitationHtml({
        ...baseInv,
        inviterName: '<script>alert(1)</script>',
      });
      expect(html).toContain(baseInv.magicLinkUrl);
      expect(html).toContain('QAEngineer');
      // XSS-style input is escaped
      expect(html).not.toContain('<script>alert(1)');
      expect(html).toContain('&lt;script&gt;');
    });
  });

  describe('capture mode', () => {
    it('sendInvitation() captures into queue without calling Resend', async () => {
      const svc = new EmailService();
      const result = await svc.sendInvitation(baseInv);
      expect(result.messageId).toMatch(/^captured-/);
      expect(result.stubbed).toBe(true);
      expect(mockSend).not.toHaveBeenCalled();

      const captured = svc.getCapturedEmails();
      expect(captured).toHaveLength(1);
      expect(captured[0].to).toBe(baseInv.to);
      expect(captured[0].subject).toContain('Akshay Panchal');
      expect(captured[0].html).toContain(baseInv.magicLinkUrl);
      expect(captured[0].text).toContain(baseInv.magicLinkUrl);
      expect(captured[0].messageId).toMatch(/^captured-/);
    });

    it('clearCapturedEmails() empties the queue', async () => {
      const svc = new EmailService();
      await svc.sendInvitation(baseInv);
      expect(svc.getCapturedEmails()).toHaveLength(1);
      svc.clearCapturedEmails();
      expect(svc.getCapturedEmails()).toHaveLength(0);
    });

    it('sendMagicLink() captures with stub-suitable subject', async () => {
      const svc = new EmailService();
      const result = await svc.sendMagicLink({
        to: 'x@iksula.com',
        magicLinkUrl: 'https://x.example/auth?token=t',
        expiresAt: '2026-05-03T00:00:00Z',
      });
      expect(result.messageId).toMatch(/^captured-/);
      const captured = svc.getCapturedEmails();
      expect(captured[0].subject).toBe('Your QA Nexus sign-in link');
      expect(captured[0].text).toContain('https://x.example/auth?token=t');
    });

    it('sendPasswordReset() captures with reset subject', async () => {
      const svc = new EmailService();
      const result = await svc.sendPasswordReset({
        to: 'x@iksula.com',
        resetUrl: 'https://x.example/reset?t=t',
        expiresAt: '2026-05-03T00:00:00Z',
      });
      expect(result.stubbed).toBe(true);
      const captured = svc.getCapturedEmails();
      expect(captured[0].subject).toBe('Reset your QA Nexus password');
    });
  });

  describe('deferred mode', () => {
    it('sendInvitation() returns deferred-prefixed messageId, no Resend call', async () => {
      process.env.NODE_ENV = 'production';
      delete process.env.RESEND_API_KEY;
      const svc = new EmailService();
      const result = await svc.sendInvitation(baseInv);
      expect(result.messageId).toMatch(/^deferred-/);
      expect(result.stubbed).toBe(true);
      expect(mockSend).not.toHaveBeenCalled();
    });
  });

  describe('real mode + graceful errors', () => {
    function realModeService(): EmailService {
      process.env.NODE_ENV = 'production';
      process.env.RESEND_API_KEY = 're_real_LIVE_key';
      return new EmailService();
    }

    it('happy path — calls Resend with correct payload + returns Resend id', async () => {
      mockSend.mockResolvedValueOnce({
        data: { id: 're-message-id-789' },
        error: null,
      });
      const svc = realModeService();
      const result = await svc.sendInvitation(baseInv);
      expect(result).toEqual({
        messageId: 're-message-id-789',
        stubbed: false,
      });
      expect(mockSend).toHaveBeenCalledTimes(1);
      const call = mockSend.mock.calls[0][0];
      expect(call.to).toBe(baseInv.to);
      expect(call.subject).toContain('Akshay Panchal');
      expect(call.html).toContain(baseInv.magicLinkUrl);
      expect(call.text).toContain(baseInv.magicLinkUrl);
      expect(call.from).toBe('noreply@qa-nexus.iksula.com'); // default
    });

    it('Resend returns error — does NOT throw, returns messageId + error', async () => {
      mockSend.mockResolvedValueOnce({
        data: null,
        error: { message: 'rate-limited' },
      });
      const svc = realModeService();
      const result = await svc.sendInvitation(baseInv);
      expect(result.messageId).toMatch(/^failed-/);
      expect(result.stubbed).toBe(false);
      expect(result.error).toBe('rate-limited');
    });

    it('Resend SDK throws — caught + returned as failed result', async () => {
      mockSend.mockRejectedValueOnce(new Error('network down'));
      const svc = realModeService();
      const result = await svc.sendInvitation(baseInv);
      expect(result.messageId).toMatch(/^failed-/);
      expect(result.error).toBe('network down');
    });

    it('legacy send() shape still works (auth.config.ts compat)', async () => {
      mockSend.mockResolvedValueOnce({
        data: { id: 'legacy-id' },
        error: null,
      });
      const svc = realModeService();
      const result = await svc.send({
        to: 'x@iksula.com',
        subject: 'subj',
        html: '<p>h</p>',
        text: 'h',
      });
      expect(result).toEqual({ id: 'legacy-id', stubbed: false });
    });
  });
});

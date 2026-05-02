// F14m2 Link Test Case Modal unit tests.
//
// Scope: mount + open marker (with reqKey + counts), search filter
// debounces + narrows the available list, link button moves a row
// from available → linked + fires success toast + link marker, unlink
// reverses the flow, Esc closes via cancel marker.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LinkTestCaseModal } from '@/components/requirements/link-test-case-modal';
import { renderWithProviders } from '../test-utils';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));
import { toast } from 'sonner';

describe('LinkTestCaseModal (F14m2)', () => {
  beforeEach(() => {
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it('mounts with parent requirement copy + 9 available / 3 linked + fires open marker', () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const onClose = vi.fn();

    renderWithProviders(<LinkTestCaseModal onClose={onClose} reqKey="RET-001" />);

    expect(screen.getByRole('heading', { name: /link test cases/i })).toBeInTheDocument();
    // Header surfaces parent req key + title
    expect(screen.getByText('RET-001')).toBeInTheDocument();
    expect(screen.getByText(/implement refund api/i)).toBeInTheDocument();

    // Available section reports 9 (12 total − 3 pre-linked)
    const availableHeading = screen.getByText(/^available/i);
    expect(availableHeading.textContent).toMatch(/\(9\)/);

    // Linked section reports 3
    const linkedHeading = screen.getByText(/linked to ret-001/i);
    expect(linkedHeading.textContent).toMatch(/\(3\)/);

    // Open marker fired with the right shape
    expect(infoSpy).toHaveBeenCalledWith(
      'pattern-a:deferred:link-test-case-open',
      expect.objectContaining({
        reqKey: 'RET-001',
        availableCount: 9,
        linkedCount: 3,
      }),
    );

    infoSpy.mockRestore();
  });

  it('search input narrows the available list + fires search-change marker (after debounce)', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderWithProviders(<LinkTestCaseModal onClose={onClose} reqKey="RET-001" />);

    const searchInput = screen.getByLabelText(/search test cases/i);
    await user.type(searchInput, 'webhook');

    // Search marker fires after the 300 ms debounce
    await waitFor(
      () => {
        expect(infoSpy).toHaveBeenCalledWith(
          'pattern-a:deferred:link-test-case-search-change',
          expect.objectContaining({ query: expect.stringContaining('webhook') }),
        );
      },
      { timeout: 1000 },
    );

    // TC-RET-408 is "Webhook signature mismatch is rejected" → still visible
    expect(screen.getAllByText('TC-RET-408').length).toBeGreaterThan(0);
    // TC-RET-402 is "Refund POST is idempotent on charge id" → not visible
    expect(screen.queryByText('TC-RET-402')).not.toBeInTheDocument();

    infoSpy.mockRestore();
  });

  it('clicking Link on TC-RET-402: row moves to Linked + fires marker + success toast', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderWithProviders(<LinkTestCaseModal onClose={onClose} reqKey="RET-001" />);

    // TC-RET-402 starts in Available (NOT in INITIAL_LINKED_KEYS).
    const linkBtn = screen.getByRole('button', { name: /^link tc-ret-402$/i });
    await user.click(linkBtn);

    // After link, the Unlink button surfaces (proves the row migrated).
    expect(screen.getByRole('button', { name: /^unlink tc-ret-402$/i })).toBeInTheDocument();

    // Marker + success toast
    expect(infoSpy).toHaveBeenCalledWith(
      'pattern-a:deferred:link-test-case-link',
      expect.objectContaining({ reqKey: 'RET-001', tcKey: 'TC-RET-402' }),
    );
    expect(vi.mocked(toast.success)).toHaveBeenCalledWith(
      expect.stringMatching(/TC-RET-402 linked to RET-001/),
      expect.objectContaining({ description: expect.any(String) }),
    );

    infoSpy.mockRestore();
  });

  it('clicking Unlink on TC-RET-401 (pre-linked): row moves back to Available + fires marker', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderWithProviders(<LinkTestCaseModal onClose={onClose} reqKey="RET-001" />);

    const unlinkBtn = screen.getByRole('button', { name: /^unlink tc-ret-401$/i });
    await user.click(unlinkBtn);

    // After unlink, the Link button surfaces in the Available column.
    expect(screen.getByRole('button', { name: /^link tc-ret-401$/i })).toBeInTheDocument();

    expect(infoSpy).toHaveBeenCalledWith(
      'pattern-a:deferred:link-test-case-unlink',
      expect.objectContaining({ reqKey: 'RET-001', tcKey: 'TC-RET-401' }),
    );
    expect(vi.mocked(toast.success)).toHaveBeenCalledWith(
      expect.stringMatching(/TC-RET-401 unlinked from RET-001/),
      expect.objectContaining({ description: expect.any(String) }),
    );

    infoSpy.mockRestore();
  });

  it('"Done" footer button fires cancel marker + invokes onClose', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderWithProviders(<LinkTestCaseModal onClose={onClose} reqKey="RET-001" />);

    const doneBtn = screen.getByRole('button', { name: /^done$/i });
    await user.click(doneBtn);

    expect(infoSpy).toHaveBeenCalledWith(
      'pattern-a:deferred:link-test-case-cancel',
      expect.objectContaining({ trigger: 'button' }),
    );
    expect(onClose).toHaveBeenCalledTimes(1);

    infoSpy.mockRestore();
  });
});

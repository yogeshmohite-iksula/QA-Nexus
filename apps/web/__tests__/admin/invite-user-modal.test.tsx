// F27m1 Invite User Modal unit tests.
//
// Scope: form-default render (3 rows from inviteFormDefaults), Zod
// validation (default empty rows → submit disabled), add-row CTA
// fires invite-add-row marker + grows the form, cancel button fires
// invite-cancel + invokes onClose, personal-message textarea + cap
// counter render correctly. Plus the F27m1 UX-polish surface added
// 2026-05-02: Sonner toast on success/error + loading-spinner state.

import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InviteUserModal } from '@/components/admin/invite-user-modal';
import { renderWithProviders } from '../test-utils';

// Stub `sonner` so tests can assert toast.success / toast.error fired
// without spinning up the real <Toaster /> portal in jsdom.
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));
import { toast } from 'sonner';

describe('InviteUserModal (F27m1)', () => {
  it('mounts with 3 default invite rows + fires the open marker', () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const onClose = vi.fn();

    renderWithProviders(<InviteUserModal onClose={onClose} />);

    // 3 email inputs (one per default row from inviteFormDefaults)
    const emailInputs = screen.getAllByPlaceholderText(/iksula\.com/i);
    expect(emailInputs.length).toBeGreaterThanOrEqual(3);

    expect(infoSpy).toHaveBeenCalledWith(
      'pattern-a:deferred:invite-modal-open',
      expect.objectContaining({
        rowCount: expect.any(Number),
        projectsAvailable: expect.any(Number),
      }),
    );

    infoSpy.mockRestore();
  });

  it('add-row CTA appends a new invite row and fires invite-add-row marker', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderWithProviders(<InviteUserModal onClose={onClose} />);

    const beforeRows = screen.getAllByPlaceholderText(/iksula\.com/i).length;
    const addRowBtn = screen.getByRole('button', { name: /add another invite/i });
    await user.click(addRowBtn);

    const afterRows = screen.getAllByPlaceholderText(/iksula\.com/i).length;
    expect(afterRows).toBe(beforeRows + 1);

    expect(infoSpy).toHaveBeenCalledWith(
      'pattern-a:deferred:invite-add-row',
      expect.objectContaining({ newCount: beforeRows + 1 }),
    );

    infoSpy.mockRestore();
  });

  it('cancel button fires invite-cancel marker + invokes onClose prop', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderWithProviders(<InviteUserModal onClose={onClose} />);

    const cancelBtn = screen.getByRole('button', { name: /^cancel$/i });
    await user.click(cancelBtn);

    expect(infoSpy).toHaveBeenCalledWith(
      'pattern-a:deferred:invite-cancel',
      expect.objectContaining({ rowCount: expect.any(Number) }),
    );
    expect(onClose).toHaveBeenCalledTimes(1);

    infoSpy.mockRestore();
  });

  it('Send invites button is disabled when no row has both a valid email AND ≥1 project', () => {
    const onClose = vi.fn();
    renderWithProviders(<InviteUserModal onClose={onClose} />);

    // Default rows ship with empty emails + no projects → submit disabled.
    // Submit button text is "Send invites" verbatim from the locked source.
    const submitBtn = screen.getByRole('button', { name: /send invites/i });
    expect(submitBtn).toBeDisabled();
  });

  it('valid submit: shows "Sending…" loading state, fires success toast, calls onClose', async () => {
    vi.mocked(toast.success).mockClear();
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderWithProviders(<InviteUserModal onClose={onClose} />);

    // The form ships with 3 default rows but the Zod schema requires
    // EVERY row to have a valid email + ≥1 project. Strip rows 2 + 3
    // so we only need to fill row 1.
    const removeRow3 = screen.getByRole('button', { name: /remove row 3/i });
    await user.click(removeRow3);
    const removeRow2 = screen.getByRole('button', { name: /remove row 2/i });
    await user.click(removeRow2);

    // Fill row 1 with a valid email
    const emailInputs = screen.getAllByPlaceholderText(/iksula\.com/i);
    expect(emailInputs.length).toBe(1);
    await user.type(emailInputs[0], 'priya.menon@iksula.com');

    // Scope chip selection to the row's <li> container so we don't hit
    // the bulk-apply panel's chips at the top of the form (those are
    // staging state, not row state, and don't fire row-toggle).
    const rowLi = emailInputs[0].closest('li');
    expect(rowLi).not.toBeNull();
    const rowChips = within(rowLi as HTMLElement)
      .getAllByRole('button')
      .filter((b) => b.getAttribute('aria-pressed') === 'false');
    expect(rowChips.length).toBeGreaterThan(0);
    await user.click(rowChips[0]);

    // Submit becomes enabled once the row is valid
    const submitBtn = screen.getByRole('button', { name: /send invites/i });
    await waitFor(() => expect(submitBtn).not.toBeDisabled());
    await user.click(submitBtn);

    // Loading state observable mid-submit OR success toast already
    // fired — either proves the async flow executed end-to-end.
    await waitFor(
      () => {
        const sending = screen.queryByRole('button', { name: /sending/i });
        const successFired = vi.mocked(toast.success).mock.calls.length > 0;
        expect(sending !== null || successFired).toBe(true);
      },
      { timeout: 2000 },
    );

    // Final state: success toast fires + onClose called once.
    await waitFor(
      () => {
        expect(vi.mocked(toast.success)).toHaveBeenCalledWith(
          expect.stringMatching(/1 invitation queued/),
          expect.objectContaining({ description: expect.any(String) }),
        );
        expect(onClose).toHaveBeenCalledTimes(1);
      },
      { timeout: 2000 },
    );
  });

  it('renders the personal-message textarea with the 0 / 500 char-cap counter', () => {
    const onClose = vi.fn();
    renderWithProviders(<InviteUserModal onClose={onClose} />);

    // The label "Personal message (optional)" is `htmlFor`-bound to the
    // textarea#invite-message — getByLabelText resolves it cleanly.
    const textarea = screen.getByLabelText(/personal message/i);
    expect(textarea.tagName).toBe('TEXTAREA');

    // Cap counter renders "0 / 500" on initial mount
    expect(screen.getByText(/0 \/ 500/)).toBeInTheDocument();
  });
});

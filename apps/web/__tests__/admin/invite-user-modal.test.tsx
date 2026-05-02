// F27m1 Invite User Modal unit tests.
//
// Scope: form-default render (3 rows from inviteFormDefaults), Zod
// validation (default empty rows → submit disabled), add-row CTA
// fires invite-add-row marker + grows the form, cancel button fires
// invite-cancel + invokes onClose, personal-message textarea + cap
// counter render correctly.

import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InviteUserModal } from '@/components/admin/invite-user-modal';
import { renderWithProviders } from '../test-utils';

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

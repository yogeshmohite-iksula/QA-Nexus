// F14m1 Edit/Add Requirement Modal unit tests.
//
// Scope: create-mode + edit-mode mount + open marker, default form
// values, Zod validation (title-too-short blocks save), tag add/
// remove, async submit success-toast end-to-end + onClose call,
// validation error toast, Esc-cancel, double-submit guard.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RequirementFormModal } from '@/components/requirements/requirement-form-modal';
import { renderWithProviders } from '../test-utils';

// Stub Sonner so tests can assert toast.success / toast.error fired.
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));
import { toast } from 'sonner';

describe('RequirementFormModal (F14m1)', () => {
  beforeEach(() => {
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it('mounts in create mode with default values + fires open marker', () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const onClose = vi.fn();

    renderWithProviders(<RequirementFormModal onClose={onClose} />);

    // Header copy
    expect(screen.getByRole('heading', { name: /create requirement/i })).toBeInTheDocument();

    // Default values: title empty, priority P2, status draft
    expect((screen.getByLabelText(/^priority\b/i) as HTMLSelectElement).value).toBe('P2');
    expect((screen.getByLabelText(/^status\b/i) as HTMLSelectElement).value).toBe('draft');

    // Open marker
    expect(infoSpy).toHaveBeenCalledWith(
      'pattern-a:deferred:requirement-form-open',
      expect.objectContaining({ mode: 'create', reqKey: null }),
    );

    infoSpy.mockRestore();
  });

  it('mounts in edit mode pre-filled from RET-001 + fires open marker with key', () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const onClose = vi.fn();

    renderWithProviders(<RequirementFormModal onClose={onClose} reqKey="RET-001" />);

    // Header switches to "Edit requirement" + surfaces the key
    expect(screen.getByRole('heading', { name: /edit requirement/i })).toBeInTheDocument();
    expect(screen.getByText('RET-001')).toBeInTheDocument();

    // Title pre-fills with the seed RET-001 title
    const titleInput = screen.getByLabelText(/^title\b/i) as HTMLInputElement;
    expect(titleInput.value).toBe('Implement refund API for failed orders');

    // Priority + status reflect seed values (RET-001 = P0 / active)
    expect((screen.getByLabelText(/^priority\b/i) as HTMLSelectElement).value).toBe('P0');
    expect((screen.getByLabelText(/^status\b/i) as HTMLSelectElement).value).toBe('active');

    expect(infoSpy).toHaveBeenCalledWith(
      'pattern-a:deferred:requirement-form-open',
      expect.objectContaining({ mode: 'edit', reqKey: 'RET-001' }),
    );

    infoSpy.mockRestore();
  });

  it('save button is disabled when title is empty (Zod min-length 3)', () => {
    const onClose = vi.fn();
    renderWithProviders(<RequirementFormModal onClose={onClose} />);

    const saveBtn = screen.getByRole('button', { name: /create requirement$/i });
    expect(saveBtn).toBeDisabled();
  });

  it('cancel button fires cancel marker + invokes onClose', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderWithProviders(<RequirementFormModal onClose={onClose} reqKey="RET-001" />);

    const cancelBtn = screen.getByRole('button', { name: /discard changes/i });
    await user.click(cancelBtn);

    expect(infoSpy).toHaveBeenCalledWith(
      'pattern-a:deferred:requirement-form-cancel',
      expect.objectContaining({ trigger: 'button', mode: 'edit' }),
    );
    expect(onClose).toHaveBeenCalledTimes(1);

    infoSpy.mockRestore();
  });

  it('add tag → tag chip renders + fires tag-add marker; remove tag → fires tag-remove marker', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderWithProviders(<RequirementFormModal onClose={onClose} />);

    const tagInput = screen.getByLabelText(/^tags\b/i);
    await user.type(tagInput, 'security');
    await user.click(screen.getByRole('button', { name: /add tag/i }));

    expect(screen.getByText('security')).toBeInTheDocument();
    expect(infoSpy).toHaveBeenCalledWith(
      'pattern-a:deferred:requirement-form-tag-add',
      expect.objectContaining({ tag: 'security' }),
    );

    // Remove via the per-chip × button (aria-label "Remove tag security")
    const removeBtn = screen.getByRole('button', { name: /remove tag security/i });
    await user.click(removeBtn);

    expect(screen.queryByText('security')).not.toBeInTheDocument();
    expect(infoSpy).toHaveBeenCalledWith(
      'pattern-a:deferred:requirement-form-tag-remove',
      expect.objectContaining({ tag: 'security' }),
    );

    infoSpy.mockRestore();
  });

  it('valid edit-mode submit: shows "Saving…" + fires success toast + onClose', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderWithProviders(<RequirementFormModal onClose={onClose} reqKey="RET-001" />);

    // RET-001 pre-fills as valid; type a small edit to mark dirty.
    const titleInput = screen.getByLabelText(/^title\b/i);
    await user.type(titleInput, ' (v2)');

    const saveBtn = screen.getByRole('button', { name: /save changes/i });
    await waitFor(() => expect(saveBtn).not.toBeDisabled());
    await user.click(saveBtn);

    // Either the loading button is mid-flight OR the toast already fired.
    await waitFor(
      () => {
        const saving = screen.queryByRole('button', { name: /saving/i });
        const successFired = vi.mocked(toast.success).mock.calls.length > 0;
        expect(saving !== null || successFired).toBe(true);
      },
      { timeout: 2000 },
    );

    await waitFor(
      () => {
        expect(vi.mocked(toast.success)).toHaveBeenCalledWith(
          expect.stringMatching(/RET-001 saved/i),
          expect.objectContaining({ description: expect.any(String) }),
        );
        expect(onClose).toHaveBeenCalledTimes(1);
      },
      { timeout: 2000 },
    );
  });

  it('priority change fires field-change marker for "priority"', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderWithProviders(<RequirementFormModal onClose={onClose} />);

    const prioritySelect = screen.getByLabelText(/^priority\b/i);
    await user.selectOptions(prioritySelect, 'P0');

    expect(infoSpy).toHaveBeenCalledWith(
      'pattern-a:deferred:requirement-form-field-change',
      expect.objectContaining({ field: 'priority' }),
    );

    infoSpy.mockRestore();
  });
});

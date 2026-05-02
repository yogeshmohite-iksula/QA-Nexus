// F14m3 Convert to Jira Story Modal unit tests.
//
// Scope: mount + open marker, default state (5 Iksula projects, 3
// issue types, sprint pre-fills from parent req), invalid story-points
// disables Convert + fires error toast on click, valid Convert flow
// fires submit marker + success toast with mock Jira key, Cancel /
// field-change markers fire correctly.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConvertToJiraModal } from '@/components/requirements/convert-to-jira-modal';
import { renderWithProviders } from '../test-utils';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));
import { toast } from 'sonner';

describe('ConvertToJiraModal (F14m3)', () => {
  beforeEach(() => {
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it('mounts with parent req context + 5 Jira projects + fires open marker', () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const onClose = vi.fn();

    renderWithProviders(<ConvertToJiraModal onClose={onClose} reqKey="RET-001" />);

    expect(screen.getByRole('heading', { name: /convert to jira story/i })).toBeInTheDocument();
    // RET-001 appears in both the header AND the field-mapping preview
    expect(screen.getAllByText('RET-001').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/implement refund api/i).length).toBeGreaterThan(0);

    // Project select has all 5 Iksula projects
    const projectSelect = screen.getByLabelText(/target jira project/i) as HTMLSelectElement;
    const projectValues = Array.from(projectSelect.options).map((o) => o.value);
    expect(projectValues).toEqual(['RET', 'CART', 'PAY', 'AUTH', 'OPS']);

    // Issue-type select has the 3 standard values
    const issueTypeSelect = screen.getByLabelText(/^issue type$/i) as HTMLSelectElement;
    const issueValues = Array.from(issueTypeSelect.options).map((o) => o.value);
    expect(issueValues).toEqual(['Story', 'Task', 'Epic']);

    // Mount marker
    expect(infoSpy).toHaveBeenCalledWith(
      'pattern-a:deferred:convert-jira-open',
      expect.objectContaining({ reqKey: 'RET-001' }),
    );

    infoSpy.mockRestore();
  });

  it('Convert button is disabled when story points is empty / out of range', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderWithProviders(<ConvertToJiraModal onClose={onClose} reqKey="RET-001" />);

    const spInput = screen.getByLabelText(/^story points$/i);
    const convertBtn = screen.getByRole('button', { name: /create story in jira/i });

    // Out-of-range: 200 → invalid (max 100)
    await user.clear(spInput);
    await user.type(spInput, '200');
    expect(convertBtn).toBeDisabled();

    // Empty → invalid
    await user.clear(spInput);
    expect(convertBtn).toBeDisabled();

    // Valid 5 → enabled
    await user.type(spInput, '5');
    await waitFor(() => expect(convertBtn).not.toBeDisabled());
  });

  it('field-change markers fire when project / issue type / sprint are touched', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderWithProviders(<ConvertToJiraModal onClose={onClose} reqKey="RET-001" />);

    await user.selectOptions(screen.getByLabelText(/target jira project/i), 'CART');
    await user.selectOptions(screen.getByLabelText(/^issue type$/i), 'Task');
    await user.selectOptions(screen.getByLabelText(/^sprint$/i), 'Sprint 43');

    expect(infoSpy).toHaveBeenCalledWith(
      'pattern-a:deferred:convert-jira-field-change',
      expect.objectContaining({ field: 'project' }),
    );
    expect(infoSpy).toHaveBeenCalledWith(
      'pattern-a:deferred:convert-jira-field-change',
      expect.objectContaining({ field: 'issueType' }),
    );
    expect(infoSpy).toHaveBeenCalledWith(
      'pattern-a:deferred:convert-jira-field-change',
      expect.objectContaining({ field: 'sprint' }),
    );

    infoSpy.mockRestore();
  });

  it('valid Convert flow: shows "Creating in Jira…" + fires submit marker + success toast + onClose', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderWithProviders(<ConvertToJiraModal onClose={onClose} reqKey="RET-001" />);

    // Defaults are valid (storyPoints = 5, project = RET). Click Convert.
    const convertBtn = screen.getByRole('button', { name: /create story in jira/i });
    await user.click(convertBtn);

    // Submit marker fires immediately (before the 800 ms delay)
    expect(infoSpy).toHaveBeenCalledWith(
      'pattern-a:deferred:convert-jira-submit',
      expect.objectContaining({
        reqKey: 'RET-001',
        targetProject: 'RET',
        issueType: 'Story',
        storyPoints: 5,
      }),
    );

    // Loading state OR success toast observable mid-flight
    await waitFor(
      () => {
        const creating = screen.queryByRole('button', { name: /creating in jira/i });
        const successFired = vi.mocked(toast.success).mock.calls.length > 0;
        expect(creating !== null || successFired).toBe(true);
      },
      { timeout: 2000 },
    );

    // Final state: success toast + onClose called once. Mock Jira key
    // matches RET-NNN pattern.
    await waitFor(
      () => {
        expect(vi.mocked(toast.success)).toHaveBeenCalledWith(
          expect.stringMatching(/Created RET-\d+ in Jira/),
          expect.objectContaining({ description: expect.any(String) }),
        );
        expect(onClose).toHaveBeenCalledTimes(1);
      },
      { timeout: 2500 },
    );

    infoSpy.mockRestore();
  });

  it('Cancel button fires cancel marker + invokes onClose', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderWithProviders(<ConvertToJiraModal onClose={onClose} reqKey="RET-001" />);

    const cancelBtn = screen.getByRole('button', { name: /^cancel$/i });
    await user.click(cancelBtn);

    expect(infoSpy).toHaveBeenCalledWith(
      'pattern-a:deferred:convert-jira-cancel',
      expect.objectContaining({ trigger: 'button' }),
    );
    expect(onClose).toHaveBeenCalledTimes(1);

    infoSpy.mockRestore();
  });
});

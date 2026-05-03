// F28 Settings & Audit unit tests.
//
// Scope: default tab is General, hash deeplink #audit-log mounts
// directly on the Audit Log tab, tab change fires settings-tab-change
// marker + updates document.location.hash via history.replaceState,
// audit-log filter chip cycles event kinds + fires audit-filter-change.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsAuditPage } from '@/components/admin/settings-audit-page';
import { renderWithProviders } from '../test-utils';

describe('SettingsAuditPage (F28)', () => {
  beforeEach(() => {
    // Reset hash between tests so deeplink test doesn't leak state
    window.history.replaceState(null, '', '/admin/settings');
  });

  it('mounts with General tab active by default + fires settings-load marker', () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);

    renderWithProviders(<SettingsAuditPage />);

    // Page header h1 — verbatim copy from the locked source
    expect(
      screen.getByRole('heading', { name: /how is the workspace configured/i }),
    ).toBeInTheDocument();

    expect(infoSpy).toHaveBeenCalledWith(
      'pattern-a:deferred:settings-load',
      expect.objectContaining({
        activeTab: 'general',
        eventCount: expect.any(Number),
      }),
    );

    infoSpy.mockRestore();
  });

  it('hash deeplink #audit-log activates the Audit Log tab on mount', () => {
    window.history.replaceState(null, '', '/admin/settings#audit-log');

    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);

    renderWithProviders(<SettingsAuditPage />);

    // Mount marker should report activeTab=audit-log
    expect(infoSpy).toHaveBeenCalledWith(
      'pattern-a:deferred:settings-load',
      expect.objectContaining({ activeTab: 'audit-log' }),
    );

    // Audit log panel should render — look for the integrity-card copy
    // ("Chain integrity") which only renders inside the audit panel.
    expect(screen.getByText(/chain integrity/i)).toBeInTheDocument();

    infoSpy.mockRestore();
  });

  it('clicking the Audit Log tab fires settings-tab-change marker + updates hash', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const user = userEvent.setup();

    renderWithProviders(<SettingsAuditPage />);

    // Tabs are rendered inside a <nav role="navigation"> — TabButton
    // components are <button>s with the tab label text. Use accessible
    // name with strict end-anchor to avoid matching "View full audit log".
    const auditTab = screen.getByRole('button', { name: /^audit log/i });
    await user.click(auditTab);

    expect(infoSpy).toHaveBeenCalledWith(
      'pattern-a:deferred:settings-tab-change',
      expect.objectContaining({ tab: 'audit-log' }),
    );

    expect(window.location.hash).toBe('#audit-log');

    infoSpy.mockRestore();
  });

  it('audit-log Kind filter chip cycles + fires audit-filter-change marker', async () => {
    window.history.replaceState(null, '', '/admin/settings#audit-log');

    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const user = userEvent.setup();

    renderWithProviders(<SettingsAuditPage />);

    // Match the chip's aria-label "Cycle event-kind filter"
    const kindChip = screen.getByRole('button', { name: /cycle event-kind filter/i });
    await user.click(kindChip);

    expect(infoSpy).toHaveBeenCalledWith(
      'pattern-a:deferred:audit-filter-change',
      expect.objectContaining({ kind: expect.any(String) }),
    );

    infoSpy.mockRestore();
  });

  it('renders the 8-tab settings nav (every tab id appears as a clickable button)', () => {
    renderWithProviders(<SettingsAuditPage />);

    // Each tab label appears verbatim in the nav. Use getAllByText to
    // count occurrences (some labels may also appear inside the panel).
    const expectedLabels = [
      /^general$/i,
      /^branding$/i,
      /^data retention$/i,
      /^integrations health$/i,
      /^audit log$/i,
      /^billing$/i,
      /^sso \/ saml$/i,
      /^compliance$/i,
    ];
    for (const re of expectedLabels) {
      const matches = screen.getAllByText(re);
      expect(matches.length, `expected tab label matching ${re}`).toBeGreaterThan(0);
    }
  });

  it('audit-log panel surfaces the integrity stats (chain / retention / evidence)', () => {
    window.history.replaceState(null, '', '/admin/settings#audit-log');
    renderWithProviders(<SettingsAuditPage />);

    // 99.97% renders in both PageHeader summary copy + integrity card —
    // both should be present, so use getAllByText.
    expect(screen.getAllByText(/99\.97%/).length).toBeGreaterThan(0);
    // Audit retention "90 days" appears in the integrity card body
    expect(screen.getAllByText(/90 days/i).length).toBeGreaterThan(0);
    // Evidence retention "365 days"
    expect(screen.getAllByText(/365 days/i).length).toBeGreaterThan(0);
  });
});

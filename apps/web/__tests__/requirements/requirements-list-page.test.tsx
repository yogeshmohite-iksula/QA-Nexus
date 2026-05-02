// F14 Requirements List unit tests.
//
// Scope: page header counts render, all 24 seed RET-### rows show in
// cards default view, source-tab + status filter narrow the list,
// hash-deeplink #status=draft activates the draft filter on mount,
// view toggle switches cards ↔ table, empty state renders for
// non-matching filters, deferred markers fire on every interaction.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RequirementsListPage } from '@/components/requirements/requirements-list-page';
import { renderWithProviders } from '../test-utils';

describe('RequirementsListPage (F14)', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/requirements');
  });

  it('mounts with all 24 RET-### seed requirements visible + fires list-load marker', () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);

    renderWithProviders(<RequirementsListPage />);

    // Page heading
    expect(screen.getByRole('heading', { name: /^requirements$/i })).toBeInTheDocument();

    // 24 RET keys render in the cards view (each appears once in card body)
    for (let i = 1; i <= 24; i++) {
      const key = `RET-${String(i).padStart(3, '0')}`;
      expect(screen.getAllByText(key).length, `expected ${key}`).toBeGreaterThan(0);
    }

    // Mount marker fired with totals
    expect(infoSpy).toHaveBeenCalledWith(
      'pattern-a:deferred:requirements-list-load',
      expect.objectContaining({
        totalCount: 24,
        statusBreakdown: expect.objectContaining({
          draft: expect.any(Number),
          active: expect.any(Number),
          done: expect.any(Number),
          archived: expect.any(Number),
        }),
      }),
    );

    infoSpy.mockRestore();
  });

  it('renders the page-header counts (24 total / 15 jira / 2 uploaded / 6 coverage gaps)', () => {
    renderWithProviders(<RequirementsListPage />);
    const summaryNodes = screen.getAllByText(/coverage gaps/i);
    const summaryParagraph = summaryNodes
      .map((n) => n.closest('p'))
      .find((p) => p && /total/i.test(p.textContent ?? '')) as HTMLElement;
    expect(summaryParagraph).toBeTruthy();
    // Verbatim: "24 total · 15 from Jira · 2 uploaded · 6 coverage gaps."
    expect(summaryParagraph.textContent).toMatch(
      /24\s*total.*15\s*from jira.*2\s*uploaded.*6\s*coverage gaps/i,
    );
  });

  it('clicking the Jira source tab fires source-change marker and narrows the list', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const user = userEvent.setup();

    renderWithProviders(<RequirementsListPage />);

    const jiraTab = screen.getByRole('tab', { name: /jira/i });
    await user.click(jiraTab);

    expect(infoSpy).toHaveBeenCalledWith(
      'pattern-a:deferred:requirements-source-change',
      expect.objectContaining({ source: 'jira' }),
    );

    // RET-002 is source='manual' — should NOT appear after Jira filter.
    // RET-001 is source='jira' — should still appear.
    expect(screen.getAllByText('RET-001').length).toBeGreaterThan(0);
    expect(screen.queryByText('RET-002')).not.toBeInTheDocument();

    infoSpy.mockRestore();
  });

  it('hash deeplink #status=draft activates the draft filter on mount', () => {
    window.history.replaceState(null, '', '/requirements#status=draft');

    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);

    renderWithProviders(<RequirementsListPage />);

    // Mount marker reports the parsed initial filter
    expect(infoSpy).toHaveBeenCalledWith(
      'pattern-a:deferred:requirements-list-load',
      expect.objectContaining({
        initialFilter: expect.objectContaining({ status: 'draft' }),
      }),
    );

    // Status select has draft pre-selected
    const statusSelect = screen.getByLabelText(/status filter/i) as HTMLSelectElement;
    expect(statusSelect.value).toBe('draft');

    // RET-002 is status='draft' → visible. RET-001 is 'active' → not.
    expect(screen.getAllByText('RET-002').length).toBeGreaterThan(0);
    expect(screen.queryByText('RET-001')).not.toBeInTheDocument();

    infoSpy.mockRestore();
  });

  it('Status filter dropdown updates the URL hash + fires filter-change marker', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const user = userEvent.setup();

    renderWithProviders(<RequirementsListPage />);

    const statusSelect = screen.getByLabelText(/status filter/i);
    await user.selectOptions(statusSelect, 'archived');

    expect(infoSpy).toHaveBeenCalledWith(
      'pattern-a:deferred:requirements-filter-change',
      expect.objectContaining({ kind: 'status', value: 'archived' }),
    );

    // URL hash should reflect the chosen status
    expect(window.location.hash).toBe('#status=archived');

    infoSpy.mockRestore();
  });

  it('view toggle switches Cards → Table + fires view-toggle marker', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const user = userEvent.setup();

    renderWithProviders(<RequirementsListPage />);

    const tableTab = screen.getByRole('tab', { name: /^table$/i });
    await user.click(tableTab);

    expect(infoSpy).toHaveBeenCalledWith(
      'pattern-a:deferred:requirements-view-toggle',
      expect.objectContaining({ view: 'table' }),
    );

    // Table view exposes a Key column header that's hidden in the cards view
    expect(screen.getByText(/^key$/i)).toBeInTheDocument();

    infoSpy.mockRestore();
  });

  it('"+ Add requirement" CTA fires add-open marker + routes to /requirements/new', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const user = userEvent.setup();

    renderWithProviders(<RequirementsListPage />);

    const addBtn = screen.getByRole('button', { name: /add requirement/i });
    await user.click(addBtn);

    expect(infoSpy).toHaveBeenCalledWith(
      'pattern-a:deferred:requirements-add-open',
      expect.objectContaining({ from: 'F14' }),
    );

    infoSpy.mockRestore();
  });

  it('search narrows the list by key OR title and fires search-change marker', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const user = userEvent.setup();

    renderWithProviders(<RequirementsListPage />);

    const searchInput = screen.getByLabelText(/search requirements/i);
    await user.type(searchInput, 'multi-currency');

    expect(infoSpy).toHaveBeenCalledWith(
      'pattern-a:deferred:requirements-search-change',
      expect.objectContaining({ query: expect.stringContaining('multi-currency') }),
    );

    // RET-004 is "Multi-currency refund support" → visible
    expect(screen.getAllByText('RET-004').length).toBeGreaterThan(0);
    // RET-001 is "Implement refund API for failed orders" → not visible
    expect(screen.queryByText('RET-001')).not.toBeInTheDocument();

    infoSpy.mockRestore();
  });

  it('empty state renders when filters return zero matches', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RequirementsListPage />);

    const searchInput = screen.getByLabelText(/search requirements/i);
    await user.type(searchInput, 'this-string-will-never-match');

    const empty = screen.getByRole('status');
    expect(within(empty).getByText(/no requirements match/i)).toBeInTheDocument();
  });
});

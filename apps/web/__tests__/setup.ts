// Vitest setup — jest-dom matchers + global stubs for Next.js
// router/navigation hooks. Imported once per test run.

import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});

// `next/navigation` is a server-flavoured shim in test envs — stub the
// hooks tests reach for. Individual tests override `mockReplace` /
// `mockPush` via vi.mocked(useRouter).mockReturnValue(...).
export const mockPush = vi.fn();
export const mockReplace = vi.fn();
export const mockBack = vi.fn();
export const mockForward = vi.fn();
export const mockPrefetch = vi.fn();
export const mockRefresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
    forward: mockForward,
    prefetch: mockPrefetch,
    refresh: mockRefresh,
  }),
  usePathname: () => '/admin/users',
  useSearchParams: () => new URLSearchParams(),
}));

afterEach(() => {
  mockPush.mockClear();
  mockReplace.mockClear();
  mockBack.mockClear();
  mockForward.mockClear();
  mockPrefetch.mockClear();
  mockRefresh.mockClear();
});

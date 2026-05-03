// Vitest config for apps/web — jsdom + React 19 + Next 15 path alias.
//
// Light unit tests for the M1 admin frames (F27 / F27m1 / F28) +
// AdminGuard. Pattern A scope: assert deferred markers fire, no
// network calls, no real persistence. Real test infra (Playwright E2E
// + integration tests) lands MS0-T034+.
//
// Why vitest (not jest): vite-native, faster watch, and the JSX
// plugin already ships with the runtime — no babel config drift.

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./__tests__/setup.ts'],
    include: ['__tests__/**/*.test.{ts,tsx}'],
    css: false,
  },
});

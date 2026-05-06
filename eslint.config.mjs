// QA Nexus PM1 — root ESLint flat config (ESLint 9)
// Generated 2026-04-26 (replaces .eslintrc.json + .eslintignore legacy format)
// Per-workspace overrides live in apps/web/eslint.config.mjs (Next.js plugin)
// and apps/api/eslint.config.mjs (NestJS plugin — added by MS0-T003).

import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // Global ignores — applies before any other config
  {
    ignores: [
      'node_modules/**',
      '**/node_modules/**',
      '.next/**',
      '**/.next/**',
      'dist/**',
      '**/dist/**',
      'out/**',
      'build/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      '.turbo/**',
      'apps/api/src/generated/**',
      'apps/api/node_modules/.prisma/**',
      'pnpm-lock.yaml',
      '.claude/audit.jsonl',
      '.cache/**',
      '**/Xenova/**',
      'QA Nexus/**',
      'docs/**',
      '*.min.js',
      '**/next-env.d.ts',
      'node-compile-cache/**',
      // Node.js helper scripts (Playwright sweeps, work-log scripts, etc.)
      // — run outside the strict browser/Next config; they intentionally
      // use CommonJS require() + console + process. Lint them with their
      // own scoped config if desired, NOT under the workspace browser rules.
      'scripts/**/*.{js,mjs,cjs}',
    ],
  },

  // Base recommended (ESLint + typescript-eslint)
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Workspace-wide PM1 rules
  {
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
      'no-debugger': 'error',
    },
  },

  // Test files — relaxed rules
  {
    files: [
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.spec.ts',
      '**/*.spec.tsx',
      '**/test/**/*.ts',
      '**/__tests__/**/*.ts',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },

  // NestJS DI requires runtime class imports for constructor parameters
  // (the @Controller / @Injectable decorators emit metadata that needs the
  // value at runtime, not just the type). The `consistent-type-imports`
  // rule above auto-converts `import { X }` -> `import type { X }` when X
  // is only used as a type, which silently breaks Nest DI at runtime.
  // Disable for apps/api/src/**/*.ts so Nest sees runtime class refs.
  //
  // This rule lives at root (not just apps/api/eslint.config.mjs) because
  // lint-staged runs eslint from the repo root and flat-config picks the
  // CWD's config file — so per-package overrides don't apply during the
  // pre-commit hooks. Spec: MS0-T022.
  {
    files: ['apps/api/src/**/*.ts'],
    rules: {
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },

  // PM1 hard rule: no `any` without // FIXME + ticket reference
  // (Enforced via the no-explicit-any rule above; humans must add // FIXME comment with ticket before suppressing.)
);

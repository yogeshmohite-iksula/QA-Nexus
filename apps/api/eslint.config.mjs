// QA Nexus PM1 — apps/api ESLint flat config (P1.15)
//
// Inherits the workspace-root eslint.config.mjs (ESLint 9 + typescript-eslint
// umbrella). pnpm workspaces resolves the umbrella + plugin from root's
// hoisted node_modules — apps/api doesn't need its own copy of the umbrella.
//
// Pre-P1.15: this file referenced `@typescript-eslint/no-explicit-any`
// without registering the plugin in `plugins:` — ESLint 8.57 errored
// `Could not find plugin "@typescript-eslint"` on every CI lint run.
// Fix: drop the local rule definitions, inherit from root, add NestJS-
// specific overrides only.

import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,

  // NestJS-specific overrides:
  // - Relax `no-explicit-any` from `error` (root) to `warn` (apps/api).
  //   NestJS DI sometimes needs `any` in DTOs/decorators where the
  //   metadata-reflect machinery infers types at runtime. Real code review
  //   gates these instead of CI.
  {
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },

  // Tighter ignores for apps/api-only paths (root already ignores
  // node_modules/dist/coverage globally, but be explicit for clarity).
  {
    ignores: ['dist/**', 'coverage/**'],
  },

  // NestJS DI requires runtime class imports for constructor parameters
  // (the @Controller/@Injectable decorators emit metadata that needs the
  // value, not just the type). The root `consistent-type-imports: error`
  // rule auto-converts these to `import type`, which silently breaks Nest
  // DI at runtime. Disable for apps/api/src/** so Nest sees runtime refs.
  {
    files: ['src/**/*.ts'],
    rules: {
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },
];

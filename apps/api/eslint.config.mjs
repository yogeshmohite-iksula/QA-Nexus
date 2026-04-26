// QA Nexus PM1 — apps/api ESLint flat config (ESLint 9, NestJS 10)
// Inherits root eslint.config.mjs base rules; adds NestJS-specific overrides.
// FlatCompat bridge needed because the NestJS 10 scaffold ships .eslintrc.js (legacy);
// flat config takes precedence and is what root's typescript-eslint umbrella expects.
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const eslintConfig = [
  // Inherit by re-exporting nothing custom for now; root flat config applies via
  // explicit invocation `pnpm exec eslint --config <root>/eslint.config.mjs apps/api/src`.
  // For local `pnpm --filter api lint` invocations, this file makes ESLint 9 happy.
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', '*.config.js'],
  },
  // NestJS-specific: relax decorator-related rules
  {
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn', // NestJS DI sometimes needs any in DTOs/decorators
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
];

export default eslintConfig;

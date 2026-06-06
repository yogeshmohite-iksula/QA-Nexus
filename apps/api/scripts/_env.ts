// QA Nexus PM1 — minimal .env loader for standalone ts-node scripts.
//
// The app has no dotenv / ConfigModule.forRoot (Render injects env vars at
// runtime in prod; local standalone scripts historically pass env via the CLI,
// e.g. `DATABASE_URL="$(grep ^DATABASE_URL apps/api/.env | cut -d= -f2-)" pnpm …`).
// That CLI pattern is brittle for multi-var scripts (quoting `RESEND_FROM_NAME=
// "QA Nexus"` breaks `source`). This loader reads apps/api/.env directly so
// smoke/probe scripts "just run" with `pnpm --filter @qa-nexus/api smoke:*`.
//
// SECURITY: only ever assigns into process.env and returns key NAMES — it NEVER
// prints or returns secret VALUES (Hard Rule 6 / security.md "Logging").
// Existing process.env values WIN (so CLI overrides still take precedence).

import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Load `apps/api/.env` (relative to this scripts/ dir) into process.env.
 * @returns the list of key NAMES newly set (safe to log — never values).
 */
export function loadEnvFile(relFromScriptsDir = '../.env'): string[] {
  const envPath = path.resolve(__dirname, relFromScriptsDir);
  if (!fs.existsSync(envPath)) return [];

  const loaded: string[] = [];
  for (const rawLine of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const m = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;

    const key = m[1];
    let val = m[2];
    // Strip a single pair of surrounding quotes (handles values with spaces).
    if (
      val.length >= 2 &&
      ((val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'")))
    ) {
      val = val.slice(1, -1);
    }

    if (process.env[key] === undefined) {
      process.env[key] = val;
      loaded.push(key);
    }
  }
  return loaded;
}

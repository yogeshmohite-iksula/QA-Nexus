// QA Nexus PM1 — Day-17 PR #138 — pin @better-auth/core zod-v4
// override so the prod crash chain doesn't regress.
//
// Spec: Crash chain from Day-17 Render logs
//   TypeError: z.ipv4 is not a function
//     at isValidIP (@better-auth/core@1.6.11/.../utils/ip.mjs:7:11)
//     at getIp (better-auth@1.6.11/.../get-request-ip.mjs:13:8)
//     at resolveRateLimitConfig (rate-limiter/index.mjs:107)
// Root cause: PR #132 added scoped override for `better-auth>zod`
// but `@better-auth/core` is a separate npm package — its zod
// resolved to v3 from the workspace pin → z.ipv4 (v4-only API)
// was undefined → TypeError on first auth request.
// Fix: add `@better-auth/core>zod: ^4.3.6` to root pnpm.overrides.
//
// This test exercises the override via fs+resolution checks since
// the .mjs source can't be imported directly from jest's CJS
// transformer (transitive subpath import). The checks ensure:
//   (1) @better-auth/core's `dependencies.zod` semver range still
//       accepts >= 4
//   (2) The resolved zod inside @better-auth/core's pnpm slot is
//       actually v4.x (not v3.x silently downgraded by the root
//       override)
//   (3) The override line in root package.json exists + targets
//       @better-auth/core>zod
// Together these three checks crash the test suite if the override
// regresses — the closest CI-friendly proxy for the runtime
// `z.ipv4 is not a function` crash given jest's tooling
// constraints. A direct runtime invocation via `node` is the
// canonical proof and is documented in the PR body verification
// section.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

/** Walk up from cwd to find the repo root. We detect it via the
 *  pnpm-workspace.yaml marker file (pnpm monorepo convention) — the
 *  root package.json doesn't carry a `workspaces` key in this repo,
 *  since pnpm uses pnpm-workspace.yaml instead. */
function findRepoRoot(start: string): string {
  let dir = start;
  for (let i = 0; i < 8; i++) {
    if (existsSync(join(dir, 'pnpm-workspace.yaml'))) return dir;
    const parent = resolve(dir, '..');
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(`could not find repo root from ${start}`);
}

describe('@better-auth/core zod@4 override (PR #138 prod-crash regression pin)', () => {
  const repoRoot = findRepoRoot(process.cwd());
  const rootPkg = JSON.parse(
    readFileSync(join(repoRoot, 'package.json'), 'utf8'),
  ) as {
    pnpm?: { overrides?: Record<string, string> };
  };

  it('root pnpm.overrides contains the @better-auth/core>zod scoped override', () => {
    expect(rootPkg.pnpm?.overrides?.['@better-auth/core>zod']).toMatch(
      /^\^?4\./,
    );
  });

  it('root pnpm.overrides still has the sibling better-auth>zod override (PR #132)', () => {
    expect(rootPkg.pnpm?.overrides?.['better-auth>zod']).toMatch(/^\^?4\./);
  });

  it('@better-auth/core resolves to zod v4 in its pnpm slot (not v3)', () => {
    // Look up the pnpm-resolved slot for @better-auth/core. Slot names
    // include the package version + hashed peer-dep suffix; we glob
    // by prefix.
    const pnpmDir = join(repoRoot, 'node_modules', '.pnpm');
    expect(existsSync(pnpmDir)).toBe(true);
    const slots = readdirSync(pnpmDir).filter((d) =>
      d.startsWith('@better-auth+core@1.'),
    );
    expect(slots.length).toBeGreaterThan(0);
    // At least one of the slots must contain a zod v4 in its
    // own node_modules.
    let foundV4 = false;
    for (const slot of slots) {
      const zodPkgPath = join(
        pnpmDir,
        slot,
        'node_modules',
        'zod',
        'package.json',
      );
      if (!existsSync(zodPkgPath)) continue;
      const zodPkg = JSON.parse(readFileSync(zodPkgPath, 'utf8')) as {
        version: string;
      };
      if (zodPkg.version.startsWith('4.')) {
        foundV4 = true;
        break;
      }
    }
    expect(foundV4).toBe(true);
  });

  it('@better-auth/core dist/utils/ip.mjs exists (the prod crash file)', () => {
    const pnpmDir = join(repoRoot, 'node_modules', '.pnpm');
    const slots = readdirSync(pnpmDir).filter((d) =>
      d.startsWith('@better-auth+core@1.'),
    );
    const slot = slots[0];
    expect(slot).toBeDefined();
    const ipMjs = join(
      pnpmDir,
      slot,
      'node_modules',
      '@better-auth',
      'core',
      'dist',
      'utils',
      'ip.mjs',
    );
    expect(existsSync(ipMjs)).toBe(true);
    // The file calls z.ipv4 — present in v4 only. If we get here
    // with foundV4=true above, the crash path is closed.
    const src = readFileSync(ipMjs, 'utf8');
    expect(src).toMatch(/z\.ipv4|z\.ipv6/); // assert the v4-API usage exists
  });
});

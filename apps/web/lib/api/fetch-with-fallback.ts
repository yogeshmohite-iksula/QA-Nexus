// fetchWithFallback — the Option B safety net (Sun 2026-06-07, Yogesh-ratified).
//
// Every P0 data-wiring call goes through this helper so that a missing /
// slow / malformed API response NEVER breaks a pilot page — it transparently
// falls back to the committed canned-data. This is what makes Option B
// (wire real endpoints) carry the same zero-breakage risk as Option A.
//
// Contract (per the Option B brief):
//   - 3-second AbortController timeout (configurable)
//   - credentials: 'include' (BetterAuth session cookie)
//   - on ANY failure (network / non-2xx / timeout / schema-mismatch) →
//     console.warn with a labelled reason (Mon-launch debug aid) → return
//     the canned-data fallback unchanged.
//   - shape-agnostic: generic <T>; the caller supplies the fallback of type T
//     and (optionally) a Zod schema. The helper itself has NO knowledge of any
//     endpoint URL or response shape, so it is safe to ship BEFORE BE+1's
//     endpoint-shape catalog lands.
//
// Usage (once the catalog confirms shapes — NOT before):
//   import { F09_PROJECTS } from '...canned-data';
//   import { projectsResponseSchema } from '@qa-nexus/shared';
//   export const fetchProjects = () =>
//     fetchWithFallback('/api/projects', F09_PROJECTS, {
//       schema: projectsResponseSchema,
//       label: 'F09 projects',
//     });

import { getApiBaseURL } from '@/lib/env';

const DEFAULT_TIMEOUT_MS = 3_000;

/** Minimal structural type for a Zod-like schema (avoids a hard zod import
 *  here; callers pass their real zod schema which satisfies this). */
interface ParseLike<T> {
  parse: (data: unknown) => T;
}

export interface FetchWithFallbackOptions<T> {
  /** Optional Zod (or Zod-like) schema. If provided, the parsed result is
   *  returned; a parse failure triggers the fallback. */
  schema?: ParseLike<T>;
  /** Override the 3s default timeout. */
  timeoutMs?: number;
  /** Human label for the console.warn on fallback (e.g. 'F09 projects'). */
  label?: string;
  /** Extra fetch init (method, headers, body). credentials:'include' is
   *  always forced on. */
  init?: Omit<RequestInit, 'signal'>;
  /** Base URL override. Defaults to NEXT_PUBLIC_API_BASE_URL (prod Render)
   *  / http://localhost:3001 (dev) — matching the existing users-api.ts. */
  baseUrl?: string;
}

const API_BASE = getApiBaseURL().replace(/\/$/, '');

/**
 * Fetch `path` and return the parsed body, or `fallback` on any failure.
 * NEVER throws — the fallback guarantees the caller always gets a usable T.
 */
export async function fetchWithFallback<T>(
  path: string,
  fallback: T,
  opts: FetchWithFallbackOptions<T> = {},
): Promise<T> {
  const { schema, timeoutMs = DEFAULT_TIMEOUT_MS, label = path, init, baseUrl } = opts;
  const url = path.startsWith('http') ? path : `${baseUrl ?? API_BASE}${path}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...init,
      credentials: 'include',
      signal: controller.signal,
    });
    if (!res.ok) {
      console.warn(`[fetchWithFallback] ${label}: HTTP ${res.status} → using canned-data`);
      return fallback;
    }
    const json: unknown = await res.json();
    if (schema) {
      try {
        return schema.parse(json);
      } catch (parseErr) {
        console.warn(
          `[fetchWithFallback] ${label}: response failed schema validation → using canned-data`,
          parseErr,
        );
        return fallback;
      }
    }
    return json as T;
  } catch (err) {
    const reason =
      err instanceof DOMException && err.name === 'AbortError'
        ? `timeout after ${timeoutMs}ms`
        : err instanceof Error
          ? err.message
          : 'unknown error';
    console.warn(`[fetchWithFallback] ${label}: ${reason} → using canned-data`);
    return fallback;
  } finally {
    clearTimeout(timer);
  }
}

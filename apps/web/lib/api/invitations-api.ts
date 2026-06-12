// Invitations API — POST /api/invitations wire for the F27m1 invite modal.
//
// P0-D part 2 (Decision D1: functional invite is M1-mandated). Hard Rule 11:
// shapes verified against BE invitations.controller.ts + shared
// CreateInvitationInput (packages/shared/src/schemas/user.ts:139-154):
//   { invitedEmail: email, role: UserRole, projectScopeJson?: Uuid[],
//     expiresInHours?: int (default 168) }
// POST is per-invitee; bulk invite = sequential loop (keeps audit-log ordering
// + avoids burst on Render free tier). Auth: BetterAuth session cookie →
// credentials:'include' (Admin/Lead only, RolesGuard).
//
// projectScopeJson wants project UUIDs. The modal stores project LABELS
// ('Returns', …) per the canonical F27m1 HTML, so we resolve labels →
// canonical keys (RET/CART/…) → UUIDs via GET /api/projects. If that lookup
// fails (offline dev, API hiccup) we OMIT the field — schema documents empty
// scope as workspace-wide, the safe default — and report it in the result.
//
// API base mirrors lib/env.ts 3-tier convention (env var → hardcoded prod
// for the CF Pages env-injection quirk → localhost dev). Dev never POSTs to
// prod by accident.

import { CreateInvitationInput, ProjectSchema } from '@qa-nexus/shared';
import type { UserRole } from '@qa-nexus/shared';
import { z } from 'zod';

const API_PROD_URL = 'https://qa-nexus-api.onrender.com';
const API_DEV_URL = 'http://localhost:3001';

function apiBase(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (fromEnv && fromEnv.length > 0) return fromEnv.replace(/\/$/, '');
  if (process.env.NODE_ENV === 'production') return API_PROD_URL;
  return API_DEV_URL;
}

/** FE project token → canonical project key. Accepts BOTH the F27M1_PROJECTS
 *  keys ('returns', …, the modal's applyProjects state) and display labels
 *  ('Returns', …) so callers can pass whichever they hold. */
const TOKEN_TO_KEY: Record<string, string> = {
  returns: 'RET',
  Returns: 'RET',
  commerce: 'CART',
  Commerce: 'CART',
  payments: 'PAY',
  Payments: 'PAY',
  mobile: 'AUTH',
  'Mobile App': 'AUTH',
  Mobile: 'AUTH',
  ops: 'OPS',
  'Internal Ops': 'OPS',
  Ops: 'OPS',
};

const projectsResponse = z.object({ ok: z.literal(true), projects: z.array(ProjectSchema) });

/** Resolve FE project tokens → project UUIDs via GET /api/projects.
 *  Returns undefined on any failure (→ omit scope = workspace-wide). */
async function resolveProjectIds(tokens: string[]): Promise<string[] | undefined> {
  if (tokens.length === 0) return undefined; // no selection = workspace-wide
  try {
    const res = await fetch(`${apiBase()}/api/projects`, { credentials: 'include' });
    if (!res.ok) return undefined;
    const parsed = projectsResponse.safeParse(await res.json());
    if (!parsed.success) return undefined;
    const ids = tokens
      .map((token) => TOKEN_TO_KEY[token])
      .filter((key): key is string => Boolean(key))
      .map((key) => parsed.data.projects.find((p) => p.key === key)?.id)
      .filter((id): id is string => Boolean(id));
    return ids.length > 0 ? ids : undefined;
  } catch {
    return undefined;
  }
}

export interface InviteRequestRow {
  email: string;
  role: UserRole;
  /** FE project tokens (applyProjects keys or display labels) — resolved to UUIDs internally. */
  projectTokens: string[];
}

export interface SendInvitationsResult {
  sent: number;
  failed: Array<{ email: string; message: string }>;
  /** True when project labels could not be resolved → invites went workspace-wide. */
  scopeDowngraded: boolean;
}

/** Send one POST /api/invitations per row. Never throws. */
export async function sendInvitations(rows: InviteRequestRow[]): Promise<SendInvitationsResult> {
  const result: SendInvitationsResult = { sent: 0, failed: [], scopeDowngraded: false };
  // Rows usually share the same Apply-to-all scope — resolve each distinct
  // token set once instead of re-fetching /api/projects per invitee.
  const scopeCache = new Map<string, string[] | undefined>();
  for (const row of rows) {
    try {
      const cacheKey = row.projectTokens.join('|');
      let projectScopeJson: string[] | undefined;
      if (scopeCache.has(cacheKey)) {
        projectScopeJson = scopeCache.get(cacheKey);
      } else {
        projectScopeJson = await resolveProjectIds(row.projectTokens);
        scopeCache.set(cacheKey, projectScopeJson);
      }
      if (row.projectTokens.length > 0 && !projectScopeJson) result.scopeDowngraded = true;
      // Validate against the SHARED schema before sending (Hard Rule 10) —
      // catches mapping bugs FE-side with a readable message.
      const body = CreateInvitationInput.parse({
        invitedEmail: row.email,
        role: row.role,
        ...(projectScopeJson ? { projectScopeJson } : {}),
      });
      const res = await fetch(`${apiBase()}/api/invitations`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        result.sent += 1;
      } else {
        let message = `HTTP ${res.status}`;
        try {
          const j: unknown = await res.json();
          if (j && typeof j === 'object' && 'message' in j) {
            message = String((j as { message: unknown }).message);
          }
        } catch {
          /* keep status message */
        }
        result.failed.push({ email: row.email, message });
      }
    } catch (err) {
      result.failed.push({
        email: row.email,
        message: err instanceof Error ? err.message : 'Network error',
      });
    }
  }
  return result;
}

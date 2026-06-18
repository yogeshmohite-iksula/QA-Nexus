// Pending-invites read API — GET /api/invitations for the F27 Users & Roles
// "Pending invites" section (Sweep C, 2026-06-12).
//
// Hard Rule 11 — verified against BE invitations.controller.ts:
//   GET /api/invitations  (Admin/Lead/QAEngineer/Stakeholder)
//     → { ok: true, invitations: InvitationListItem[] }
// No shared list-envelope schema exists, so we compose one locally from the
// shared InvitationListItem item schema (Rule 10 — the ITEM is shared).
//
// We surface only status === 'pending' rows (accepted/expired/revoked are not
// "pending invites"). Display fields derive from the item alone — no extra
// fetch: a pending invitee has no displayName yet, so the email IS the
// identity; project scope shows a truthful count (no fabricated chip labels);
// `sentBy` resolves to the current user when they are the inviter, else a
// neutral "an admin" (honest — only Admin/Lead can invite).

import { InvitationListItem } from '@qa-nexus/shared';
import { z } from 'zod';

import { getApiBaseURL } from '@/lib/env';
import { fetchWithFallback } from './fetch-with-fallback';

const listResponse = z.object({
  ok: z.literal(true),
  invitations: z.array(InvitationListItem),
});

/** The display shape the F27 PendingInvites card renders. */
export interface PendingInviteRow {
  initials: string;
  email: string;
  sentBy: string;
  expiresIn: string;
  role: string;
  projects: readonly string[];
}

const ROLE_LABEL: Record<string, string> = {
  Admin: 'Admin',
  Lead: 'Lead',
  QAEngineer: 'QA Engineer',
  Stakeholder: 'Stakeholder',
};

function initialsOfEmail(email: string): string {
  const local = email.split('@')[0] ?? email;
  const letters = local.replace(/[^a-zA-Z]/g, '');
  return (letters.slice(0, 2) || email.slice(0, 2)).toUpperCase();
}

function expiresInLabel(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (!Number.isFinite(ms) || ms <= 0) return 'soon';
  const hours = Math.floor(ms / 3_600_000);
  const days = Math.floor(hours / 24);
  const rem = hours % 24;
  return days > 0 ? `${days}d ${rem}h` : `${rem}h`;
}

interface InviterCtx {
  meId?: string;
  meName?: string;
}

/**
 * Fetch pending invites → display rows. Null = fetch failed (caller keeps the
 * canned fallback). Empty array = a real empty workspace (no pending invites).
 */
export async function fetchPendingInvites(
  ctx: InviterCtx = {},
): Promise<PendingInviteRow[] | null> {
  const res = await fetchWithFallback<z.infer<typeof listResponse> | null>(
    '/api/invitations',
    null,
    { schema: listResponse, label: 'F27 pending invites', baseUrl: getApiBaseURL() },
  );
  if (!res) return null;
  return res.invitations
    .filter((inv) => inv.status === 'pending')
    .map((inv) => {
      const scopeCount = Array.isArray(inv.projectScopeJson) ? inv.projectScopeJson.length : 0;
      return {
        initials: initialsOfEmail(inv.invitedEmail),
        email: inv.invitedEmail,
        sentBy: inv.invitedBy === ctx.meId && ctx.meName ? ctx.meName : 'an admin',
        expiresIn: expiresInLabel(inv.expiresAt),
        role: ROLE_LABEL[inv.role] ?? inv.role,
        projects:
          scopeCount === 0
            ? ['All projects']
            : [`${scopeCount} project${scopeCount === 1 ? '' : 's'}`],
      };
    });
}

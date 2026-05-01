// Zod schema for F27m1 Invite User Modal.
//
// Pattern A: validation runs client-side. Submit fires
// `pattern-a:deferred:invite-submit` with the typed payload — NO POST
// yet. Real wiring lands MS0-T030.5+ post-merge of BE M1 schema
// (`feature/be-m1-users-schema`).
//
// When BE wiring lands, this schema moves to `packages/shared/invitations`
// — backend + frontend share the same Zod source-of-truth per ADR-006.

import { z } from 'zod';

export const inviteRoles = ['admin', 'lead', 'qa-engineer', 'stakeholder'] as const;
export type InviteRole = (typeof inviteRoles)[number];

export const inviteRoleLabel: Record<InviteRole, string> = {
  admin: 'Admin',
  lead: 'QA Lead',
  'qa-engineer': 'QA Engineer',
  stakeholder: 'Stakeholder',
};

/** Per-row Zod schema. `projectKeys` is non-empty array. */
export const inviteRowSchema = z.object({
  email: z.string().trim().email('Enter a valid work email'),
  role: z.enum(inviteRoles),
  projectKeys: z.array(z.string().min(1)).min(1, 'Pick at least one project'),
});
export type InviteRow = z.infer<typeof inviteRowSchema>;

export const inviteFormSchema = z.object({
  rows: z
    .array(inviteRowSchema)
    .min(1, 'Add at least one email')
    .max(25, 'Max 25 invites per batch'),
  personalMessage: z
    .string()
    .trim()
    .max(500, 'Keep it under 500 characters')
    .optional()
    .or(z.literal('')),
});
export type InviteForm = z.infer<typeof inviteFormSchema>;

export const inviteFormDefaults: InviteForm = {
  rows: [
    { email: '', role: 'qa-engineer', projectKeys: [] },
    { email: '', role: 'qa-engineer', projectKeys: [] },
    { email: '', role: 'qa-engineer', projectKeys: [] },
  ],
  personalMessage: '',
};

/** Pattern A payload — what the backend will eventually accept. */
export interface InvitePayload {
  rows: Array<{
    email: string;
    role: InviteRole;
    projectKeys: string[];
  }>;
  personalMessage?: string;
}

export function buildInvitePayload(form: InviteForm): InvitePayload {
  return {
    rows: form.rows.map((r) => ({
      email: r.email.trim().toLowerCase(),
      role: r.role,
      projectKeys: r.projectKeys,
    })),
    personalMessage: form.personalMessage?.trim() || undefined,
  };
}

/** Lightweight email check used for live validation before zod runs. */
export function isLikelyEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

/** Parse a clipboard-pasted blob into a list of emails. Splits on
 *  commas, semicolons, whitespace, newlines. */
export function parseEmailBlob(blob: string): string[] {
  return blob
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

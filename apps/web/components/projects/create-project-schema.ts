// Zod schema for F10 Create Project Modal.
//
// Pattern A: validation runs client-side. Submit fires
// `pattern-a:deferred:create-project` with the typed payload — NO POST yet.
// Real wiring lands with MS0-T030.5+ (BetterAuth + project create endpoint).
//
// Glyph IDs are whitelisted gradient pairs (CLAUDE.md hex whitelist) — same
// 4 IDs as the F07 founder wizard (`onboarding/schemas.ts`). When BE wiring
// lands, these schemas will move to packages/shared/projects.

import { z } from 'zod';

// Re-use the F07 glyph IDs verbatim — same gradient palette is approved
// for both founder onboarding and "create another project" flows.
export const glyphIds = ['teal-violet', 'teal-soft', 'violet-only', 'neutral'] as const;
export type GlyphId = (typeof glyphIds)[number];

export const dataSources = ['jira', 'upload', 'blank'] as const;
export type DataSource = (typeof dataSources)[number];

export const inviteRoles = ['lead', 'admin', 'qa-engineer', 'stakeholder'] as const;
export type InviteRole = (typeof inviteRoles)[number];

export const inviteSchema = z.object({
  email: z.string().trim().email('Enter a valid email'),
  role: z.enum(inviteRoles),
});

export const createProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Project name must be at least 2 characters')
    .max(50, 'Project name must be 50 characters or fewer'),
  jiraKey: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{2,10}$/, 'Use 2–10 letters or digits')
    .optional()
    .or(z.literal('')),
  description: z
    .string()
    .trim()
    .max(500, 'Description must be 500 characters or fewer')
    .optional()
    .or(z.literal('')),
  glyph: z.enum(glyphIds),
  connectJiraNow: z.boolean(),
  jiraBaseUrl: z
    .string()
    .trim()
    .url('Use a full URL like https://iksula.atlassian.net')
    .optional()
    .or(z.literal('')),
  dataSource: z.enum(dataSources),
  defaultInviteRole: z.enum(inviteRoles),
  invites: z.array(inviteSchema),
});

export type CreateProjectForm = z.infer<typeof createProjectSchema>;

export const createProjectDefaults: CreateProjectForm = {
  name: '',
  jiraKey: '',
  description: '',
  glyph: 'teal-violet',
  connectJiraNow: true,
  jiraBaseUrl: 'https://iksula.atlassian.net',
  dataSource: 'jira',
  defaultInviteRole: 'qa-engineer',
  invites: [],
};

// Slug from project name — lower-case, hyphenated, alphanumeric only.
// Mirrors the locked source's "Slug auto-generated" preview chip.
export function slugFromName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Glyph initials from project name (max 2 chars, uppercase). Same rule as
// the locked source ("Iksula Returns" → "IR").
export function glyphInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

// Pattern A payload — what the backend will eventually accept (deferred).
export interface CreateProjectPayload {
  name: string;
  slug: string;
  jiraKey?: string;
  description?: string;
  glyph: GlyphId;
  connectJiraNow: boolean;
  jiraBaseUrl?: string;
  dataSource: DataSource;
  invites: Array<{ email: string; role: InviteRole }>;
}

export function buildCreateProjectPayload(form: CreateProjectForm): CreateProjectPayload {
  return {
    name: form.name.trim(),
    slug: slugFromName(form.name),
    jiraKey: form.jiraKey?.trim() || undefined,
    description: form.description?.trim() || undefined,
    glyph: form.glyph,
    connectJiraNow: form.connectJiraNow,
    jiraBaseUrl: form.connectJiraNow ? form.jiraBaseUrl?.trim() || undefined : undefined,
    dataSource: form.dataSource,
    invites: form.invites,
  };
}

// Roster-suggestion display row for the invites chip rail.
//
// FOLLOWUP (i) — seed-centralization (ADR-006):
// - The 7-element ROSTER_SUGGESTIONS array previously hardcoded here was
//   removed. Suggestions now come from `useTeamRoster()` at render time
//   (the demo-seed has the same 8 Iksula teammates; signed-in user is
//   filtered out via `useTeammates()` in the consumer).
// - This file keeps only the DISPLAY shape + the helper that computes
//   per-user view fields (initials, shortName, glyph, role) from the
//   seed `UserPublic` type. When BE adds /api/users in T021, the helper
//   stays — only the data source upstream changes.
export interface RosterSuggestion {
  initials: string;
  fullName: string;
  shortName: string;
  email: string;
  role: InviteRole;
  glyph: GlyphId;
}

/** Stable round-robin glyph palette — cycles whitelisted gradients across
 *  roster slots so consecutive avatars don't all share the same gradient. */
const GLYPH_CYCLE: GlyphId[] = ['teal-violet', 'teal-soft', 'violet-only', 'neutral'];

/** Compact "Akshay P." short form derived from the seed `displayName`. */
function shortNameOf(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];
  // Trailing letter already a period (e.g. "Mohanraj K.") → keep as-is.
  if (parts[1].endsWith('.')) return `${parts[0]} ${parts[1]}`;
  return `${parts[0]} ${parts[1][0]}.`;
}

function initialsOf(displayName: string): string {
  return displayName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/** Map a seed `UserPublic.role` enum to the F10 invite-role enum. */
function inviteRoleOf(seedRole: string): InviteRole {
  const r = seedRole.toLowerCase();
  if (r === 'lead') return 'lead';
  if (r === 'admin') return 'admin';
  if (r === 'stakeholder') return 'stakeholder';
  return 'qa-engineer';
}

/**
 * Build the F10 chip-rail suggestions from a seed roster. Filters out the
 * signed-in user by id. Order is preserved from the input (the seed
 * roster is alphabetical by displayName).
 */
export function buildRosterSuggestions(
  members: Array<{ id: string; displayName: string; email: string; role: string }>,
  signedInUserId: string,
): RosterSuggestion[] {
  return members
    .filter((m) => m.id !== signedInUserId)
    .map((m, idx) => ({
      initials: initialsOf(m.displayName),
      fullName: m.displayName,
      shortName: shortNameOf(m.displayName),
      email: m.email,
      role: inviteRoleOf(m.role),
      glyph: GLYPH_CYCLE[idx % GLYPH_CYCLE.length],
    }));
}

export const inviteRoleLabel: Record<InviteRole, string> = {
  lead: 'Lead',
  admin: 'Admin',
  'qa-engineer': 'QA Engineer',
  stakeholder: 'Stakeholder',
};

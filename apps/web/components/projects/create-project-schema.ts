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

// Iksula roster suggestions for the invites chip rail (excludes signed-in
// user — that filter happens at the component level via SIGNED_IN_USER).
export interface RosterSuggestion {
  initials: string;
  fullName: string;
  shortName: string;
  email: string;
  role: InviteRole;
  glyph: GlyphId;
}

export const ROSTER_SUGGESTIONS: RosterSuggestion[] = [
  {
    initials: 'AP',
    fullName: 'Akshay Panchal',
    shortName: 'Akshay P.',
    email: 'akshay.panchal@iksula.com',
    role: 'lead',
    glyph: 'teal-violet',
  },
  {
    initials: 'KK',
    fullName: 'Kishor Kadam',
    shortName: 'Kishor K.',
    email: 'kishor.kadam@iksula.com',
    role: 'qa-engineer',
    glyph: 'teal-soft',
  },
  {
    initials: 'NG',
    fullName: 'Nitin Gomle',
    shortName: 'Nitin G.',
    email: 'nitin.gomle@iksula.com',
    role: 'qa-engineer',
    glyph: 'violet-only',
  },
  {
    initials: 'NS',
    fullName: 'Nadim Siddiqui',
    shortName: 'Nadim S.',
    email: 'nadim.siddiqui@iksula.com',
    role: 'qa-engineer',
    glyph: 'teal-violet',
  },
  {
    initials: 'GD',
    fullName: 'Govind Daware',
    shortName: 'Govind D.',
    email: 'govind.daware@iksula.com',
    role: 'qa-engineer',
    glyph: 'teal-soft',
  },
  {
    initials: 'MK',
    fullName: 'Mohanraj K.',
    shortName: 'Mohanraj K.',
    email: 'mohanraj.k@iksula.com',
    role: 'qa-engineer',
    glyph: 'violet-only',
  },
  {
    initials: 'ST',
    fullName: 'Sagar Todankar',
    shortName: 'Sagar T.',
    email: 'sagar.todankar@iksula.com',
    role: 'qa-engineer',
    glyph: 'neutral',
  },
];

export const inviteRoleLabel: Record<InviteRole, string> = {
  lead: 'Lead',
  admin: 'Admin',
  'qa-engineer': 'QA Engineer',
  stakeholder: 'Stakeholder',
};

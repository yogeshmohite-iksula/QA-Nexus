// Zod schemas for the F07 Founder Onboarding wizard.
//
// TODO(M1, MS0-T021 + MS0-T020): move these schemas to packages/shared/onboarding
// once BetterAuth + Prisma wire up the backend. Frontend imports the same
// schemas the backend declares (single source of truth) per .claude/rules/frontend.md.
// For now, the FE is the source of truth (BE wiring deferred per CHAT 2 brief).

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Step 1 — Create project
// ---------------------------------------------------------------------------

export const glyphIds = ['teal-violet', 'teal-soft', 'violet-only', 'neutral'] as const;
export type GlyphId = (typeof glyphIds)[number];

export const stepProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Project name must be at least 2 characters')
    .max(50, 'Project name must be 50 characters or fewer'),
  description: z
    .string()
    .trim()
    .max(500, 'Description must be 500 characters or fewer')
    .optional()
    .or(z.literal('')),
  glyph: z.enum(glyphIds),
  jiraKey: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{2,10}$/, 'Use 2–10 letters or digits')
    .optional()
    .or(z.literal('')),
});

export type StepProject = z.infer<typeof stepProjectSchema>;

// ---------------------------------------------------------------------------
// Step 2 — Choose data source (Pattern A: store selection only, defer flow)
// ---------------------------------------------------------------------------

export const dataSources = ['jira', 'upload'] as const;
export type DataSource = (typeof dataSources)[number];

export const stepDataSourceSchema = z.object({
  source: z.enum(dataSources).optional(),
});

export type StepDataSource = z.infer<typeof stepDataSourceSchema>;

// ---------------------------------------------------------------------------
// Step 3 — Invite team
// ---------------------------------------------------------------------------

export const inviteRoles = ['lead', 'qa-engineer'] as const;
export type InviteRole = (typeof inviteRoles)[number];

export const inviteSchema = z.object({
  email: z.string().trim().email('Enter a valid email').or(z.literal('')),
  role: z.enum(inviteRoles),
});

export const stepTeamInviteSchema = z.object({
  invites: z.array(inviteSchema),
});

export type StepTeamInvite = z.infer<typeof stepTeamInviteSchema>;

// ---------------------------------------------------------------------------
// Combined wizard form (atomic commit on Step 3)
// ---------------------------------------------------------------------------

export const founderWizardSchema = stepProjectSchema
  .merge(stepDataSourceSchema)
  .merge(stepTeamInviteSchema);

export type FounderWizardForm = z.infer<typeof founderWizardSchema>;

export const wizardDefaults: FounderWizardForm = {
  name: '',
  description: '',
  glyph: 'teal-violet',
  jiraKey: '',
  source: undefined,
  invites: [
    { email: '', role: 'qa-engineer' },
    { email: '', role: 'qa-engineer' },
    { email: '', role: 'qa-engineer' },
  ],
};

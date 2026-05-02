// TB-003 projects + TB-004 project_members.
import { z } from 'zod';
import { Uuid, Timestamp, UserRole, NonEmpty } from './enums';

export const ProjectSchema = z.object({
  id: Uuid,
  workspaceId: Uuid,
  key: z
    .string()
    .min(2)
    .max(20)
    .regex(/^[A-Z0-9_]+$/, 'key must be UPPER_SNAKE'),
  name: NonEmpty,
  description: z.string().nullable(),
  createdBy: Uuid,
  createdAt: Timestamp,
});
export type Project = z.infer<typeof ProjectSchema>;

export const CreateProjectInput = z.object({
  key: z
    .string()
    .min(2)
    .max(20)
    .regex(/^[A-Z0-9_]+$/),
  name: NonEmpty,
  description: z.string().optional(),
});
export type CreateProjectInput = z.infer<typeof CreateProjectInput>;

export const UpdateProjectInput = z.object({
  name: NonEmpty.optional(),
  description: z.string().nullable().optional(),
});
export type UpdateProjectInput = z.infer<typeof UpdateProjectInput>;

// TB-004 project_members
export const ProjectMemberSchema = z.object({
  projectId: Uuid,
  userId: Uuid,
  roleOverride: UserRole.nullable(),
  createdAt: Timestamp,
});
export type ProjectMember = z.infer<typeof ProjectMemberSchema>;

export const AddProjectMemberInput = z.object({
  userId: Uuid,
  roleOverride: UserRole.optional(),
});
export type AddProjectMemberInput = z.infer<typeof AddProjectMemberInput>;

// ─────────────────────────────────────────────────────────────────────
// M1 Day-6 PM Block 2 — F27 project-scoped role override section.
// Endpoints under /api/projects/:slug/members. Uses
// ProjectScopedRolesGuard (effective role per-project).
// ─────────────────────────────────────────────────────────────────────

export const ProjectMemberListItem = z.object({
  userId: Uuid,
  email: z.string().email(),
  name: NonEmpty,
  workspaceRole: UserRole,
  /** NULL = inherits workspace role; non-null = per-project override. */
  roleOverride: UserRole.nullable(),
  addedAt: Timestamp,
  /** UUID of the user who added this member. NULL = seeded by Day-0 bootstrap. */
  addedByUserId: Uuid.nullable(),
});
export type ProjectMemberListItem = z.infer<typeof ProjectMemberListItem>;

export const ListProjectMembersResponse = z.object({
  ok: z.literal(true),
  members: z.array(ProjectMemberListItem),
});
export type ListProjectMembersResponse = z.infer<typeof ListProjectMembersResponse>;

/// Body of PATCH /api/projects/:slug/members/:userId.
/// `roleOverride: null` removes the override (falls back to workspace role).
export const ChangeProjectMemberRoleInput = z.object({
  roleOverride: UserRole.nullable(),
});
export type ChangeProjectMemberRoleInput = z.infer<typeof ChangeProjectMemberRoleInput>;

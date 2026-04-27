// TB-003 projects + TB-004 project_members.
import { z } from 'zod';
import { Uuid, Timestamp, UserRole, NonEmpty } from './enums.js';

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

// TB-001 workspaces — top-level tenant container.
import { z } from 'zod';
import { Uuid, Timestamp } from './enums.js';

export const WorkspaceSchema = z.object({
  id: Uuid,
  name: z.string().min(1).max(120),
  createdAt: Timestamp,
  createdBy: Uuid.nullable(),
  settings: z.record(z.unknown()).default({}),
});
export type Workspace = z.infer<typeof WorkspaceSchema>;

export const CreateWorkspaceInput = z.object({
  name: z.string().min(1).max(120),
  settings: z.record(z.unknown()).optional(),
});
export type CreateWorkspaceInput = z.infer<typeof CreateWorkspaceInput>;

export const UpdateWorkspaceInput = z.object({
  name: z.string().min(1).max(120).optional(),
  settings: z.record(z.unknown()).optional(),
});
export type UpdateWorkspaceInput = z.infer<typeof UpdateWorkspaceInput>;

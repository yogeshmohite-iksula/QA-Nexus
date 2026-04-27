// TB-006 requirements.
import { z } from 'zod';
import {
  Uuid,
  Timestamp,
  Priority,
  RequirementStatus,
  RequirementSource,
  NonEmpty,
} from './enums.js';

export const RequirementSchema = z.object({
  id: Uuid,
  projectId: Uuid,
  key: z.string().min(2).max(40),
  title: NonEmpty,
  description: z.string(),
  epicKey: z.string().nullable(),
  priority: Priority,
  status: RequirementStatus,
  sprint: z.string().nullable(),
  source: RequirementSource,
  sourceRef: z.string().nullable(),
  createdBy: Uuid,
  createdAt: Timestamp,
  updatedAt: Timestamp,
});
export type Requirement = z.infer<typeof RequirementSchema>;

export const CreateRequirementInput = z.object({
  key: z.string().min(2).max(40),
  title: NonEmpty,
  description: z.string(),
  epicKey: z.string().optional(),
  priority: Priority,
  sprint: z.string().optional(),
  source: RequirementSource.default('manual'),
  sourceRef: z.string().optional(),
});
export type CreateRequirementInput = z.infer<typeof CreateRequirementInput>;

export const UpdateRequirementInput = CreateRequirementInput.partial().extend({
  status: RequirementStatus.optional(),
});
export type UpdateRequirementInput = z.infer<typeof UpdateRequirementInput>;

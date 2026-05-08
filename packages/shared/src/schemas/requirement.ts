// TB-006 requirements.
import { z } from 'zod';
import { Uuid, Timestamp, Priority, RequirementStatus, RequirementSource, NonEmpty } from './enums';

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

// ─────────────────────────────────────────────────────────────────────
// M3 Day-13 TASK 2 — Requirement CRUD response + filter shapes.
// Real implementation replaces the M3-BE-03 501 stubs from PR #77.
// ─────────────────────────────────────────────────────────────────────

/// `GET /api/projects/:projectId/requirements` filter surface.
/// Mirrors TestCaseListQuery's CSV-coerce pattern.
export const RequirementListQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  /// CSV: `?priority=P0,P1`
  priority: z
    .string()
    .optional()
    .transform((s) =>
      s
        ? s
            .split(',')
            .map((p) => p.trim())
            .filter(Boolean)
        : undefined,
    ),
  /// CSV: `?status=active,done`
  status: z
    .string()
    .optional()
    .transform((s) =>
      s
        ? s
            .split(',')
            .map((p) => p.trim())
            .filter(Boolean)
        : undefined,
    ),
  /// `?source=jira` (single value).
  source: RequirementSource.optional(),
  /// `?sprint=Sprint-42` (exact match).
  sprint: z.string().min(1).max(80).optional(),
  /// Free-text title search (case-insensitive ILIKE substring).
  q: z.string().min(1).max(200).optional(),
});
export type RequirementListQuery = z.infer<typeof RequirementListQuery>;

export const RequirementListItem = z.object({
  id: Uuid,
  projectId: Uuid,
  key: z.string(),
  title: NonEmpty,
  priority: Priority,
  status: RequirementStatus,
  source: RequirementSource,
  sourceRef: z.string().nullable(),
  epicKey: z.string().nullable(),
  sprint: z.string().nullable(),
  /// Number of linked test cases — derived via Prisma `_count.testCaseLinks`.
  linkedTestCaseCount: z.number().int().nonnegative(),
  createdBy: Uuid,
  createdAt: Timestamp,
  updatedAt: Timestamp,
});
export type RequirementListItem = z.infer<typeof RequirementListItem>;

export const RequirementListResponse = z.object({
  ok: z.literal(true),
  requirements: z.array(RequirementListItem),
  pagination: z.object({
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
  }),
});
export type RequirementListResponse = z.infer<typeof RequirementListResponse>;

export const RequirementDetailItem = RequirementListItem.extend({
  description: z.string(),
});
export type RequirementDetailItem = z.infer<typeof RequirementDetailItem>;

export const RequirementDetailResponse = z.object({
  ok: z.literal(true),
  requirement: RequirementDetailItem,
});
export type RequirementDetailResponse = z.infer<typeof RequirementDetailResponse>;

export const RequirementCreateResponse = z.object({
  ok: z.literal(true),
  requirement: RequirementDetailItem,
});
export type RequirementCreateResponse = z.infer<typeof RequirementCreateResponse>;

export const RequirementUpdateResponse = z.object({
  ok: z.literal(true),
  requirement: RequirementDetailItem,
});
export type RequirementUpdateResponse = z.infer<typeof RequirementUpdateResponse>;

/// DELETE = soft-delete via `status='archived'`. RequirementStatus
/// enum already has 'archived' as a vocab value, so no enum
/// reconciliation is needed (unlike test_cases — see PR #74 note).
export const RequirementDeleteResponse = z.object({
  ok: z.literal(true),
  requirementId: Uuid,
  archived: z.literal(true),
});
export type RequirementDeleteResponse = z.infer<typeof RequirementDeleteResponse>;

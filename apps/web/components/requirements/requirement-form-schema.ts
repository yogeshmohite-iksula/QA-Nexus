// F14m1 Edit/Add Requirement Modal — Zod schema + defaults + helper.
//
// Mirrors `requirementSchema` (TB-006) but trimmed to the editable
// surface. Server-set fields (id, projectId, createdById, createdAt,
// updatedAt, source, sourceRef) live on the persisted entity, NOT on
// the form. `key` is read-only when editing (server-issued) and
// optional / preview-only when adding (BE assigns the next RET-###
// at create time).

import { z } from 'zod';
import { requirementPriorityValues, requirementStatusValues } from '@/lib/data/requirements';

// Sprint dropdown options — surfaced in the Sprint select. The first
// "" entry is the unassigned / null state. Brief specified Sprint 41
// / 42 / 43; matches what's in the seed today.
export const requirementSprintOptions = [
  { value: '', label: 'No sprint' },
  { value: 'Sprint 41', label: 'Sprint 41' },
  { value: 'Sprint 42', label: 'Sprint 42' },
  { value: 'Sprint 43', label: 'Sprint 43' },
] as const;

export const requirementFormSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be 200 characters or fewer'),
  description: z.string().max(4000, 'Description must be 4 000 characters or fewer').default(''),
  priority: z.enum(requirementPriorityValues, {
    errorMap: () => ({ message: 'Pick a priority' }),
  }),
  status: z.enum(requirementStatusValues, {
    errorMap: () => ({ message: 'Pick a status' }),
  }),
  sprint: z.string().max(64).default(''), // empty string = unassigned (maps to null on persist)
  tags: z.array(z.string().min(1).max(30)).max(20, 'Up to 20 tags').default([]),
  acceptanceCriteria: z
    .string()
    .max(8000, 'Acceptance criteria must be 8 000 characters or fewer')
    .default(''),
});

export type RequirementForm = z.infer<typeof requirementFormSchema>;

export const requirementFormDefaults: RequirementForm = {
  title: '',
  description: '',
  priority: 'Medium',
  status: 'draft',
  sprint: '',
  tags: [],
  acceptanceCriteria: '',
};

// Build the BE payload from a validated form. Maps empty `sprint`
// string to `null` (matches TB-006 `sprint text NULL`). Trims tags.
export interface RequirementMutationPayload {
  title: string;
  description: string;
  priority: RequirementForm['priority'];
  status: RequirementForm['status'];
  sprint: string | null;
  tags: string[];
  acceptanceCriteria: string;
}

export function buildRequirementPayload(form: RequirementForm): RequirementMutationPayload {
  return {
    title: form.title.trim(),
    description: form.description.trim(),
    priority: form.priority,
    status: form.status,
    sprint: form.sprint.trim() === '' ? null : form.sprint.trim(),
    tags: form.tags.map((t) => t.trim()).filter(Boolean),
    acceptanceCriteria: form.acceptanceCriteria.trim(),
  };
}

// Tag-input helper — splits a comma- or newline-separated paste into
// tag tokens. Trims, drops empties, dedupes.
export function parseTagInput(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(/[,\n]/g)
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  );
}

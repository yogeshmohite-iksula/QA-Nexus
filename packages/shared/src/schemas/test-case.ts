// TB-007 test_cases + TB-008 test_case_links.
import { z } from 'zod';
import { Uuid, Timestamp, Priority, TestCaseStatus, NonEmpty } from './enums';

export const TestStepSchema = z.object({
  order: z.number().int().nonnegative(),
  action: NonEmpty,
  expected: z.string().optional(),
});
export type TestStep = z.infer<typeof TestStepSchema>;

export const TestCaseSchema = z.object({
  id: Uuid,
  projectId: Uuid,
  key: z.string().min(2).max(40),
  title: NonEmpty,
  preconditions: z.string(),
  stepsJson: z.array(TestStepSchema),
  expectedResult: z.string(),
  priority: Priority,
  status: TestCaseStatus,
  confidenceScore: z.number().min(0).max(1).nullable(),
  aiProvenanceJson: z.record(z.unknown()).nullable(),
  // Embedding is server-managed; not part of API responses by default.
  createdBy: Uuid,
  createdAt: Timestamp,
  updatedAt: Timestamp,
});
export type TestCase = z.infer<typeof TestCaseSchema>;

export const CreateTestCaseInput = z.object({
  key: z.string().min(2).max(40),
  title: NonEmpty,
  preconditions: z.string().default(''),
  stepsJson: z.array(TestStepSchema).default([]),
  expectedResult: z.string(),
  priority: Priority,
  status: TestCaseStatus.default('manual_draft'),
  linkedRequirementIds: z.array(Uuid).default([]),
});
export type CreateTestCaseInput = z.infer<typeof CreateTestCaseInput>;

export const UpdateTestCaseInput = CreateTestCaseInput.omit({ key: true }).partial();
export type UpdateTestCaseInput = z.infer<typeof UpdateTestCaseInput>;

// TB-008 test_case_links
export const TestCaseLinkSchema = z.object({
  testCaseId: Uuid,
  requirementId: Uuid,
});
export type TestCaseLink = z.infer<typeof TestCaseLinkSchema>;

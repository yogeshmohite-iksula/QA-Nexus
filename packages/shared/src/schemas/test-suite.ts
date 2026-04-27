// TB-009 test_suites + TB-010 test_suite_members.
import { z } from 'zod';
import { Uuid, Timestamp, TestSuiteStatus, NonEmpty } from './enums.js';

export const TestSuiteSchema = z.object({
  id: Uuid,
  projectId: Uuid,
  name: NonEmpty,
  description: z.string(),
  ownerId: Uuid,
  status: TestSuiteStatus,
  createdAt: Timestamp,
  updatedAt: Timestamp,
});
export type TestSuite = z.infer<typeof TestSuiteSchema>;

export const CreateTestSuiteInput = z.object({
  name: NonEmpty,
  description: z.string().default(''),
  ownerId: Uuid,
});
export type CreateTestSuiteInput = z.infer<typeof CreateTestSuiteInput>;

export const UpdateTestSuiteInput = z.object({
  name: NonEmpty.optional(),
  description: z.string().optional(),
  ownerId: Uuid.optional(),
  status: TestSuiteStatus.optional(),
});
export type UpdateTestSuiteInput = z.infer<typeof UpdateTestSuiteInput>;

// TB-010 test_suite_members
export const TestSuiteMemberSchema = z.object({
  suiteId: Uuid,
  testCaseId: Uuid,
  displayOrder: z.number().int().nonnegative(),
});
export type TestSuiteMember = z.infer<typeof TestSuiteMemberSchema>;

export const ReorderSuiteMembersInput = z.object({
  members: z.array(z.object({ testCaseId: Uuid, displayOrder: z.number().int().nonnegative() })),
});
export type ReorderSuiteMembersInput = z.infer<typeof ReorderSuiteMembersInput>;

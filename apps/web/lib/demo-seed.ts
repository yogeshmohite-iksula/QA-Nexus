/**
 * DEMO SEED DATA — temporary stub until BE API endpoints land.
 *
 * DO NOT add new user/project/entity arrays in component data.ts files.
 * All UI components must read via context providers:
 *   - useCurrentUser() — apps/web/lib/contexts/CurrentUserContext
 *   - useProject(), useActiveProject(), useProjectList() — ProjectContext
 *   - useTeamRoster(), useTeamMember(id), useTeammates() — TeamRosterContext
 *
 * When T021 BetterAuth + F27 user management + project CRUD endpoints land,
 * this file gets replaced by API responses (likely via TanStack Query +
 * `/api/users`, `/api/projects`, etc). Components require ZERO changes —
 * the context providers swap their data source and the type contracts in
 * `@qa-nexus/shared` (UserPublic, Project, AgentActivity, Approval, …)
 * remain stable.
 *
 * Replaced by (target endpoints):
 *   - /api/users               (T021 / F27)
 *   - /api/projects            (T030.5+ / F27)
 *   - /api/test-cases          (M2)
 *   - /api/defects             (M3)
 *   - /api/runs                (M4)
 *   - /api/activity-feed       (M2-M4)
 *   - /api/approvals           (M2-M4)
 *
 * See ADR-006 + `docs/refactor/seed-centralization-migration.md` for the
 * full migration plan + the FE Day-4 refactor runbook.
 *
 * Spec: followup (i) Phase 3(b). Volumes per Yogesh's binding spec.
 *
 * IDs are STABLE hardcoded UUID v4 — see SEED_IDS at the bottom for the
 * canonical name → UUID map. Snapshot tests + cross-references depend on
 * stability. Do NOT regenerate these UUIDs casually; if you must, update
 * every consumer in the same PR.
 */

import type {
  UserPublic,
  Project,
  TestCase,
  Defect,
  TestRun,
  AgentActivity,
  Approval,
} from '@qa-nexus/shared';

// ────────────────────────────────────────────────────────────────────
// Workspace anchor — single workspace for the PM1 pilot per
// IKSULA_CONTEXT.md. All entities scope to this ID.
// ────────────────────────────────────────────────────────────────────

export const WORKSPACE_ID = '675ca171-15ab-4105-953a-9f2824dcda2e';

// Reusable timestamps — held constant for snapshot stability.
const T_BASE = '2026-01-15T08:00:00.000Z'; // workspace + project creation baseline
const T_TODAY = '2026-04-29T10:00:00.000Z';
const T_YESTERDAY = '2026-04-28T15:00:00.000Z';
const T_2D_AGO = '2026-04-27T11:00:00.000Z';

// ────────────────────────────────────────────────────────────────────
// USERS — 8 named Iksula pilot users per CLAUDE.md "Iksula data canon".
// Alphabetical by displayName so SEED_IDS lookups are predictable.
// ────────────────────────────────────────────────────────────────────

export const users: UserPublic[] = [
  {
    id: '27ba2087-2e14-4c09-aeab-a2750358bf35',
    workspaceId: WORKSPACE_ID,
    email: 'akshay.panchal@iksula.com',
    displayName: 'Akshay Panchal',
    role: 'Lead',
    organizationalLabel: 'QA Lead',
    activatedAt: T_BASE,
    lastLoginAt: T_TODAY,
    createdAt: T_BASE,
  },
  {
    id: '49c80226-77ef-4a25-9da8-38de57646cf0',
    workspaceId: WORKSPACE_ID,
    email: 'govind.daware@iksula.com',
    displayName: 'Govind Daware',
    role: 'QAEngineer',
    organizationalLabel: 'QA Engineer',
    activatedAt: T_BASE,
    lastLoginAt: T_YESTERDAY,
    createdAt: T_BASE,
  },
  {
    id: '7ead099f-5012-47a0-94e8-83e1a15ce964',
    workspaceId: WORKSPACE_ID,
    email: 'kishor.kadam@iksula.com',
    displayName: 'Kishor Kadam',
    role: 'QAEngineer',
    organizationalLabel: 'QA Engineer',
    activatedAt: T_BASE,
    lastLoginAt: T_TODAY,
    createdAt: T_BASE,
  },
  {
    id: 'aabf7dd7-2e89-4429-8708-422c6b03b8cd',
    workspaceId: WORKSPACE_ID,
    email: 'mohanraj.k@iksula.com',
    displayName: 'Mohanraj K.',
    role: 'QAEngineer',
    organizationalLabel: 'QA Engineer',
    activatedAt: T_BASE,
    lastLoginAt: T_2D_AGO,
    createdAt: T_BASE,
  },
  {
    id: '4afc692f-6252-4bbb-825b-f959f59e4234',
    workspaceId: WORKSPACE_ID,
    email: 'nadim.siddiqui@iksula.com',
    displayName: 'Nadim Siddiqui',
    role: 'QAEngineer',
    organizationalLabel: 'QA Engineer',
    activatedAt: T_BASE,
    lastLoginAt: T_YESTERDAY,
    createdAt: T_BASE,
  },
  {
    id: 'c9872aec-8200-41f2-b522-7dffe723221e',
    workspaceId: WORKSPACE_ID,
    email: 'nitin.gomle@iksula.com',
    displayName: 'Nitin Gomle',
    role: 'QAEngineer',
    organizationalLabel: 'QA Engineer',
    activatedAt: T_BASE,
    lastLoginAt: T_TODAY,
    createdAt: T_BASE,
  },
  {
    id: '41d0e917-3cf4-4882-bf80-6358d1fcdddf',
    workspaceId: WORKSPACE_ID,
    email: 'sagar.todankar@iksula.com',
    displayName: 'Sagar Todankar',
    role: 'QAEngineer',
    organizationalLabel: 'QA Engineer',
    activatedAt: T_BASE,
    lastLoginAt: T_2D_AGO,
    createdAt: T_BASE,
  },
  {
    id: '9514aa89-2699-4c2d-93b1-75ecec96704e',
    workspaceId: WORKSPACE_ID,
    email: 'yogesh.mohite@iksula.com',
    displayName: 'Yogesh Mohite',
    role: 'Admin',
    organizationalLabel: 'Sr QA / Admin',
    activatedAt: T_BASE,
    lastLoginAt: T_TODAY,
    createdAt: T_BASE,
  },
];

// ────────────────────────────────────────────────────────────────────
// PROJECTS — 5 Iksula projects per IKSULA_CONTEXT.md.
// Alphabetical by key for SEED_IDS lookup ergonomics.
// ────────────────────────────────────────────────────────────────────

export const projects: Project[] = [
  {
    id: '00fa51a0-c9ae-4d19-b30c-7fe72be45258',
    workspaceId: WORKSPACE_ID,
    key: 'AUTH',
    name: 'Iksula Mobile App',
    description: 'iOS + Android app login + session management. Main green.',
    createdBy: users[7].id, // Yogesh = Admin
    createdAt: T_BASE,
  },
  {
    id: '60e7f9b4-0acf-460d-a4bf-09dd67f9adbe',
    workspaceId: WORKSPACE_ID,
    key: 'CART',
    name: 'Iksula Commerce',
    description: 'Storefront + checkout. Main branch active.',
    createdBy: users[7].id,
    createdAt: T_BASE,
  },
  {
    id: '4088051f-3ead-45ea-97b5-15547171de11',
    workspaceId: WORKSPACE_ID,
    key: 'OPS',
    name: 'Iksula Internal Ops',
    description: 'Ops admin tooling. Available, lower priority.',
    createdBy: users[7].id,
    createdAt: T_BASE,
  },
  {
    id: '6be050cd-9330-4385-b376-9b4b053c0277',
    workspaceId: WORKSPACE_ID,
    key: 'PAY',
    name: 'Iksula Payments',
    description: 'Payment gateway integration. Staging amber.',
    createdBy: users[7].id,
    createdAt: T_BASE,
  },
  {
    // RET — anchor project per IKSULA_CONTEXT.md "Anchor project for seeds"
    id: '0fc84fa9-3ede-4cae-82d1-6d31d4b3ad7b',
    workspaceId: WORKSPACE_ID,
    key: 'RET',
    name: 'Iksula Returns',
    description:
      'Return-flow + refund pipeline. Sprint 42, Day 9 of 14. Release R-2026-04-PaymentV2.',
    createdBy: users[7].id, // Yogesh
    createdAt: T_BASE,
  },
];

// Helper handles for inline use below — keeps the literal arrays readable.
const RET_ID = projects[4].id;
const CART_ID = projects[1].id;
const PAY_ID = projects[3].id;
const AUTH_ID = projects[0].id;
const OPS_ID = projects[2].id;
const AKSHAY = users[0];
const GOVIND = users[1];
const KISHOR = users[2];
const MOHANRAJ = users[3];
const NADIM = users[4];
const NITIN = users[5];
const SAGAR = users[6];
const YOGESH = users[7];

// ────────────────────────────────────────────────────────────────────
// TEST CASES — 50 across the 5 projects (RET=20 / CART=12 / PAY=8 /
// AUTH=7 / OPS=3). Mix of statuses + priorities for visual variety.
// ────────────────────────────────────────────────────────────────────

const TC_UUIDS = [
  '66de6eff-265e-4c62-bc26-8227ae6ba1c4',
  'e89c2ad7-d295-44df-94cb-f2287e02c47b',
  '1d668a04-8afe-4c35-87b9-8cb344997b28',
  '8cbd24b9-96e8-4d86-8871-d2bb0bd64d1a',
  '0cacf778-4bf5-4fee-a106-d33c777d9e11',
  '975e2250-78e8-4c73-a225-c35c92932641',
  'f16f4cd1-f431-4e46-8414-d8cf9ef21f05',
  '1b09ea1c-45e9-4a20-8892-5141e3b9cbad',
  '7003eb60-b02a-41c4-94b6-a9c6040abed0',
  'cae95114-6c0d-4d43-9269-42beedead2c9',
  'b4a48de5-4809-4c2a-9363-f8b4f3fe90a9',
  'a3fdd1ab-9cc6-4d45-b13c-040f0edfa788',
  'c0ed36fe-f5b8-4943-87b4-0f3da9c37923',
  'f5e21404-0e59-4680-8692-d40262854d45',
  'd2eb8641-11e7-434e-9c24-f24a5ab29cca',
  '68002496-cbfd-4768-9da2-bdc8785d5583',
  'a6f84fa0-6f77-41f7-bcdf-baa74856ac05',
  'e76cbf51-9d9a-4129-bcaa-78abfef67d6c',
  '7050531c-1938-496c-8de2-e28d36a98ac5',
  '4d3eaa9e-1288-40ee-81b6-13901380b484',
  // CART (12)
  'e1a117c0-d809-4da4-a2af-e0ac20db38a0',
  '42ff0cd9-6cb8-4589-a619-0ed527fa9ca6',
  '1709b101-67d0-4463-8a60-6d979dca12c3',
  '479fa1b8-b5b8-491e-8942-19cc87a69ac8',
  '693d140f-611b-4070-87d7-a031560987b7',
  '9d2f485f-dd5e-48fc-ad39-1f140f497d34',
  'f3a78d65-8278-41a0-a818-26d4f8ae72fd',
  'ce0190a9-53aa-4f2d-9ad9-202ff3ce82b2',
  '5bcb95e9-c207-490a-a558-9f3ee4cfbfc9',
  '9daab4f6-8ef8-47f0-aba3-ed5c6c144463',
  '4af9e42d-8769-4cee-820e-9e27d3a3927b',
  'd080e5b5-c642-4f4c-99bd-3a09a5b3dd53',
  // PAY (8)
  '3512ea37-f632-46e8-bd93-214225f18ce8',
  'a0178ece-1a2d-4769-98b4-103139664ccc',
  'a986f33a-de2b-4eaa-b5c3-ecdd4a32d9a0',
  '8847a3df-25b3-4e19-8480-03fdcdeb89cf',
  'b71ec367-a55f-4cfe-9946-784db9b71cb6',
  '28b916c4-bfa9-463d-b85c-4c6b889e75b5',
  'ab491ca5-f8fb-4ec9-8220-af2d02c1699b',
  '85e3c7e9-513c-4ed3-b052-0b81f8197c1f',
  // AUTH (7)
  '8645721a-78b2-4a8a-af59-8528c3c49bef',
  '89b1e893-5348-4ada-a14c-c78197933f62',
  '0c467e4d-12c7-4bef-a2ac-13ec85726aa9',
  '6b77b15c-09d1-4449-b3c8-9641a595e4ba',
  '415ba50b-7784-4281-8652-dda25d6ed986',
  '6c111a88-1c2b-4dcf-a744-d7302e9d5c92',
  'e99d520f-0c13-42d4-acba-e7c66497e267',
  // OPS (3)
  '8fa62d2c-29b2-41e4-8d26-76bc2ca726be',
  '45c010a0-37b7-46ac-98da-0aed997f6a41',
  'edb6f02b-a472-49d8-8eb3-4babbd7f84d2',
];

// Compact helper builds a TestCase. Defaults sensible values that a
// stub can rely on without per-row repetition.
function tc(overrides: {
  index: number;
  projectId: string;
  key: string;
  title: string;
  status?: TestCase['status'];
  priority?: TestCase['priority'];
  assignee?: UserPublic;
  confidenceScore?: number | null;
  expected?: string;
  preconditions?: string;
}): TestCase {
  const {
    index,
    projectId,
    key,
    title,
    status = 'reviewed',
    priority = 'P2',
    assignee = YOGESH,
    confidenceScore = 0.85,
    expected = 'Behavior matches the spec.',
    preconditions = 'User authenticated; project context active.',
  } = overrides;
  return {
    id: TC_UUIDS[index],
    projectId,
    key,
    title,
    preconditions,
    stepsJson: [
      { order: 1, action: 'Open the relevant page', expected: 'Page loads' },
      { order: 2, action: 'Trigger the action under test', expected: 'Action executes' },
      { order: 3, action: 'Verify the outcome', expected },
    ],
    expectedResult: expected,
    priority,
    status,
    confidenceScore,
    aiProvenanceJson:
      status === 'ai_draft' ? { agent: 'test-author', model: 'gpt-oss-120b' } : null,
    // M3 TASK BE-01 — AI provenance fields. Demo seed defaults to the
    // step-format manual path so existing fixtures keep their shape.
    format: 'step',
    gherkin: null,
    generatedByAgent: null,
    sourceChunkIds: null,
    rationale: null,
    createdBy: assignee.id,
    createdAt: T_2D_AGO,
    updatedAt: T_YESTERDAY,
  };
}

export const testCases: TestCase[] = [
  // RET (20)
  tc({
    index: 0,
    projectId: RET_ID,
    key: 'TC-RET-001',
    title: 'Refund initiated within 7 days lands in customer account',
    priority: 'P1',
    status: 'active',
    assignee: AKSHAY,
  }),
  tc({
    index: 1,
    projectId: RET_ID,
    key: 'TC-RET-002',
    title: 'Refund after 7 days requires manager approval',
    priority: 'P1',
    status: 'active',
    assignee: AKSHAY,
  }),
  tc({
    index: 2,
    projectId: RET_ID,
    key: 'TC-RET-003',
    title: 'Partial refund of multi-item order updates each line',
    priority: 'P1',
    status: 'reviewed',
    assignee: KISHOR,
  }),
  tc({
    index: 3,
    projectId: RET_ID,
    key: 'TC-RET-004',
    title: 'Refund amount matches paid amount minus shipping',
    priority: 'P1',
    status: 'active',
    assignee: KISHOR,
  }),
  tc({
    index: 4,
    projectId: RET_ID,
    key: 'TC-RET-005',
    title: 'Refund of expired voucher is rejected',
    priority: 'P2',
    status: 'reviewed',
    assignee: NITIN,
  }),
  tc({
    index: 5,
    projectId: RET_ID,
    key: 'TC-RET-006',
    title: 'Multiple refunds on same order are tracked separately',
    priority: 'P2',
    status: 'active',
    assignee: NITIN,
  }),
  tc({
    index: 6,
    projectId: RET_ID,
    key: 'TC-RET-007',
    title: 'Refund webhook is delivered to merchant on success',
    priority: 'P1',
    status: 'active',
    assignee: NADIM,
  }),
  tc({
    index: 7,
    projectId: RET_ID,
    key: 'TC-RET-008',
    title: 'Refund webhook retries on transient 5xx',
    priority: 'P2',
    status: 'flaky',
    assignee: NADIM,
  }),
  tc({
    index: 8,
    projectId: RET_ID,
    key: 'TC-RET-009',
    title: 'Refund email notification renders item images',
    priority: 'P3',
    status: 'reviewed',
    assignee: GOVIND,
  }),
  tc({
    index: 9,
    projectId: RET_ID,
    key: 'TC-RET-010',
    title: 'Return label PDF generates with correct postage',
    priority: 'P2',
    status: 'active',
    assignee: GOVIND,
  }),
  tc({
    index: 10,
    projectId: RET_ID,
    key: 'TC-RET-011',
    title: 'Return label QR code scans with carrier app',
    priority: 'P2',
    status: 'reviewed',
    assignee: MOHANRAJ,
  }),
  tc({
    index: 11,
    projectId: RET_ID,
    key: 'TC-RET-012',
    title: 'Refund eligibility shows in order detail page',
    priority: 'P2',
    status: 'active',
    assignee: MOHANRAJ,
  }),
  tc({
    index: 12,
    projectId: RET_ID,
    key: 'TC-RET-013',
    title: 'Bulk refund via admin CSV upload processes 100+ orders',
    priority: 'P2',
    status: 'manual_draft',
    assignee: SAGAR,
  }),
  tc({
    index: 13,
    projectId: RET_ID,
    key: 'TC-RET-014',
    title: 'Refund rejected when order is in dispute state',
    priority: 'P1',
    status: 'active',
    assignee: SAGAR,
  }),
  tc({
    index: 14,
    projectId: RET_ID,
    key: 'TC-RET-015',
    title: 'Refund accessibility — screen reader announces status',
    priority: 'P3',
    status: 'reviewed',
    assignee: KISHOR,
  }),
  tc({
    index: 15,
    projectId: RET_ID,
    key: 'TC-RET-016',
    title: 'Refund amount precision retains 2 decimal places',
    priority: 'P1',
    status: 'active',
    assignee: AKSHAY,
    confidenceScore: 0.95,
  }),
  tc({
    index: 16,
    projectId: RET_ID,
    key: 'TC-RET-017',
    title: 'Refund concurrency — 2 admins issuing same refund',
    priority: 'P1',
    status: 'flaky',
    assignee: NADIM,
  }),
  tc({
    index: 17,
    projectId: RET_ID,
    key: 'TC-RET-018',
    title: 'Refund audit log includes initiator + reason',
    priority: 'P2',
    status: 'active',
    assignee: YOGESH,
  }),
  tc({
    index: 18,
    projectId: RET_ID,
    key: 'TC-RET-019',
    title: 'Refund for international order applies forex rate at purchase',
    priority: 'P1',
    status: 'ai_draft',
    assignee: NITIN,
    confidenceScore: 0.78,
  }),
  tc({
    index: 19,
    projectId: RET_ID,
    key: 'TC-RET-020',
    title: 'Refund analytics dashboard updates within 5 min',
    priority: 'P3',
    status: 'manual_draft',
    assignee: GOVIND,
  }),

  // CART (12)
  tc({
    index: 20,
    projectId: CART_ID,
    key: 'TC-CART-001',
    title: 'Add to cart from PDP updates badge count',
    priority: 'P1',
    status: 'active',
    assignee: KISHOR,
  }),
  tc({
    index: 21,
    projectId: CART_ID,
    key: 'TC-CART-002',
    title: 'Quantity update preserves cart-level discount',
    priority: 'P2',
    status: 'active',
    assignee: NITIN,
  }),
  tc({
    index: 22,
    projectId: CART_ID,
    key: 'TC-CART-003',
    title: 'Remove last item from cart shows empty state',
    priority: 'P2',
    status: 'reviewed',
    assignee: NADIM,
  }),
  tc({
    index: 23,
    projectId: CART_ID,
    key: 'TC-CART-004',
    title: 'Save-for-later moves item out of active cart',
    priority: 'P2',
    status: 'active',
    assignee: GOVIND,
  }),
  tc({
    index: 24,
    projectId: CART_ID,
    key: 'TC-CART-005',
    title: 'Cart persists across browser sessions for signed-in user',
    priority: 'P1',
    status: 'active',
    assignee: AKSHAY,
  }),
  tc({
    index: 25,
    projectId: CART_ID,
    key: 'TC-CART-006',
    title: 'Out-of-stock item in cart shows banner',
    priority: 'P2',
    status: 'active',
    assignee: MOHANRAJ,
  }),
  tc({
    index: 26,
    projectId: CART_ID,
    key: 'TC-CART-007',
    title: 'Coupon code applies to subtotal correctly',
    priority: 'P1',
    status: 'reviewed',
    assignee: SAGAR,
  }),
  tc({
    index: 27,
    projectId: CART_ID,
    key: 'TC-CART-008',
    title: 'Cart expiration after 30 days clears items',
    priority: 'P3',
    status: 'manual_draft',
    assignee: GOVIND,
  }),
  tc({
    index: 28,
    projectId: CART_ID,
    key: 'TC-CART-009',
    title: 'Cart shows estimated tax + shipping pre-checkout',
    priority: 'P2',
    status: 'active',
    assignee: NITIN,
  }),
  tc({
    index: 29,
    projectId: CART_ID,
    key: 'TC-CART-010',
    title: 'Mini-cart drawer renders on mobile (RWD ≥ 320px)',
    priority: 'P2',
    status: 'reviewed',
    assignee: NADIM,
  }),
  tc({
    index: 30,
    projectId: CART_ID,
    key: 'TC-CART-011',
    title: 'Bundle discount applies when bundle items are present',
    priority: 'P2',
    status: 'ai_draft',
    assignee: KISHOR,
    confidenceScore: 0.81,
  }),
  tc({
    index: 31,
    projectId: CART_ID,
    key: 'TC-CART-012',
    title: 'Guest cart merges with user cart on sign-in',
    priority: 'P1',
    status: 'flaky',
    assignee: AKSHAY,
  }),

  // PAY (8)
  tc({
    index: 32,
    projectId: PAY_ID,
    key: 'TC-PAY-001',
    title: 'Card payment with 3DS challenge completes',
    priority: 'P1',
    status: 'active',
    assignee: NADIM,
  }),
  tc({
    index: 33,
    projectId: PAY_ID,
    key: 'TC-PAY-002',
    title: 'UPI payment with PSP timeout shows retry',
    priority: 'P1',
    status: 'active',
    assignee: NITIN,
  }),
  tc({
    index: 34,
    projectId: PAY_ID,
    key: 'TC-PAY-003',
    title: 'Payment idempotency-key prevents duplicate charges',
    priority: 'P1',
    status: 'reviewed',
    assignee: AKSHAY,
  }),
  tc({
    index: 35,
    projectId: PAY_ID,
    key: 'TC-PAY-004',
    title: 'Saved card reuse uses stored CVV-less flow',
    priority: 'P2',
    status: 'active',
    assignee: KISHOR,
  }),
  tc({
    index: 36,
    projectId: PAY_ID,
    key: 'TC-PAY-005',
    title: 'Payment with insufficient funds returns user error',
    priority: 'P2',
    status: 'active',
    assignee: GOVIND,
  }),
  tc({
    index: 37,
    projectId: PAY_ID,
    key: 'TC-PAY-006',
    title: 'Webhook signature verifies before payload trust',
    priority: 'P1',
    status: 'active',
    assignee: SAGAR,
  }),
  tc({
    index: 38,
    projectId: PAY_ID,
    key: 'TC-PAY-007',
    title: 'Payment receipt PDF includes GST breakup',
    priority: 'P3',
    status: 'reviewed',
    assignee: MOHANRAJ,
  }),
  tc({
    index: 39,
    projectId: PAY_ID,
    key: 'TC-PAY-008',
    title: 'Refund-on-failed-capture fires within 24h',
    priority: 'P2',
    status: 'manual_draft',
    assignee: NITIN,
  }),

  // AUTH (7)
  tc({
    index: 40,
    projectId: AUTH_ID,
    key: 'TC-AUTH-001',
    title: 'OTP sign-in delivers within 30 seconds',
    priority: 'P1',
    status: 'active',
    assignee: KISHOR,
  }),
  tc({
    index: 41,
    projectId: AUTH_ID,
    key: 'TC-AUTH-002',
    title: 'Password reset link expires after 1 hour',
    priority: 'P1',
    status: 'active',
    assignee: NADIM,
  }),
  tc({
    index: 42,
    projectId: AUTH_ID,
    key: 'TC-AUTH-003',
    title: 'Biometric unlock falls back to PIN on failure',
    priority: 'P2',
    status: 'reviewed',
    assignee: GOVIND,
  }),
  tc({
    index: 43,
    projectId: AUTH_ID,
    key: 'TC-AUTH-004',
    title: 'Session expires after 7 days of inactivity',
    priority: 'P2',
    status: 'active',
    assignee: SAGAR,
  }),
  tc({
    index: 44,
    projectId: AUTH_ID,
    key: 'TC-AUTH-005',
    title: 'Sign-out clears local + remote session',
    priority: 'P2',
    status: 'active',
    assignee: AKSHAY,
  }),
  tc({
    index: 45,
    projectId: AUTH_ID,
    key: 'TC-AUTH-006',
    title: 'Multi-device sign-in shows session list in settings',
    priority: 'P3',
    status: 'manual_draft',
    assignee: NITIN,
  }),
  tc({
    index: 46,
    projectId: AUTH_ID,
    key: 'TC-AUTH-007',
    title: 'Sign-up with existing email shows clear error',
    priority: 'P1',
    status: 'flaky',
    assignee: MOHANRAJ,
  }),

  // OPS (3)
  tc({
    index: 47,
    projectId: OPS_ID,
    key: 'TC-OPS-001',
    title: 'Admin role assignment audit row written',
    priority: 'P1',
    status: 'active',
    assignee: YOGESH,
  }),
  tc({
    index: 48,
    projectId: OPS_ID,
    key: 'TC-OPS-002',
    title: 'Bulk user export CSV completes for 1k users',
    priority: 'P2',
    status: 'reviewed',
    assignee: AKSHAY,
  }),
  tc({
    index: 49,
    projectId: OPS_ID,
    key: 'TC-OPS-003',
    title: 'Feature flag toggle propagates within 60 seconds',
    priority: 'P2',
    status: 'manual_draft',
    assignee: KISHOR,
  }),
];

// ────────────────────────────────────────────────────────────────────
// DEFECTS — 20 across the 5 projects (RET=6 / CART=5 / PAY=4 / AUTH=3 / OPS=2).
// Mix of severity (P0/P1/P2/P3) + status (open/triaged/in_progress/resolved/closed).
// ────────────────────────────────────────────────────────────────────

const DEF_UUIDS = [
  '2ef27373-1c91-4621-947b-585eb0b787d5',
  '9c3865a8-9f5e-4d22-a58f-8ad3e75f9a15',
  'f53c1c11-a625-4167-9a4b-63f76d5fdb7c',
  'ba1016b9-20af-46e8-82ce-1a8be184fa21',
  '24bc5ad8-02d6-4ea8-a229-8e1a34a0b59a',
  '062b3418-1f6f-4ac5-b6d3-8554e64efbc7',
  // CART (5)
  '55b39c6a-1c30-4d6e-8439-e02311da53e4',
  '195f4083-7dd4-419e-a8c6-077644b7416a',
  'ad1b59f9-f67f-49d7-97f7-84e377abc715',
  'cd9a7089-24c7-4337-8668-300b579e5a95',
  'f9ace866-159a-42b9-abad-7fb5a3ffb894',
  // PAY (4)
  '09a6598e-eb75-4173-9d0d-154c75094ea9',
  '27c4de7e-9ce4-4b53-b0cf-7d56fb145841',
  '70762d5a-df11-458a-9122-b41a27b657ac',
  'c1ea1781-4bc5-426f-96c1-29cd15f7e46f',
  // AUTH (3)
  '43e56223-ee79-4600-a4fa-525f6072d35b',
  '190b77d2-4a3d-4c78-899e-ffdb5360e8fa',
  '4032063e-0624-4dac-b7a9-90aa831500dc',
  // OPS (2)
  '548672bf-802b-4fdc-9c9d-1895b04db880',
  '4d4dfc52-6355-4fef-b270-2523191b9815',
];

function defect(args: {
  index: number;
  projectId: string;
  key: string;
  title: string;
  description: string;
  severity: Defect['severity'];
  status: Defect['status'];
  assignee?: UserPublic | null;
  resolvedAt?: string | null;
}): Defect {
  return {
    id: DEF_UUIDS[args.index],
    projectId: args.projectId,
    key: args.key,
    title: args.title,
    description: args.description,
    severity: args.severity,
    status: args.status,
    triggeredByRunId: null,
    triggeredByTestCaseId: null,
    assigneeId: args.assignee === null ? null : (args.assignee?.id ?? YOGESH.id),
    jiraIssueId: null,
    createdAt: T_2D_AGO,
    resolvedAt: args.resolvedAt ?? null,
  };
}

export const defects: Defect[] = [
  // RET (6) — DEF-001 must be "refund off by 1 cent" per F08b reference
  defect({
    index: 0,
    projectId: RET_ID,
    key: 'DEF-001',
    title: 'Refund off by 1 cent on multi-currency orders',
    description: 'Float-rounding in refund.amount path. Off by ±0.01 across ~3% of orders.',
    severity: 'P1',
    status: 'in_progress',
    assignee: AKSHAY,
  }),
  defect({
    index: 1,
    projectId: RET_ID,
    key: 'DEF-002',
    title: 'Return label QR code unscannable on iOS 16',
    description: 'PDF-rendered QR contrast fails iOS 16 camera threshold.',
    severity: 'P2',
    status: 'triaged',
    assignee: KISHOR,
  }),
  defect({
    index: 2,
    projectId: RET_ID,
    key: 'DEF-003',
    title: 'Refund webhook lost when merchant URL redirects',
    description: 'Webhook delivery does not follow 301; merchants with HTTPS upgrades miss events.',
    severity: 'P1',
    status: 'new',
    assignee: NADIM,
  }),
  defect({
    index: 3,
    projectId: RET_ID,
    key: 'DEF-004',
    title: 'Bulk-refund CSV crashes on 200+ rows',
    description: 'Memory leak in CSV parser; OOM at ~250 rows on free Render dyno.',
    severity: 'P2',
    status: 'new',
    assignee: SAGAR,
  }),
  defect({
    index: 4,
    projectId: RET_ID,
    key: 'DEF-005',
    title: 'Refund email Hindi font missing',
    description:
      'Email template uses CJK font for Devanagari; renders boxes on most Iksula customer mailboxes.',
    severity: 'P3',
    status: 'resolved',
    assignee: GOVIND,
    resolvedAt: T_YESTERDAY,
  }),
  defect({
    index: 5,
    projectId: RET_ID,
    key: 'DEF-006',
    title: 'Refund eligibility check ignores partial-shipment state',
    description: 'Order with one shipped + one pending line wrongly shows "not eligible".',
    severity: 'P1',
    status: 'closed',
    assignee: AKSHAY,
    resolvedAt: T_2D_AGO,
  }),

  // CART (5)
  defect({
    index: 6,
    projectId: CART_ID,
    key: 'DEF-007',
    title: 'Cart badge desyncs after rapid add-remove',
    description: 'Race between optimistic update + server confirm; badge count drifts.',
    severity: 'P2',
    status: 'in_progress',
    assignee: NITIN,
  }),
  defect({
    index: 7,
    projectId: CART_ID,
    key: 'DEF-008',
    title: 'Coupon stacks twice on price comparison view',
    description: 'PCV recomputes discount including already-applied coupon. ~5% revenue impact.',
    severity: 'P0',
    status: 'in_progress',
    assignee: AKSHAY,
  }),
  defect({
    index: 8,
    projectId: CART_ID,
    key: 'DEF-009',
    title: 'Saved-for-later items vanish after 30 days silently',
    description: 'TTL fires without notification; users lose intent.',
    severity: 'P3',
    status: 'new',
    assignee: GOVIND,
  }),
  defect({
    index: 9,
    projectId: CART_ID,
    key: 'DEF-010',
    title: 'Mini-cart drawer overflows on iPhone SE (320px)',
    description:
      'CLAUDE.md Rule 12 violation. Long product titles push checkout button off-screen.',
    severity: 'P2',
    status: 'triaged',
    assignee: KISHOR,
  }),
  defect({
    index: 10,
    projectId: CART_ID,
    key: 'DEF-011',
    title: 'Out-of-stock banner shows for available SKUs intermittently',
    description: 'Inventory cache stale by ~5 min; users see false OOS.',
    severity: 'P2',
    status: 'resolved',
    assignee: NADIM,
    resolvedAt: T_YESTERDAY,
  }),

  // PAY (4)
  defect({
    index: 11,
    projectId: PAY_ID,
    key: 'DEF-012',
    title: 'UPI timeout retries before user sees status',
    description: 'Auto-retry fires at 8s; user has no chance to cancel.',
    severity: 'P1',
    status: 'new',
    assignee: NADIM,
  }),
  defect({
    index: 12,
    projectId: PAY_ID,
    key: 'DEF-013',
    title: 'Saved card reuse loses billing address on first attempt',
    description: 'PSP edge case; second attempt succeeds. Friction for ~12% of saved-card users.',
    severity: 'P2',
    status: 'triaged',
    assignee: NITIN,
  }),
  defect({
    index: 13,
    projectId: PAY_ID,
    key: 'DEF-014',
    title: 'Receipt PDF GST breakup missing for B2B orders',
    description: 'PDF template only emits GSTIN for B2C; B2B Iksula merchants need it.',
    severity: 'P2',
    status: 'in_progress',
    assignee: MOHANRAJ,
  }),
  defect({
    index: 14,
    projectId: PAY_ID,
    key: 'DEF-015',
    title: 'Webhook signature verify fails on multi-byte payload',
    description: 'Signing uses str length not byte length; emoji-containing payloads reject.',
    severity: 'P1',
    status: 'closed',
    assignee: SAGAR,
    resolvedAt: T_2D_AGO,
  }),

  // AUTH (3)
  defect({
    index: 15,
    projectId: AUTH_ID,
    key: 'DEF-016',
    title: 'OTP delivery to airtel numbers delayed > 60s',
    description: 'Carrier-specific SMS routing; ~8% delivery > 60s threshold.',
    severity: 'P1',
    status: 'new',
    assignee: KISHOR,
  }),
  defect({
    index: 16,
    projectId: AUTH_ID,
    key: 'DEF-017',
    title: 'Biometric prompt repeats after sign-out → sign-in',
    description: 'KeyChain entry not cleared on sign-out; next sign-in re-prompts.',
    severity: 'P3',
    status: 'triaged',
    assignee: GOVIND,
  }),
  defect({
    index: 17,
    projectId: AUTH_ID,
    key: 'DEF-018',
    title: 'Sign-up email collision flow shows generic 500',
    description: 'API returns 500 instead of friendly 409 + "use sign-in" link.',
    severity: 'P2',
    status: 'in_progress',
    assignee: MOHANRAJ,
  }),

  // OPS (2)
  defect({
    index: 18,
    projectId: OPS_ID,
    key: 'DEF-019',
    title: 'Admin role-change audit row missing actor',
    description: 'NULL actor_id on rows where role-change initiated via CLI tool.',
    severity: 'P2',
    status: 'new',
    assignee: YOGESH,
  }),
  defect({
    index: 19,
    projectId: OPS_ID,
    key: 'DEF-020',
    title: 'Bulk user export truncates display names with apostrophes',
    description: 'CSV escaping bug; names like "O\'Brien" emit broken cell.',
    severity: 'P3',
    status: 'closed',
    assignee: AKSHAY,
    resolvedAt: T_2D_AGO,
  }),
];

// ────────────────────────────────────────────────────────────────────
// RECENT RUNS — 15 across the 5 projects. Mix of completed + running.
// Anchor: R-2026-04-28-A (RET) is the live run shown on F08b cards.
// ────────────────────────────────────────────────────────────────────

const RUN_UUIDS = [
  // RET (5)
  '98b2fa36-e99d-48d8-84b7-d6063de08100',
  'c10cfca0-fb2a-4160-b33c-5f2bd4fea7f8',
  'e433dcbd-fd20-4d3e-9be6-8758a75915cd',
  '98619059-ce81-462e-bbff-4a8f77002e69',
  'ccb49cdc-378e-434f-be61-1701764926a3',
  // CART (4)
  'ae043f36-5782-4a60-8b1a-d934f2a600cd',
  '0c5eaf7d-2337-4aa3-ba4a-77e74a135878',
  '88f9a074-b422-4528-9159-c2a6fdf6e83a',
  '5ecd6f71-5d41-4ad3-8c34-6bc1c2ccb9af',
  // PAY (3)
  'ff8f0a38-3473-4222-9e6e-6f0e59ab6738',
  '73aff8cd-2270-4d9a-8f9b-a95b3e9d75a0',
  '2ed678fb-8276-4a9c-8c9a-12939613fe11',
  // AUTH (2)
  '521a5d86-d1ac-4d84-b5de-869b394cd54f',
  '56571447-f549-4c47-bda6-9cd67b6d87ee',
  // OPS (1)
  'afcb5326-9715-4ae5-84cf-a38e0749101d',
];

export const recentRuns: TestRun[] = [
  // RET (5) — anchor live run R-2026-04-28-A
  {
    id: RUN_UUIDS[0],
    projectId: RET_ID,
    suiteId: null,
    name: 'R-2026-04-28-A',
    triggeredBy: 'manual',
    triggeredByUserId: AKSHAY.id,
    status: 'running',
    startedAt: T_TODAY,
    completedAt: null,
    environment: 'staging',
  },
  {
    id: RUN_UUIDS[1],
    projectId: RET_ID,
    suiteId: null,
    name: 'R-2026-04-27-B',
    triggeredBy: 'webhook',
    triggeredByUserId: null,
    status: 'passed',
    startedAt: T_YESTERDAY,
    completedAt: T_YESTERDAY,
    environment: 'staging',
  },
  {
    id: RUN_UUIDS[2],
    projectId: RET_ID,
    suiteId: null,
    name: 'R-2026-04-27-A',
    triggeredBy: 'manual',
    triggeredByUserId: KISHOR.id,
    status: 'failed',
    startedAt: T_YESTERDAY,
    completedAt: T_YESTERDAY,
    environment: 'qa',
  },
  {
    id: RUN_UUIDS[3],
    projectId: RET_ID,
    suiteId: null,
    name: 'R-2026-04-26-C',
    triggeredBy: 'cron',
    triggeredByUserId: null,
    status: 'passed',
    startedAt: T_2D_AGO,
    completedAt: T_2D_AGO,
    environment: 'staging',
  },
  {
    id: RUN_UUIDS[4],
    projectId: RET_ID,
    suiteId: null,
    name: 'R-2026-04-26-A',
    triggeredBy: 'manual',
    triggeredByUserId: NADIM.id,
    status: 'passed',
    startedAt: T_2D_AGO,
    completedAt: T_2D_AGO,
    environment: 'staging',
  },
  // CART (4)
  {
    id: RUN_UUIDS[5],
    projectId: CART_ID,
    suiteId: null,
    name: 'C-2026-04-28-A',
    triggeredBy: 'manual',
    triggeredByUserId: NITIN.id,
    status: 'passed',
    startedAt: T_TODAY,
    completedAt: T_TODAY,
    environment: 'staging',
  },
  {
    id: RUN_UUIDS[6],
    projectId: CART_ID,
    suiteId: null,
    name: 'C-2026-04-27-A',
    triggeredBy: 'webhook',
    triggeredByUserId: null,
    status: 'passed',
    startedAt: T_YESTERDAY,
    completedAt: T_YESTERDAY,
    environment: 'qa',
  },
  {
    id: RUN_UUIDS[7],
    projectId: CART_ID,
    suiteId: null,
    name: 'C-2026-04-27-B',
    triggeredBy: 'manual',
    triggeredByUserId: KISHOR.id,
    status: 'failed',
    startedAt: T_YESTERDAY,
    completedAt: T_YESTERDAY,
    environment: 'staging',
  },
  {
    id: RUN_UUIDS[8],
    projectId: CART_ID,
    suiteId: null,
    name: 'C-2026-04-26-A',
    triggeredBy: 'cron',
    triggeredByUserId: null,
    status: 'passed',
    startedAt: T_2D_AGO,
    completedAt: T_2D_AGO,
    environment: 'staging',
  },
  // PAY (3)
  {
    id: RUN_UUIDS[9],
    projectId: PAY_ID,
    suiteId: null,
    name: 'P-2026-04-28-A',
    triggeredBy: 'manual',
    triggeredByUserId: AKSHAY.id,
    status: 'passed',
    startedAt: T_TODAY,
    completedAt: T_TODAY,
    environment: 'staging',
  },
  {
    id: RUN_UUIDS[10],
    projectId: PAY_ID,
    suiteId: null,
    name: 'P-2026-04-27-A',
    triggeredBy: 'webhook',
    triggeredByUserId: null,
    status: 'passed',
    startedAt: T_YESTERDAY,
    completedAt: T_YESTERDAY,
    environment: 'qa',
  },
  {
    id: RUN_UUIDS[11],
    projectId: PAY_ID,
    suiteId: null,
    name: 'P-2026-04-26-A',
    triggeredBy: 'cron',
    triggeredByUserId: null,
    status: 'passed',
    startedAt: T_2D_AGO,
    completedAt: T_2D_AGO,
    environment: 'staging',
  },
  // AUTH (2)
  {
    id: RUN_UUIDS[12],
    projectId: AUTH_ID,
    suiteId: null,
    name: 'A-2026-04-28-A',
    triggeredBy: 'manual',
    triggeredByUserId: GOVIND.id,
    status: 'passed',
    startedAt: T_TODAY,
    completedAt: T_TODAY,
    environment: 'staging',
  },
  {
    id: RUN_UUIDS[13],
    projectId: AUTH_ID,
    suiteId: null,
    name: 'A-2026-04-27-A',
    triggeredBy: 'webhook',
    triggeredByUserId: null,
    status: 'passed',
    startedAt: T_YESTERDAY,
    completedAt: T_YESTERDAY,
    environment: 'qa',
  },
  // OPS (1)
  {
    id: RUN_UUIDS[14],
    projectId: OPS_ID,
    suiteId: null,
    name: 'O-2026-04-28-A',
    triggeredBy: 'manual',
    triggeredByUserId: YOGESH.id,
    status: 'queued',
    startedAt: null,
    completedAt: null,
    environment: 'staging',
  },
];

// ────────────────────────────────────────────────────────────────────
// AGENT ACTIVITY — 25 events. Heavy on RET (anchor); spread across the
// 4 agents (test-author=A1, defect-triager, run-summarizer, rca-proposer=A4).
// Mapped to A1/A2/A4 from PM1_PRD §5 where:
//   A1 = test-author       → kind: test_case_generated / test_case_revised
//   A2 = test-deduper      → kind: test_case_revised (uses diffSummary)
//   A4 = root-cause        → kind: rca_proposed
//   plus run-summarizer + defect-triager for variety
// ────────────────────────────────────────────────────────────────────

const ACT_UUIDS = [
  // RET (10)
  '57adca5c-1496-46d9-95e6-ce8484fe3972',
  '3e6497fa-461c-40d5-977b-4cb7101dc458',
  '14ded624-72ea-4d06-95b5-d35f9324d60d',
  'd00a1940-afb1-4f1e-a178-2bfcc8ace355',
  '70f1e858-2175-48d2-9345-326adc692cfb',
  '329e79d7-740e-4b22-943a-39167d3dc85a',
  '1c4b0c33-ca7b-4a49-bf38-2afd46d0b40f',
  'dbe26956-4270-40ad-b945-b3339e1dd4e9',
  '851c710a-cebf-4fd7-9cc4-a55228cc8029',
  '73b23325-86c4-4854-8575-d1ed0e774f9c',
  // CART (3)
  'f68b816b-0320-4650-a26c-598348d653ea',
  'd0edf150-f8f6-474a-8bfc-7f8c3abd2e7a',
  '48e03422-675e-40e3-8e70-edecf89c0dd1',
  // PAY (3)
  'b96988e8-f3c3-41bb-9cf6-d3b26f50fd31',
  'f51622c2-e71e-4820-ade0-dbf57ba36afc',
  'e13d4a3a-7d5f-488b-a5c8-27cc384bf300',
  // AUTH (2)
  '169131da-aca7-4e0b-a363-5031ffa83e9f',
  '01341d5c-a67a-4889-ab85-c4a6fea41846',
  // OPS (2)
  'cf76fe78-83fb-46be-8895-5739bc025b90',
  'd849ff04-cd29-4ac7-b698-0b80b8840023',
  // 5 mixed for breadth
  '357d2054-d09a-4f65-b5f2-13d10da2f391',
  'bf7a63ae-1ab3-4290-8373-07e1863ab0b3',
  '21a8f767-f6f7-4ba3-a114-cbd26523a343',
  '0c11a6e3-35f2-4492-bece-b4d02c972bb7',
  '92c25139-93d2-4926-8f96-22a1ae56b6b1',
];

export const recentAgentActivity: AgentActivity[] = [
  // RET — A1 test-author bursts
  {
    id: ACT_UUIDS[0],
    kind: 'test_case_generated',
    occurredAt: T_TODAY,
    workspaceId: WORKSPACE_ID,
    projectId: RET_ID,
    actor: AKSHAY,
    agent: 'test-author',
    confidence: 0.92,
    testCaseId: testCases[18].id,
    preview: 'Refund for international order applies forex rate at purchase',
  },
  {
    id: ACT_UUIDS[1],
    kind: 'test_case_revised',
    occurredAt: T_TODAY,
    workspaceId: WORKSPACE_ID,
    projectId: RET_ID,
    actor: KISHOR,
    agent: 'test-author',
    confidence: 0.88,
    testCaseId: testCases[2].id,
    diffSummary: '+2 steps, -1 step (sharpened expected for partial-line case)',
  },
  {
    id: ACT_UUIDS[2],
    kind: 'rca_proposed',
    occurredAt: T_YESTERDAY,
    workspaceId: WORKSPACE_ID,
    projectId: RET_ID,
    actor: null,
    agent: 'rca-proposer',
    confidence: 0.79,
    defectId: defects[0].id,
    preview: 'Float-rounding in refund.amount; root cause likely IEEE-754 vs cents-as-int.',
  },
  {
    id: ACT_UUIDS[3],
    kind: 'defect_triaged',
    occurredAt: T_YESTERDAY,
    workspaceId: WORKSPACE_ID,
    projectId: RET_ID,
    actor: AKSHAY,
    agent: 'defect-triager',
    confidence: 0.86,
    defectId: defects[1].id,
    proposedSeverity: 'P2',
  },
  {
    id: ACT_UUIDS[4],
    kind: 'run_summarized',
    occurredAt: T_YESTERDAY,
    workspaceId: WORKSPACE_ID,
    projectId: RET_ID,
    actor: null,
    agent: 'run-summarizer',
    confidence: 0.93,
    runId: recentRuns[1].id,
    summary: 'R-2026-04-27-B: 18 of 20 passed; 2 failed (TC-RET-008 flake, TC-RET-017 race)',
  },
  {
    id: ACT_UUIDS[5],
    kind: 'test_case_generated',
    occurredAt: T_YESTERDAY,
    workspaceId: WORKSPACE_ID,
    projectId: RET_ID,
    actor: NADIM,
    agent: 'test-author',
    confidence: 0.81,
    testCaseId: testCases[7].id,
    preview: 'Refund webhook retries on transient 5xx',
  },
  {
    id: ACT_UUIDS[6],
    kind: 'rca_proposed',
    occurredAt: T_YESTERDAY,
    workspaceId: WORKSPACE_ID,
    projectId: RET_ID,
    actor: null,
    agent: 'rca-proposer',
    confidence: 0.84,
    defectId: defects[2].id,
    preview: 'Webhook does not follow 301; merchant URL upgrades fail silently.',
  },
  {
    id: ACT_UUIDS[7],
    kind: 'test_case_revised',
    occurredAt: T_2D_AGO,
    workspaceId: WORKSPACE_ID,
    projectId: RET_ID,
    actor: NITIN,
    agent: 'test-author',
    confidence: 0.77,
    testCaseId: testCases[16].id,
    diffSummary: '+1 step (added concurrency check before refund issue)',
  },
  {
    id: ACT_UUIDS[8],
    kind: 'defect_triaged',
    occurredAt: T_2D_AGO,
    workspaceId: WORKSPACE_ID,
    projectId: RET_ID,
    actor: KISHOR,
    agent: 'defect-triager',
    confidence: 0.91,
    defectId: defects[3].id,
    proposedSeverity: 'P2',
  },
  {
    id: ACT_UUIDS[9],
    kind: 'run_summarized',
    occurredAt: T_2D_AGO,
    workspaceId: WORKSPACE_ID,
    projectId: RET_ID,
    actor: null,
    agent: 'run-summarizer',
    confidence: 0.89,
    runId: recentRuns[3].id,
    summary: 'R-2026-04-26-C: 20 of 20 passed (full sweep, no flakes)',
  },

  // CART (3)
  {
    id: ACT_UUIDS[10],
    kind: 'test_case_generated',
    occurredAt: T_TODAY,
    workspaceId: WORKSPACE_ID,
    projectId: CART_ID,
    actor: KISHOR,
    agent: 'test-author',
    confidence: 0.81,
    testCaseId: testCases[30].id,
    preview: 'Bundle discount applies when bundle items are present',
  },
  {
    id: ACT_UUIDS[11],
    kind: 'rca_proposed',
    occurredAt: T_YESTERDAY,
    workspaceId: WORKSPACE_ID,
    projectId: CART_ID,
    actor: null,
    agent: 'rca-proposer',
    confidence: 0.74,
    defectId: defects[7].id,
    preview: 'Coupon stacks twice — likely missing dedup in PriceCompareView recomputation.',
  },
  {
    id: ACT_UUIDS[12],
    kind: 'defect_triaged',
    occurredAt: T_2D_AGO,
    workspaceId: WORKSPACE_ID,
    projectId: CART_ID,
    actor: AKSHAY,
    agent: 'defect-triager',
    confidence: 0.88,
    defectId: defects[9].id,
    proposedSeverity: 'P2',
  },

  // PAY (3)
  {
    id: ACT_UUIDS[13],
    kind: 'rca_proposed',
    occurredAt: T_TODAY,
    workspaceId: WORKSPACE_ID,
    projectId: PAY_ID,
    actor: null,
    agent: 'rca-proposer',
    confidence: 0.82,
    defectId: defects[12].id,
    preview: 'PSP edge case on first saved-card use; likely auth.address normalization.',
  },
  {
    id: ACT_UUIDS[14],
    kind: 'test_case_revised',
    occurredAt: T_YESTERDAY,
    workspaceId: WORKSPACE_ID,
    projectId: PAY_ID,
    actor: NADIM,
    agent: 'test-author',
    confidence: 0.85,
    testCaseId: testCases[33].id,
    diffSummary: '+2 steps (UPI timeout retry + cancel-during-retry assertion)',
  },
  {
    id: ACT_UUIDS[15],
    kind: 'run_summarized',
    occurredAt: T_YESTERDAY,
    workspaceId: WORKSPACE_ID,
    projectId: PAY_ID,
    actor: null,
    agent: 'run-summarizer',
    confidence: 0.95,
    runId: recentRuns[10].id,
    summary: 'P-2026-04-27-A: 8 of 8 passed; cleanest run this sprint',
  },

  // AUTH (2)
  {
    id: ACT_UUIDS[16],
    kind: 'defect_triaged',
    occurredAt: T_TODAY,
    workspaceId: WORKSPACE_ID,
    projectId: AUTH_ID,
    actor: KISHOR,
    agent: 'defect-triager',
    confidence: 0.83,
    defectId: defects[15].id,
    proposedSeverity: 'P1',
  },
  {
    id: ACT_UUIDS[17],
    kind: 'test_case_generated',
    occurredAt: T_YESTERDAY,
    workspaceId: WORKSPACE_ID,
    projectId: AUTH_ID,
    actor: GOVIND,
    agent: 'test-author',
    confidence: 0.76,
    testCaseId: testCases[42].id,
    preview: 'Biometric unlock falls back to PIN on failure',
  },

  // OPS (2)
  {
    id: ACT_UUIDS[18],
    kind: 'rca_proposed',
    occurredAt: T_2D_AGO,
    workspaceId: WORKSPACE_ID,
    projectId: OPS_ID,
    actor: null,
    agent: 'rca-proposer',
    confidence: 0.71,
    defectId: defects[18].id,
    preview: 'NULL actor on CLI-initiated role change; CLI tool bypasses session middleware.',
  },
  {
    id: ACT_UUIDS[19],
    kind: 'test_case_generated',
    occurredAt: T_2D_AGO,
    workspaceId: WORKSPACE_ID,
    projectId: OPS_ID,
    actor: YOGESH,
    agent: 'test-author',
    confidence: 0.89,
    testCaseId: testCases[47].id,
    preview: 'Admin role assignment audit row written',
  },

  // 5 cross-project breadth
  {
    id: ACT_UUIDS[20],
    kind: 'run_summarized',
    occurredAt: T_TODAY,
    workspaceId: WORKSPACE_ID,
    projectId: null,
    actor: null,
    agent: 'run-summarizer',
    confidence: 0.91,
    runId: recentRuns[5].id,
    summary: 'C-2026-04-28-A: 12 of 12 passed (cart green)',
  },
  {
    id: ACT_UUIDS[21],
    kind: 'test_case_revised',
    occurredAt: T_YESTERDAY,
    workspaceId: WORKSPACE_ID,
    projectId: AUTH_ID,
    actor: NADIM,
    agent: 'test-author',
    confidence: 0.79,
    testCaseId: testCases[41].id,
    diffSummary: '+1 step (verify reset link expires server-side, not just UI)',
  },
  {
    id: ACT_UUIDS[22],
    kind: 'defect_triaged',
    occurredAt: T_YESTERDAY,
    workspaceId: WORKSPACE_ID,
    projectId: PAY_ID,
    actor: AKSHAY,
    agent: 'defect-triager',
    confidence: 0.93,
    defectId: defects[11].id,
    proposedSeverity: 'P1',
  },
  {
    id: ACT_UUIDS[23],
    kind: 'test_case_generated',
    occurredAt: T_2D_AGO,
    workspaceId: WORKSPACE_ID,
    projectId: CART_ID,
    actor: SAGAR,
    agent: 'test-author',
    confidence: 0.83,
    testCaseId: testCases[26].id,
    preview: 'Coupon code applies to subtotal correctly',
  },
  {
    id: ACT_UUIDS[24],
    kind: 'rca_proposed',
    occurredAt: T_2D_AGO,
    workspaceId: WORKSPACE_ID,
    projectId: AUTH_ID,
    actor: null,
    agent: 'rca-proposer',
    confidence: 0.68,
    defectId: defects[16].id,
    preview:
      'KeyChain entry not cleared on sign-out — likely missing AuthService.clearKeychain() call.',
  },
];

// ────────────────────────────────────────────────────────────────────
// PENDING APPROVALS — 4 items per spec.
// 3 on RET (A1 strategy / A2 dedup / A4 RCA — matches F08b queue) + 1 on CART.
// All assigned to Akshay (Lead) per F08b "Approval Center" copy.
// ────────────────────────────────────────────────────────────────────

const APPR_UUIDS = [
  '82e617c9-1288-4661-adcf-f3d4c737426f',
  '1d0a2b04-2a98-4896-bf0a-fd61e4aa9279',
  '6599a13b-85a0-49e5-95cf-f3f8a27da445',
  '2dda6c20-f918-400e-a34c-8c8981019dbe',
];

export const pendingApprovals: Approval[] = [
  // RET — A1 strategy approval
  {
    id: APPR_UUIDS[0],
    kind: 'test_case',
    workspaceId: WORKSPACE_ID,
    projectId: RET_ID,
    requestedBy: KISHOR,
    assignedTo: AKSHAY,
    requestedAt: T_TODAY,
    status: 'pending',
    decidedAt: null,
    decisionNote: null,
    testCaseId: testCases[18].id, // TC-RET-019 forex
    preview: 'A1 proposed strategy: Refund forex rate at purchase (3 step coverage)',
  },
  // RET — A2 dedup approval
  {
    id: APPR_UUIDS[1],
    kind: 'test_case',
    workspaceId: WORKSPACE_ID,
    projectId: RET_ID,
    requestedBy: NITIN,
    assignedTo: AKSHAY,
    requestedAt: T_YESTERDAY,
    status: 'pending',
    decidedAt: null,
    decisionNote: null,
    testCaseId: testCases[16].id, // TC-RET-017 concurrency (revised by A2)
    preview: 'A2 dedup: collapsed 3 near-identical concurrency tests into TC-RET-017',
  },
  // RET — A4 RCA approval
  {
    id: APPR_UUIDS[2],
    kind: 'defect_rca',
    workspaceId: WORKSPACE_ID,
    projectId: RET_ID,
    requestedBy: AKSHAY,
    assignedTo: AKSHAY,
    requestedAt: T_YESTERDAY,
    status: 'pending',
    decidedAt: null,
    decisionNote: null,
    defectId: defects[0].id, // DEF-001 refund off by 1 cent
    preview:
      'A4 RCA proposed for DEF-001: float-rounding in refund.amount path. 5-layer hypothesis included.',
  },
  // CART — small approval
  {
    id: APPR_UUIDS[3],
    kind: 'test_case',
    workspaceId: WORKSPACE_ID,
    projectId: CART_ID,
    requestedBy: KISHOR,
    assignedTo: AKSHAY,
    requestedAt: T_2D_AGO,
    status: 'pending',
    decidedAt: null,
    decisionNote: null,
    testCaseId: testCases[30].id, // TC-CART-011 bundle discount
    preview: 'A1 proposed: Bundle discount applies when bundle items are present (P2)',
  },
];

// ────────────────────────────────────────────────────────────────────
// SEED_IDS — referentially navigable map.
// Tests use `SEED_IDS.users.yogesh` instead of scattering string literals.
// ────────────────────────────────────────────────────────────────────

export const SEED_IDS = {
  workspaceId: WORKSPACE_ID,
  users: {
    akshay: AKSHAY.id,
    govind: GOVIND.id,
    kishor: KISHOR.id,
    mohanraj: MOHANRAJ.id,
    nadim: NADIM.id,
    nitin: NITIN.id,
    sagar: SAGAR.id,
    yogesh: YOGESH.id,
  },
  projects: {
    auth: AUTH_ID,
    cart: CART_ID,
    ops: OPS_ID,
    pay: PAY_ID,
    ret: RET_ID,
  },
  testCases: Object.fromEntries(testCases.map((tc) => [tc.key.toLowerCase(), tc.id])) as Record<
    string,
    string
  >,
  defects: Object.fromEntries(defects.map((d) => [d.key.toLowerCase(), d.id])) as Record<
    string,
    string
  >,
  runs: Object.fromEntries(recentRuns.map((r) => [r.name.toLowerCase(), r.id])) as Record<
    string,
    string
  >,
  approvals: {
    retA1: APPR_UUIDS[0],
    retA2: APPR_UUIDS[1],
    retA4: APPR_UUIDS[2],
    cartA1: APPR_UUIDS[3],
  },
} as const;

// QA Nexus PM1 — Seed-data type contracts (UI-facing).
//
// Spec: followup (i) — "Centralize demo seed data + decouple UI from
// hardcoded names". This file is the SHARED contract between:
//
//   - apps/web/lib/demo-seed.ts (Day-3 evening, MAIN scaffolding)  ← producer
//   - apps/web/components/{home,home-lead,home-empty,projects,sprint}/* ← consumers
//   - apps/api/src/* future GET /api/users, /api/projects, /api/test-cases
//     /api/defects, /api/runs, /api/agent-activities, /api/approvals  ← producer-after-T021+
//
// CONTRACT INVARIANT: every type here MUST be the shape the BE API will
// return when the corresponding endpoint lands. UI components depend on
// these types; if BE returns a different shape, components break — so
// the API author + this file's author MUST coordinate via Zod schemas in
// `packages/shared/src/schemas/*`. When a BE Zod schema exists, this file
// re-exports its inferred type (single source of truth). When the BE
// schema doesn't exist yet (M2-M4 features like AgentActivity), this
// file defines the type FIRST and the schema must conform when written.
//
// MIGRATION PATH (per ADR-006 — to land Phase 4):
//   Today (PM1 setup):   demo-seed.ts → these types → components
//   Post-T021/F27:       useQuery('/api/users') → UserPublic[] → these types → components
//   Components do NOT change between today and post-T021. That's the win.
//
// IMPORT FROM @qa-nexus/shared, NEVER from this file directly.
//   ✓ import { User, Project, AgentActivity } from '@qa-nexus/shared';
//   ✗ import { ... } from '@qa-nexus/shared/seed-types';

// ────────────────────────────────────────────────────────────────────
// Re-exported from existing BE Zod schemas (single source of truth).
// When a future endpoint returns one of these, JSON.parse(response) →
// type assertion is safe because the schema mirrors the shape exactly.
// ────────────────────────────────────────────────────────────────────

// User + Project are already barrel-exported from `packages/shared/src/index.ts`
// via the `./schemas/*` glob (the full DB types — `User` includes passwordHash;
// use `UserPublic` for any UI-display path). Components should import
// `UserPublic` from `@qa-nexus/shared` for typing user-facing props — that's
// the API-safe shape (the BE strips passwordHash before serializing).
//
// See `./schemas/user.ts` for `UserSchema` (DB row — includes passwordHash)
//  vs `UserPublicSchema` (API response — passwordHash omitted). UI = always
//  the latter.

/** TestCase + per-step + revision metadata. Returned by future
 *  `GET /api/test-cases[/:id]`. */
export type { TestCase, TestStep } from './schemas/test-case';

/** Defect with severity / status / RCA report. Returned by future
 *  `GET /api/defects[/:id]`. */
export type { Defect, RcaReport } from './schemas/defect';

/** Test run + per-step result. Returned by future `GET /api/runs[/:id]`. */
export type { TestRun, TestRunResult } from './schemas/test-run';

// ────────────────────────────────────────────────────────────────────
// UI-display "join" types — denormalized snapshots that combine a base
// entity with related rows that the UI displays inline. The BE may
// return these as separate JOINs in API responses or as embedded objects
// (`include: { assignee: true }` Prisma pattern). Either way, the
// UI-facing shape is locked here.
//
// When the BE picks a representation, it MUST conform to one of these.
// ────────────────────────────────────────────────────────────────────

import type { UserPublic } from './schemas/user';
import type { Project } from './schemas/project';
import type { TestCase } from './schemas/test-case';
import type { Defect } from './schemas/defect';
import type { TestRunResult } from './schemas/test-run';

/** Test case with denormalized assignee + project. UI columns commonly
 *  show `tc.assignee.displayName` and `tc.project.key` together. */
export interface TestCaseWithRelations extends TestCase {
  assignee: UserPublic | null;
  project: Pick<Project, 'id' | 'key' | 'name'>;
}

/** Defect with denormalized reporter + assignee + project. Used in
 *  defect-list views (F08b approvals queue, F09 defects). */
export interface DefectWithRelations extends Defect {
  reporter: UserPublic;
  assignee: UserPublic | null;
  project: Pick<Project, 'id' | 'key' | 'name'>;
}

/** Test run with denormalized author + project. Used in F19 Run Console
 *  + F08a queue card. */
export interface TestRunResultWithRelations extends TestRunResult {
  executedBy: UserPublic;
  project: Pick<Project, 'id' | 'key' | 'name'>;
}

// ────────────────────────────────────────────────────────────────────
// UI-only types — no BE schema yet. When the corresponding endpoint
// lands (M2-M4), the BE Zod schema MUST conform to one of these
// interfaces. Treat these as forward-looking API contracts.
//
// When a schema lands, MOVE the canonical definition to packages/shared/
// src/schemas/<name>.ts as a Zod schema + inferred type, and switch
// the export here to `export type { Foo } from './schemas/foo';`.
// ────────────────────────────────────────────────────────────────────

/** Cross-functional union of all activity-feed events surfaced on F08
 *  Home dashboards. Each subtype has a discriminator `kind` so consumers
 *  can switch on it for icon / copy / link choice. Returned by future
 *  `GET /api/activity-feed?workspaceId=...&since=...`.
 *
 *  Future BE schema target: `packages/shared/src/schemas/activity-feed.ts`. */
export type AgentActivity =
  | AgentActivityTestCaseGenerated
  | AgentActivityTestCaseRevised
  | AgentActivityDefectTriaged
  | AgentActivityRunSummarized
  | AgentActivityRcaProposed;

interface AgentActivityBase {
  /** Stable UUID. */
  id: string;
  /** Discriminator. */
  kind: string;
  /** ISO 8601 timestamp. */
  occurredAt: string;
  /** Workspace this event belongs to (RLS scope). */
  workspaceId: string;
  /** Optional project scope (null for cross-project activity). */
  projectId: string | null;
  /** Optional acting user (null when AI-only). */
  actor: UserPublic | null;
  /** AI agent label that produced this event. */
  agent: 'test-author' | 'defect-triager' | 'run-summarizer' | 'rca-proposer';
  /** Confidence 0.0–1.0 from the LLM gateway. */
  confidence: number;
}

export interface AgentActivityTestCaseGenerated extends AgentActivityBase {
  kind: 'test_case_generated';
  testCaseId: string;
  /** Title preview (first 80 chars) for the activity-feed copy. */
  preview: string;
}

export interface AgentActivityTestCaseRevised extends AgentActivityBase {
  kind: 'test_case_revised';
  testCaseId: string;
  /** Diff summary (e.g., "+2 steps, -1 step"). */
  diffSummary: string;
}

export interface AgentActivityDefectTriaged extends AgentActivityBase {
  kind: 'defect_triaged';
  defectId: string;
  /** Severity assigned by the agent. */
  proposedSeverity: 'P0' | 'P1' | 'P2' | 'P3';
}

export interface AgentActivityRunSummarized extends AgentActivityBase {
  kind: 'run_summarized';
  runId: string;
  /** "12 of 15 passed; 3 failed" style summary. */
  summary: string;
}

export interface AgentActivityRcaProposed extends AgentActivityBase {
  kind: 'rca_proposed';
  defectId: string;
  /** First 120 chars of the proposed RCA text. */
  preview: string;
}

// ────────────────────────────────────────────────────────────────────
// Approvals — Lead/Admin queue items on F08b. Each requires a human
// decision (approve / reject / request-changes). Returned by future
// `GET /api/approvals?workspaceId=...&status=pending`.
//
// Future BE schema target: `packages/shared/src/schemas/approval.ts`.
// ────────────────────────────────────────────────────────────────────

export type Approval = ApprovalTestCase | ApprovalDefectRca | ApprovalRunSignoff;

interface ApprovalBase {
  id: string;
  /** Discriminator. */
  kind: string;
  /** Workspace scope (RLS). */
  workspaceId: string;
  projectId: string;
  /** Who requested approval. */
  requestedBy: UserPublic;
  /** Lead/Admin who must decide. NULL = "any Lead+". */
  assignedTo: UserPublic | null;
  /** ISO 8601. */
  requestedAt: string;
  /** Pending until decided; one of approve/reject/request_changes. */
  status: 'pending' | 'approved' | 'rejected' | 'request_changes';
  /** ISO 8601 if decided; null if pending. */
  decidedAt: string | null;
  /** Optional decider note. */
  decisionNote: string | null;
}

export interface ApprovalTestCase extends ApprovalBase {
  kind: 'test_case';
  testCaseId: string;
  /** Preview for the queue card (first 80 chars of title). */
  preview: string;
}

export interface ApprovalDefectRca extends ApprovalBase {
  kind: 'defect_rca';
  defectId: string;
  /** Preview of the proposed RCA (first 120 chars). */
  preview: string;
}

export interface ApprovalRunSignoff extends ApprovalBase {
  kind: 'run_signoff';
  runId: string;
  /** Pass/fail count summary. */
  preview: string;
}

// ────────────────────────────────────────────────────────────────────
// Convenience aggregates — used by context providers (Phase 4).
// ────────────────────────────────────────────────────────────────────

/** Workspace-wide team roster (returned by `GET /api/users?workspaceId=...`).
 *  The Lead user (per RBAC role = Lead) is exposed at `.lead` for cards
 *  that need to show "Lead: Akshay Panchal" style copy. */
export interface TeamRoster {
  members: UserPublic[];
  lead: UserPublic | null;
  admin: UserPublic | null;
}

/** Workspace-wide project list (returned by `GET /api/projects`). The
 *  anchor project (Iksula Returns / RET in PM1) is exposed at `.anchor`. */
export interface ProjectList {
  projects: Project[];
  anchor: Project | null;
}

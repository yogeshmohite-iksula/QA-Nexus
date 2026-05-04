// TB-019 llm_providers + TB-020 llm_provider_models + TB-021 agent_model_assignments.
import { z } from 'zod';
import {
  Uuid,
  Timestamp,
  LlmProviderKind,
  LlmProviderStatus,
  AgentKind,
  AgentRole,
  NonEmpty,
} from './enums';

// TB-019
export const LlmProviderSchema = z.object({
  id: Uuid,
  workspaceId: Uuid,
  providerKind: LlmProviderKind,
  displayName: NonEmpty,
  // Ciphertext only; never returned to clients.
  apiKeyEncrypted: z.string(),
  endpointUrl: z.string().url(),
  extraConfigJson: z.record(z.unknown()),
  status: LlmProviderStatus,
  lastTestAt: Timestamp.nullable(),
  lastTestResult: z.record(z.unknown()).nullable(),
  createdBy: Uuid,
  createdAt: Timestamp,
});
export type LlmProvider = z.infer<typeof LlmProviderSchema>;

export const LlmProviderPublicSchema = LlmProviderSchema.omit({ apiKeyEncrypted: true });
export type LlmProviderPublic = z.infer<typeof LlmProviderPublicSchema>;

export const CreateLlmProviderInput = z.object({
  providerKind: LlmProviderKind,
  displayName: NonEmpty,
  apiKey: z.string().min(8), // service encrypts before insert
  endpointUrl: z.string().url().optional(),
  extraConfigJson: z.record(z.unknown()).optional(),
});
export type CreateLlmProviderInput = z.infer<typeof CreateLlmProviderInput>;

// TB-020
export const ModelCapabilitySchema = z.object({
  contextWindow: z.number().int().positive().optional(),
  tokPerSec: z.number().positive().optional(),
  rpdLimit: z.number().int().positive().optional(),
  tpmLimit: z.number().int().positive().optional(),
  tags: z.array(z.string()).optional(),
  pricing: z
    .object({
      promptUsdPerMtok: z.number().nonnegative().optional(),
      completionUsdPerMtok: z.number().nonnegative().optional(),
    })
    .optional(),
});
export type ModelCapability = z.infer<typeof ModelCapabilitySchema>;

export const LlmProviderModelSchema = z.object({
  id: Uuid,
  providerId: Uuid,
  modelId: NonEmpty,
  displayName: NonEmpty,
  capabilityJson: ModelCapabilitySchema,
  enabledForWorkspace: z.boolean(),
  fetchedAt: Timestamp,
});
export type LlmProviderModel = z.infer<typeof LlmProviderModelSchema>;

// TB-021
export const AgentModelAssignmentSchema = z.object({
  id: Uuid,
  workspaceId: Uuid,
  agentKind: AgentKind,
  role: AgentRole,
  modelPk: Uuid,
  activationThresholdJson: z.record(z.unknown()).nullable(),
  createdBy: Uuid,
  createdAt: Timestamp,
});
export type AgentModelAssignment = z.infer<typeof AgentModelAssignmentSchema>;

export const CreateAgentAssignmentInput = z.object({
  agentKind: AgentKind,
  role: AgentRole,
  modelPk: Uuid,
  activationThresholdJson: z.record(z.unknown()).optional(),
});
export type CreateAgentAssignmentInput = z.infer<typeof CreateAgentAssignmentInput>;

// ─────────────────────────────────────────────────────────────────────
// M1.5 Day-8 Step 3 — Admin LLM-config endpoints (F26 will consume).
// GET /api/admin/config/llm-providers + PUT same path.
//
// Builds on the existing TB-019/020/021 schema (no new table).
// "Provider config" = the workspace's full LLM picture:
//   - Registered providers (apiKey REDACTED → hasApiKey: boolean)
//   - Models catalog per provider
//   - Routing assignments (agentKind × role → modelPk)
//
// PUT only updates ROUTING. API-key onboarding lives on a separate
// future endpoint (POST /api/admin/config/llm-providers/:id/key) that
// will land in M1.5 with explicit field-level audit. Splitting routing
// vs key-rotation surfaces minimises blast radius for any single PUT.
// ─────────────────────────────────────────────────────────────────────

/// Provider projection returned to the F26 UI. NEVER includes the
/// encrypted API key. `hasApiKey` is a derived boolean so the UI can
/// show "configured" without exposing the ciphertext.
export const LlmProviderConfigItem = z.object({
  id: Uuid,
  providerKind: LlmProviderKind,
  displayName: NonEmpty,
  endpointUrl: z.string().url(),
  status: LlmProviderStatus,
  hasApiKey: z.boolean(),
  lastTestAt: Timestamp.nullable(),
  /// Model catalog scoped to this provider (only enabled-for-workspace).
  models: z.array(
    z.object({
      modelPk: Uuid,
      modelId: NonEmpty,
      displayName: NonEmpty,
      enabledForWorkspace: z.boolean(),
    }),
  ),
});
export type LlmProviderConfigItem = z.infer<typeof LlmProviderConfigItem>;

/// Single routing entry — agentKind × role → modelPk.
/// Joined with provider + model display fields for FE convenience.
export const LlmAssignmentItem = z.object({
  id: Uuid,
  agentKind: AgentKind,
  role: AgentRole,
  modelPk: Uuid,
  // Convenience joins so F26 can render "A1 Scribe / primary → groq /
  // openai/gpt-oss-120b" without follow-up queries.
  providerKind: LlmProviderKind,
  providerDisplayName: NonEmpty,
  modelId: NonEmpty,
  modelDisplayName: NonEmpty,
});
export type LlmAssignmentItem = z.infer<typeof LlmAssignmentItem>;

/// GET /api/admin/config/llm-providers response.
export const LlmProviderConfigResponse = z.object({
  ok: z.literal(true),
  providers: z.array(LlmProviderConfigItem),
  assignments: z.array(LlmAssignmentItem),
});
export type LlmProviderConfigResponse = z.infer<typeof LlmProviderConfigResponse>;

/// PUT body — replaces the workspace's routing assignments wholesale.
/// (Partial updates would require a separate compound key on the URL,
/// adding controller surface; "submit the full set" is simpler + atomic.)
/// Service validates that every (agentKind, role) pair is unique within
/// the array AND that every modelPk exists in this workspace's catalog.
export const PutLlmProviderConfigRequest = z.object({
  assignments: z
    .array(
      z.object({
        agentKind: AgentKind,
        role: AgentRole,
        modelPk: Uuid,
        activationThresholdJson: z.record(z.unknown()).optional(),
      }),
    )
    .min(1)
    .max(50),
});
export type PutLlmProviderConfigRequest = z.infer<typeof PutLlmProviderConfigRequest>;

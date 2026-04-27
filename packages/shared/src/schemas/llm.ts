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
} from './enums.js';

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

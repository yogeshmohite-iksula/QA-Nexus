// LLM Config API — GET /api/admin/config/llm-providers wire for F26m1.
//
// Hard Rule 11 verified against BE (admin/llm-config/llm-config.controller.ts:34):
//   @Controller('api/admin/config/llm-providers')
//   GET /  @Roles(Admin)  → { ok, providers, assignments }
//   PUT /  @Roles(Admin)  → { ok, providers, assignments } (write)
//   (No POST /test-connection — the modal "Test connection" stays Pattern A
//    until BE adds a /test endpoint.)
//
// Shared schema: LlmProviderPublicSchema (omits apiKeyEncrypted) at
// packages/shared/src/schemas/llm.ts:31. Provider row carries: id,
// workspaceId, providerKind ('groq'|'gemini'|'custom'), displayName,
// endpointUrl, status, lastTestAt, lastTestResult, createdBy, createdAt.

import { z } from 'zod';
import {
  LlmProviderPublicSchema,
  type LlmProviderPublic,
  type LlmProviderKind,
} from '@qa-nexus/shared';

import { fetchWithFallback } from './fetch-with-fallback';

/** Response envelope for GET /api/admin/config/llm-providers. The
 *  `assignments` block carries agent → provider mappings (TB-021); we
 *  surface providers only on F26m1, assignments stay in the back-pocket
 *  for the broader F26 surface. */
const LlmProviderConfigResponse = z.object({
  ok: z.literal(true),
  providers: z.array(LlmProviderPublicSchema),
  assignments: z.array(z.unknown()),
});
export type LlmProviderConfigResponse = z.infer<typeof LlmProviderConfigResponse>;

/** Workspace LLM providers. Admin-only — non-Admin → 403 → null fallback.
 *  Null result also covers pre-bootstrap workspaces with no providers
 *  configured yet (the modal already handles the empty list path). */
export async function fetchLlmProviders(): Promise<LlmProviderConfigResponse | null> {
  return fetchWithFallback<LlmProviderConfigResponse | null>(
    `/api/admin/config/llm-providers`,
    null,
    { schema: LlmProviderConfigResponse, label: 'F26m1 LLM providers' },
  );
}

/** Display-side provider summary used by the F26m1 config-modal side pane.
 *  Decoupled from `LlmProviderPublic` so we can keep canned-data narrow
 *  + live wide (same pattern as Sweep C). `providerKind` widens to the
 *  shared enum (12 values inc. groq/gemini/anthropic/custom_oai/…) since
 *  BE accepts the full set; rendering paths that only know the three M1
 *  canonicals (groq/gemini/custom) display unknown kinds as a generic
 *  "Custom" chip. */
export interface LlmProviderRow {
  id: string;
  providerKind: LlmProviderKind;
  displayName: string;
  status: LlmProviderPublic['status'];
  endpointUrl: string;
  lastTestAt: string | null;
}

export function llmProviderToRow(p: LlmProviderPublic): LlmProviderRow {
  return {
    id: p.id,
    providerKind: p.providerKind,
    displayName: p.displayName,
    status: p.status,
    endpointUrl: p.endpointUrl,
    lastTestAt: p.lastTestAt,
  };
}

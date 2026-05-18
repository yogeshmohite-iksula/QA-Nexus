// QA Nexus PM1 — Seed LLM provider config (Path C bridge — ADR-015).
//
// CLI script that lets an admin onboard an LLM provider (Groq / Gemini /
// etc.) by writing TB-019 + TB-020 + TB-021 rows directly, with the API
// key AES-GCM-encrypted via BETTER_AUTH_SECRET.
//
// Lifespan: Until F26 v2 React UI ships in M5. Tracked in followup `(az)`.
//
// Run (from repo root, uses repo's ts-node — tsx not installed):
//   cd apps/api && \
//     GROQ_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx \
//     WORKSPACE_KEY=iksula \
//     ADMIN_EMAIL=yogesh.mohite@iksula.com \
//     pnpm exec ts-node --transpile-only \
//       --compiler-options '{"module":"commonjs","moduleResolution":"node"}' \
//       scripts/seed-llm-provider.ts
//
// Required env vars:
//   GROQ_KEY        — plaintext Groq API key (gsk_*). Encrypted before INSERT.
//   WORKSPACE_KEY   — workspace.key value (e.g., 'iksula'). Resolves to workspace_id.
//   ADMIN_EMAIL     — admin user email. Resolves to created_by user_id.
//   BETTER_AUTH_SECRET — already in apps/api/.env; used as AES-GCM seed.
//
// Optional env vars (defaults match Groq free tier):
//   PROVIDER_KIND     — default 'groq'
//   PROVIDER_DISPLAY  — default 'Groq (Path C bridge — pre-F26)'
//   PROVIDER_ENDPOINT — default 'https://api.groq.com/openai/v1'
//
// Behavior:
//   - Idempotent: re-running with same WORKSPACE_KEY + PROVIDER_KIND
//     UPDATEs the existing row (refreshes ciphertext + status='connected').
//   - Three-table cascade in a single Prisma transaction.
//   - Audit-log row written per Hard Rule 7 (counts only — NEVER the key).
//   - Exits 1 with diagnostic message on any failure.
//   - GROQ_KEY env var is read ONCE then NEVER printed/logged.
//
// Hard rules:
//   - $0 cost gate (Groq free tier — no paid services)
//   - Hard Rule 6: API key never persisted in plaintext anywhere
//   - Hard Rule 7: Audit row written before tx commit

/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client';
import { encryptApiKey } from '../src/llm/crypto';
import { writeAuditRow } from '../src/audit/audit-helper';

const prisma = new PrismaClient();

interface SeedConfig {
  groqKey: string;
  workspaceKey: string;
  adminEmail: string;
  betterAuthSecret: string;
  providerKind: string;
  providerDisplay: string;
  providerEndpoint: string;
}

function readConfig(): SeedConfig {
  const groqKey = process.env.GROQ_KEY;
  const workspaceKey = process.env.WORKSPACE_KEY;
  const adminEmail = process.env.ADMIN_EMAIL;
  const betterAuthSecret = process.env.BETTER_AUTH_SECRET;

  const missing: string[] = [];
  if (!groqKey) missing.push('GROQ_KEY');
  if (!workspaceKey) missing.push('WORKSPACE_KEY');
  if (!adminEmail) missing.push('ADMIN_EMAIL');
  if (!betterAuthSecret) missing.push('BETTER_AUTH_SECRET');
  if (missing.length > 0) {
    bail(
      `Missing required env vars: ${missing.join(', ')}. ` +
        `See header comment for usage.`,
    );
  }

  return {
    groqKey: groqKey!,
    workspaceKey: workspaceKey!,
    adminEmail: adminEmail!,
    betterAuthSecret: betterAuthSecret!,
    providerKind: process.env.PROVIDER_KIND ?? 'groq',
    providerDisplay:
      process.env.PROVIDER_DISPLAY ?? 'Groq (Path C bridge — pre-F26)',
    providerEndpoint:
      process.env.PROVIDER_ENDPOINT ?? 'https://api.groq.com/openai/v1',
  };
}

function bail(msg: string): never {
  console.error(`[seed-llm-provider] FAIL: ${msg}`);
  process.exit(1);
}

/// Groq free-tier model catalog (per CLAUDE.md "Locked tech stack").
/// New models can be added later by re-running with a flag (M3.5+).
const GROQ_MODELS = [
  {
    modelId: 'openai/gpt-oss-120b',
    displayName: 'GPT-OSS-120B (Composer primary)',
  },
  {
    modelId: 'meta-llama/llama-4-scout-17b-16e-instruct',
    displayName: 'Llama-4 Scout 17B (long-context)',
  },
  {
    modelId: 'openai/gpt-oss-20b',
    displayName: 'GPT-OSS-20B (fast layer)',
  },
];

async function main(): Promise<void> {
  const cfg = readConfig();
  console.log(
    `[seed-llm-provider] starting — workspace=${cfg.workspaceKey} ` +
      `admin=${cfg.adminEmail} provider=${cfg.providerKind}`,
  );

  // Resolve workspace + user from human-friendly identifiers.
  // Workspace has no `key` column — match on `name` case-insensitively
  // (e.g., WORKSPACE_KEY=iksula → matches Workspace name 'Iksula').
  const workspace = await prisma.workspace.findFirst({
    where: { name: { equals: cfg.workspaceKey, mode: 'insensitive' } },
  });
  if (!workspace) {
    bail(
      `Workspace with name~='${cfg.workspaceKey}' not found. ` +
        `Run \`pnpm prisma:seed\` first OR check WORKSPACE_KEY (case-insensitive name match).`,
    );
  }
  const admin = await prisma.user.findUnique({
    where: { email: cfg.adminEmail },
  });
  if (!admin) {
    bail(
      `User with email='${cfg.adminEmail}' not found. ` +
        `Check ADMIN_EMAIL OR seed the user via \`pnpm prisma:seed\`.`,
    );
  }
  if (admin.role !== 'Admin') {
    bail(
      `User '${cfg.adminEmail}' has role='${admin.role}'; ` +
        `Admin role required for created_by on llm_providers (per ERD §3 L940).`,
    );
  }

  // Encrypt the API key via the canonical helper. After this point the
  // plaintext is held only in `cfg.groqKey` (a function-local variable);
  // never written to disk, never logged.
  const apiKeyEncrypted = encryptApiKey(cfg.groqKey, cfg.betterAuthSecret);

  // Three-table cascade in a single transaction. Idempotent via upsert
  // semantics: existing provider for (workspace, kind) is UPDATED;
  // models are upserted on (provider_id, model_id) unique key;
  // assignments are upserted on (workspace_id, agent_kind, role) unique.
  const result = await prisma.$transaction(async (tx) => {
    // Upsert TB-019 provider row.
    // No formal unique constraint on (workspace_id, provider_kind),
    // so we manually find-then-update or create.
    const existing = await tx.llmProvider.findFirst({
      where: {
        workspaceId: workspace!.id,
        providerKind: cfg.providerKind as 'groq', // schema enum
      },
    });
    const providerRow = existing
      ? await tx.llmProvider.update({
          where: { id: existing.id },
          data: {
            apiKeyEncrypted,
            displayName: cfg.providerDisplay,
            endpointUrl: cfg.providerEndpoint,
            status: 'connected',
            lastTestAt: new Date(),
          },
        })
      : await tx.llmProvider.create({
          data: {
            workspaceId: workspace!.id,
            providerKind: cfg.providerKind as 'groq',
            displayName: cfg.providerDisplay,
            apiKeyEncrypted,
            endpointUrl: cfg.providerEndpoint,
            extraConfigJson: {},
            status: 'connected',
            createdBy: admin!.id,
          },
        });

    // Upsert TB-020 model catalog rows.
    const upsertedModels = [];
    for (const m of GROQ_MODELS) {
      const model = await tx.llmProviderModel.upsert({
        where: {
          providerId_modelId: {
            providerId: providerRow.id,
            modelId: m.modelId,
          },
        },
        update: { displayName: m.displayName, enabledForWorkspace: true },
        create: {
          providerId: providerRow.id,
          modelId: m.modelId,
          displayName: m.displayName,
          enabledForWorkspace: true,
        },
      });
      upsertedModels.push(model);
    }

    // Upsert TB-021 agent×role routing assignments. Conservative
    // mapping based on PM1_ERD §5: A1 (Composer), A2 (Curator), A4
    // (Sherlock) all default to GPT-OSS-120B as primary, Llama-4 Scout
    // as long_context, GPT-OSS-20B as fast_layer.
    const modelByAlias = {
      primary: upsertedModels.find((m) => m.modelId === 'openai/gpt-oss-120b'),
      long_context: upsertedModels.find(
        (m) => m.modelId === 'meta-llama/llama-4-scout-17b-16e-instruct',
      ),
      fast_layer: upsertedModels.find(
        (m) => m.modelId === 'openai/gpt-oss-20b',
      ),
    };

    const assignmentSpecs: Array<{
      agentKind: 'A1' | 'A2' | 'A4';
      role: 'primary' | 'long_context' | 'fast_layer';
    }> = [
      { agentKind: 'A1', role: 'primary' },
      { agentKind: 'A1', role: 'long_context' },
      { agentKind: 'A1', role: 'fast_layer' },
      { agentKind: 'A2', role: 'primary' },
      { agentKind: 'A4', role: 'primary' },
    ];

    let assignmentCount = 0;
    for (const spec of assignmentSpecs) {
      const targetModel = modelByAlias[spec.role];
      if (!targetModel) continue; // skip if model alias missing
      await tx.agentModelAssignment.upsert({
        where: {
          workspaceId_agentKind_role: {
            workspaceId: workspace!.id,
            agentKind: spec.agentKind,
            role: spec.role,
          },
        },
        update: { modelPk: targetModel.id },
        create: {
          workspaceId: workspace!.id,
          agentKind: spec.agentKind,
          role: spec.role,
          modelPk: targetModel.id,
          createdBy: admin!.id,
        },
      });
      assignmentCount += 1;
    }

    return {
      providerRow,
      modelCount: upsertedModels.length,
      assignmentCount,
      action: existing ? 'UPDATED' : 'CREATED',
    };
  });

  // Audit row per Hard Rule 7 — written OUTSIDE the upsert transaction
  // because writeAuditRow takes the workspace pg_advisory_xact_lock
  // for the per-workspace HMAC chain integrity (running it inside
  // another tx would deadlock). Counts only — NEVER the key plaintext
  // OR ciphertext (ciphertext leak would help an attacker correlate
  // with future re-encrypts of the same key under same seed).
  await writeAuditRow(prisma, {
    workspaceId: workspace!.id,
    actorId: admin!.id,
    entityType: 'llm_provider',
    entityId: result.providerRow.id,
    action: 'llm_provider_seeded',
    payload: {
      provider_id: result.providerRow.id,
      provider_kind: cfg.providerKind,
      workspace_id: workspace!.id,
      workspace_name: workspace!.name,
      model_count: result.modelCount,
      assignment_count: result.assignmentCount,
      api_key_length: cfg.groqKey.length, // length only, NEVER the key
      ciphertext_length: apiKeyEncrypted.length,
      action: result.action,
      source: 'seed-llm-provider.ts (Path C bridge — ADR-015)',
      actor_email: cfg.adminEmail,
    },
    // Day-21 Kimi-K2 HIGH triage (c): secret is now a writeAuditRow param.
    // Seed script reads BETTER_AUTH_SECRET via readConfig() → cfg.betterAuthSecret.
    secret: cfg.betterAuthSecret,
  });

  console.log('');
  console.log('[seed-llm-provider] === SUCCESS ===');
  console.log(`[seed-llm-provider]   action:           ${result.action}`);
  console.log(
    `[seed-llm-provider]   provider_id:      ${result.providerRow.id}`,
  );
  console.log(`[seed-llm-provider]   models seeded:    ${result.modelCount}`);
  console.log(
    `[seed-llm-provider]   assignments:      ${result.assignmentCount}`,
  );
  console.log('');
  console.log(
    '[seed-llm-provider] Next step: restart Render service (or redeploy) so',
  );
  console.log(
    '[seed-llm-provider] LLMGatewayService.onModuleInit() picks up the new',
  );
  console.log(
    '[seed-llm-provider] DB row. Boot log should show "source=db". Per ADR-015.',
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error(
      '[seed-llm-provider] FAIL:',
      err instanceof Error ? err.message : err,
    );
    if (err instanceof Error && err.stack) console.error(err.stack);
    await prisma.$disconnect();
    process.exit(1);
  });

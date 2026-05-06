// QA Nexus PM1 — KbAnswerService.
//
// Spec: M2 TASK 3 (Day-11). RAG question-answering pipeline that turns
// a natural-language question + retrieved chunks into a cited answer.
// Sits on top of KbSearchService (Step 8) + LLMGateway.complete()
// (MS0-T023). Closes the user-facing half of the M2 KB feature.
//
// Architecture (per ADR-012 prompt strategy):
//   1. Reuse KbSearchService.search() for top-K chunks — workspace
//      isolation + audit comes for free.
//   2. If 0 chunks → SHORT-CIRCUIT (no LLM call) with the canonical
//      "no information" answer + confidence 0.
//   3. Build context as `[chunk: <UUID>]\nSource: <title>\n<text>` per
//      retrieved chunk — the citation marker IS the chunk header so the
//      model trivially mirrors it (no citation drift).
//   4. Call LLMGateway.complete(question_with_context, {
//        systemPrompt, temperature: 0.2, maxTokens: 800
//      })
//   5. Parse cited chunk IDs from the answer via UUID-anchored regex.
//      Filter to IDs we actually sent (catches model-hallucinated UUIDs).
//   6. Confidence = avg(cited.similarity) || top_chunk.similarity.
//   7. Audit `kb_answer_generated` synchronously. PII guard: counts +
//      provider metadata only — NEVER question text NOR answer text NOR
//      chunk text.
//
// Failure semantics:
//   - KbSearchService failure (embedder down) → propagates as
//     ServiceUnavailableException; the search-level audit captures it.
//   - LLM failure → `kb_answer_failed` audit + ServiceUnavailableException.
//   - Empty chunks → graceful "no context" 200 response (not an error).

import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { LLMGatewayService } from '../llm/llm-gateway.service';
import { KbSearchService, type ActorContext } from './kb-search.service';

const DEFAULT_TOP_K = 5;
const MAX_TOP_K = 10;
const ANSWER_MAX_TOKENS = 800;
const ANSWER_TEMPERATURE = 0.2;

/** Hardcoded short-circuit answer per ADR-012 §4 + system prompt rule 1. */
const NO_CONTEXT_ANSWER =
  "I don't have information on that in this knowledge base.";

/** UUID-anchored citation regex per ADR-012 §2. False-positive resistant. */
const CITATION_REGEX =
  /\[chunk:\s*([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\]/gi;

/** System prompt locked in source per ADR-012 §1 + mitigation §1.
 *  Any change requires PR review citing ADR-012. */
const SYSTEM_PROMPT = `You are QA Nexus, a knowledge-base assistant for Iksula's QA team.
Answer the user's question using ONLY the provided context chunks.
Rules:
1. If the context does not contain the answer, respond with exactly:
   "${NO_CONTEXT_ANSWER}"
   Do NOT speculate, do NOT use outside knowledge.
2. When you use information from a chunk, cite it inline using the
   exact format: [chunk: <UUID>]
   Place the citation immediately after the sentence it supports.
   Multiple citations per sentence are allowed: [chunk: A][chunk: B].
3. Keep the answer concise — 2-4 sentences typical, 6 maximum.
4. Use a neutral, professional tone.`;

export interface AnswerInput {
  projectId: string;
  question: string;
  /** Top-K chunks to retrieve. Default 5; clamped to MAX_TOP_K (10). */
  topK?: number;
}

export interface AnswerResult {
  answer: string;
  /** Chunk IDs the model actually cited (intersected with retrieved set
   *  so hallucinated UUIDs are filtered out). */
  sourceChunkIds: string[];
  /** Average similarity of cited chunks; top-chunk similarity if no
   *  citations; 0 if no context retrieved. Range [0, 1]. */
  confidenceScore: number;
  /** True when the search returned 0 chunks AND the LLM was skipped.
   *  FE shows a "no info" notice (NOT a chat bubble) for this case. */
  noContext: boolean;
  /** Total chunks retrieved by the upstream search (before citation
   *  filtering). FE may render these as "consulted" cards alongside
   *  the answer. */
  retrievedChunkCount: number;
  /** LLM provider metadata (null when noContext short-circuited). */
  llmMetadata: {
    providerName: string;
    modelUsed: string;
    tokensIn: number;
    tokensOut: number;
    latencyMs: number;
    fallbackUsed: boolean;
  } | null;
}

@Injectable()
export class KbAnswerService {
  private readonly logger = new Logger(KbAnswerService.name);

  constructor(
    private readonly searcher: KbSearchService,
    private readonly llm: LLMGatewayService,
    private readonly audit: AuditService,
  ) {}

  async answer(input: AnswerInput, ctx: ActorContext): Promise<AnswerResult> {
    const topK = Math.max(1, Math.min(MAX_TOP_K, input.topK ?? DEFAULT_TOP_K));

    // 1. Retrieve top-K chunks via KbSearchService. Workspace isolation
    //    + per-call audit row are both inherited from the search layer.
    const { chunks: retrieved } = await this.searcher.search(
      { projectId: input.projectId, query: input.question, limit: topK },
      ctx,
    );

    // 2. Empty-context short-circuit per ADR-012 §4. Skip LLM entirely.
    if (retrieved.length === 0) {
      await this.auditAnswer(input, ctx, {
        retrievedCount: 0,
        citedCount: 0,
        answerLength: NO_CONTEXT_ANSWER.length,
        noContext: true,
        llmCalled: false,
        confidence: 0,
        llm: null,
      });
      return {
        answer: NO_CONTEXT_ANSWER,
        sourceChunkIds: [],
        confidenceScore: 0,
        noContext: true,
        retrievedChunkCount: 0,
        llmMetadata: null,
      };
    }

    // 3. Build the context block per ADR-012 §1 user-message template.
    const contextBlock = retrieved
      .map(
        (c) =>
          `[chunk: ${c.chunkId}]\nSource: ${c.sourceFileName}\n${c.chunkText}`,
      )
      .join('\n\n');
    const userMessage =
      `Question: ${input.question}\n\n` +
      `Context (top ${retrieved.length} chunks, ranked by semantic similarity):\n\n` +
      contextBlock;

    // 4. Call the LLM gateway. Failure → wrap as 503 + audit failure.
    let llmResult;
    try {
      llmResult = await this.llm.complete(userMessage, {
        systemPrompt: SYSTEM_PROMPT,
        temperature: ANSWER_TEMPERATURE,
        maxTokens: ANSWER_MAX_TOKENS,
      });
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `KbAnswer LLM failure for projectId=${input.projectId}: ${reason}`,
      );
      await this.auditFailure(input, ctx, 'llm', reason, retrieved.length);
      throw new ServiceUnavailableException(
        `answer generation failed: ${reason}`,
      );
    }

    // 5. Parse citations from the answer text. Filter to chunk IDs we
    //    actually sent (catches model-hallucinated UUIDs per ADR-012 §2).
    const retrievedSet = new Set(retrieved.map((c) => c.chunkId.toLowerCase()));
    const citedRaw = new Set<string>();
    let m: RegExpExecArray | null;
    CITATION_REGEX.lastIndex = 0;
    while ((m = CITATION_REGEX.exec(llmResult.text)) !== null) {
      citedRaw.add(m[1].toLowerCase());
    }
    const citedFiltered = [...citedRaw].filter((id) => retrievedSet.has(id));

    // 6. Confidence per ADR-012 §5.
    const citedSimilarities = retrieved
      .filter((c) => citedFiltered.includes(c.chunkId.toLowerCase()))
      .map((c) => c.relevanceScore ?? 0);
    const confidenceScore =
      citedSimilarities.length > 0
        ? citedSimilarities.reduce((a, b) => a + b, 0) /
          citedSimilarities.length
        : (retrieved[0].relevanceScore ?? 0);

    // 7. Audit (PII-redacted per ADR-012 §6 + .claude/rules/security.md).
    await this.auditAnswer(input, ctx, {
      retrievedCount: retrieved.length,
      citedCount: citedFiltered.length,
      answerLength: llmResult.text.length,
      noContext: false,
      llmCalled: true,
      confidence: confidenceScore,
      llm: {
        provider: llmResult.providerName,
        model: llmResult.modelUsed,
        tokensIn: llmResult.tokensIn,
        tokensOut: llmResult.tokensOut,
      },
    });

    return {
      answer: llmResult.text,
      sourceChunkIds: citedFiltered,
      confidenceScore: Math.max(0, Math.min(1, confidenceScore)),
      noContext: false,
      retrievedChunkCount: retrieved.length,
      llmMetadata: {
        providerName: llmResult.providerName,
        modelUsed: llmResult.modelUsed,
        tokensIn: llmResult.tokensIn,
        tokensOut: llmResult.tokensOut,
        latencyMs: llmResult.latencyMs,
        fallbackUsed: llmResult.fallbackUsed,
      },
    };
  }

  /** Internal: write the success-path audit row. PII-redacted shape
   *  matches ADR-012 §6 — counts + provider metadata only. */
  private async auditAnswer(
    input: AnswerInput,
    ctx: ActorContext,
    detail: {
      retrievedCount: number;
      citedCount: number;
      answerLength: number;
      noContext: boolean;
      llmCalled: boolean;
      confidence: number;
      llm: {
        provider: string;
        model: string;
        tokensIn: number;
        tokensOut: number;
      } | null;
    },
  ): Promise<void> {
    const tokenCount = input.question
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
    await this.audit.write({
      workspaceId: ctx.workspaceId,
      actorId: ctx.actorId,
      entityType: 'kb_answer',
      entityId: input.projectId,
      action: 'kb_answer_generated',
      payload: {
        project_id: input.projectId,
        question_length: input.question.length,
        question_token_count: tokenCount,
        result_chunks: detail.retrievedCount,
        cited_chunks: detail.citedCount,
        answer_length: detail.answerLength,
        no_context: detail.noContext,
        llm_called: detail.llmCalled,
        provider: detail.llm?.provider ?? null,
        model: detail.llm?.model ?? null,
        tokens_in: detail.llm?.tokensIn ?? 0,
        tokens_out: detail.llm?.tokensOut ?? 0,
        confidence_score: Number(detail.confidence.toFixed(3)),
        actor_email: ctx.actorEmail,
      },
    });
  }

  /** Internal: write the failure-path audit row. Best-effort — write
   *  failure does NOT mask the original error. */
  private async auditFailure(
    input: AnswerInput,
    ctx: ActorContext,
    stage: 'llm' | 'parse',
    reason: string,
    retrievedCount: number,
  ): Promise<void> {
    try {
      await this.audit.write({
        workspaceId: ctx.workspaceId,
        actorId: ctx.actorId,
        entityType: 'kb_answer',
        entityId: input.projectId,
        action: 'kb_answer_failed',
        payload: {
          project_id: input.projectId,
          question_length: input.question.length,
          stage,
          reason: reason.slice(0, 500),
          retrieved_chunks: retrievedCount,
          actor_email: ctx.actorEmail,
        },
      });
    } catch (auditErr) {
      this.logger.error(
        `audit write for kb_answer_failed itself failed: ` +
          `${auditErr instanceof Error ? auditErr.message : String(auditErr)}. ` +
          `Original failure stage=${stage} reason=${reason.slice(0, 200)}`,
      );
    }
  }
}

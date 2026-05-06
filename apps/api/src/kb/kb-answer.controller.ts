// QA Nexus PM1 — KbAnswerController.
//
// Spec: M2 TASK 3 (Day-11). RAG question-answering endpoint.
//
// Endpoint:
//   POST /api/projects/:projectId/kb/answer  (Admin/Lead/QAEng/Stake)
//
// Body shape (Zod KbAnswerRequest):
//   { question: string, topK?: number = 5 }
//
// Response shape (Zod KbAnswerResponse):
//   { ok: true, answer, sourceChunkIds, confidenceScore, noContext,
//     retrievedChunkCount, llmMetadata }
//
// Architecture: thin HTTP wrapper. All RAG logic lives in
// KbAnswerService. Workspace isolation inherits from KbSearchService
// (which is called by KbAnswerService) — no need to re-check here.

import {
  Body,
  Controller,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { Role, KbAnswerRequest, type KbAnswerResponse } from '@qa-nexus/shared';
import { Roles } from '../auth/rbac/roles.decorator';
import { RolesGuard } from '../auth/rbac/roles.guard';
import { AuthService } from '../auth/auth.service';
import { KbAnswerService } from './kb-answer.service';
import type { ActorContext } from './kb-search.service';

function reqHeaders(req: Request): Headers {
  const h = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (Array.isArray(v)) v.forEach((vv) => h.append(k, vv));
    else if (typeof v === 'string') h.set(k, v);
  }
  return h;
}

@Controller('api/projects/:projectId/kb')
@UseGuards(RolesGuard)
export class KbAnswerController {
  constructor(
    private readonly answerer: KbAnswerService,
    private readonly authService: AuthService,
  ) {}

  private async actorOf(req: Request): Promise<ActorContext> {
    const session = await this.authService.resolveSession(reqHeaders(req));
    if (!session) {
      throw new UnauthorizedException(
        'session disappeared between guard and handler',
      );
    }
    return {
      workspaceId: session.appUser.workspaceId,
      actorId: session.appUser.id,
      actorEmail: session.appUser.email,
    };
  }

  @Post('answer')
  @Roles(Role.Admin, Role.Lead, Role.QAEngineer, Role.Stakeholder)
  async answer(
    @Param('projectId') projectId: string,
    @Body() body: unknown,
    @Req() req: Request,
  ): Promise<KbAnswerResponse> {
    const input = KbAnswerRequest.parse(body);
    const ctx = await this.actorOf(req);

    const result = await this.answerer.answer(
      { projectId, question: input.question, topK: input.topK },
      ctx,
    );

    return {
      ok: true,
      answer: result.answer,
      sourceChunkIds: result.sourceChunkIds,
      confidenceScore: result.confidenceScore,
      noContext: result.noContext,
      retrievedChunkCount: result.retrievedChunkCount,
      llmMetadata: result.llmMetadata,
    };
  }
}

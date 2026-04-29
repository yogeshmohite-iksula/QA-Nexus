// Dev probe + diagnostics for the LLM gateway. Admin-gated; refuses in
// production via NODE_ENV check. Also exposes /llm/providers for ops to
// see which adapters are registered.
//
// Spec: MS0-T023.
import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import { Role } from '@qa-nexus/shared';
import { Roles } from '../auth/rbac/roles.decorator';
import { RolesGuard } from '../auth/rbac/roles.guard';
import { LLMGatewayService } from './llm-gateway.service';
import { listProviders } from './provider-registry';

const TestBody = z.object({
  prompt: z.string().min(1).max(50_000),
  longContext: z.boolean().optional(),
  systemPrompt: z.string().optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().max(4096).optional(),
});

@Controller('llm')
@UseGuards(RolesGuard)
export class LLMController {
  constructor(private readonly gateway: LLMGatewayService) {}

  @Get('providers')
  @Roles(Role.Admin)
  providers() {
    return {
      registered: listProviders(),
      config: this.gateway.getConfig(),
    };
  }

  @Post('test')
  @Roles(Role.Admin)
  async test(@Body() body: unknown) {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException(
        '/llm/test is dev-only and disabled in production',
      );
    }
    const parsed = TestBody.parse(body);
    const result = await this.gateway.complete(parsed.prompt, {
      forceLongContext: parsed.longContext,
      systemPrompt: parsed.systemPrompt,
      model: parsed.model,
      temperature: parsed.temperature,
      maxTokens: parsed.maxTokens,
    });
    return {
      ok: true,
      result,
    };
  }
}

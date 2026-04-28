// Dev-only embedding probe — for manual verification + smoke tests.
//
// Spec: MS0-T024. Admin-gated via T022's RolesGuard. Disabled in
// production (NODE_ENV='production') so it can never accidentally be hit
// in a deployed environment.
//
// In production, the endpoint returns 404. Devs needing the probe can run
// the api with NODE_ENV unset or set to 'development' / 'test'.
import {
  Controller,
  ForbiddenException,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@qa-nexus/shared';
import { Roles } from '../auth/rbac/roles.decorator';
import { RolesGuard } from '../auth/rbac/roles.guard';
import { EmbeddingService } from './embedding.service';

@Controller('embedding')
@UseGuards(RolesGuard)
export class EmbeddingController {
  constructor(private readonly embedding: EmbeddingService) {}

  @Get('cosine')
  @Roles(Role.Admin)
  async cosine(
    @Query('a') a: string | undefined,
    @Query('b') b: string | undefined,
  ) {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('dev-only endpoint');
    }
    if (!a || !b) {
      return { ok: false, message: 'pass ?a=…&b=… to compare two strings' };
    }
    const va = await this.embedding.embed(a);
    const vb = await this.embedding.embed(b);
    let dot = 0,
      na = 0,
      nb = 0;
    for (let i = 0; i < va.length; i++) {
      dot += va[i] * vb[i];
      na += va[i] * va[i];
      nb += vb[i] * vb[i];
    }
    const cos = dot / (Math.sqrt(na) * Math.sqrt(nb));
    return { ok: true, a, b, dim: va.length, cosine_similarity: cos };
  }

  @Get('test')
  @Roles(Role.Admin)
  async test(@Query('text') text: string | undefined) {
    if (process.env.NODE_ENV === 'production') {
      // Belt-and-suspenders: even if Admin auth passes, refuse in prod.
      throw new ForbiddenException(
        '/embedding/test is dev-only and disabled in production',
      );
    }
    if (!text || text.length === 0) {
      return {
        ok: false,
        message: 'pass ?text=… to embed a sample string',
        status: this.embedding.status(),
      };
    }
    const t0 = Date.now();
    const vector = await this.embedding.embed(text);
    const latencyMs = Date.now() - t0;
    // Trim full vector for response — first 8 + last 4 dims is enough to
    // confirm shape; full vector inflates response size needlessly.
    const sample = [
      ...Array.from(vector.slice(0, 8)),
      '...',
      ...Array.from(vector.slice(-4)),
    ];
    return {
      ok: true,
      text,
      dim: vector.length,
      latency_ms: latencyMs,
      sample_first8_last4: sample,
      status: this.embedding.status(),
    };
  }
}

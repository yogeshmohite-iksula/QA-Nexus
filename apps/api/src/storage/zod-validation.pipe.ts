// QA Nexus PM1 — minimal Zod validation pipe.
//
// Wraps a Zod schema as a NestJS PipeTransform so request bodies are
// validated (and typed) at the controller boundary. Throws BadRequestException
// with the formatted Zod issues if validation fails.
//
// Locally scoped to apps/api/src/storage/ for now; if other modules adopt
// the same pattern we'll promote to apps/api/src/common/.
//
// Spec: .claude/rules/api.md "Endpoints" → "Every endpoint must have a
// corresponding Zod schema in packages/shared … never duplicate."

import {
  BadRequestException,
  Injectable,
  type ArgumentMetadata,
  type PipeTransform,
} from '@nestjs/common';
import type { ZodSchema, ZodIssue } from 'zod';

@Injectable()
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown, _metadata: ArgumentMetadata): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        message: 'request body validation failed',
        issues: result.error.issues.map((i: ZodIssue) => ({
          path: i.path.join('.'),
          code: i.code,
          message: i.message,
        })),
      });
    }
    return result.data;
  }
}

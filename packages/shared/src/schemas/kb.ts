// TB-017 kb_documents + TB-018 kb_chunks.
import { z } from 'zod';
import { Uuid, Timestamp, NonEmpty } from './enums.js';

export const KbDocumentSchema = z.object({
  id: Uuid,
  // null = workspace-scoped
  projectId: Uuid.nullable(),
  title: NonEmpty,
  bodyMd: z.string(),
  // Kept as a free text field until M2 enumerates the 12 PM1 templates.
  templateKind: NonEmpty,
  pinned: z.boolean(),
  authorId: Uuid,
  createdAt: Timestamp,
  updatedAt: Timestamp,
});
export type KbDocument = z.infer<typeof KbDocumentSchema>;

export const CreateKbDocumentInput = z.object({
  projectId: Uuid.nullable().optional(),
  title: NonEmpty,
  bodyMd: z.string().default(''),
  templateKind: NonEmpty,
  pinned: z.boolean().default(false),
});
export type CreateKbDocumentInput = z.infer<typeof CreateKbDocumentInput>;

export const UpdateKbDocumentInput = z.object({
  title: NonEmpty.optional(),
  bodyMd: z.string().optional(),
  templateKind: NonEmpty.optional(),
  pinned: z.boolean().optional(),
});
export type UpdateKbDocumentInput = z.infer<typeof UpdateKbDocumentInput>;

// TB-018 kb_chunks (server-managed; clients never write these directly)
export const KbChunkSchema = z.object({
  id: Uuid,
  documentId: Uuid,
  chunkText: z.string(),
  // embedding intentionally omitted — server-only.
  chunkIndex: z.number().int().nonnegative(),
  metadataJson: z.record(z.unknown()),
});
export type KbChunk = z.infer<typeof KbChunkSchema>;

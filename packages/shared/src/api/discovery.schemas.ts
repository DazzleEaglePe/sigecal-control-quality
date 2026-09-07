import { z } from 'zod';

import { createApiSuccessSchema, PaginationQuerySchema } from './contracts.js';
import { AuditActionSchema } from '../domain/enums.js';

export const SearchTypeSchema = z.enum([
  'BATCH',
  'INSPECTION',
  'NONCONFORMITY',
]);

export const SearchQuerySchema = z
  .object({
    q: z.string().trim().min(2).max(100),
    types: z
      .string()
      .transform((value) => value.split(',').filter(Boolean))
      .pipe(z.array(SearchTypeSchema).min(1))
      .optional(),
    limitPerType: z.coerce.number().int().min(1).max(20).default(8),
  })
  .strict();

export const SearchResultSchema = z
  .object({
    id: z.uuid(),
    type: SearchTypeSchema,
    code: z.string().trim().min(1),
    status: z.string().trim().min(1),
    context: z.string().trim().min(1),
  })
  .strict();

export const SearchResponseDataSchema = z
  .object({
    batches: z.array(SearchResultSchema),
    inspections: z.array(SearchResultSchema),
    nonConformities: z.array(SearchResultSchema),
    total: z.number().int().nonnegative(),
  })
  .strict();

export const SearchResponseSchema = createApiSuccessSchema(
  SearchResponseDataSchema,
);

export const AuditQuerySchema = PaginationQuerySchema.omit({
  search: true,
  sortBy: true,
  sortOrder: true,
}).extend({
  userId: z.uuid().optional(),
  entity: z.string().trim().min(1).max(80).optional(),
  entityId: z.string().trim().min(1).max(160).optional(),
  action: AuditActionSchema.optional(),
  dateFrom: z.iso.datetime({ offset: true }).optional(),
  dateTo: z.iso.datetime({ offset: true }).optional(),
});

export const AuditItemSchema = z
  .object({
    id: z.uuid(),
    user: z
      .object({
        id: z.uuid(),
        firstName: z.string(),
        lastName: z.string(),
      })
      .strict()
      .nullable(),
    action: AuditActionSchema,
    entity: z.string(),
    entityId: z.string(),
    before: z.unknown().nullable(),
    after: z.unknown().nullable(),
    ipAddress: z.string().nullable(),
    createdAt: z.iso.datetime({ offset: true }),
  })
  .strict();

export const AuditListResponseSchema = createApiSuccessSchema(
  z.array(AuditItemSchema),
);

export type SearchType = z.infer<typeof SearchTypeSchema>;
export type SearchQuery = z.infer<typeof SearchQuerySchema>;
export type SearchResult = z.infer<typeof SearchResultSchema>;
export type SearchResponseData = z.infer<typeof SearchResponseDataSchema>;
export type AuditQuery = z.infer<typeof AuditQuerySchema>;
export type AuditItem = z.infer<typeof AuditItemSchema>;

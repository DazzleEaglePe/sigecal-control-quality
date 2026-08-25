import { z } from 'zod';

export interface PaginationMeta {
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
}

export interface ApiSuccess<T> {
  readonly success: true;
  readonly data: T;
  readonly meta?: PaginationMeta;
}

export interface ApiError {
  readonly success: false;
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly details: readonly unknown[];
  };
}

export const PaginationMetaSchema = z
  .object({
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1).max(100),
    total: z.number().int().nonnegative(),
  })
  .strict();

export const PaginationQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    sortBy: z.string().trim().min(1).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    search: z.string().trim().min(1).optional(),
  })
  .strict();

export const createApiSuccessSchema = <Schema extends z.ZodType>(
  data: Schema,
) =>
  z
    .object({
      success: z.literal(true),
      data,
      meta: PaginationMetaSchema.optional(),
    })
    .strict();

export const ApiErrorSchema = z
  .object({
    success: z.literal(false),
    error: z
      .object({
        code: z.string().regex(/^[A-Z][A-Z0-9_]*$/),
        message: z.string().trim().min(1),
        details: z.array(z.unknown()),
      })
      .strict(),
  })
  .strict();

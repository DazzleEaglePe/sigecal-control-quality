import { z } from 'zod';

import { ApiErrorSchema, createApiSuccessSchema } from './contracts.js';

export const DATABASE_UNAVAILABLE_CODE = 'DATABASE_UNAVAILABLE';
export const SERVICE_UNAVAILABLE_MESSAGE =
  'El servicio no está disponible temporalmente.';

export const HealthDataSchema = z
  .object({
    status: z.literal('ok'),
    database: z.literal('connected'),
    timestamp: z.iso.datetime({ offset: true }),
  })
  .strict();

export const HealthResponseSchema = createApiSuccessSchema(HealthDataSchema);

export const DatabaseUnavailableErrorResponseSchema = ApiErrorSchema.extend({
  error: ApiErrorSchema.shape.error.extend({
    code: z.literal(DATABASE_UNAVAILABLE_CODE),
    message: z.literal(SERVICE_UNAVAILABLE_MESSAGE),
  }),
});

export type HealthData = z.infer<typeof HealthDataSchema>;
export type HealthResponse = z.infer<typeof HealthResponseSchema>;
export type DatabaseUnavailableErrorResponse = z.infer<
  typeof DatabaseUnavailableErrorResponseSchema
>;

import { z } from 'zod';

import {
  DataOriginSchema,
  NCSeveritySchema,
  NCStatusSchema,
  ResultStatusSchema,
} from '../domain/enums.js';
import { createApiSuccessSchema, PaginationQuerySchema } from './contracts.js';

const IdSchema = z.uuid();
const DateSchema = z.iso.date();
const DateTimeSchema = z.iso.datetime({ offset: true });
const TextSchema = z.string().trim().min(1).max(500);
const ScoreSchema = z
  .object({
    attributeId: IdSchema,
    score: z.number().int().min(1).max(5),
    descriptor: TextSchema.nullable().optional(),
  })
  .strict();

const uniqueAttributes = (scores: readonly { attributeId: string }[]) =>
  new Set(scores.map(({ attributeId }) => attributeId)).size === scores.length;

export const SensoryPanelistInputSchema = z
  .object({
    userId: IdSchema.optional(),
    externalName: z.string().trim().min(2).max(120).optional(),
    scores: z.array(ScoreSchema).min(1).max(50).refine(uniqueAttributes),
  })
  .strict()
  .refine((value) => Boolean(value.userId) !== Boolean(value.externalName), {
    message: 'Indique un usuario o un nombre externo, no ambos.',
  });

export const CreateSensorySessionRequestSchema = z
  .object({
    inspectionId: IdSchema,
    sessionDate: DateSchema,
    panelists: z.array(SensoryPanelistInputSchema).min(1).max(30),
    defectsFound: TextSchema.nullable().optional(),
    notes: TextSchema.nullable().optional(),
  })
  .strict();

export const CorrectSensorySessionRequestSchema =
  CreateSensorySessionRequestSchema.omit({ inspectionId: true }).extend({
    reason: TextSchema,
  });

export const SensorySessionListQuerySchema = PaginationQuerySchema.extend({
  batchId: IdSchema.optional(),
  inspectionId: IdSchema.optional(),
  status: ResultStatusSchema.optional(),
}).strict();

export const SensoryCompareQuerySchema = z
  .object({
    sessionIds: z
      .string()
      .transform((value) => value.split(',').filter(Boolean))
      .pipe(z.array(IdSchema).min(2).max(10)),
  })
  .strict();
export const SensoryPreparationQuerySchema = z
  .object({ inspectionId: IdSchema })
  .strict();

const ReferenceSchema = z
  .object({ id: IdSchema, code: z.string(), name: z.string() })
  .strict();
const PersonSchema = z
  .object({ id: IdSchema, firstName: z.string(), lastName: z.string() })
  .strict();
const ThresholdSchema = z
  .object({
    id: IdSchema,
    minAverage: z.string(),
    referenceNorm: z.string().nullable(),
    validFrom: DateSchema,
    isProvisional: z.boolean(),
  })
  .strict();
const NonConformitySchema = z
  .object({
    id: IdSchema,
    code: z.string(),
    status: NCStatusSchema,
    severity: NCSeveritySchema,
  })
  .strict();
const SensoryScoreItemSchema = z
  .object({
    attribute: ReferenceSchema,
    score: z.number().int().min(1).max(5),
    descriptor: z.string().nullable(),
  })
  .strict();
const SensoryPanelistItemSchema = z
  .object({
    id: IdSchema,
    user: PersonSchema.nullable(),
    externalName: z.string().nullable(),
    scores: z.array(SensoryScoreItemSchema),
  })
  .strict();

export const SensorySessionSchema = z
  .object({
    id: IdSchema,
    inspection: ReferenceSchema.omit({ name: true }),
    batch: ReferenceSchema.omit({ name: true }),
    sessionDate: DateSchema,
    overallAverage: z.string(),
    threshold: ThresholdSchema,
    appliedThreshold: z.string(),
    status: ResultStatusSchema,
    defectsFound: z.string().nullable(),
    notes: z.string().nullable(),
    recordedBy: PersonSchema,
    recordedAt: DateTimeSchema,
    dataOrigin: DataOriginSchema,
    annulledBy: PersonSchema.nullable(),
    annulledAt: DateTimeSchema.nullable(),
    annulReason: z.string().nullable(),
    replacesId: IdSchema.nullable(),
    replacementId: IdSchema.nullable(),
    panelists: z.array(SensoryPanelistItemSchema),
    nonConformity: NonConformitySchema.nullable(),
  })
  .strict();

export const SensoryProfilePointSchema = z
  .object({ attribute: ReferenceSchema, average: z.number().min(1).max(5) })
  .strict();
export const SensoryProfileSchema = z
  .object({
    sessionId: IdSchema,
    batchCode: z.string(),
    overallAverage: z.number(),
    status: ResultStatusSchema,
    points: z.array(SensoryProfilePointSchema),
  })
  .strict();
export const SensoryPanelistOptionSchema = PersonSchema;
export const SensoryPreparationSchema = z
  .object({
    attributes: z.array(ReferenceSchema),
    threshold: ThresholdSchema,
  })
  .strict();

export const SensorySessionListResponseSchema = createApiSuccessSchema(
  z.array(SensorySessionSchema),
);
export const SensorySessionResponseSchema =
  createApiSuccessSchema(SensorySessionSchema);
export const SensoryCorrectionResponseSchema = createApiSuccessSchema(
  z.object({
    annulled: SensorySessionSchema,
    replacement: SensorySessionSchema,
  }),
);
export const SensoryProfileResponseSchema =
  createApiSuccessSchema(SensoryProfileSchema);
export const SensoryCompareResponseSchema = createApiSuccessSchema(
  z.array(SensoryProfileSchema),
);
export const SensoryPanelistOptionsResponseSchema = createApiSuccessSchema(
  z.array(SensoryPanelistOptionSchema),
);
export const SensoryPreparationResponseSchema = createApiSuccessSchema(
  SensoryPreparationSchema,
);

export type CreateSensorySessionRequest = z.infer<
  typeof CreateSensorySessionRequestSchema
>;
export type CorrectSensorySessionRequest = z.infer<
  typeof CorrectSensorySessionRequestSchema
>;
export type SensorySessionListQuery = z.infer<
  typeof SensorySessionListQuerySchema
>;
export type SensoryCompareQuery = z.infer<typeof SensoryCompareQuerySchema>;
export type SensorySessionItem = z.infer<typeof SensorySessionSchema>;
export type SensoryProfile = z.infer<typeof SensoryProfileSchema>;
export type SensoryPanelistOption = z.infer<typeof SensoryPanelistOptionSchema>;
export type SensoryPreparation = z.infer<typeof SensoryPreparationSchema>;

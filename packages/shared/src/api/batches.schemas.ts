import { z } from 'zod';

import {
  BatchStatusSchema,
  DataOriginSchema,
  InspectionStatusSchema,
  InspectionTypeSchema,
  NCSeveritySchema,
  NCStatusSchema,
} from '../domain/enums.js';
import { createApiSuccessSchema, PaginationQuerySchema } from './contracts.js';

const IdSchema = z.uuid();
const DateSchema = z.iso.date();
const DateTimeSchema = z.iso.datetime();
const DecimalSchema = z.string().regex(/^\d+(\.\d+)?$/);
const OptionalTextSchema = z
  .string()
  .trim()
  .min(1)
  .max(500)
  .nullable()
  .optional();

const ReferenceSchema = z
  .object({
    id: IdSchema,
    code: z.string(),
    name: z.string(),
  })
  .strict();

const PersonSchema = z
  .object({
    id: IdSchema,
    firstName: z.string(),
    lastName: z.string(),
  })
  .strict();

export const BatchVarietyInputSchema = z
  .object({
    varietyId: IdSchema,
    percentage: z.number().positive().max(100).optional(),
  })
  .strict();

const compositionIsValid = (
  varieties: readonly z.infer<typeof BatchVarietyInputSchema>[],
): boolean => {
  if (
    new Set(varieties.map((item) => item.varietyId)).size !== varieties.length
  )
    return false;
  const percentages = varieties.map((item) => item.percentage);
  if (percentages.every((value) => value === undefined)) return true;
  if (percentages.some((value) => value === undefined)) return false;
  const reported = percentages.filter(
    (value): value is number => value !== undefined,
  );
  const total = reported.reduce((sum, value) => sum + value, 0);
  return Math.abs(total - 100) < 0.001;
};

const CompositionSchema = z
  .array(BatchVarietyInputSchema)
  .min(1)
  .max(20)
  .refine(compositionIsValid, {
    message: 'Las variedades deben ser únicas y sus porcentajes sumar 100.',
  });

export const CreateBatchRequestSchema = z
  .object({
    piscoTypeId: IdSchema,
    varieties: CompositionSchema,
    startDate: DateSchema,
    volumeLiters: z.number().positive(),
    harvestOrigin: z.string().trim().min(1).max(200).optional(),
    notes: OptionalTextSchema,
  })
  .strict();

export const UpdateBatchRequestSchema = z
  .object({
    piscoTypeId: IdSchema.optional(),
    varieties: CompositionSchema.optional(),
    startDate: DateSchema.optional(),
    volumeLiters: z.number().positive().optional(),
    harvestOrigin: z.string().trim().min(1).max(200).nullable().optional(),
    notes: OptionalTextSchema,
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Debe enviar al menos un campo.',
  });

export const BatchListQuerySchema = PaginationQuerySchema.extend({
  status: BatchStatusSchema.optional(),
  varietyId: IdSchema.optional(),
  piscoTypeId: IdSchema.optional(),
  stageId: IdSchema.optional(),
  dataOrigin: DataOriginSchema.optional(),
  dateFrom: DateSchema.optional(),
  dateTo: DateSchema.optional(),
})
  .strict()
  .refine(
    (value) =>
      !value.dateFrom || !value.dateTo || value.dateFrom <= value.dateTo,
    {
      message: 'La fecha final no puede ser anterior a la inicial.',
      path: ['dateTo'],
    },
  );

export const AdvanceBatchStageRequestSchema = z
  .object({
    responsibleId: IdSchema,
    observations: z.string().trim().min(1).max(500).optional(),
  })
  .strict();

export const RejectBatchRequestSchema = z
  .object({
    reason: z.string().trim().min(1).max(500),
  })
  .strict();

const BatchVarietySchema = z
  .object({
    variety: ReferenceSchema,
    percentage: DecimalSchema.nullable(),
  })
  .strict();

export const BatchSchema = z
  .object({
    id: IdSchema,
    code: z.string().regex(/^LT-\d{4}-\d{4}$/),
    piscoType: ReferenceSchema,
    currentStage: ReferenceSchema.extend({
      sequence: z.number().int().positive(),
    }),
    status: BatchStatusSchema,
    startDate: DateSchema,
    closeDate: DateSchema.nullable(),
    rejectedAt: DateTimeSchema.nullable(),
    rejectedBy: PersonSchema.nullable(),
    rejectionReason: z.string().nullable(),
    volumeLiters: DecimalSchema,
    harvestOrigin: z.string().nullable(),
    notes: z.string().nullable(),
    createdBy: PersonSchema,
    dataOrigin: DataOriginSchema,
    createdAt: DateTimeSchema,
    updatedAt: DateTimeSchema,
    varieties: z.array(BatchVarietySchema),
    openNonConformities: z.number().int().nonnegative(),
    hasInspections: z.boolean(),
  })
  .strict();

const TimelineInspectionSchema = z
  .object({
    id: IdSchema,
    code: z.string(),
    type: InspectionTypeSchema,
    status: InspectionStatusSchema,
    scheduledDate: DateTimeSchema,
  })
  .strict();

const TimelineNonConformitySchema = z
  .object({
    id: IdSchema,
    code: z.string(),
    status: NCStatusSchema,
    severity: NCSeveritySchema,
    description: z.string(),
  })
  .strict();

export const BatchTimelineEntrySchema = z
  .object({
    stage: ReferenceSchema.extend({ sequence: z.number().int().positive() }),
    state: z.enum(['COMPLETED', 'CURRENT', 'PENDING']),
    startedAt: DateTimeSchema.nullable(),
    finishedAt: DateTimeSchema.nullable(),
    responsible: PersonSchema.nullable(),
    observations: z.string().nullable(),
    inspections: z.array(TimelineInspectionSchema),
    nonConformities: z.array(TimelineNonConformitySchema),
  })
  .strict();

export const BatchResponseSchema = createApiSuccessSchema(BatchSchema);
export const BatchListResponseSchema = createApiSuccessSchema(
  z.array(BatchSchema),
);
export const BatchTimelineResponseSchema = createApiSuccessSchema(
  z.array(BatchTimelineEntrySchema),
);
export const BatchAdvanceWarningSchema = z.enum([
  'PENDING_INSPECTIONS',
  'OPEN_NONCONFORMITIES',
]);
export const BatchAdvanceResultSchema = z
  .object({
    batch: BatchSchema,
    warnings: z.array(BatchAdvanceWarningSchema),
  })
  .strict();
export const BatchAdvanceResponseSchema = createApiSuccessSchema(
  BatchAdvanceResultSchema,
);
export const BatchTraceabilitySchema = z
  .object({
    batch: BatchSchema,
    timeline: z.array(BatchTimelineEntrySchema),
  })
  .strict();
export const BatchTraceabilityResponseSchema = createApiSuccessSchema(
  BatchTraceabilitySchema,
);

export type BatchItem = z.infer<typeof BatchSchema>;
export type BatchListQuery = z.infer<typeof BatchListQuerySchema>;
export type CreateBatchRequest = z.infer<typeof CreateBatchRequestSchema>;
export type UpdateBatchRequest = z.infer<typeof UpdateBatchRequestSchema>;
export type AdvanceBatchStageRequest = z.infer<
  typeof AdvanceBatchStageRequestSchema
>;
export type RejectBatchRequest = z.infer<typeof RejectBatchRequestSchema>;
export type BatchTimelineEntry = z.infer<typeof BatchTimelineEntrySchema>;
export type BatchAdvanceWarning = z.infer<typeof BatchAdvanceWarningSchema>;

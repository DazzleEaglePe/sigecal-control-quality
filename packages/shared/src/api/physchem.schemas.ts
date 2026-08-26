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
const DecimalSchema = z.string().regex(/^-?\d+(\.\d+)?$/);
const TextSchema = z.string().trim().min(1).max(500);
const MeasurementSchema = z
  .object({
    parameterId: IdSchema,
    value: z.number(),
    observation: TextSchema.nullable().optional(),
  })
  .strict();

const uniqueParameters = (
  values: readonly z.infer<typeof MeasurementSchema>[],
): boolean =>
  new Set(values.map((item) => item.parameterId)).size === values.length;

export const ValidatePhysChemResultsRequestSchema = z
  .object({
    inspectionId: IdSchema,
    results: z
      .array(MeasurementSchema)
      .min(1)
      .max(100)
      .refine(uniqueParameters),
  })
  .strict();
export const CreatePhysChemResultsRequestSchema =
  ValidatePhysChemResultsRequestSchema;

export const CorrectPhysChemResultRequestSchema = z
  .object({
    reason: TextSchema,
    value: z.number(),
    observation: TextSchema.nullable().optional(),
    equipmentId: IdSchema,
  })
  .strict();

export const PhysChemResultListQuerySchema = PaginationQuerySchema.extend({
  inspectionId: IdSchema.optional(),
  parameterId: IdSchema.optional(),
  batchId: IdSchema.optional(),
  status: ResultStatusSchema.optional(),
}).strict();
export const PhysChemHistoryQuerySchema = PaginationQuerySchema.extend({
  parameterId: IdSchema,
  piscoTypeId: IdSchema.optional(),
}).strict();
export const PhysChemControlChartQuerySchema = z
  .object({
    parameterId: IdSchema,
    piscoTypeId: IdSchema,
    stageId: IdSchema,
    standardId: IdSchema.optional(),
    dateFrom: DateSchema.optional(),
    dateTo: DateSchema.optional(),
    includeDemo: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .default(false),
  })
  .strict()
  .refine(
    (value) =>
      !value.dateFrom || !value.dateTo || value.dateFrom <= value.dateTo,
    { path: ['dateTo'], message: 'La fecha final no puede ser anterior.' },
  );

const ReferenceSchema = z
  .object({ id: IdSchema, code: z.string(), name: z.string() })
  .strict();
const BatchReferenceSchema = z
  .object({ id: IdSchema, code: z.string() })
  .strict();
const PersonSchema = z
  .object({ id: IdSchema, firstName: z.string(), lastName: z.string() })
  .strict();
const StandardAppliedSchema = z
  .object({
    id: IdSchema,
    minValue: DecimalSchema.nullable(),
    maxValue: DecimalSchema.nullable(),
    targetValue: DecimalSchema.nullable(),
    referenceNorm: z.string().nullable(),
  })
  .strict();

export const PhysChemValidationSchema = z
  .object({
    parameterId: IdSchema,
    value: z.number(),
    status: z.enum(['CONFORME', 'NO_CONFORME']),
    standard: StandardAppliedSchema,
  })
  .strict();

const NonConformitySummarySchema = z
  .object({
    id: IdSchema,
    code: z.string(),
    status: NCStatusSchema,
    severity: NCSeveritySchema,
  })
  .strict();

export const PhysChemResultSchema = z
  .object({
    id: IdSchema,
    inspection: BatchReferenceSchema,
    batch: BatchReferenceSchema,
    parameter: ReferenceSchema.extend({ unit: z.string().nullable() }),
    standard: StandardAppliedSchema,
    value: DecimalSchema,
    status: ResultStatusSchema,
    observation: z.string().nullable(),
    equipment: ReferenceSchema,
    calibrationRef: z.string().nullable(),
    recordedBy: PersonSchema,
    recordedAt: DateTimeSchema,
    dataOrigin: DataOriginSchema,
    annulledBy: PersonSchema.nullable(),
    annulledAt: DateTimeSchema.nullable(),
    annulReason: z.string().nullable(),
    replacesId: IdSchema.nullable(),
    replacementId: IdSchema.nullable(),
    nonConformity: NonConformitySummarySchema.nullable(),
  })
  .strict();

export const PhysChemCorrectionSchema = z
  .object({
    annulled: PhysChemResultSchema,
    replacement: PhysChemResultSchema,
    nonConformity: NonConformitySummarySchema.nullable(),
  })
  .strict();

const ControlChartPointSchema = z
  .object({
    date: DateSchema,
    value: z.number(),
    batchCode: z.string(),
    outOfControl: z.boolean(),
  })
  .strict();
export const PhysChemControlChartSchema = z
  .object({
    points: z.array(ControlChartPointSchema),
    centerLine: z.number().nullable(),
    upperControlLimit: z.number().nullable(),
    lowerControlLimit: z.number().nullable(),
    sampleSize: z.number().int().nonnegative(),
    sufficientData: z.boolean(),
    includesDemo: z.boolean(),
  })
  .strict();

export const PhysChemValidationResponseSchema = createApiSuccessSchema(
  z.array(PhysChemValidationSchema),
);
export const PhysChemResultResponseSchema =
  createApiSuccessSchema(PhysChemResultSchema);
export const PhysChemResultListResponseSchema = createApiSuccessSchema(
  z.array(PhysChemResultSchema),
);
export const PhysChemCorrectionResponseSchema = createApiSuccessSchema(
  PhysChemCorrectionSchema,
);
export const PhysChemControlChartResponseSchema = createApiSuccessSchema(
  PhysChemControlChartSchema,
);

export type ValidatePhysChemResultsRequest = z.infer<
  typeof ValidatePhysChemResultsRequestSchema
>;
export type CreatePhysChemResultsRequest = z.infer<
  typeof CreatePhysChemResultsRequestSchema
>;
export type CorrectPhysChemResultRequest = z.infer<
  typeof CorrectPhysChemResultRequestSchema
>;
export type PhysChemResultListQuery = z.infer<
  typeof PhysChemResultListQuerySchema
>;
export type PhysChemHistoryQuery = z.infer<typeof PhysChemHistoryQuerySchema>;
export type PhysChemControlChartQuery = z.infer<
  typeof PhysChemControlChartQuerySchema
>;
export type PhysChemValidation = z.infer<typeof PhysChemValidationSchema>;
export type PhysChemResultItem = z.infer<typeof PhysChemResultSchema>;
export type PhysChemCorrection = z.infer<typeof PhysChemCorrectionSchema>;
export type PhysChemControlChart = z.infer<typeof PhysChemControlChartSchema>;

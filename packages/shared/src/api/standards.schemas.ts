import { z } from 'zod';

import { DataOriginSchema, NCSeveritySchema } from '../domain/enums.js';
import { createApiSuccessSchema } from './contracts.js';

const IdSchema = z.uuid();
const DateSchema = z.iso.date();
const DecimalResponseSchema = z.string().regex(/^-?\d+(\.\d+)?$/);

const limitsAreOrdered = (value: {
  readonly minValue?: number | null | undefined;
  readonly maxValue?: number | null | undefined;
  readonly targetValue?: number | null | undefined;
}): boolean => {
  if (
    value.minValue != null &&
    value.maxValue != null &&
    value.minValue > value.maxValue
  )
    return false;
  if (
    value.targetValue != null &&
    value.minValue != null &&
    value.targetValue < value.minValue
  )
    return false;
  return !(
    value.targetValue != null &&
    value.maxValue != null &&
    value.targetValue > value.maxValue
  );
};

export const StandardSchema = z
  .object({
    id: IdSchema,
    parameterId: IdSchema,
    piscoTypeId: IdSchema.nullable(),
    stageId: IdSchema.nullable(),
    minValue: DecimalResponseSchema.nullable(),
    maxValue: DecimalResponseSchema.nullable(),
    targetValue: DecimalResponseSchema.nullable(),
    referenceNorm: z.string().nullable(),
    defaultSeverity: NCSeveritySchema,
    isProvisional: z.boolean(),
    validFrom: DateSchema,
    validTo: DateSchema.nullable(),
    isActive: z.boolean(),
  })
  .strict();

export const CreateStandardRequestSchema = z
  .object({
    parameterId: IdSchema,
    piscoTypeId: IdSchema.optional(),
    stageId: IdSchema.optional(),
    minValue: z.number().nullable().optional(),
    maxValue: z.number().nullable().optional(),
    targetValue: z.number().nullable().optional(),
    referenceNorm: z.string().trim().min(1).max(160).optional(),
    defaultSeverity: NCSeveritySchema,
    isProvisional: z.boolean().default(true),
    validFrom: DateSchema,
    validTo: DateSchema.optional(),
  })
  .strict()
  .refine(
    (value) =>
      value.minValue != null ||
      value.maxValue != null ||
      value.targetValue != null,
    {
      message: 'Debe definir al menos un límite o valor objetivo.',
    },
  )
  .refine(limitsAreOrdered, {
    message: 'Los límites del estándar no están ordenados.',
  })
  .refine((value) => !value.validTo || value.validFrom <= value.validTo, {
    message: 'La fecha final no puede ser anterior a la inicial.',
    path: ['validTo'],
  });

export const UpdateStandardRequestSchema = z
  .object({
    minValue: z.number().nullable().optional(),
    maxValue: z.number().nullable().optional(),
    targetValue: z.number().nullable().optional(),
    referenceNorm: z.string().trim().min(1).max(160).nullable().optional(),
    defaultSeverity: NCSeveritySchema.optional(),
    isProvisional: z.boolean().optional(),
    isActive: z.boolean().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Debe enviar al menos un campo.',
  })
  .refine(limitsAreOrdered, {
    message: 'Los límites del estándar no están ordenados.',
  });

export const StandardHistoryQuerySchema = z
  .object({ parameterId: IdSchema })
  .strict();
export const EffectiveStandardQuerySchema = z
  .object({
    parameterId: IdSchema,
    piscoTypeId: IdSchema.optional(),
    stageId: IdSchema.optional(),
    date: DateSchema,
    dataOrigin: DataOriginSchema.default('REAL'),
  })
  .strict();
export const StandardResponseSchema = createApiSuccessSchema(StandardSchema);
export const StandardListResponseSchema = createApiSuccessSchema(
  z.array(StandardSchema),
);

export const SensoryThresholdSchema = z
  .object({
    id: IdSchema,
    piscoTypeId: IdSchema.nullable(),
    minAverage: DecimalResponseSchema,
    defaultSeverity: NCSeveritySchema,
    referenceNorm: z.string().nullable(),
    validFrom: DateSchema,
    validTo: DateSchema.nullable(),
    isActive: z.boolean(),
    isProvisional: z.boolean(),
  })
  .strict();

export const CreateSensoryThresholdRequestSchema = z
  .object({
    piscoTypeId: IdSchema.optional(),
    minAverage: z.number().min(1).max(5),
    defaultSeverity: NCSeveritySchema,
    referenceNorm: z.string().trim().min(1).max(160).optional(),
    validFrom: DateSchema,
    validTo: DateSchema.optional(),
    isProvisional: z.boolean().default(true),
  })
  .strict()
  .refine((value) => !value.validTo || value.validFrom <= value.validTo, {
    message: 'La fecha final no puede ser anterior a la inicial.',
    path: ['validTo'],
  });

export const SensoryThresholdHistoryQuerySchema = z
  .object({
    piscoTypeId: IdSchema.optional(),
    isActive: z.stringbool().optional(),
  })
  .strict();
export const EffectiveSensoryThresholdQuerySchema = z
  .object({
    piscoTypeId: IdSchema.optional(),
    date: DateSchema,
    dataOrigin: DataOriginSchema.default('REAL'),
  })
  .strict();
export const SensoryThresholdResponseSchema = createApiSuccessSchema(
  SensoryThresholdSchema,
);
export const SensoryThresholdListResponseSchema = createApiSuccessSchema(
  z.array(SensoryThresholdSchema),
);

export type StandardItem = z.infer<typeof StandardSchema>;
export type CreateStandardRequest = z.infer<typeof CreateStandardRequestSchema>;
export type UpdateStandardRequest = z.infer<typeof UpdateStandardRequestSchema>;
export type StandardHistoryQuery = z.infer<typeof StandardHistoryQuerySchema>;
export type EffectiveStandardQuery = z.infer<
  typeof EffectiveStandardQuerySchema
>;
export type SensoryThresholdItem = z.infer<typeof SensoryThresholdSchema>;
export type CreateSensoryThresholdRequest = z.infer<
  typeof CreateSensoryThresholdRequestSchema
>;
export type SensoryThresholdHistoryQuery = z.infer<
  typeof SensoryThresholdHistoryQuerySchema
>;
export type EffectiveSensoryThresholdQuery = z.infer<
  typeof EffectiveSensoryThresholdQuerySchema
>;

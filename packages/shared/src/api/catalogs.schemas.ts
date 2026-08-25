import { z } from 'zod';

import { EquipmentStatusSchema, ParameterTypeSchema } from '../domain/enums.js';
import { createApiSuccessSchema } from './contracts.js';

const IdSchema = z.uuid();
const CodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9_-]{2,40}$/, 'Use letras, números, guion o guion bajo.');
const NameSchema = z.string().trim().min(1).max(120);
const DescriptionSchema = z.string().trim().min(1).max(500);
const nonEmpty = <Shape extends z.ZodRawShape>(shape: Shape) =>
  z
    .object(shape)
    .strict()
    .refine((value) => Object.keys(value).length > 0, {
      message: 'Debe enviar al menos un campo.',
    });

export const GrapeVarietySchema = z
  .object({
    id: IdSchema,
    code: z.string(),
    name: z.string(),
    isActive: z.boolean(),
  })
  .strict();
export const CreateGrapeVarietyRequestSchema = z
  .object({ code: CodeSchema, name: NameSchema })
  .strict();
export const UpdateGrapeVarietyRequestSchema = nonEmpty({
  code: CodeSchema.optional(),
  name: NameSchema.optional(),
  isActive: z.boolean().optional(),
});

export const PiscoTypeSchema = z
  .object({
    id: IdSchema,
    code: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    isActive: z.boolean(),
  })
  .strict();
export const CreatePiscoTypeRequestSchema = z
  .object({
    code: CodeSchema,
    name: NameSchema,
    description: DescriptionSchema.optional(),
  })
  .strict();
export const UpdatePiscoTypeRequestSchema = nonEmpty({
  code: CodeSchema.optional(),
  name: NameSchema.optional(),
  description: DescriptionSchema.nullable().optional(),
  isActive: z.boolean().optional(),
});

export const ProcessStageSchema = z
  .object({
    id: IdSchema,
    code: z.string(),
    name: z.string(),
    sequence: z.number().int().positive(),
    description: z.string().nullable(),
    isActive: z.boolean(),
  })
  .strict();
export const CreateProcessStageRequestSchema = z
  .object({
    code: CodeSchema,
    name: NameSchema,
    sequence: z.number().int().positive().max(999),
    description: DescriptionSchema.optional(),
  })
  .strict();
export const UpdateProcessStageRequestSchema = nonEmpty({
  code: CodeSchema.optional(),
  name: NameSchema.optional(),
  sequence: z.number().int().positive().max(999).optional(),
  description: DescriptionSchema.nullable().optional(),
  isActive: z.boolean().optional(),
});

export const EquipmentSchema = z
  .object({
    id: IdSchema,
    code: z.string(),
    name: z.string(),
    status: EquipmentStatusSchema,
    lastCalibrationRef: z.string().nullable(),
    isActive: z.boolean(),
  })
  .strict();
export const CreateEquipmentRequestSchema = z
  .object({
    code: CodeSchema,
    name: NameSchema,
    status: EquipmentStatusSchema,
    lastCalibrationRef: z.string().trim().min(1).max(160).optional(),
  })
  .strict();
export const UpdateEquipmentRequestSchema = nonEmpty({
  code: CodeSchema.optional(),
  name: NameSchema.optional(),
  status: EquipmentStatusSchema.optional(),
  lastCalibrationRef: z.string().trim().min(1).max(160).nullable().optional(),
  isActive: z.boolean().optional(),
});

export const SensoryAttributeSchema = z
  .object({
    id: IdSchema,
    code: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    sequence: z.number().int().positive(),
    isActive: z.boolean(),
  })
  .strict();
export const CreateSensoryAttributeRequestSchema = z
  .object({
    code: CodeSchema,
    name: NameSchema,
    description: DescriptionSchema.optional(),
    sequence: z.number().int().positive().max(999),
  })
  .strict();
export const UpdateSensoryAttributeRequestSchema = nonEmpty({
  code: CodeSchema.optional(),
  name: NameSchema.optional(),
  description: DescriptionSchema.nullable().optional(),
  sequence: z.number().int().positive().max(999).optional(),
  isActive: z.boolean().optional(),
});

export const ParameterSchema = z
  .object({
    id: IdSchema,
    code: z.string(),
    name: z.string(),
    unit: z.string(),
    type: ParameterTypeSchema,
    testMethod: z.string().nullable(),
    decimals: z.number().int().min(0).max(6),
    isActive: z.boolean(),
  })
  .strict();
export const CreateParameterRequestSchema = z
  .object({
    code: CodeSchema,
    name: NameSchema,
    unit: z.string().trim().min(1).max(40),
    type: ParameterTypeSchema,
    testMethod: z.string().trim().min(1).max(160).optional(),
    decimals: z.number().int().min(0).max(6).default(2),
  })
  .strict();
export const UpdateParameterRequestSchema = nonEmpty({
  code: CodeSchema.optional(),
  name: NameSchema.optional(),
  unit: z.string().trim().min(1).max(40).optional(),
  type: ParameterTypeSchema.optional(),
  testMethod: z.string().trim().min(1).max(160).nullable().optional(),
  decimals: z.number().int().min(0).max(6).optional(),
  isActive: z.boolean().optional(),
});

export const CatalogListQuerySchema = z
  .object({ isActive: z.stringbool().optional() })
  .strict();
export const GrapeVarietyResponseSchema =
  createApiSuccessSchema(GrapeVarietySchema);
export const GrapeVarietyListResponseSchema = createApiSuccessSchema(
  z.array(GrapeVarietySchema),
);
export const PiscoTypeResponseSchema = createApiSuccessSchema(PiscoTypeSchema);
export const PiscoTypeListResponseSchema = createApiSuccessSchema(
  z.array(PiscoTypeSchema),
);
export const ProcessStageResponseSchema =
  createApiSuccessSchema(ProcessStageSchema);
export const ProcessStageListResponseSchema = createApiSuccessSchema(
  z.array(ProcessStageSchema),
);
export const EquipmentResponseSchema = createApiSuccessSchema(EquipmentSchema);
export const EquipmentListResponseSchema = createApiSuccessSchema(
  z.array(EquipmentSchema),
);
export const SensoryAttributeResponseSchema = createApiSuccessSchema(
  SensoryAttributeSchema,
);
export const SensoryAttributeListResponseSchema = createApiSuccessSchema(
  z.array(SensoryAttributeSchema),
);
export const ParameterResponseSchema = createApiSuccessSchema(ParameterSchema);
export const ParameterListResponseSchema = createApiSuccessSchema(
  z.array(ParameterSchema),
);

export type GrapeVarietyItem = z.infer<typeof GrapeVarietySchema>;
export type PiscoTypeItem = z.infer<typeof PiscoTypeSchema>;
export type ProcessStageItem = z.infer<typeof ProcessStageSchema>;
export type EquipmentItem = z.infer<typeof EquipmentSchema>;
export type SensoryAttributeItem = z.infer<typeof SensoryAttributeSchema>;
export type ParameterItem = z.infer<typeof ParameterSchema>;
export type CatalogListQuery = z.infer<typeof CatalogListQuerySchema>;
export type CreateGrapeVarietyRequest = z.infer<
  typeof CreateGrapeVarietyRequestSchema
>;
export type UpdateGrapeVarietyRequest = z.infer<
  typeof UpdateGrapeVarietyRequestSchema
>;
export type CreatePiscoTypeRequest = z.infer<
  typeof CreatePiscoTypeRequestSchema
>;
export type UpdatePiscoTypeRequest = z.infer<
  typeof UpdatePiscoTypeRequestSchema
>;
export type CreateProcessStageRequest = z.infer<
  typeof CreateProcessStageRequestSchema
>;
export type UpdateProcessStageRequest = z.infer<
  typeof UpdateProcessStageRequestSchema
>;
export type CreateEquipmentRequest = z.infer<
  typeof CreateEquipmentRequestSchema
>;
export type UpdateEquipmentRequest = z.infer<
  typeof UpdateEquipmentRequestSchema
>;
export type CreateSensoryAttributeRequest = z.infer<
  typeof CreateSensoryAttributeRequestSchema
>;
export type UpdateSensoryAttributeRequest = z.infer<
  typeof UpdateSensoryAttributeRequestSchema
>;
export type CreateParameterRequest = z.infer<
  typeof CreateParameterRequestSchema
>;
export type UpdateParameterRequest = z.infer<
  typeof UpdateParameterRequestSchema
>;

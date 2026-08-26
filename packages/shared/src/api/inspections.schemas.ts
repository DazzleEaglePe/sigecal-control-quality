import { z } from 'zod';

import {
  DataOriginSchema,
  EquipmentStatusSchema,
  InspectionStatusSchema,
  InspectionTypeSchema,
  ParameterTypeSchema,
  RoleSchema,
} from '../domain/enums.js';
import { createApiSuccessSchema, PaginationQuerySchema } from './contracts.js';

const IdSchema = z.uuid();
const DateSchema = z.iso.date();
const DateTimeSchema = z.iso.datetime({ offset: true });
const TimeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/);
const NoteSchema = z.string().trim().min(1).max(500);

const uniqueIds = (values: readonly string[]): boolean =>
  new Set(values).size === values.length;

const ReferenceSchema = z
  .object({ id: IdSchema, code: z.string(), name: z.string() })
  .strict();
const BatchReferenceSchema = z
  .object({ id: IdSchema, code: z.string() })
  .strict();
const PersonSchema = z
  .object({ id: IdSchema, firstName: z.string(), lastName: z.string() })
  .strict();
const EquipmentSchema = ReferenceSchema.extend({
  status: EquipmentStatusSchema,
}).strict();
const ParameterSchema = ReferenceSchema.extend({
  type: ParameterTypeSchema,
  unit: z.string().nullable(),
}).strict();

export const CreateInspectionRequestSchema = z
  .object({
    batchId: IdSchema,
    stageId: IdSchema,
    type: InspectionTypeSchema,
    scheduledDate: DateTimeSchema,
    responsibleId: IdSchema,
    equipmentId: IdSchema.nullable().optional(),
    parameterIds: z.array(IdSchema).max(100).refine(uniqueIds),
    notes: NoteSchema.nullable().optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.type === 'FISICOQUIMICO' && value.parameterIds.length === 0)
      context.addIssue({
        code: 'custom',
        path: ['parameterIds'],
        message: 'Una inspección fisicoquímica requiere parámetros.',
      });
  });

export const UpdateInspectionRequestSchema = z
  .object({
    scheduledDate: DateTimeSchema.optional(),
    responsibleId: IdSchema.optional(),
    equipmentId: IdSchema.nullable().optional(),
    parameterIds: z.array(IdSchema).max(100).refine(uniqueIds).optional(),
    notes: NoteSchema.nullable().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Debe enviar al menos un campo.',
  });

export const RescheduleInspectionRequestSchema = z
  .object({ newDate: DateTimeSchema, reason: NoteSchema })
  .strict();
export const CancelInspectionRequestSchema = z
  .object({ reason: NoteSchema })
  .strict();

export const InspectionListQuerySchema = PaginationQuerySchema.extend({
  batchId: IdSchema.optional(),
  status: InspectionStatusSchema.optional(),
  type: InspectionTypeSchema.optional(),
  responsibleId: IdSchema.optional(),
  stageId: IdSchema.optional(),
  dateFrom: DateTimeSchema.optional(),
  dateTo: DateTimeSchema.optional(),
})
  .strict()
  .refine(
    (value) =>
      !value.dateFrom || !value.dateTo || value.dateFrom <= value.dateTo,
    { path: ['dateTo'], message: 'El final no puede ser anterior al inicio.' },
  );

export const InspectionCalendarQuerySchema = PaginationQuerySchema.extend({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  dateFrom: DateTimeSchema.optional(),
  dateTo: DateTimeSchema.optional(),
})
  .strict()
  .superRefine((value, context) => {
    const calendarPair = value.month !== undefined && value.year !== undefined;
    const rangePair =
      value.dateFrom !== undefined && value.dateTo !== undefined;
    if (calendarPair === rangePair)
      context.addIssue({
        code: 'custom',
        message: 'Envíe mes y año, o bien fecha inicial y final.',
      });
    if (
      rangePair &&
      value.dateFrom !== undefined &&
      value.dateTo !== undefined &&
      value.dateFrom > value.dateTo
    )
      context.addIssue({
        code: 'custom',
        path: ['dateTo'],
        message: 'El final no puede ser anterior al inicio.',
      });
  });

export const InspectionCoverageQuerySchema = z
  .object({ batchId: IdSchema })
  .strict();
export const MyPendingInspectionQuerySchema = PaginationQuerySchema;

const ResponsibleByRoleSchema = z
  .partialRecord(RoleSchema, IdSchema)
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Asigne al menos una persona responsable.',
  });
export const CreateInspectionPlanRequestSchema = z
  .object({
    batchId: IdSchema,
    templateId: IdSchema,
    responsibleByRole: ResponsibleByRoleSchema,
  })
  .strict();

export const InspectionTemplateListQuerySchema = PaginationQuerySchema.extend({
  piscoTypeId: IdSchema.optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
}).strict();

export const InspectionTemplateItemInputSchema = z
  .object({
    stageId: IdSchema,
    type: InspectionTypeSchema,
    offsetDaysFromBatchStart: z.number().int().nonnegative(),
    scheduledLocalTime: TimeSchema,
    responsibleRole: RoleSchema,
    equipmentId: IdSchema.nullable().optional(),
    parameterIds: z.array(IdSchema).max(100).refine(uniqueIds),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.type === 'FISICOQUIMICO' && value.parameterIds.length === 0)
      context.addIssue({
        code: 'custom',
        path: ['parameterIds'],
        message: 'El ítem fisicoquímico requiere parámetros.',
      });
  });

export const CreateInspectionTemplateRequestSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(2)
      .max(30)
      .regex(/^[A-Z0-9_-]+$/),
    name: z.string().trim().min(2).max(120),
    piscoTypeId: IdSchema,
    validFrom: DateSchema,
    validTo: DateSchema.nullable().optional(),
    items: z.array(InspectionTemplateItemInputSchema).min(1).max(100),
  })
  .strict()
  .refine((value) => !value.validTo || value.validTo >= value.validFrom, {
    path: ['validTo'],
    message: 'La vigencia final no puede ser anterior a la inicial.',
  });

export const InspectionSchema = z
  .object({
    id: IdSchema,
    code: z.string().regex(/^INS-\d{4}-\d{4}$/),
    batch: BatchReferenceSchema,
    stage: ReferenceSchema,
    type: InspectionTypeSchema,
    status: InspectionStatusSchema,
    scheduledDate: DateTimeSchema,
    executedAt: DateTimeSchema.nullable(),
    responsible: PersonSchema,
    equipment: EquipmentSchema.nullable(),
    rescheduledFromId: IdSchema.nullable(),
    rescheduledToId: IdSchema.nullable(),
    changeReason: z.string().nullable(),
    notes: z.string().nullable(),
    createdBy: PersonSchema,
    dataOrigin: DataOriginSchema,
    parameters: z.array(ParameterSchema),
    recordedParameterIds: z.array(IdSchema),
  })
  .strict();

export const InspectionTemplateItemSchema = z
  .object({
    id: IdSchema,
    stage: ReferenceSchema,
    type: InspectionTypeSchema,
    offsetDaysFromBatchStart: z.number().int().nonnegative(),
    scheduledLocalTime: TimeSchema,
    responsibleRole: RoleSchema,
    equipment: EquipmentSchema.nullable(),
    parameters: z.array(ParameterSchema),
  })
  .strict();
export const InspectionTemplateSchema = z
  .object({
    id: IdSchema,
    code: z.string(),
    name: z.string(),
    piscoType: ReferenceSchema,
    validFrom: DateSchema,
    validTo: DateSchema.nullable(),
    isActive: z.boolean(),
    createdBy: PersonSchema,
    items: z.array(InspectionTemplateItemSchema),
  })
  .strict();

const CoverageStageSchema = z
  .object({
    stage: ReferenceSchema,
    hasScheduledInspection: z.boolean(),
    inspections: z.number().int().nonnegative(),
  })
  .strict();
export const InspectionCoverageSchema = z
  .object({
    batch: BatchReferenceSchema,
    coveredStages: z.number().int().nonnegative(),
    totalStages: z.number().int().nonnegative(),
    percentage: z.number().min(0).max(100).nullable(),
    stages: z.array(CoverageStageSchema),
  })
  .strict();

export const InspectionResponseSchema =
  createApiSuccessSchema(InspectionSchema);
export const InspectionListResponseSchema = createApiSuccessSchema(
  z.array(InspectionSchema),
);
export const InspectionTemplateResponseSchema = createApiSuccessSchema(
  InspectionTemplateSchema,
);
export const InspectionTemplateListResponseSchema = createApiSuccessSchema(
  z.array(InspectionTemplateSchema),
);
export const InspectionCoverageResponseSchema = createApiSuccessSchema(
  InspectionCoverageSchema,
);
export const InspectionPlanResponseSchema = createApiSuccessSchema(
  z.array(InspectionSchema),
);

export type CreateInspectionRequest = z.infer<
  typeof CreateInspectionRequestSchema
>;
export type UpdateInspectionRequest = z.infer<
  typeof UpdateInspectionRequestSchema
>;
export type RescheduleInspectionRequest = z.infer<
  typeof RescheduleInspectionRequestSchema
>;
export type CancelInspectionRequest = z.infer<
  typeof CancelInspectionRequestSchema
>;
export type InspectionListQuery = z.infer<typeof InspectionListQuerySchema>;
export type InspectionCalendarQuery = z.infer<
  typeof InspectionCalendarQuerySchema
>;
export type MyPendingInspectionQuery = z.infer<
  typeof MyPendingInspectionQuerySchema
>;
export type CreateInspectionPlanRequest = z.infer<
  typeof CreateInspectionPlanRequestSchema
>;
export type CreateInspectionTemplateRequest = z.infer<
  typeof CreateInspectionTemplateRequestSchema
>;
export type InspectionTemplateListQuery = z.infer<
  typeof InspectionTemplateListQuerySchema
>;
export type InspectionItem = z.infer<typeof InspectionSchema>;
export type InspectionTemplateItem = z.infer<typeof InspectionTemplateSchema>;
export type InspectionCoverage = z.infer<typeof InspectionCoverageSchema>;

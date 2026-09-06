import { z } from 'zod';

import {
  ActionStatusSchema,
  ActionTypeSchema,
  DataOriginSchema,
  NCOriginSchema,
  NCSeveritySchema,
  NCStatusSchema,
} from '../domain/enums.js';
import { createApiSuccessSchema, PaginationQuerySchema } from './contracts.js';

const IdSchema = z.uuid();
const DateSchema = z.iso.date();
const DateTimeSchema = z.iso.datetime({ offset: true });
const NoteSchema = z.string().trim().min(1).max(1000);
const CommentSchema = z.string().trim().min(1).max(500);

const ReferenceSchema = z
  .object({ id: IdSchema, code: z.string(), name: z.string() })
  .strict();
const BatchReferenceSchema = z
  .object({ id: IdSchema, code: z.string() })
  .strict();
const PersonSchema = z
  .object({ id: IdSchema, firstName: z.string(), lastName: z.string() })
  .strict();

export const CreateNonConformityRequestSchema = z
  .object({
    batchId: IdSchema,
    stageId: IdSchema.nullable().optional(),
    description: NoteSchema,
    severity: NCSeveritySchema,
    rootCause: NoteSchema.nullable().optional(),
    assignedToId: IdSchema.nullable().optional(),
    assignedAreaId: IdSchema.nullable().optional(),
  })
  .strict();

export const UpdateNonConformityRequestSchema = z
  .object({
    description: NoteSchema.optional(),
    severity: NCSeveritySchema.optional(),
    rootCause: NoteSchema.nullable().optional(),
    assignedToId: IdSchema.nullable().optional(),
    assignedAreaId: IdSchema.nullable().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Debe enviar al menos un campo.',
  });

export const CloseNonConformityRequestSchema = z
  .object({ closeComment: NoteSchema })
  .strict();

export const NonConformityListQuerySchema = PaginationQuerySchema.extend({
  status: NCStatusSchema.optional(),
  severity: NCSeveritySchema.optional(),
  batchId: IdSchema.optional(),
  stageId: IdSchema.optional(),
  origin: NCOriginSchema.optional(),
  assignedToId: IdSchema.optional(),
  assignedAreaId: IdSchema.optional(),
  dateFrom: DateTimeSchema.optional(),
  dateTo: DateTimeSchema.optional(),
})
  .strict()
  .refine(
    (value) =>
      !value.dateFrom || !value.dateTo || value.dateFrom <= value.dateTo,
    { path: ['dateTo'], message: 'El final no puede ser anterior al inicio.' },
  );

export const CreateActionRequestSchema = z
  .object({
    type: ActionTypeSchema,
    description: NoteSchema,
    responsibleId: IdSchema,
    committedDate: DateSchema,
    replacesActionId: IdSchema.optional(),
  })
  .strict();

export const UpdateActionRequestSchema = z
  .object({
    type: ActionTypeSchema.optional(),
    description: NoteSchema.optional(),
    responsibleId: IdSchema.optional(),
    committedDate: DateSchema.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Debe enviar al menos un campo.',
  });

export const VerifyActionRequestSchema = z
  .object({ isEffective: z.boolean(), verificationComment: CommentSchema })
  .strict();

export const CorrectiveActionSchema = z
  .object({
    id: IdSchema,
    nonConformityId: IdSchema,
    type: ActionTypeSchema,
    description: z.string(),
    responsible: PersonSchema,
    committedDate: DateSchema,
    executedAt: DateTimeSchema.nullable(),
    status: ActionStatusSchema,
    isEffective: z.boolean().nullable(),
    verifiedBy: PersonSchema.nullable(),
    verifiedAt: DateTimeSchema.nullable(),
    verificationComment: z.string().nullable(),
    replacesActionId: IdSchema.nullable(),
  })
  .strict();

export const NonConformitySchema = z
  .object({
    id: IdSchema,
    code: z.string().regex(/^NC-\d{4}-\d{4}$/),
    batch: BatchReferenceSchema,
    stage: ReferenceSchema.nullable(),
    inspectionId: IdSchema.nullable(),
    physChemResultId: IdSchema.nullable(),
    sensorySessionId: IdSchema.nullable(),
    origin: NCOriginSchema,
    severity: NCSeveritySchema,
    status: NCStatusSchema,
    description: z.string(),
    rootCause: z.string().nullable(),
    detectedAt: DateTimeSchema,
    detectedBy: PersonSchema,
    assignedTo: PersonSchema.nullable(),
    assignedArea: ReferenceSchema.nullable(),
    attentionStartedAt: DateTimeSchema.nullable(),
    responseTimeHours: z.number().nonnegative().nullable(),
    closedAt: DateTimeSchema.nullable(),
    closedBy: PersonSchema.nullable(),
    closeComment: z.string().nullable(),
    closureTimeHours: z.number().nonnegative().nullable(),
    annulledAt: DateTimeSchema.nullable(),
    annulledBy: PersonSchema.nullable(),
    annulReason: z.string().nullable(),
    dataOrigin: DataOriginSchema,
  })
  .strict();

export const NonConformityDetailSchema = NonConformitySchema.extend({
  actions: z.array(CorrectiveActionSchema),
}).strict();

export const NonConformityResponseSchema =
  createApiSuccessSchema(NonConformitySchema);
export const NonConformityDetailResponseSchema = createApiSuccessSchema(
  NonConformityDetailSchema,
);
export const NonConformityListResponseSchema = createApiSuccessSchema(
  z.array(NonConformitySchema),
);
export const CorrectiveActionResponseSchema = createApiSuccessSchema(
  CorrectiveActionSchema,
);
export const CorrectiveActionListResponseSchema = createApiSuccessSchema(
  z.array(CorrectiveActionSchema),
);

export type CreateNonConformityRequest = z.infer<
  typeof CreateNonConformityRequestSchema
>;
export type UpdateNonConformityRequest = z.infer<
  typeof UpdateNonConformityRequestSchema
>;
export type CloseNonConformityRequest = z.infer<
  typeof CloseNonConformityRequestSchema
>;
export type NonConformityListQuery = z.infer<
  typeof NonConformityListQuerySchema
>;
export type CreateActionRequest = z.infer<typeof CreateActionRequestSchema>;
export type UpdateActionRequest = z.infer<typeof UpdateActionRequestSchema>;
export type VerifyActionRequest = z.infer<typeof VerifyActionRequestSchema>;
export type NonConformityItem = z.infer<typeof NonConformitySchema>;
export type NonConformityDetail = z.infer<typeof NonConformityDetailSchema>;
export type CorrectiveActionItem = z.infer<typeof CorrectiveActionSchema>;

import { z } from 'zod';

import {
  InspectionStatusSchema,
  InspectionTypeSchema,
  NCOriginSchema,
  NCSeveritySchema,
  NCStatusSchema,
  ResultStatusSchema,
} from '../domain/enums.js';
import { createApiSuccessSchema } from './contracts.js';

const NullableMetricSchema = z.number().nonnegative().nullable();
const IdSchema = z.uuid();
const DateTimeSchema = z.iso.datetime({ offset: true });
const IncludeDemoSchema = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true')
  .default(false);

const ExportRangeSchema = z
  .object({
    dateFrom: DateTimeSchema.optional(),
    dateTo: DateTimeSchema.optional(),
    includeDemo: IncludeDemoSchema,
  })
  .refine(
    (value) =>
      !value.dateFrom || !value.dateTo || value.dateFrom <= value.dateTo,
    { path: ['dateTo'], message: 'El final no puede ser anterior al inicio.' },
  );

export const InspectionExportQuerySchema = ExportRangeSchema.extend({
  batchId: IdSchema.optional(),
  stageId: IdSchema.optional(),
  responsibleId: IdSchema.optional(),
  status: InspectionStatusSchema.optional(),
  type: InspectionTypeSchema.optional(),
}).strict();

export const NonConformityExportQuerySchema = ExportRangeSchema.extend({
  batchId: IdSchema.optional(),
  stageId: IdSchema.optional(),
  assignedToId: IdSchema.optional(),
  assignedAreaId: IdSchema.optional(),
  status: NCStatusSchema.optional(),
  severity: NCSeveritySchema.optional(),
  origin: NCOriginSchema.optional(),
}).strict();

export const ResultExportQuerySchema = ExportRangeSchema.extend({
  batchId: IdSchema.optional(),
  inspectionId: IdSchema.optional(),
  parameterId: IdSchema.optional(),
  status: ResultStatusSchema.optional(),
}).strict();

export const ReportsDashboardQuerySchema = z
  .object({
    dateFrom: z.iso.date(),
    dateTo: z.iso.date(),
    includeDemo: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .default(false),
  })
  .strict()
  .refine((value) => value.dateFrom <= value.dateTo, {
    message: 'La fecha inicial no puede ser posterior a la fecha final.',
    path: ['dateTo'],
  });

const StandardCoverageSchema = z
  .object({
    value: NullableMetricSchema,
    covered: z.number().int().nonnegative(),
    total: z.number().int().nonnegative(),
  })
  .strict();

const ConformityRateSchema = z
  .object({
    value: NullableMetricSchema,
    conforming: z.number().int().nonnegative(),
    total: z.number().int().nonnegative(),
    physchem: NullableMetricSchema,
    sensory: NullableMetricSchema,
    standardCoverage: StandardCoverageSchema,
  })
  .strict();

const ScheduleComplianceSchema = z
  .object({
    value: NullableMetricSchema,
    onTime: z.number().int().nonnegative(),
    due: z.number().int().nonnegative(),
    late: z.number().int().nonnegative(),
    overdue: z.number().int().nonnegative(),
  })
  .strict();

const ResponseTimeSchema = z
  .object({
    hours: NullableMetricSchema,
    attended: z.number().int().nonnegative(),
    unattended: z.number().int().nonnegative(),
    oldestUnattendedHours: NullableMetricSchema,
  })
  .strict();

const StageCountSchema = z
  .object({
    stageId: z.uuid().nullable(),
    stageName: z.string().trim().min(1),
    sequence: z.number().int().positive().nullable(),
    count: z.number().int().nonnegative(),
  })
  .strict();

const ActiveStageCountSchema = StageCountSchema.extend({
  stageId: z.uuid(),
  sequence: z.number().int().positive(),
  inObservation: z.number().int().nonnegative(),
}).strict();

const TrendPointSchema = z
  .object({
    month: z.string().regex(/^\d{4}-\d{2}$/),
    rate: NullableMetricSchema,
    conforming: z.number().int().nonnegative(),
    sampleSize: z.number().int().nonnegative(),
  })
  .strict();

export const ReportsDashboardSchema = z
  .object({
    period: z
      .object({
        dateFrom: z.iso.date(),
        dateTo: z.iso.date(),
        timeZone: z.literal('America/Lima'),
      })
      .strict(),
    includesDemo: z.boolean(),
    conformityRate: ConformityRateSchema,
    scheduleCompliance: ScheduleComplianceSchema,
    avgResponseTime: ResponseTimeSchema,
    openNonConformities: z.record(
      NCSeveritySchema,
      z.number().int().nonnegative(),
    ),
    activeBatchesByStage: z.array(ActiveStageCountSchema),
    ncByStage: z.array(StageCountSchema),
    conformityTrend: z.array(TrendPointSchema),
  })
  .strict();

export const ReportsDashboardResponseSchema = createApiSuccessSchema(
  ReportsDashboardSchema,
);

export type ReportsDashboardQuery = z.infer<typeof ReportsDashboardQuerySchema>;
export type ReportsDashboard = z.infer<typeof ReportsDashboardSchema>;
export type InspectionExportQuery = z.infer<typeof InspectionExportQuerySchema>;
export type NonConformityExportQuery = z.infer<
  typeof NonConformityExportQuerySchema
>;
export type ResultExportQuery = z.infer<typeof ResultExportQuerySchema>;

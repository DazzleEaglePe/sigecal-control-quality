import { z } from 'zod';

import { NCSeveritySchema } from '../domain/enums.js';
import { createApiSuccessSchema } from './contracts.js';

const NullableMetricSchema = z.number().nonnegative().nullable();

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

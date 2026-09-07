import { z } from 'zod';

export {
  InspectionExportQuerySchema,
  NonConformityExportQuerySchema,
  ReportsDashboardQuerySchema,
  ResultExportQuerySchema,
} from '@sigecal/shared';

export const ReportBatchParamsSchema = z.object({ batchId: z.uuid() }).strict();

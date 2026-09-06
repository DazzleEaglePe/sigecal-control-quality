import { z } from 'zod';

export { ReportsDashboardQuerySchema } from '@sigecal/shared';

export const ReportBatchParamsSchema = z.object({ batchId: z.uuid() }).strict();

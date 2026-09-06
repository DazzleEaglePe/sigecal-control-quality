import { z } from 'zod';

import { ReportsDashboardResponseSchema } from '../../src/index.js';

const schema = (value: z.ZodType): Record<string, unknown> => {
  const result: Record<string, unknown> = { ...z.toJSONSchema(value) };
  delete result.$schema;
  return result;
};

const json = (name: string) => ({
  'application/json': { schema: { $ref: `#/components/schemas/${name}` } },
});

export const reportPaths = {
  '/reports/dashboard': {
    get: {
      security: [{ bearerAuth: [] }],
      tags: ['Reportes'],
      operationId: 'getReportsDashboard',
      summary: 'Calcula los indicadores consolidados del periodo',
      parameters: [
        {
          name: 'dateFrom',
          in: 'query',
          required: true,
          schema: { type: 'string', format: 'date' },
        },
        {
          name: 'dateTo',
          in: 'query',
          required: true,
          schema: { type: 'string', format: 'date' },
        },
        {
          name: 'includeDemo',
          in: 'query',
          schema: { type: 'boolean', default: false },
          description: 'Solo ADMIN y JEFE_CALIDAD pueden activarlo.',
        },
      ],
      responses: {
        '200': {
          description: 'Indicadores calculados en America/Lima.',
          content: json('ReportsDashboardResponse'),
        },
        '403': {
          description: 'El rol no puede incluir datos de demostración.',
          content: json('ApiError'),
        },
      },
    },
  },
};

export const reportSchemas = {
  ReportsDashboardResponse: schema(ReportsDashboardResponseSchema),
};

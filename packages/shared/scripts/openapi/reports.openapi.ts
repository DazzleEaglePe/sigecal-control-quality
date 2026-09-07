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
const queryParameter = (name: string, format?: string) => ({
  name,
  in: 'query',
  schema: { type: 'string', ...(format ? { format } : {}) },
});
const includeDemoParameter = {
  name: 'includeDemo',
  in: 'query',
  schema: { type: 'boolean', default: false },
  description: 'Solo ADMIN y JEFE_CALIDAD pueden activarlo.',
};
const reportDates = [
  queryParameter('dateFrom', 'date-time'),
  queryParameter('dateTo', 'date-time'),
];
const excelResponses = {
  '200': {
    description: 'Libro Excel generado con los filtros aplicados.',
    headers: { 'Content-Disposition': { schema: { type: 'string' } } },
    content: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
        schema: { type: 'string', format: 'binary' },
      },
    },
  },
  '403': {
    description: 'El rol no puede exportar o incluir datos DEMO.',
    content: json('ApiError'),
  },
};

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
  '/reports/traceability/{batchId}/pdf': {
    get: {
      security: [{ bearerAuth: [] }],
      tags: ['Reportes'],
      operationId: 'downloadTraceabilityPdf',
      summary: 'Descarga la trazabilidad completa de un lote en PDF',
      parameters: [
        {
          name: 'batchId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      responses: {
        '200': {
          description: 'PDF con identificación, composición y etapas.',
          headers: {
            'Content-Disposition': { schema: { type: 'string' } },
          },
          content: {
            'application/pdf': {
              schema: { type: 'string', format: 'binary' },
            },
          },
        },
        '403': {
          description: 'El rol no puede exportar reportes.',
          content: json('ApiError'),
        },
        '404': {
          description: 'El lote no existe o no está a su alcance.',
          content: json('ApiError'),
        },
      },
    },
  },
  '/reports/inspections/excel': {
    get: {
      security: [{ bearerAuth: [] }],
      tags: ['Reportes'],
      operationId: 'downloadInspectionsExcel',
      summary: 'Exporta inspecciones filtradas en Excel',
      parameters: [
        ...reportDates,
        ...['batchId', 'stageId', 'responsibleId'].map((name) =>
          queryParameter(name, 'uuid'),
        ),
        queryParameter('status'),
        queryParameter('type'),
        includeDemoParameter,
      ],
      responses: excelResponses,
    },
  },
  '/reports/nonconformities/excel': {
    get: {
      security: [{ bearerAuth: [] }],
      tags: ['Reportes'],
      operationId: 'downloadNonConformitiesExcel',
      summary: 'Exporta no conformidades y acciones filtradas en Excel',
      parameters: [
        ...reportDates,
        ...['batchId', 'stageId', 'assignedToId', 'assignedAreaId'].map(
          (name) => queryParameter(name, 'uuid'),
        ),
        queryParameter('status'),
        queryParameter('severity'),
        queryParameter('origin'),
        includeDemoParameter,
      ],
      responses: excelResponses,
    },
  },
  '/reports/results/excel': {
    get: {
      security: [{ bearerAuth: [] }],
      tags: ['Reportes'],
      operationId: 'downloadResultsExcel',
      summary: 'Exporta resultados fisicoquímicos filtrados en Excel',
      parameters: [
        ...reportDates,
        ...['batchId', 'inspectionId', 'parameterId'].map((name) =>
          queryParameter(name, 'uuid'),
        ),
        queryParameter('status'),
        includeDemoParameter,
      ],
      responses: excelResponses,
    },
  },
};

export const reportSchemas = {
  ReportsDashboardResponse: schema(ReportsDashboardResponseSchema),
};

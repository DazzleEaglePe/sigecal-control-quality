import { z } from 'zod';

import {
  AdvanceBatchStageRequestSchema,
  BatchAdvanceResponseSchema,
  BatchListResponseSchema,
  BatchResponseSchema,
  BatchTimelineResponseSchema,
  BatchTraceabilityResponseSchema,
  CreateBatchRequestSchema,
  RejectBatchRequestSchema,
  UpdateBatchRequestSchema,
} from '../../src/index.js';

const schema = (value: z.ZodType): Record<string, unknown> => {
  const result: Record<string, unknown> = { ...z.toJSONSchema(value) };
  delete result.$schema;
  return result;
};
const json = (name: string): Record<string, unknown> => ({
  'application/json': { schema: { $ref: `#/components/schemas/${name}` } },
});
const errorResponse = (description: string): Record<string, unknown> => ({
  description,
  content: json('ApiError'),
});
const secured = { security: [{ bearerAuth: [] }], tags: ['Lotes'] };
const idParameter = {
  name: 'id',
  in: 'path',
  required: true,
  schema: { type: 'string', format: 'uuid' },
};

const listParameters = [
  { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1 } },
  {
    name: 'pageSize',
    in: 'query',
    schema: { type: 'integer', minimum: 1, maximum: 100 },
  },
  { name: 'search', in: 'query', schema: { type: 'string' } },
  {
    name: 'status',
    in: 'query',
    schema: {
      type: 'string',
      enum: ['EN_PROCESO', 'EN_OBSERVACION', 'CERRADO', 'RECHAZADO'],
    },
  },
  ...['varietyId', 'piscoTypeId', 'stageId'].map((name) => ({
    name,
    in: 'query',
    schema: { type: 'string', format: 'uuid' },
  })),
  {
    name: 'dataOrigin',
    in: 'query',
    schema: { type: 'string', enum: ['REAL', 'DEMO'] },
  },
  ...['dateFrom', 'dateTo'].map((name) => ({
    name,
    in: 'query',
    schema: { type: 'string', format: 'date' },
  })),
];

export const batchPaths = {
  '/batches': {
    get: {
      ...secured,
      operationId: 'listBatches',
      summary: 'Lista lotes con alcance por rol y paginación',
      parameters: listParameters,
      responses: {
        '200': {
          description: 'Lotes accesibles para la persona autenticada.',
          content: json('BatchListResponse'),
        },
        '401': errorResponse('Sesión inválida.'),
      },
    },
    post: {
      ...secured,
      operationId: 'createBatch',
      summary: 'Crea un lote REAL y abre su primera etapa',
      requestBody: { required: true, content: json('CreateBatchRequest') },
      responses: {
        '201': {
          description: 'Lote creado.',
          content: json('BatchResponse'),
        },
        '400': errorResponse('Composición o datos inválidos.'),
        '403': errorResponse('Rol no autorizado.'),
        '409': errorResponse('Catálogo inactivo o composición incompatible.'),
      },
    },
  },
  '/batches/{id}': {
    get: {
      ...secured,
      operationId: 'getBatch',
      summary: 'Obtiene el detalle de un lote accesible',
      parameters: [idParameter],
      responses: {
        '200': {
          description: 'Lote encontrado.',
          content: json('BatchResponse'),
        },
        '404': errorResponse('Lote inexistente o fuera de alcance.'),
      },
    },
    patch: {
      ...secured,
      operationId: 'updateBatch',
      summary: 'Actualiza los datos permitidos de un lote no terminal',
      parameters: [idParameter],
      requestBody: { required: true, content: json('UpdateBatchRequest') },
      responses: {
        '200': {
          description: 'Lote actualizado.',
          content: json('BatchResponse'),
        },
        '403': errorResponse('Rol no autorizado.'),
        '404': errorResponse('Lote inexistente o fuera de alcance.'),
        '409': errorResponse('Lote terminal o datos de identidad congelados.'),
      },
    },
  },
  '/batches/{id}/timeline': {
    get: {
      ...secured,
      operationId: 'getBatchTimeline',
      summary: 'Obtiene la trazabilidad cronológica de todas las etapas',
      parameters: [idParameter],
      responses: {
        '200': {
          description: 'Línea de tiempo del lote.',
          content: json('BatchTimelineResponse'),
        },
        '404': errorResponse('Lote inexistente o fuera de alcance.'),
      },
    },
  },
  '/batches/{id}/advance-stage': {
    post: {
      ...secured,
      operationId: 'advanceBatchStage',
      summary: 'Cierra la etapa actual y abre la siguiente inmediata',
      parameters: [idParameter],
      requestBody: {
        required: true,
        content: json('AdvanceBatchStageRequest'),
      },
      responses: {
        '200': {
          description: 'Etapa avanzada con advertencias no bloqueantes.',
          content: json('BatchAdvanceResponse'),
        },
        '409': errorResponse(
          'Lote terminal, responsable inválido o etapa final.',
        ),
      },
    },
  },
  '/batches/{id}/close': {
    post: {
      ...secured,
      operationId: 'closeBatch',
      summary: 'Cierra un lote sin no conformidades abiertas',
      parameters: [idParameter],
      responses: {
        '200': { description: 'Lote cerrado.', content: json('BatchResponse') },
        '403': errorResponse('Requiere ADMIN o JEFE_CALIDAD.'),
        '409': errorResponse('Existen no conformidades abiertas.'),
      },
    },
  },
  '/batches/{id}/reject': {
    post: {
      ...secured,
      operationId: 'rejectBatch',
      summary: 'Rechaza un lote con motivo, fecha y actor',
      parameters: [idParameter],
      requestBody: { required: true, content: json('RejectBatchRequest') },
      responses: {
        '200': {
          description: 'Lote rechazado.',
          content: json('BatchResponse'),
        },
        '403': errorResponse('Requiere ADMIN o JEFE_CALIDAD.'),
        '409': errorResponse('Lote en estado terminal.'),
      },
    },
  },
  '/batches/{id}/qr': {
    get: {
      ...secured,
      operationId: 'getBatchQr',
      summary: 'Genera el QR del enlace de trazabilidad',
      parameters: [idParameter],
      responses: {
        '200': {
          description: 'Código QR en SVG.',
          content: { 'image/svg+xml': { schema: { type: 'string' } } },
        },
        '404': errorResponse('Lote inexistente o fuera de alcance.'),
      },
    },
  },
  '/batches/{id}/traceability': {
    get: {
      ...secured,
      operationId: 'getBatchTraceability',
      summary: 'Obtiene el lote y su línea de tiempo consolidada',
      parameters: [idParameter],
      responses: {
        '200': {
          description: 'Trazabilidad consolidada.',
          content: json('BatchTraceabilityResponse'),
        },
        '404': errorResponse('Lote inexistente o fuera de alcance.'),
      },
    },
  },
};

export const batchSchemas = {
  CreateBatchRequest: schema(CreateBatchRequestSchema),
  UpdateBatchRequest: schema(UpdateBatchRequestSchema),
  AdvanceBatchStageRequest: schema(AdvanceBatchStageRequestSchema),
  RejectBatchRequest: schema(RejectBatchRequestSchema),
  BatchResponse: schema(BatchResponseSchema),
  BatchListResponse: schema(BatchListResponseSchema),
  BatchTimelineResponse: schema(BatchTimelineResponseSchema),
  BatchAdvanceResponse: schema(BatchAdvanceResponseSchema),
  BatchTraceabilityResponse: schema(BatchTraceabilityResponseSchema),
};

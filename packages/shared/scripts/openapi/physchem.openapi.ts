import { z } from 'zod';

import {
  CorrectPhysChemResultRequestSchema,
  CreatePhysChemResultsRequestSchema,
  PhysChemControlChartResponseSchema,
  PhysChemCorrectionResponseSchema,
  PhysChemResultListResponseSchema,
  PhysChemValidationResponseSchema,
  ValidatePhysChemResultsRequestSchema,
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
const secured = { security: [{ bearerAuth: [] }], tags: ['Fisicoquímico'] };
const pagination = [
  { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1 } },
  {
    name: 'pageSize',
    in: 'query',
    schema: { type: 'integer', minimum: 1, maximum: 100 },
  },
];
const uuidQuery = (name: string, required = false) => ({
  name,
  in: 'query',
  required,
  schema: { type: 'string', format: 'uuid' },
});

export const physChemPaths = {
  '/physchem/results': {
    get: {
      ...secured,
      operationId: 'listPhysChemResults',
      summary: 'Lista resultados fisicoquímicos con alcance por rol',
      parameters: [
        ...pagination,
        uuidQuery('inspectionId'),
        uuidQuery('parameterId'),
        uuidQuery('batchId'),
        {
          name: 'status',
          in: 'query',
          schema: {
            type: 'string',
            enum: ['CONFORME', 'NO_CONFORME', 'ANULADO'],
          },
        },
      ],
      responses: {
        '200': {
          description: 'Resultados accesibles.',
          content: json('PhysChemResultListResponse'),
        },
        '401': errorResponse('Sesión inválida.'),
      },
    },
    post: {
      ...secured,
      operationId: 'createPhysChemResults',
      summary:
        'Registra resultados finales y NC automáticas en una transacción',
      requestBody: {
        required: true,
        content: json('CreatePhysChemResultsRequest'),
      },
      responses: {
        '201': {
          description: 'Resultados finales registrados.',
          content: json('PhysChemResultListResponse'),
        },
        '403': errorResponse('Rol o asignación no autorizados.'),
        '409': errorResponse('Parámetro ya registrado o inspección inválida.'),
        '422': errorResponse('No existe estándar definitivo aplicable.'),
      },
    },
  },
  '/physchem/results/validate': {
    post: {
      ...secured,
      operationId: 'validatePhysChemResults',
      summary: 'Previsualiza la conformidad sin guardar datos',
      requestBody: {
        required: true,
        content: json('ValidatePhysChemResultsRequest'),
      },
      responses: {
        '200': {
          description: 'Conformidad calculada.',
          content: json('PhysChemValidationResponse'),
        },
        '403': errorResponse('Rol o asignación no autorizados.'),
        '422': errorResponse('No existe estándar definitivo aplicable.'),
      },
    },
  },
  '/physchem/results/{id}/correct': {
    post: {
      ...secured,
      operationId: 'correctPhysChemResult',
      summary: 'Anula un resultado y crea su reemplazo transaccional',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      requestBody: {
        required: true,
        content: json('CorrectPhysChemResultRequest'),
      },
      responses: {
        '201': {
          description: 'Resultado corregido sin perder historial.',
          content: json('PhysChemCorrectionResponse'),
        },
        '403': errorResponse('Rol o asignación no autorizados.'),
        '409': errorResponse('Resultado ya anulado o reemplazado.'),
        '422': errorResponse('No existe estándar definitivo aplicable.'),
      },
    },
  },
  '/physchem/history': {
    get: {
      ...secured,
      operationId: 'getPhysChemHistory',
      summary: 'Consulta histórico final por parámetro y tipo de pisco',
      parameters: [
        ...pagination,
        uuidQuery('parameterId', true),
        uuidQuery('piscoTypeId'),
      ],
      responses: {
        '200': {
          description: 'Histórico sin anulados ni datos DEMO.',
          content: json('PhysChemResultListResponse'),
        },
      },
    },
  },
  '/physchem/control-chart': {
    get: {
      ...secured,
      operationId: 'getPhysChemControlChart',
      summary: 'Calcula media y límites ±3σ con al menos ocho mediciones',
      parameters: [
        uuidQuery('parameterId', true),
        uuidQuery('piscoTypeId', true),
        uuidQuery('stageId', true),
        uuidQuery('standardId'),
        ...['dateFrom', 'dateTo'].map((name) => ({
          name,
          in: 'query',
          schema: { type: 'string', format: 'date' },
        })),
        {
          name: 'includeDemo',
          in: 'query',
          schema: { type: 'boolean', default: false },
        },
      ],
      responses: {
        '200': {
          description: 'Serie comparable y límites calculados cuando procede.',
          content: json('PhysChemControlChartResponse'),
        },
        '403': errorResponse('includeDemo requiere ADMIN o JEFE_CALIDAD.'),
      },
    },
  },
};

export const physChemSchemas = {
  ValidatePhysChemResultsRequest: schema(ValidatePhysChemResultsRequestSchema),
  CreatePhysChemResultsRequest: schema(CreatePhysChemResultsRequestSchema),
  CorrectPhysChemResultRequest: schema(CorrectPhysChemResultRequestSchema),
  PhysChemValidationResponse: schema(PhysChemValidationResponseSchema),
  PhysChemResultListResponse: schema(PhysChemResultListResponseSchema),
  PhysChemCorrectionResponse: schema(PhysChemCorrectionResponseSchema),
  PhysChemControlChartResponse: schema(PhysChemControlChartResponseSchema),
};

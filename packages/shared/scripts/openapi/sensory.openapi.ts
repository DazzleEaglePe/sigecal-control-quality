import { z } from 'zod';
import {
  CorrectSensorySessionRequestSchema,
  CreateSensorySessionRequestSchema,
  SensoryCompareResponseSchema,
  SensoryCorrectionResponseSchema,
  SensoryPanelistOptionsResponseSchema,
  SensoryPreparationResponseSchema,
  SensoryProfileResponseSchema,
  SensorySessionListResponseSchema,
  SensorySessionResponseSchema,
} from '../../src/index.js';

const schema = (value: z.ZodType): Record<string, unknown> => {
  const result: Record<string, unknown> = { ...z.toJSONSchema(value) };
  delete result.$schema;
  return result;
};
const json = (name: string) => ({
  'application/json': { schema: { $ref: `#/components/schemas/${name}` } },
});
const error = (description: string) => ({
  description,
  content: json('ApiError'),
});
const secured = { security: [{ bearerAuth: [] }], tags: ['Organoléptico'] };
const idParameter = {
  name: 'id',
  in: 'path',
  required: true,
  schema: { type: 'string', format: 'uuid' },
};
const uuidQuery = (name: string, required = false) => ({
  name,
  in: 'query',
  required,
  schema: { type: 'string', format: 'uuid' },
});
const pagination = [
  { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1 } },
  {
    name: 'pageSize',
    in: 'query',
    schema: { type: 'integer', minimum: 1, maximum: 100 },
  },
];

const sessionCollection = {
  get: {
    ...secured,
    operationId: 'listSensorySessions',
    summary: 'Lista sesiones sensoriales finales y anuladas',
    parameters: [
      ...pagination,
      uuidQuery('batchId'),
      uuidQuery('inspectionId'),
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
        description: 'Sesiones accesibles.',
        content: json('SensorySessionListResponse'),
      },
    },
  },
  post: {
    ...secured,
    operationId: 'createSensorySession',
    summary: 'Registra la matriz y calcula la conformidad en el servidor',
    requestBody: {
      required: true,
      content: json('CreateSensorySessionRequest'),
    },
    responses: {
      '201': {
        description: 'Sesión final registrada.',
        content: json('SensorySessionResponse'),
      },
      '403': error('Rol o asignación no autorizados.'),
      '422': error('Falta umbral definitivo o matriz completa.'),
    },
  },
};
const sessionDetail = {
  get: {
    ...secured,
    operationId: 'getSensorySession',
    summary: 'Obtiene panel, matriz y trazabilidad de una sesión',
    parameters: [idParameter],
    responses: {
      '200': {
        description: 'Detalle sensorial.',
        content: json('SensorySessionResponse'),
      },
      '404': error('Sesión no disponible.'),
    },
  },
};
const correction = {
  post: {
    ...secured,
    operationId: 'correctSensorySession',
    summary: 'Anula una sesión y crea su reemplazo transaccional',
    parameters: [idParameter],
    requestBody: {
      required: true,
      content: json('CorrectSensorySessionRequest'),
    },
    responses: {
      '201': {
        description: 'Versión corregida.',
        content: json('SensoryCorrectionResponse'),
      },
      '409': error('La sesión ya fue corregida.'),
      '422': error('Falta umbral definitivo.'),
    },
  },
};
const profile = {
  get: {
    ...secured,
    operationId: 'getSensoryProfile',
    summary: 'Calcula promedios por atributo para el perfil radial',
    parameters: [idParameter],
    responses: {
      '200': {
        description: 'Perfil del producto.',
        content: json('SensoryProfileResponse'),
      },
    },
  },
};

export const sensoryPaths = {
  '/sensory/sessions': sessionCollection,
  '/sensory/sessions/{id}': sessionDetail,
  '/sensory/sessions/{id}/correct': correction,
  '/sensory/sessions/{id}/profile': profile,
  '/sensory/compare': {
    get: {
      ...secured,
      operationId: 'compareSensoryProfiles',
      summary: 'Compara perfiles de producto entre sesiones',
      parameters: [
        {
          name: 'sessionIds',
          in: 'query',
          required: true,
          schema: { type: 'string' },
        },
      ],
      responses: {
        '200': {
          description: 'Perfiles comparables.',
          content: json('SensoryCompareResponse'),
        },
      },
    },
  },
  '/sensory/panelist-options': {
    get: {
      ...secured,
      operationId: 'listSensoryPanelistOptions',
      summary: 'Lista usuarios activos para trazabilidad del panel',
      responses: {
        '200': {
          description: 'Personas seleccionables sin métricas personales.',
          content: json('SensoryPanelistOptionsResponse'),
        },
      },
    },
  },
  '/sensory/preparation': {
    get: {
      ...secured,
      operationId: 'prepareSensorySession',
      summary: 'Devuelve atributos y umbral de solo lectura',
      parameters: [uuidQuery('inspectionId', true)],
      responses: {
        '200': {
          description: 'Contexto de captura.',
          content: json('SensoryPreparationResponse'),
        },
        '422': error('No existe umbral aplicable.'),
      },
    },
  },
};

export const sensorySchemas = {
  CreateSensorySessionRequest: schema(CreateSensorySessionRequestSchema),
  CorrectSensorySessionRequest: schema(CorrectSensorySessionRequestSchema),
  SensorySessionListResponse: schema(SensorySessionListResponseSchema),
  SensorySessionResponse: schema(SensorySessionResponseSchema),
  SensoryCorrectionResponse: schema(SensoryCorrectionResponseSchema),
  SensoryProfileResponse: schema(SensoryProfileResponseSchema),
  SensoryCompareResponse: schema(SensoryCompareResponseSchema),
  SensoryPanelistOptionsResponse: schema(SensoryPanelistOptionsResponseSchema),
  SensoryPreparationResponse: schema(SensoryPreparationResponseSchema),
};

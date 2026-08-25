import { z } from 'zod';

import {
  CreateSensoryThresholdRequestSchema,
  CreateStandardRequestSchema,
  SensoryThresholdListResponseSchema,
  SensoryThresholdResponseSchema,
  StandardListResponseSchema,
  StandardResponseSchema,
  UpdateStandardRequestSchema,
} from '../../src/index.js';

const schema = (value: z.ZodType): Record<string, unknown> => {
  const result: Record<string, unknown> = { ...z.toJSONSchema(value) };
  delete result.$schema;
  return result;
};
const json = (reference: string): Record<string, unknown> => ({
  'application/json': { schema: { $ref: reference } },
});
const errorResponse = (description: string): Record<string, unknown> => ({
  description,
  content: json('#/components/schemas/ApiError'),
});
const secured = { security: [{ bearerAuth: [] }] };
const idParameter = {
  name: 'id',
  in: 'path',
  required: true,
  schema: { type: 'string', format: 'uuid' },
};
const dateParameter = {
  name: 'date',
  in: 'query',
  required: true,
  schema: { type: 'string', format: 'date' },
};
const originParameter = {
  name: 'dataOrigin',
  in: 'query',
  schema: { type: 'string', enum: ['REAL', 'DEMO'], default: 'REAL' },
};

export const standardsPaths = {
  '/masters/standards': {
    get: {
      ...secured,
      operationId: 'listStandards',
      summary: 'Lista el historial de estándares de un parámetro',
      tags: ['Maestros'],
      parameters: [
        {
          name: 'parameterId',
          in: 'query',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      responses: {
        '200': {
          description: 'Historial completo.',
          content: json('#/components/schemas/StandardListResponse'),
        },
      },
    },
    post: {
      ...secured,
      operationId: 'createStandardVersion',
      summary: 'Crea una versión y cierra la anterior del mismo ámbito',
      tags: ['Maestros'],
      requestBody: {
        required: true,
        content: json('#/components/schemas/CreateStandardRequest'),
      },
      responses: {
        '201': {
          description: 'Versión creada.',
          content: json('#/components/schemas/StandardResponse'),
        },
        '400': errorResponse('Límites o fechas inválidas.'),
        '403': errorResponse('Requiere ADMIN o JEFE_CALIDAD.'),
        '409': errorResponse('Intervalo de vigencia superpuesto.'),
      },
    },
  },
  '/masters/standards/{id}': {
    patch: {
      ...secured,
      operationId: 'updateUnusedStandard',
      summary: 'Actualiza un estándar que aún no fue aplicado',
      tags: ['Maestros'],
      parameters: [idParameter],
      requestBody: {
        required: true,
        content: json('#/components/schemas/UpdateStandardRequest'),
      },
      responses: {
        '200': {
          description: 'Estándar actualizado.',
          content: json('#/components/schemas/StandardResponse'),
        },
        '404': errorResponse('Estándar inexistente.'),
        '409': errorResponse(
          'Estándar aplicado o límites resultantes inválidos.',
        ),
      },
    },
  },
  '/masters/standards/effective': {
    get: {
      ...secured,
      operationId: 'resolveEffectiveStandard',
      summary: 'Resuelve por fecha y prioridad de ámbito',
      tags: ['Maestros'],
      parameters: [
        {
          name: 'parameterId',
          in: 'query',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
        {
          name: 'piscoTypeId',
          in: 'query',
          schema: { type: 'string', format: 'uuid' },
        },
        {
          name: 'stageId',
          in: 'query',
          schema: { type: 'string', format: 'uuid' },
        },
        dateParameter,
        originParameter,
      ],
      responses: {
        '200': {
          description: 'Estándar aplicable.',
          content: json('#/components/schemas/StandardResponse'),
        },
        '422': errorResponse('No existe un estándar confirmado aplicable.'),
      },
    },
  },
  '/masters/sensory-thresholds': {
    get: {
      ...secured,
      operationId: 'listSensoryThresholds',
      summary: 'Lista el historial de umbrales sensoriales',
      tags: ['Maestros'],
      parameters: [
        {
          name: 'piscoTypeId',
          in: 'query',
          schema: { type: 'string', format: 'uuid' },
        },
        { name: 'isActive', in: 'query', schema: { type: 'boolean' } },
      ],
      responses: {
        '200': {
          description: 'Historial de umbrales.',
          content: json('#/components/schemas/SensoryThresholdListResponse'),
        },
      },
    },
    post: {
      ...secured,
      operationId: 'createSensoryThresholdVersion',
      summary: 'Crea un umbral y cierra la versión anterior',
      tags: ['Maestros'],
      requestBody: {
        required: true,
        content: json('#/components/schemas/CreateSensoryThresholdRequest'),
      },
      responses: {
        '201': {
          description: 'Umbral creado.',
          content: json('#/components/schemas/SensoryThresholdResponse'),
        },
        '409': errorResponse('Intervalo de vigencia superpuesto.'),
      },
    },
  },
  '/masters/sensory-thresholds/effective': {
    get: {
      ...secured,
      operationId: 'resolveEffectiveSensoryThreshold',
      summary: 'Resuelve el umbral sensorial por tipo y fecha',
      tags: ['Maestros'],
      parameters: [
        {
          name: 'piscoTypeId',
          in: 'query',
          schema: { type: 'string', format: 'uuid' },
        },
        dateParameter,
        originParameter,
      ],
      responses: {
        '200': {
          description: 'Umbral aplicable.',
          content: json('#/components/schemas/SensoryThresholdResponse'),
        },
        '422': errorResponse('No existe un umbral confirmado aplicable.'),
      },
    },
  },
};

export const standardsSchemas = {
  StandardResponse: schema(StandardResponseSchema),
  StandardListResponse: schema(StandardListResponseSchema),
  CreateStandardRequest: schema(CreateStandardRequestSchema),
  UpdateStandardRequest: schema(UpdateStandardRequestSchema),
  SensoryThresholdResponse: schema(SensoryThresholdResponseSchema),
  SensoryThresholdListResponse: schema(SensoryThresholdListResponseSchema),
  CreateSensoryThresholdRequest: schema(CreateSensoryThresholdRequestSchema),
};

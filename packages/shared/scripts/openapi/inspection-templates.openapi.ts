import { z } from 'zod';

import {
  CreateInspectionTemplateRequestSchema,
  InspectionTemplateListResponseSchema,
  InspectionTemplateResponseSchema,
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
const secured = { security: [{ bearerAuth: [] }], tags: ['Plantillas'] };
const idParameter = {
  name: 'id',
  in: 'path',
  required: true,
  schema: { type: 'string', format: 'uuid' },
};

export const inspectionTemplatePaths = {
  '/masters/inspection-templates': {
    get: {
      ...secured,
      operationId: 'listInspectionTemplates',
      summary: 'Lista el historial de plantillas por tipo de pisco',
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1 } },
        {
          name: 'pageSize',
          in: 'query',
          schema: { type: 'integer', minimum: 1, maximum: 100 },
        },
        { name: 'search', in: 'query', schema: { type: 'string' } },
        {
          name: 'piscoTypeId',
          in: 'query',
          schema: { type: 'string', format: 'uuid' },
        },
        { name: 'isActive', in: 'query', schema: { type: 'boolean' } },
      ],
      responses: {
        '200': {
          description: 'Plantillas versionadas.',
          content: json('InspectionTemplateListResponse'),
        },
        '401': errorResponse('Sesión inválida.'),
        '403': errorResponse('Requiere ADMIN o JEFE_CALIDAD.'),
      },
    },
    post: {
      ...secured,
      operationId: 'createInspectionTemplate',
      summary: 'Crea una plantilla versionada sin solapar vigencias',
      requestBody: {
        required: true,
        content: json('CreateInspectionTemplateRequest'),
      },
      responses: {
        '201': {
          description: 'Plantilla creada.',
          content: json('InspectionTemplateResponse'),
        },
        '400': errorResponse('Estructura de plantilla inválida.'),
        '403': errorResponse('Requiere ADMIN o JEFE_CALIDAD.'),
        '409': errorResponse('Código duplicado o vigencia solapada.'),
      },
    },
  },
  '/masters/inspection-templates/{id}/deactivate': {
    post: {
      ...secured,
      operationId: 'deactivateInspectionTemplate',
      summary: 'Desactiva una plantilla conservando su historial',
      parameters: [idParameter],
      responses: {
        '200': {
          description: 'Plantilla desactivada.',
          content: json('InspectionTemplateResponse'),
        },
        '403': errorResponse('Requiere ADMIN o JEFE_CALIDAD.'),
        '404': errorResponse('Plantilla no encontrada.'),
        '409': errorResponse('La plantilla ya estaba inactiva.'),
      },
    },
  },
};

export const inspectionTemplateSchemas = {
  CreateInspectionTemplateRequest: schema(
    CreateInspectionTemplateRequestSchema,
  ),
  InspectionTemplateResponse: schema(InspectionTemplateResponseSchema),
  InspectionTemplateListResponse: schema(InspectionTemplateListResponseSchema),
};

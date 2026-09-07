import { z } from 'zod';

import {
  AuditListResponseSchema,
  SearchResponseSchema,
} from '../../src/index.js';

const schema = (value: z.ZodType): Record<string, unknown> => {
  const result: Record<string, unknown> = { ...z.toJSONSchema(value) };
  delete result.$schema;
  return result;
};
const json = (name: string) => ({
  'application/json': { schema: { $ref: `#/components/schemas/${name}` } },
});
const secured = { security: [{ bearerAuth: [] }] };

export const discoveryPaths = {
  '/search': {
    get: {
      ...secured,
      tags: ['Búsqueda'],
      operationId: 'globalSearch',
      summary: 'Busca registros dentro del alcance del usuario',
      parameters: [
        {
          name: 'q',
          in: 'query',
          required: true,
          schema: { type: 'string', minLength: 2, maxLength: 100 },
        },
        {
          name: 'types',
          in: 'query',
          schema: { type: 'string', example: 'BATCH,INSPECTION' },
        },
        {
          name: 'limitPerType',
          in: 'query',
          schema: { type: 'integer', minimum: 1, maximum: 20, default: 8 },
        },
      ],
      responses: {
        '200': {
          description: 'Resultados accesibles agrupados.',
          content: json('SearchResponse'),
        },
        '400': { description: 'Consulta inválida.', content: json('ApiError') },
      },
    },
  },
  '/audit': {
    get: {
      ...secured,
      tags: ['Auditoría'],
      operationId: 'listAuditLog',
      summary: 'Consulta la bitácora inmutable',
      parameters: [
        {
          name: 'page',
          in: 'query',
          schema: { type: 'integer', minimum: 1, default: 1 },
        },
        {
          name: 'pageSize',
          in: 'query',
          schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
        },
        {
          name: 'userId',
          in: 'query',
          schema: { type: 'string', format: 'uuid' },
        },
        { name: 'entity', in: 'query', schema: { type: 'string' } },
        { name: 'entityId', in: 'query', schema: { type: 'string' } },
        {
          name: 'action',
          in: 'query',
          schema: {
            type: 'string',
            enum: [
              'CREATE',
              'UPDATE',
              'STATE_CHANGE',
              'LOGIN',
              'LOGOUT',
              'EXPORT',
            ],
          },
        },
        {
          name: 'dateFrom',
          in: 'query',
          schema: { type: 'string', format: 'date-time' },
        },
        {
          name: 'dateTo',
          in: 'query',
          schema: { type: 'string', format: 'date-time' },
        },
      ],
      responses: {
        '200': {
          description: 'Eventos paginados.',
          content: json('AuditListResponse'),
        },
        '403': {
          description: 'Rol sin permiso de auditoría.',
          content: json('ApiError'),
        },
      },
    },
  },
};

export const discoverySchemas = {
  SearchResponse: schema(SearchResponseSchema),
  AuditListResponse: schema(AuditListResponseSchema),
};

import { z } from 'zod';

import {
  CancelInspectionRequestSchema,
  CreateInspectionPlanRequestSchema,
  CreateInspectionRequestSchema,
  InspectionCoverageResponseSchema,
  InspectionListResponseSchema,
  InspectionPlanResponseSchema,
  InspectionResponseSchema,
  RescheduleInspectionRequestSchema,
  UpdateInspectionRequestSchema,
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
const secured = { security: [{ bearerAuth: [] }], tags: ['Inspecciones'] };
const idParameter = {
  name: 'id',
  in: 'path',
  required: true,
  schema: { type: 'string', format: 'uuid' },
};
const pagination = [
  { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1 } },
  {
    name: 'pageSize',
    in: 'query',
    schema: { type: 'integer', minimum: 1, maximum: 100 },
  },
  { name: 'search', in: 'query', schema: { type: 'string' } },
];
const listParameters = [
  ...pagination,
  ...['batchId', 'responsibleId', 'stageId'].map((name) => ({
    name,
    in: 'query',
    schema: { type: 'string', format: 'uuid' },
  })),
  {
    name: 'status',
    in: 'query',
    schema: {
      type: 'string',
      enum: [
        'PROGRAMADA',
        'EN_PROCESO',
        'COMPLETADA',
        'VENCIDA',
        'CANCELADA',
        'REPROGRAMADA',
      ],
    },
  },
  {
    name: 'type',
    in: 'query',
    schema: { type: 'string', enum: ['FISICOQUIMICO', 'ORGANOLEPTICO'] },
  },
  ...['dateFrom', 'dateTo'].map((name) => ({
    name,
    in: 'query',
    schema: { type: 'string', format: 'date-time' },
  })),
];

export const inspectionPaths = {
  '/inspections': {
    get: {
      ...secured,
      operationId: 'listInspections',
      summary: 'Lista inspecciones paginadas con alcance por rol',
      parameters: listParameters,
      responses: {
        '200': {
          description: 'Inspecciones accesibles.',
          content: json('InspectionListResponse'),
        },
        '401': errorResponse('Sesión inválida.'),
      },
    },
    post: {
      ...secured,
      operationId: 'createInspection',
      summary: 'Programa una inspección y sus parámetros esperados',
      requestBody: { required: true, content: json('CreateInspectionRequest') },
      responses: {
        '201': {
          description: 'Inspección programada.',
          content: json('InspectionResponse'),
        },
        '403': errorResponse('Requiere ADMIN o JEFE_CALIDAD.'),
        '409': errorResponse(
          'Lote, etapa, responsable o parámetros inválidos.',
        ),
      },
    },
  },
  '/inspections/calendar': {
    get: {
      ...secured,
      operationId: 'getInspectionCalendar',
      summary: 'Consulta un calendario mensual o por rango',
      parameters: [
        ...pagination,
        {
          name: 'month',
          in: 'query',
          schema: { type: 'integer', minimum: 1, maximum: 12 },
        },
        {
          name: 'year',
          in: 'query',
          schema: { type: 'integer', minimum: 2000, maximum: 2100 },
        },
        ...['dateFrom', 'dateTo'].map((name) => ({
          name,
          in: 'query',
          schema: { type: 'string', format: 'date-time' },
        })),
      ],
      responses: {
        '200': {
          description: 'Inspecciones dentro del rango.',
          content: json('InspectionListResponse'),
        },
        '400': errorResponse('Rango de calendario inválido.'),
      },
    },
  },
  '/inspections/my-pending': {
    get: {
      ...secured,
      operationId: 'listMyPendingInspections',
      summary: 'Lista inspecciones pendientes de la persona en sesión',
      parameters: pagination,
      responses: {
        '200': {
          description: 'Inspecciones asignadas pendientes.',
          content: json('InspectionListResponse'),
        },
      },
    },
  },
  '/inspections/coverage': {
    get: {
      ...secured,
      operationId: 'getInspectionCoverage',
      summary: 'Reporta etapas del lote con y sin inspección programada',
      parameters: [
        {
          name: 'batchId',
          in: 'query',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      responses: {
        '200': {
          description: 'Cobertura por etapa.',
          content: json('InspectionCoverageResponse'),
        },
        '403': errorResponse('Requiere ADMIN o JEFE_CALIDAD.'),
        '404': errorResponse('Lote no encontrado.'),
      },
    },
  },
  '/inspections/plans/from-template': {
    post: {
      ...secured,
      operationId: 'createInspectionPlanFromTemplate',
      summary: 'Genera transaccionalmente un plan desde una plantilla vigente',
      requestBody: {
        required: true,
        content: json('CreateInspectionPlanRequest'),
      },
      responses: {
        '201': {
          description: 'Plan completo generado.',
          content: json('InspectionPlanResponse'),
        },
        '403': errorResponse('Requiere ADMIN o JEFE_CALIDAD.'),
        '409': errorResponse('Plantilla no vigente o asignaciones inválidas.'),
      },
    },
  },
  '/inspections/{id}': {
    get: {
      ...secured,
      operationId: 'getInspection',
      summary: 'Obtiene detalle, parámetros y resultados registrados',
      parameters: [idParameter],
      responses: {
        '200': {
          description: 'Inspección encontrada.',
          content: json('InspectionResponse'),
        },
        '404': errorResponse('Inspección inexistente o fuera de alcance.'),
      },
    },
    patch: {
      ...secured,
      operationId: 'updateInspection',
      summary: 'Edita datos permitidos antes de iniciar la inspección',
      parameters: [idParameter],
      requestBody: { required: true, content: json('UpdateInspectionRequest') },
      responses: {
        '200': {
          description: 'Inspección actualizada.',
          content: json('InspectionResponse'),
        },
        '409': errorResponse('La inspección ya inició o es terminal.'),
      },
    },
  },
  '/inspections/{id}/reschedule': {
    post: {
      ...secured,
      operationId: 'rescheduleInspection',
      summary: 'Cierra el registro original y crea una nueva programación',
      parameters: [idParameter],
      requestBody: {
        required: true,
        content: json('RescheduleInspectionRequest'),
      },
      responses: {
        '201': {
          description: 'Nueva inspección programada.',
          content: json('InspectionResponse'),
        },
        '409': errorResponse('Transición no permitida.'),
      },
    },
  },
  '/inspections/{id}/cancel': {
    post: {
      ...secured,
      operationId: 'cancelInspection',
      summary: 'Cancela una inspección con motivo obligatorio',
      parameters: [idParameter],
      requestBody: { required: true, content: json('CancelInspectionRequest') },
      responses: {
        '200': {
          description: 'Inspección cancelada.',
          content: json('InspectionResponse'),
        },
        '409': errorResponse('Transición no permitida.'),
      },
    },
  },
  '/inspections/{id}/start': {
    post: {
      ...secured,
      operationId: 'startInspection',
      summary: 'Inicia una inspección con equipo operativo',
      parameters: [idParameter],
      responses: {
        '200': {
          description: 'Inspección iniciada.',
          content: json('InspectionResponse'),
        },
        '403': errorResponse('Rol o asignación no autorizados.'),
        '409': errorResponse('Transición no permitida.'),
        '422': errorResponse('Equipo ausente o no operativo.'),
      },
    },
  },
};

export const inspectionSchemas = {
  CreateInspectionRequest: schema(CreateInspectionRequestSchema),
  UpdateInspectionRequest: schema(UpdateInspectionRequestSchema),
  RescheduleInspectionRequest: schema(RescheduleInspectionRequestSchema),
  CancelInspectionRequest: schema(CancelInspectionRequestSchema),
  CreateInspectionPlanRequest: schema(CreateInspectionPlanRequestSchema),
  InspectionResponse: schema(InspectionResponseSchema),
  InspectionListResponse: schema(InspectionListResponseSchema),
  InspectionCoverageResponse: schema(InspectionCoverageResponseSchema),
  InspectionPlanResponse: schema(InspectionPlanResponseSchema),
};

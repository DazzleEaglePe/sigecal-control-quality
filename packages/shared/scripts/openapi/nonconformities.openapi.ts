import { z } from 'zod';
import {
  CloseNonConformityRequestSchema,
  CorrectiveActionListResponseSchema,
  CorrectiveActionResponseSchema,
  CreateActionRequestSchema,
  CreateNonConformityRequestSchema,
  NonConformityDetailResponseSchema,
  NonConformityListResponseSchema,
  UpdateActionRequestSchema,
  UpdateNonConformityRequestSchema,
  VerifyActionRequestSchema,
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
const secured = { security: [{ bearerAuth: [] }], tags: ['No conformidades'] };
const idParameter = {
  name: 'id',
  in: 'path',
  required: true,
  schema: { type: 'string', format: 'uuid' },
};
const actionIdParameter = {
  name: 'actionId',
  in: 'path',
  required: true,
  schema: { type: 'string', format: 'uuid' },
};
const uuidQuery = (name: string) => ({
  name,
  in: 'query',
  schema: { type: 'string', format: 'uuid' },
});
const pagination = [
  { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1 } },
  {
    name: 'pageSize',
    in: 'query',
    schema: { type: 'integer', minimum: 1, maximum: 100 },
  },
  { name: 'search', in: 'query', schema: { type: 'string' } },
];

const collection = {
  get: {
    ...secured,
    operationId: 'listNonConformities',
    summary: 'Lista no conformidades con filtros',
    parameters: [
      ...pagination,
      {
        name: 'status',
        in: 'query',
        schema: {
          type: 'string',
          enum: [
            'ABIERTA',
            'EN_ANALISIS',
            'EN_TRATAMIENTO',
            'EN_VERIFICACION',
            'CERRADA',
            'ANULADA',
          ],
        },
      },
      {
        name: 'severity',
        in: 'query',
        schema: { type: 'string', enum: ['LEVE', 'MODERADA', 'CRITICA'] },
      },
      uuidQuery('batchId'),
      uuidQuery('stageId'),
      uuidQuery('assignedToId'),
      uuidQuery('assignedAreaId'),
      {
        name: 'origin',
        in: 'query',
        schema: {
          type: 'string',
          enum: ['AUTOMATICA_FISICOQUIMICA', 'AUTOMATICA_SENSORIAL', 'MANUAL'],
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
        description: 'No conformidades accesibles.',
        content: json('NonConformityListResponse'),
      },
    },
  },
  post: {
    ...secured,
    operationId: 'createNonConformity',
    summary: 'Registra manualmente una no conformidad',
    requestBody: {
      required: true,
      content: json('CreateNonConformityRequest'),
    },
    responses: {
      '201': {
        description: 'No conformidad creada.',
        content: json('NonConformityDetailResponse'),
      },
      '404': error('El lote, la etapa o la persona asignada no existen.'),
    },
  },
};

const byId = {
  get: {
    ...secured,
    operationId: 'getNonConformity',
    summary: 'Detalle consolidado con acciones y tiempos calculados',
    parameters: [idParameter],
    responses: {
      '200': {
        description: 'No conformidad.',
        content: json('NonConformityDetailResponse'),
      },
      '404': error('No existe o no está a su alcance.'),
    },
  },
  patch: {
    ...secured,
    operationId: 'updateNonConformity',
    summary: 'Actualiza descripción, severidad, causa raíz o asignación',
    parameters: [idParameter],
    requestBody: {
      required: true,
      content: json('UpdateNonConformityRequest'),
    },
    responses: {
      '200': {
        description: 'No conformidad actualizada.',
        content: json('NonConformityDetailResponse'),
      },
      '409': error('La no conformidad está cerrada o anulada.'),
    },
  },
};

const startAttention = {
  post: {
    ...secured,
    operationId: 'startNonConformityAttention',
    summary: 'Registra el inicio de atención',
    parameters: [idParameter],
    responses: {
      '200': {
        description: 'No conformidad en tratamiento.',
        content: json('NonConformityDetailResponse'),
      },
      '409': error('La transición no está permitida.'),
    },
  },
};

const close = {
  post: {
    ...secured,
    operationId: 'closeNonConformity',
    summary: 'Cierra la no conformidad; restringido a Jefatura de Calidad',
    parameters: [idParameter],
    requestBody: {
      required: false,
      content: json('CloseNonConformityRequest'),
    },
    responses: {
      '200': {
        description: 'No conformidad cerrada.',
        content: json('NonConformityDetailResponse'),
      },
      '409': error('Existen acciones sin verificar o ya está cerrada.'),
    },
  },
};

const actionCollection = {
  get: {
    ...secured,
    operationId: 'listCorrectiveActions',
    summary: 'Acciones de la no conformidad',
    parameters: [idParameter],
    responses: {
      '200': {
        description: 'Acciones registradas.',
        content: json('CorrectiveActionListResponse'),
      },
    },
  },
  post: {
    ...secured,
    operationId: 'createCorrectiveAction',
    summary: 'Registra una acción de corrección, correctiva o preventiva',
    parameters: [idParameter],
    requestBody: { required: true, content: json('CreateActionRequest') },
    responses: {
      '201': {
        description: 'Acción creada.',
        content: json('CorrectiveActionResponse'),
      },
      '404': error(
        'La no conformidad no existe o el responsable no está activo.',
      ),
    },
  },
};

const actionById = {
  patch: {
    ...secured,
    operationId: 'updateCorrectiveAction',
    summary: 'Actualiza una acción mientras está pendiente',
    parameters: [actionIdParameter],
    requestBody: { required: true, content: json('UpdateActionRequest') },
    responses: {
      '200': {
        description: 'Acción actualizada.',
        content: json('CorrectiveActionResponse'),
      },
      '409': error('Solo se puede editar una acción pendiente.'),
    },
  },
};

const executeAction = {
  post: {
    ...secured,
    operationId: 'executeCorrectiveAction',
    summary: 'Registra la ejecución con su fecha real',
    parameters: [actionIdParameter],
    responses: {
      '200': {
        description: 'Acción ejecutada.',
        content: json('CorrectiveActionResponse'),
      },
      '409': error('La acción no está pendiente ni en ejecución.'),
    },
  },
};

const verifyAction = {
  post: {
    ...secured,
    operationId: 'verifyCorrectiveAction',
    summary: 'Verifica la eficacia; el verificador no puede ser el responsable',
    parameters: [actionIdParameter],
    requestBody: { required: true, content: json('VerifyActionRequest') },
    responses: {
      '200': {
        description: 'Acción verificada.',
        content: json('CorrectiveActionResponse'),
      },
      '409': error(
        'La acción no fue ejecutada o el verificador coincide con el responsable.',
      ),
    },
  },
};

export const nonConformityPaths = {
  '/nonconformities': collection,
  '/nonconformities/{id}': byId,
  '/nonconformities/{id}/start-attention': startAttention,
  '/nonconformities/{id}/close': close,
  '/nonconformities/{id}/actions': actionCollection,
  '/nonconformities/actions/{actionId}': actionById,
  '/nonconformities/actions/{actionId}/execute': executeAction,
  '/nonconformities/actions/{actionId}/verify': verifyAction,
};

export const nonConformitySchemas = {
  CreateNonConformityRequest: schema(CreateNonConformityRequestSchema),
  UpdateNonConformityRequest: schema(UpdateNonConformityRequestSchema),
  CloseNonConformityRequest: schema(CloseNonConformityRequestSchema),
  CreateActionRequest: schema(CreateActionRequestSchema),
  UpdateActionRequest: schema(UpdateActionRequestSchema),
  VerifyActionRequest: schema(VerifyActionRequestSchema),
  NonConformityListResponse: schema(NonConformityListResponseSchema),
  NonConformityDetailResponse: schema(NonConformityDetailResponseSchema),
  CorrectiveActionResponse: schema(CorrectiveActionResponseSchema),
  CorrectiveActionListResponse: schema(CorrectiveActionListResponseSchema),
};

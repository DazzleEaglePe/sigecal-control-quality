import { z } from 'zod';

import {
  CreateEquipmentRequestSchema,
  CreateGrapeVarietyRequestSchema,
  CreateParameterRequestSchema,
  CreatePiscoTypeRequestSchema,
  CreateProcessStageRequestSchema,
  CreateSensoryAttributeRequestSchema,
  EquipmentListResponseSchema,
  EquipmentResponseSchema,
  GrapeVarietyListResponseSchema,
  GrapeVarietyResponseSchema,
  ParameterListResponseSchema,
  ParameterResponseSchema,
  PiscoTypeListResponseSchema,
  PiscoTypeResponseSchema,
  ProcessStageListResponseSchema,
  ProcessStageResponseSchema,
  SensoryAttributeListResponseSchema,
  SensoryAttributeResponseSchema,
  UpdateEquipmentRequestSchema,
  UpdateGrapeVarietyRequestSchema,
  UpdateParameterRequestSchema,
  UpdatePiscoTypeRequestSchema,
  UpdateProcessStageRequestSchema,
  UpdateSensoryAttributeRequestSchema,
} from '../../src/index.js';

const schema = (value: z.ZodType): Record<string, unknown> => {
  const result: Record<string, unknown> = { ...z.toJSONSchema(value) };
  delete result.$schema;
  return result;
};
const json = (name: string): Record<string, unknown> => ({
  'application/json': { schema: { $ref: `#/components/schemas/${name}` } },
});
const secured = { security: [{ bearerAuth: [] }], tags: ['Maestros'] };
const errorResponse = (description: string): Record<string, unknown> => ({
  description,
  content: json('ApiError'),
});

const configs = [
  ['varieties', 'Variedad de uva', 'GrapeVariety'],
  ['pisco-types', 'Tipo de pisco', 'PiscoType'],
  ['stages', 'Etapa del proceso', 'ProcessStage'],
  ['equipment', 'Instrumento de laboratorio', 'Equipment'],
  ['sensory-attributes', 'Atributo sensorial', 'SensoryAttribute'],
  ['parameters', 'Parámetro de calidad', 'Parameter'],
] as const;

const collectionPath = (label: string, name: string) => ({
  get: {
    ...secured,
    operationId: `list${name}`,
    summary: `Lista ${label.toLowerCase()}`,
    parameters: [
      { name: 'isActive', in: 'query', schema: { type: 'boolean' } },
    ],
    responses: {
      '200': {
        description: 'Catálogo disponible.',
        content: json(`${name}ListResponse`),
      },
    },
  },
  post: {
    ...secured,
    operationId: `create${name}`,
    summary: `Crea ${label.toLowerCase()}`,
    requestBody: { required: true, content: json(`Create${name}Request`) },
    responses: {
      '201': {
        description: 'Elemento creado.',
        content: json(`${name}Response`),
      },
      '403': errorResponse('Requiere ADMIN o JEFE_CALIDAD.'),
      '409': errorResponse('Código u orden duplicado.'),
    },
  },
});

const itemPath = (label: string, name: string) => ({
  patch: {
    ...secured,
    operationId: `update${name}`,
    summary: `Actualiza o desactiva ${label.toLowerCase()}`,
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'uuid' },
      },
    ],
    requestBody: { required: true, content: json(`Update${name}Request`) },
    responses: {
      '200': {
        description: 'Elemento actualizado.',
        content: json(`${name}Response`),
      },
      '404': errorResponse('Elemento inexistente.'),
      '409': errorResponse('Código u orden duplicado.'),
    },
  },
});

export const catalogPaths: Record<string, unknown> = {};
for (const [path, label, name] of configs) {
  catalogPaths[`/masters/${path}`] = collectionPath(label, name);
  catalogPaths[`/masters/${path}/{id}`] = itemPath(label, name);
}

export const catalogSchemas = {
  GrapeVarietyResponse: schema(GrapeVarietyResponseSchema),
  GrapeVarietyListResponse: schema(GrapeVarietyListResponseSchema),
  CreateGrapeVarietyRequest: schema(CreateGrapeVarietyRequestSchema),
  UpdateGrapeVarietyRequest: schema(UpdateGrapeVarietyRequestSchema),
  PiscoTypeResponse: schema(PiscoTypeResponseSchema),
  PiscoTypeListResponse: schema(PiscoTypeListResponseSchema),
  CreatePiscoTypeRequest: schema(CreatePiscoTypeRequestSchema),
  UpdatePiscoTypeRequest: schema(UpdatePiscoTypeRequestSchema),
  ProcessStageResponse: schema(ProcessStageResponseSchema),
  ProcessStageListResponse: schema(ProcessStageListResponseSchema),
  CreateProcessStageRequest: schema(CreateProcessStageRequestSchema),
  UpdateProcessStageRequest: schema(UpdateProcessStageRequestSchema),
  EquipmentResponse: schema(EquipmentResponseSchema),
  EquipmentListResponse: schema(EquipmentListResponseSchema),
  CreateEquipmentRequest: schema(CreateEquipmentRequestSchema),
  UpdateEquipmentRequest: schema(UpdateEquipmentRequestSchema),
  SensoryAttributeResponse: schema(SensoryAttributeResponseSchema),
  SensoryAttributeListResponse: schema(SensoryAttributeListResponseSchema),
  CreateSensoryAttributeRequest: schema(CreateSensoryAttributeRequestSchema),
  UpdateSensoryAttributeRequest: schema(UpdateSensoryAttributeRequestSchema),
  ParameterResponse: schema(ParameterResponseSchema),
  ParameterListResponse: schema(ParameterListResponseSchema),
  CreateParameterRequest: schema(CreateParameterRequestSchema),
  UpdateParameterRequest: schema(UpdateParameterRequestSchema),
};

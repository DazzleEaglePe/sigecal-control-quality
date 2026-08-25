import { z } from 'zod';

import {
  AreaListResponseSchema,
  AreaResponseSchema,
  CreateAreaRequestSchema,
  CreateUserRequestSchema,
  ResetUserPasswordRequestSchema,
  UpdateAreaRequestSchema,
  UpdateUserRequestSchema,
  UpdateUserStatusRequestSchema,
  UserListResponseSchema,
  UserResponseSchema,
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

export const adminPaths = {
  '/users': {
    get: {
      ...secured,
      operationId: 'listUsers',
      summary: 'Lista usuarios con filtros y paginación',
      tags: ['Usuarios'],
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1 } },
        {
          name: 'pageSize',
          in: 'query',
          schema: { type: 'integer', minimum: 1, maximum: 100 },
        },
        {
          name: 'role',
          in: 'query',
          schema: {
            type: 'string',
            enum: ['ADMIN', 'JEFE_CALIDAD', 'ANALISTA', 'OPERARIO'],
          },
        },
        { name: 'isActive', in: 'query', schema: { type: 'boolean' } },
      ],
      responses: {
        '200': {
          description: 'Usuarios paginados.',
          content: json('#/components/schemas/UserListResponse'),
        },
        '401': errorResponse('Sesión inválida.'),
        '403': errorResponse('Acceso exclusivo de ADMIN.'),
      },
    },
    post: {
      ...secured,
      operationId: 'createUser',
      summary: 'Crea un usuario con contraseña provisional',
      tags: ['Usuarios'],
      requestBody: {
        required: true,
        content: json('#/components/schemas/CreateUserRequest'),
      },
      responses: {
        '201': {
          description: 'Usuario creado.',
          content: json('#/components/schemas/UserResponse'),
        },
        '400': errorResponse('Solicitud inválida.'),
        '401': errorResponse('Sesión inválida.'),
        '403': errorResponse('Acceso exclusivo de ADMIN.'),
        '409': errorResponse('Correo o área no disponible.'),
      },
    },
  },
  '/users/{id}': {
    get: {
      ...secured,
      operationId: 'getUser',
      summary: 'Obtiene el detalle de un usuario',
      tags: ['Usuarios'],
      parameters: [idParameter],
      responses: {
        '200': {
          description: 'Usuario encontrado.',
          content: json('#/components/schemas/UserResponse'),
        },
        '404': errorResponse('Usuario inexistente.'),
      },
    },
    patch: {
      ...secured,
      operationId: 'updateUser',
      summary: 'Actualiza datos y rol de un usuario',
      tags: ['Usuarios'],
      parameters: [idParameter],
      requestBody: {
        required: true,
        content: json('#/components/schemas/UpdateUserRequest'),
      },
      responses: {
        '200': {
          description: 'Usuario actualizado.',
          content: json('#/components/schemas/UserResponse'),
        },
        '400': errorResponse('Solicitud inválida.'),
        '404': errorResponse('Usuario inexistente.'),
        '409': errorResponse('Correo o área no disponible.'),
      },
    },
  },
  '/users/{id}/status': {
    patch: {
      ...secured,
      operationId: 'setUserStatus',
      summary: 'Activa o desactiva un usuario sin eliminarlo',
      tags: ['Usuarios'],
      parameters: [idParameter],
      requestBody: {
        required: true,
        content: json('#/components/schemas/UpdateUserStatusRequest'),
      },
      responses: {
        '200': {
          description: 'Estado actualizado y sesiones revocadas al desactivar.',
          content: json('#/components/schemas/UserResponse'),
        },
        '409': errorResponse('No se permite la autodesactivación.'),
      },
    },
  },
  '/users/{id}/reset-password': {
    post: {
      ...secured,
      operationId: 'resetUserPassword',
      summary: 'Asigna una contraseña provisional y revoca sesiones',
      tags: ['Usuarios'],
      parameters: [idParameter],
      requestBody: {
        required: true,
        content: json('#/components/schemas/ResetUserPasswordRequest'),
      },
      responses: {
        '204': { description: 'Contraseña restablecida.' },
        '404': errorResponse('Usuario inexistente.'),
      },
    },
  },
  '/masters/areas': {
    get: {
      ...secured,
      operationId: 'listAreas',
      summary: 'Lista el catálogo mínimo de áreas',
      tags: ['Maestros'],
      parameters: [
        { name: 'isActive', in: 'query', schema: { type: 'boolean' } },
      ],
      responses: {
        '200': {
          description: 'Áreas disponibles.',
          content: json('#/components/schemas/AreaListResponse'),
        },
      },
    },
    post: {
      ...secured,
      operationId: 'createArea',
      summary: 'Crea un área organizacional',
      tags: ['Maestros'],
      requestBody: {
        required: true,
        content: json('#/components/schemas/CreateAreaRequest'),
      },
      responses: {
        '201': {
          description: 'Área creada.',
          content: json('#/components/schemas/AreaResponse'),
        },
        '403': errorResponse('Requiere ADMIN o JEFE_CALIDAD.'),
        '409': errorResponse('Código duplicado.'),
      },
    },
  },
  '/masters/areas/{id}': {
    patch: {
      ...secured,
      operationId: 'updateArea',
      summary: 'Actualiza o desactiva un área',
      tags: ['Maestros'],
      parameters: [idParameter],
      requestBody: {
        required: true,
        content: json('#/components/schemas/UpdateAreaRequest'),
      },
      responses: {
        '200': {
          description: 'Área actualizada.',
          content: json('#/components/schemas/AreaResponse'),
        },
        '404': errorResponse('Área inexistente.'),
        '409': errorResponse('Área en uso o código duplicado.'),
      },
    },
  },
};

export const adminSchemas = {
  UserResponse: schema(UserResponseSchema),
  UserListResponse: schema(UserListResponseSchema),
  CreateUserRequest: schema(CreateUserRequestSchema),
  UpdateUserRequest: schema(UpdateUserRequestSchema),
  UpdateUserStatusRequest: schema(UpdateUserStatusRequestSchema),
  ResetUserPasswordRequest: schema(ResetUserPasswordRequestSchema),
  AreaResponse: schema(AreaResponseSchema),
  AreaListResponse: schema(AreaListResponseSchema),
  CreateAreaRequest: schema(CreateAreaRequestSchema),
  UpdateAreaRequest: schema(UpdateAreaRequestSchema),
};

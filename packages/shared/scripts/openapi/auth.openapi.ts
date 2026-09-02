import { z } from 'zod';

import {
  AccountEmailRequestSchema,
  AccountTokenPasswordRequestSchema,
  ChangePasswordRequestSchema,
  LoginRequestSchema,
  LoginResponseSchema,
  MeResponseSchema,
  MessageResponseSchema,
  RefreshResponseSchema,
  UserSessionSchema,
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

export const authPaths = {
  '/auth/login': {
    post: {
      operationId: 'login',
      summary: 'Inicia sesión y establece la cookie de refresco',
      tags: ['Autenticación'],
      requestBody: {
        required: true,
        content: json('#/components/schemas/LoginRequest'),
      },
      responses: {
        '200': {
          description: 'Sesión iniciada.',
          content: json('#/components/schemas/LoginResponse'),
        },
        '400': errorResponse('Solicitud inválida.'),
        '401': errorResponse('Credenciales inválidas.'),
        '423': errorResponse('Cuenta bloqueada temporalmente.'),
        '429': errorResponse('Demasiados intentos.'),
      },
    },
  },
  '/auth/refresh': {
    post: {
      operationId: 'refreshSession',
      summary: 'Rota el token de refresco y renueva el acceso',
      tags: ['Autenticación'],
      security: [{ refreshCookie: [] }],
      responses: {
        '200': {
          description: 'Token renovado.',
          content: json('#/components/schemas/RefreshResponse'),
        },
        '401': errorResponse('Token de refresco inválido o vencido.'),
      },
    },
  },
  '/auth/logout': {
    post: {
      operationId: 'logout',
      summary: 'Revoca el token de refresco y limpia la cookie',
      tags: ['Autenticación'],
      security: [{ bearerAuth: [] }],
      responses: {
        '204': { description: 'Sesión cerrada.' },
        '401': errorResponse('La sesión no es válida.'),
      },
    },
  },
  '/auth/me': {
    get: {
      operationId: 'getCurrentSession',
      summary: 'Devuelve el usuario y sus permisos efectivos',
      tags: ['Autenticación'],
      security: [{ bearerAuth: [] }],
      responses: {
        '200': {
          description: 'Sesión actual.',
          content: json('#/components/schemas/MeResponse'),
        },
        '401': errorResponse('La sesión no es válida.'),
      },
    },
  },
  '/auth/password': {
    patch: {
      operationId: 'changeOwnPassword',
      summary: 'Cambia la contraseña del usuario actual',
      tags: ['Autenticación'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: json('#/components/schemas/ChangePasswordRequest'),
      },
      responses: {
        '204': { description: 'Contraseña cambiada y sesiones revocadas.' },
        '400': errorResponse('Solicitud inválida.'),
        '401': errorResponse('La sesión o contraseña actual no es válida.'),
      },
    },
  },
  '/auth/forgot-password': {
    post: {
      operationId: 'requestPasswordReset',
      summary: 'Solicita recuperación sin revelar si la cuenta existe',
      tags: ['Autenticación'],
      requestBody: {
        required: true,
        content: json('#/components/schemas/AccountEmailRequest'),
      },
      responses: {
        '202': {
          description: 'Solicitud procesada con respuesta genérica.',
          content: json('#/components/schemas/MessageResponse'),
        },
        '400': errorResponse('Correo inválido.'),
        '429': errorResponse('Demasiadas solicitudes.'),
      },
    },
  },
  '/auth/activate': {
    post: {
      operationId: 'activateAccount',
      summary: 'Activa la cuenta y define la primera contraseña',
      tags: ['Autenticación'],
      requestBody: {
        required: true,
        content: json('#/components/schemas/AccountTokenPasswordRequest'),
      },
      responses: {
        '204': { description: 'Cuenta activada.' },
        '400': errorResponse('Token inválido, consumido o vencido.'),
        '429': errorResponse('Demasiadas solicitudes.'),
      },
    },
  },
  '/auth/reset-password': {
    post: {
      operationId: 'completePasswordReset',
      summary: 'Restablece la contraseña mediante un token temporal',
      tags: ['Autenticación'],
      requestBody: {
        required: true,
        content: json('#/components/schemas/AccountTokenPasswordRequest'),
      },
      responses: {
        '204': { description: 'Contraseña restablecida.' },
        '400': errorResponse('Token inválido, consumido o vencido.'),
        '429': errorResponse('Demasiadas solicitudes.'),
      },
    },
  },
};

export const authSchemas = {
  LoginRequest: schema(LoginRequestSchema),
  LoginResponse: schema(LoginResponseSchema),
  RefreshResponse: schema(RefreshResponseSchema),
  MeResponse: schema(MeResponseSchema),
  UserSession: schema(UserSessionSchema),
  ChangePasswordRequest: schema(ChangePasswordRequestSchema),
  AccountEmailRequest: schema(AccountEmailRequestSchema),
  AccountTokenPasswordRequest: schema(AccountTokenPasswordRequestSchema),
  MessageResponse: schema(MessageResponseSchema),
};

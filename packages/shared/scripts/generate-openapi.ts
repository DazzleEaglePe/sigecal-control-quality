import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { format, resolveConfig } from 'prettier';
import YAML from 'yaml';
import { z } from 'zod';

import {
  ApiErrorSchema,
  DatabaseUnavailableErrorResponseSchema,
  HealthResponseSchema,
} from '../src/index.js';
import { authPaths, authSchemas } from './openapi/auth.openapi.js';
import { adminPaths, adminSchemas } from './openapi/admin.openapi.js';
import { batchPaths, batchSchemas } from './openapi/batches.openapi.js';
import {
  standardsPaths,
  standardsSchemas,
} from './openapi/standards.openapi.js';
import { catalogPaths, catalogSchemas } from './openapi/catalogs.openapi.js';

const outputPath = fileURLToPath(
  new URL('../../../docs/openapi.yaml', import.meta.url),
);

const toOpenApiSchema = (schema: z.ZodType): Record<string, unknown> => {
  const openApiSchema: Record<string, unknown> = { ...z.toJSONSchema(schema) };
  delete openApiSchema.$schema;
  return openApiSchema;
};

const document = {
  openapi: '3.1.0',
  info: {
    title: 'SIGECAL API',
    version: '0.1.0',
    description:
      'Contrato ejecutable del Sistema de Gestión de Control de Calidad.',
  },
  servers: [
    {
      url: 'http://localhost:3000/api/v1',
      description: 'Desarrollo local',
    },
  ],
  tags: [
    {
      name: 'Estado',
      description: 'Disponibilidad de la API y sus dependencias.',
    },
    {
      name: 'Autenticación',
      description: 'Inicio, renovación y cierre seguro de sesión.',
    },
    { name: 'Usuarios', description: 'Administración de cuentas y roles.' },
    { name: 'Maestros', description: 'Catálogos configurables del sistema.' },
    {
      name: 'Lotes',
      description: 'Ciclo de vida y trazabilidad de lotes productivos.',
    },
  ],
  paths: {
    '/health': {
      get: {
        operationId: 'getHealth',
        summary: 'Comprueba la API y la conexión con PostgreSQL',
        tags: ['Estado'],
        responses: {
          '200': {
            description: 'La API y PostgreSQL están disponibles.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthResponse' },
                example: {
                  success: true,
                  data: {
                    status: 'ok',
                    database: 'connected',
                    timestamp: '2026-09-01T15:00:00.000Z',
                  },
                },
              },
            },
          },
          '503': {
            description: 'PostgreSQL no está disponible.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/DatabaseUnavailableErrorResponse',
                },
                example: {
                  success: false,
                  error: {
                    code: 'DATABASE_UNAVAILABLE',
                    message: 'El servicio no está disponible temporalmente.',
                    details: [],
                  },
                },
              },
            },
          },
        },
      },
    },
    ...authPaths,
    ...adminPaths,
    ...standardsPaths,
    ...catalogPaths,
    ...batchPaths,
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      refreshCookie: {
        type: 'apiKey',
        in: 'cookie',
        name: 'sigecal_refresh',
      },
    },
    schemas: {
      ApiError: toOpenApiSchema(ApiErrorSchema),
      HealthResponse: toOpenApiSchema(HealthResponseSchema),
      DatabaseUnavailableErrorResponse: toOpenApiSchema(
        DatabaseUnavailableErrorResponseSchema,
      ),
      ...authSchemas,
      ...adminSchemas,
      ...standardsSchemas,
      ...catalogSchemas,
      ...batchSchemas,
    },
  },
};

const yaml = YAML.stringify(document, { lineWidth: 0 });
const prettierConfig = await resolveConfig(outputPath);
const formattedYaml = await format(yaml, {
  ...(prettierConfig ?? {}),
  filepath: outputPath,
});

await writeFile(outputPath, formattedYaml, 'utf8');
process.stdout.write(`OpenAPI generado en ${outputPath}\n`);

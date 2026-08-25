import { describe, expect, it } from 'vitest';

import {
  CreateAreaRequestSchema,
  CreateUserRequestSchema,
  UpdateUserRequestSchema,
  UserListQuerySchema,
} from './admin.schemas.js';

describe('contratos de escritura administrativa', () => {
  it('normaliza correo, nombres y código de área sin aceptar campos extra', () => {
    const area = CreateAreaRequestSchema.parse({
      code: 'calidad',
      name: ' Calidad ',
    });
    expect(area).toEqual({
      code: 'CALIDAD',
      name: 'Calidad',
      isProvisional: true,
    });
    expect(
      CreateUserRequestSchema.safeParse({
        firstName: 'Ana',
        lastName: 'Paz',
        email: 'ana@example.com',
        role: 'ANALISTA',
        areaId: '11111111-1111-4111-a111-111111111111',
        temporaryPassword: 'Temporal1',
        passwordHash: 'prohibido',
      }).success,
    ).toBe(false);
  });

  it('rechaza actualizaciones vacías y contraseñas provisionales débiles', () => {
    expect(UpdateUserRequestSchema.safeParse({}).success).toBe(false);
    expect(
      CreateUserRequestSchema.safeParse({
        firstName: 'Ana',
        lastName: 'Paz',
        email: 'ana@example.com',
        role: 'ANALISTA',
        areaId: '11111111-1111-4111-a111-111111111111',
        temporaryPassword: 'debil',
      }).success,
    ).toBe(false);
  });
});

describe('contratos de consulta administrativa', () => {
  it('aplica paginación segura y filtros tipados', () => {
    expect(
      UserListQuerySchema.parse({ role: 'ADMIN', isActive: 'true' }),
    ).toMatchObject({
      page: 1,
      pageSize: 20,
      role: 'ADMIN',
      isActive: true,
    });
  });
});

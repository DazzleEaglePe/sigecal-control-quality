import { describe, expect, it } from 'vitest';

import {
  ChangePasswordRequestSchema,
  LoginRequestSchema,
  UserSessionSchema,
} from './auth.schemas.js';

describe('contratos de autenticación', () => {
  it('valida el correo sin modificar la contraseña', () => {
    const result = LoginRequestSchema.parse({
      email: 'admin@sigecal.pe',
      password: ' Clave123 ',
    });
    expect(result).toEqual({
      email: 'admin@sigecal.pe',
      password: ' Clave123 ',
    });
  });

  it('exige una contraseña nueva con letra y número', () => {
    expect(
      ChangePasswordRequestSchema.safeParse({
        currentPassword: 'Temporal1',
        newPassword: 'solo-letras',
      }).success,
    ).toBe(false);
  });

  it('impide exponer campos internos del usuario', () => {
    const result = UserSessionSchema.safeParse({
      id: '7c144130-4d4d-4ea5-8b48-f0ff11d32871',
      firstName: 'Administrador',
      lastName: 'SIGECAL',
      email: 'admin@sigecal.pe',
      role: 'ADMIN',
      mustChangePassword: true,
      permissions: ['USERS_MANAGE'],
      passwordHash: 'no-debe-salir',
    });
    expect(result.success).toBe(false);
  });
});

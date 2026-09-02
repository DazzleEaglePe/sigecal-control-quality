import { Role } from '../../src/generated/prisma/enums.js';
import { seedId } from './helpers.js';
import type { SeedEnvironment, SeedTransaction } from './types.js';

const DEMO_USERS = [
  {
    role: Role.ADMIN,
    email: 'ADMIN_EMAIL',
    firstName: 'Administrador',
    lastName: 'SIGECAL',
    areaCode: 'CALIDAD',
    position: 'Administrador del sistema',
  },
  {
    role: Role.JEFE_CALIDAD,
    email: 'jefe.calidad@sigecal.demo',
    firstName: 'Jefatura',
    lastName: 'Calidad',
    areaCode: 'CALIDAD',
    position: 'Jefe de Calidad',
  },
  {
    role: Role.ANALISTA,
    email: 'analista@sigecal.demo',
    firstName: 'Analista',
    lastName: 'Laboratorio',
    areaCode: 'LABORATORIO',
    position: 'Analista de laboratorio',
  },
  {
    role: Role.OPERARIO,
    email: 'operario@sigecal.demo',
    firstName: 'Operario',
    lastName: 'Producción',
    areaCode: 'PRODUCCION',
    position: 'Operario de producción',
  },
] as const;

export const seedUsers = async (
  tx: SeedTransaction,
  environment: SeedEnvironment,
): Promise<void> => {
  for (const definition of DEMO_USERS) {
    const email =
      definition.email === 'ADMIN_EMAIL'
        ? environment.adminEmail
        : definition.email;
    await tx.user.upsert({
      where: { email },
      create: {
        id: seedId(`user:${definition.role}`),
        email,
        firstName: definition.firstName,
        lastName: definition.lastName,
        passwordHash: environment.passwordHash,
        role: definition.role,
        areaId: seedId(`area:${definition.areaCode}`),
        position: definition.position,
        mustChangePassword: true,
        emailVerifiedAt: new Date('2026-08-24T00:00:00.000Z'),
      },
      update: {
        firstName: definition.firstName,
        lastName: definition.lastName,
        role: definition.role,
        areaId: seedId(`area:${definition.areaCode}`),
        position: definition.position,
        isActive: true,
        emailVerifiedAt: new Date('2026-08-24T00:00:00.000Z'),
      },
    });
  }
};

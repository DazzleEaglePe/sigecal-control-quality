import { describe, expect, it, vi } from 'vitest';

import type { Prisma, PrismaClient } from '../../generated/prisma/client.js';
import { InspectionRepository } from './inspections.repository.js';
import { IDS } from './inspections.test-helpers.js';

describe('alcance del repositorio de inspecciones', () => {
  it('aplica pertenencia de OPERARIO antes del conteo y la paginación', async () => {
    const count = vi.fn().mockResolvedValue(0);
    const findMany = vi.fn().mockResolvedValue([]);
    const repository = new InspectionRepository({
      inspection: { count, findMany },
    } as unknown as PrismaClient);
    await repository.list(
      { page: 1, pageSize: 20 },
      { userId: IDS.user, role: 'OPERARIO' },
    );
    const countCall = count.mock.calls[0]?.[0] as
      { readonly where?: Prisma.InspectionWhereInput } | undefined;
    expect(countCall?.where?.AND).toContainEqual({
      OR: [{ responsibleId: IDS.user }, { createdById: IDS.user }],
    });
    expect(findMany).toHaveBeenCalledOnce();
  });
});

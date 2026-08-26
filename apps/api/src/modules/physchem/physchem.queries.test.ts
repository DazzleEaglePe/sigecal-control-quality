import { describe, expect, it, vi } from 'vitest';

import type { Prisma, PrismaClient } from '../../generated/prisma/client.js';
import { controlChartWhere } from './physchem.queries.js';
import { PhysChemRepository } from './physchem.repository.js';
import { IDS } from './physchem.test-helpers.js';

describe('filtros de lecturas fisicoquímicas', () => {
  it('excluye anulados y DEMO del gráfico por defecto', () => {
    const where = controlChartWhere(
      {
        parameterId: IDS.parameter,
        piscoTypeId: IDS.piscoType,
        stageId: IDS.stage,
        includeDemo: false,
      },
      { userId: IDS.user, role: 'JEFE_CALIDAD' },
    );
    expect(where).toMatchObject({
      status: { not: 'ANULADO' },
      dataOrigin: 'REAL',
    });
  });

  it('excluye anulados y DEMO del histórico paginado', async () => {
    const count = vi.fn().mockResolvedValue(0);
    const repository = new PhysChemRepository({
      physChemResult: { count, findMany: vi.fn().mockResolvedValue([]) },
    } as unknown as PrismaClient);
    await repository.history(
      { page: 1, pageSize: 20, parameterId: IDS.parameter },
      { userId: IDS.user, role: 'JEFE_CALIDAD' },
    );
    const call = count.mock.calls[0]?.[0] as
      { readonly where?: Prisma.PhysChemResultWhereInput } | undefined;
    expect(call?.where).toMatchObject({
      parameterId: IDS.parameter,
      status: { not: 'ANULADO' },
      dataOrigin: 'REAL',
    });
  });
});

import { Role } from '@sigecal/shared';
import type {
  PhysChemControlChartQuery,
  PhysChemResultListQuery,
} from '@sigecal/shared';

import type { Prisma } from '../../generated/prisma/client.js';
import type { PhysChemActor } from './physchem.types.js';

export const resultAccessWhere = (
  actor: PhysChemActor,
): Prisma.PhysChemResultWhereInput =>
  actor.role === Role.OPERARIO
    ? {
        inspection: {
          OR: [{ responsibleId: actor.userId }, { createdById: actor.userId }],
        },
      }
    : {};

export const inspectionAccessWhere = (
  actor: PhysChemActor,
): Prisma.InspectionWhereInput =>
  actor.role === Role.OPERARIO
    ? { OR: [{ responsibleId: actor.userId }, { createdById: actor.userId }] }
    : {};

export const resultListWhere = (
  query: PhysChemResultListQuery,
  actor: PhysChemActor,
): Prisma.PhysChemResultWhereInput => ({
  ...(query.inspectionId ? { inspectionId: query.inspectionId } : {}),
  ...(query.parameterId ? { parameterId: query.parameterId } : {}),
  ...(query.batchId ? { inspection: { batchId: query.batchId } } : {}),
  ...(query.status ? { status: query.status } : {}),
  AND: [resultAccessWhere(actor)],
});

const chartDateWhere = (
  query: PhysChemControlChartQuery,
): Prisma.DateTimeFilter<'PhysChemResult'> | undefined =>
  query.dateFrom || query.dateTo
    ? {
        ...(query.dateFrom
          ? { gte: new Date(`${query.dateFrom}T00:00:00.000Z`) }
          : {}),
        ...(query.dateTo
          ? { lte: new Date(`${query.dateTo}T23:59:59.999Z`) }
          : {}),
      }
    : undefined;

export const controlChartWhere = (
  query: PhysChemControlChartQuery,
  actor: PhysChemActor,
): Prisma.PhysChemResultWhereInput => {
  const recordedAt = chartDateWhere(query);
  return {
    parameterId: query.parameterId,
    status: { not: 'ANULADO' },
    ...(query.includeDemo ? {} : { dataOrigin: 'REAL' }),
    ...(query.standardId ? { standardId: query.standardId } : {}),
    ...(recordedAt ? { recordedAt } : {}),
    inspection: {
      stageId: query.stageId,
      batch: { piscoTypeId: query.piscoTypeId },
    },
    AND: [resultAccessWhere(actor)],
  };
};

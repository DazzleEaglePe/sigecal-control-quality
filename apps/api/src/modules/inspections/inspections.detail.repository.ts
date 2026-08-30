import type { PrismaClient } from '../../generated/prisma/client.js';
import { applicableStandardsWhere } from '../physchem/physchem.queries.js';
import {
  mapSelectedPhysChemResult,
  physChemResultSelection,
  standardSelection,
} from '../physchem/physchem.repository.js';
import type {
  InspectionDetailRecord,
  InspectionRecord,
} from './inspections.types.js';

export const loadInspectionDetail = async (
  client: PrismaClient,
  inspection: InspectionRecord,
): Promise<InspectionDetailRecord | null> => {
  if (inspection.type !== 'FISICOQUIMICO')
    return { inspection, standards: [], results: [] };
  const batch = await client.batch.findUnique({
    where: { id: inspection.batchId },
    select: { piscoTypeId: true },
  });
  if (!batch) return null;
  const parameterIds = inspection.parameters.map(
    ({ parameter }) => parameter.id,
  );
  const [standards, results] = await Promise.all([
    client.standard.findMany({
      where: applicableStandardsWhere(
        parameterIds,
        inspection.scheduledDate,
        batch.piscoTypeId,
        inspection.stageId,
      ),
      select: standardSelection,
      orderBy: { validFrom: 'desc' },
    }),
    client.physChemResult.findMany({
      where: { inspectionId: inspection.id },
      select: physChemResultSelection,
      orderBy: { recordedAt: 'desc' },
    }),
  ]);
  return {
    inspection,
    standards,
    results: results.map(mapSelectedPhysChemResult),
  };
};

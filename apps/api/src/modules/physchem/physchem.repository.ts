import type {
  PhysChemControlChartQuery,
  PhysChemHistoryQuery,
  PhysChemResultListQuery,
} from '@sigecal/shared';

import type { Prisma, PrismaClient } from '../../generated/prisma/client.js';
import type {
  PhysChemActor,
  PhysChemInspectionContext,
  PhysChemReadRepositoryPort,
} from './physchem.types.js';
import {
  applicableStandardsWhere,
  controlChartWhere,
  inspectionAccessWhere,
  resultAccessWhere,
  resultListWhere,
} from './physchem.queries.js';

const codeSelection = { id: true, code: true } as const;
const referenceSelection = { ...codeSelection, name: true } as const;
const personSelection = { id: true, firstName: true, lastName: true } as const;
const equipmentSelection = {
  ...referenceSelection,
  status: true,
  lastCalibrationRef: true,
  isActive: true,
} as const;
const parameterSelection = {
  ...referenceSelection,
  unit: true,
  type: true,
} as const;
export const standardSelection = {
  id: true,
  parameterId: true,
  piscoTypeId: true,
  stageId: true,
  minValue: true,
  maxValue: true,
  targetValue: true,
  referenceNorm: true,
  defaultSeverity: true,
  isProvisional: true,
  validFrom: true,
  validTo: true,
  isActive: true,
} as const;
const ncSelection = {
  id: true,
  code: true,
  status: true,
  severity: true,
} as const;
const inspectionContextSelection = {
  id: true,
  code: true,
  type: true,
  status: true,
  scheduledDate: true,
  responsibleId: true,
  equipment: { select: equipmentSelection },
  batch: {
    select: {
      ...codeSelection,
      piscoTypeId: true,
      dataOrigin: true,
    },
  },
  stageId: true,
  parameters: { select: { parameter: { select: parameterSelection } } },
  results: {
    where: { status: { not: 'ANULADO' as const } },
    select: { id: true, parameterId: true, status: true },
  },
} as const;
export const physChemResultSelection = {
  id: true,
  inspectionId: true,
  inspection: {
    select: {
      ...codeSelection,
      batch: { select: codeSelection },
    },
  },
  parameterId: true,
  parameter: { select: parameterSelection },
  standardId: true,
  standard: { select: standardSelection },
  value: true,
  status: true,
  observation: true,
  equipmentId: true,
  equipment: { select: referenceSelection },
  calibrationRef: true,
  recordedBy: { select: personSelection },
  recordedById: true,
  recordedAt: true,
  dataOrigin: true,
  annulledBy: { select: personSelection },
  annulledById: true,
  annulledAt: true,
  annulReason: true,
  replacesId: true,
  replacement: { select: { id: true } },
  nonConformity: { select: ncSelection },
} as const;

type SelectedPhysChemResult = Prisma.PhysChemResultGetPayload<{
  select: typeof physChemResultSelection;
}>;

export const mapSelectedPhysChemResult = ({
  inspection,
  ...item
}: SelectedPhysChemResult) => ({
  ...item,
  inspection: { id: inspection.id, code: inspection.code },
  batch: inspection.batch,
});

export class PhysChemRepository implements PhysChemReadRepositoryPort {
  public constructor(private readonly client: PrismaClient) {}

  private async paginated(
    where: Prisma.PhysChemResultWhereInput,
    page: number,
    pageSize: number,
  ) {
    const total = await this.client.physChemResult.count({ where });
    const rawItems = await this.client.physChemResult.findMany({
      where,
      select: physChemResultSelection,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { recordedAt: 'desc' },
    });
    const items = rawItems.map(mapSelectedPhysChemResult);
    return { items, total };
  }

  public list(query: PhysChemResultListQuery, actor: PhysChemActor) {
    return this.paginated(
      resultListWhere(query, actor),
      query.page,
      query.pageSize,
    );
  }

  public findInspection(
    id: string,
    actor: PhysChemActor,
  ): Promise<PhysChemInspectionContext | null> {
    return this.client.inspection.findFirst({
      where: { id, ...inspectionAccessWhere(actor) },
      select: inspectionContextSelection,
    });
  }

  public findStandards(
    parameterIds: readonly string[],
    inspection: PhysChemInspectionContext,
  ) {
    const date = inspection.scheduledDate;
    return this.client.standard.findMany({
      where: applicableStandardsWhere(
        parameterIds,
        date,
        inspection.batch.piscoTypeId,
        inspection.stageId,
      ),
      select: standardSelection,
      orderBy: { validFrom: 'desc' },
    });
  }

  public async findCorrectionContext(
    id: string,
    equipmentId: string,
    actor: PhysChemActor,
  ) {
    const result = await this.client.physChemResult.findFirst({
      where: { id, ...resultAccessWhere(actor) },
      select: physChemResultSelection,
    });
    if (!result) return { result: null, inspection: null, equipment: null };
    const inspection = await this.client.inspection.findFirst({
      where: {
        id: result.inspectionId,
        ...inspectionAccessWhere(actor),
      },
      select: inspectionContextSelection,
    });
    const equipment = await this.client.equipment.findUnique({
      where: { id: equipmentId },
      select: equipmentSelection,
    });
    return {
      result: {
        ...result,
        inspection: { id: result.inspection.id, code: result.inspection.code },
        batch: result.inspection.batch,
      },
      inspection,
      equipment,
    };
  }

  public async findByIds(ids: readonly string[]) {
    const raw = await this.client.physChemResult.findMany({
      where: { id: { in: [...ids] } },
      select: physChemResultSelection,
      orderBy: { recordedAt: 'asc' },
    });
    return raw.map(mapSelectedPhysChemResult);
  }

  public history(query: PhysChemHistoryQuery, actor: PhysChemActor) {
    return this.paginated(
      {
        parameterId: query.parameterId,
        status: { not: 'ANULADO' },
        dataOrigin: 'REAL',
        ...(query.piscoTypeId
          ? { inspection: { batch: { piscoTypeId: query.piscoTypeId } } }
          : {}),
        AND: [resultAccessWhere(actor)],
      },
      query.page,
      query.pageSize,
    );
  }

  public controlChart(query: PhysChemControlChartQuery, actor: PhysChemActor) {
    return this.client.physChemResult
      .findMany({
        where: controlChartWhere(query, actor),
        select: {
          recordedAt: true,
          value: true,
          inspection: { select: { batch: { select: { code: true } } } },
        },
        orderBy: { recordedAt: 'asc' },
      })
      .then((rows) =>
        rows.map((row) => ({
          recordedAt: row.recordedAt,
          value: row.value,
          batchCode: row.inspection.batch.code,
        })),
      );
  }
}

import { Role, type SensorySessionListQuery } from '@sigecal/shared';
import type { Prisma, PrismaClient } from '../../generated/prisma/client.js';
import type {
  SensoryActor,
  SensoryInspection,
  SensoryReadRepositoryPort,
} from './sensory.types.js';

const person = { id: true, firstName: true, lastName: true } as const;
const threshold = {
  id: true,
  piscoTypeId: true,
  minAverage: true,
  defaultSeverity: true,
  referenceNorm: true,
  validFrom: true,
  isProvisional: true,
} as const;
const sessionSelection = {
  id: true,
  inspectionId: true,
  sessionDate: true,
  overallAverage: true,
  appliedThreshold: true,
  status: true,
  defectsFound: true,
  notes: true,
  recordedAt: true,
  dataOrigin: true,
  annulledAt: true,
  annulReason: true,
  replacesId: true,
  recordedBy: { select: person },
  annulledBy: { select: person },
  replacement: { select: { id: true } },
  sensoryThreshold: { select: threshold },
  inspection: {
    select: {
      id: true,
      code: true,
      batch: { select: { id: true, code: true } },
    },
  },
  panelists: {
    select: {
      id: true,
      externalName: true,
      user: { select: person },
      scores: {
        select: {
          score: true,
          descriptor: true,
          attribute: {
            select: { id: true, code: true, name: true, sequence: true },
          },
        },
        orderBy: { attribute: { sequence: 'asc' as const } },
      },
    },
  },
  nonConformity: {
    select: { id: true, code: true, status: true, severity: true },
  },
} as const;
const inspectionSelection = {
  id: true,
  code: true,
  type: true,
  status: true,
  scheduledDate: true,
  responsibleId: true,
  stageId: true,
  batch: {
    select: { id: true, code: true, piscoTypeId: true, dataOrigin: true },
  },
} as const;

const accessWhere = (actor: SensoryActor): Prisma.SensorySessionWhereInput =>
  actor.role === Role.OPERARIO
    ? {
        inspection: {
          OR: [{ responsibleId: actor.userId }, { createdById: actor.userId }],
        },
      }
    : {};
const inspectionAccess = (actor: SensoryActor): Prisma.InspectionWhereInput =>
  actor.role === Role.OPERARIO
    ? { OR: [{ responsibleId: actor.userId }, { createdById: actor.userId }] }
    : {};

export class SensoryRepository implements SensoryReadRepositoryPort {
  public constructor(private readonly client: PrismaClient) {}

  public findInspection(
    id: string,
    actor: SensoryActor,
  ): Promise<SensoryInspection | null> {
    return this.client.inspection.findFirst({
      where: { id, ...inspectionAccess(actor) },
      select: inspectionSelection,
    });
  }

  public findThreshold(inspection: SensoryInspection) {
    return this.client.sensoryThreshold.findFirst({
      where: {
        isActive: true,
        validFrom: { lte: inspection.scheduledDate },
        AND: [
          {
            OR: [
              { validTo: null },
              { validTo: { gte: inspection.scheduledDate } },
            ],
          },
          {
            OR: [
              { piscoTypeId: inspection.batch.piscoTypeId },
              { piscoTypeId: null },
            ],
          },
        ],
      },
      select: threshold,
      orderBy: [{ piscoTypeId: 'desc' }, { validFrom: 'desc' }],
    });
  }

  public activeAttributes() {
    return this.client.sensoryAttribute.findMany({
      where: { isActive: true },
      select: { id: true, code: true, name: true, sequence: true },
      orderBy: { sequence: 'asc' },
    });
  }

  public async usersExist(ids: readonly string[]): Promise<boolean> {
    return (
      (await this.client.user.count({
        where: { id: { in: [...new Set(ids)] }, isActive: true },
      })) === new Set(ids).size
    );
  }

  public panelistOptions() {
    return this.client.user.findMany({
      where: { isActive: true },
      select: person,
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    });
  }

  public findById(id: string, actor: SensoryActor) {
    return this.client.sensorySession.findFirst({
      where: { id, ...accessWhere(actor) },
      select: sessionSelection,
    });
  }

  public findByIds(ids: readonly string[], actor?: SensoryActor) {
    return this.client.sensorySession.findMany({
      where: { id: { in: [...ids] }, ...(actor ? accessWhere(actor) : {}) },
      select: sessionSelection,
      orderBy: { recordedAt: 'asc' },
    });
  }

  public async list(query: SensorySessionListQuery, actor: SensoryActor) {
    const where: Prisma.SensorySessionWhereInput = {
      ...(query.inspectionId ? { inspectionId: query.inspectionId } : {}),
      ...(query.batchId ? { inspection: { batchId: query.batchId } } : {}),
      ...(query.status ? { status: query.status } : {}),
      AND: [accessWhere(actor)],
    };
    const [total, items] = await Promise.all([
      this.client.sensorySession.count({ where }),
      this.client.sensorySession.findMany({
        where,
        select: sessionSelection,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { recordedAt: 'desc' },
      }),
    ]);
    return { items, total };
  }
}

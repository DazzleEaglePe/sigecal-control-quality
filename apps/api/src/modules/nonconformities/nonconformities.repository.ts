import {
  Role,
  type CreateNonConformityRequest,
  type UpdateNonConformityRequest,
} from '@sigecal/shared';

import type { Prisma, PrismaClient } from '../../generated/prisma/client.js';
import type {
  NonConformityActor,
  NonConformityReadRepositoryPort,
} from './nonconformities.types.js';

const referenceSelection = { id: true, code: true, name: true } as const;
const batchSelection = { id: true, code: true } as const;
const personSelection = { id: true, firstName: true, lastName: true } as const;

export const nonConformitySelection = {
  id: true,
  code: true,
  batchId: true,
  batch: { select: batchSelection },
  stageId: true,
  stage: { select: referenceSelection },
  inspectionId: true,
  physChemResultId: true,
  sensorySessionId: true,
  origin: true,
  severity: true,
  status: true,
  description: true,
  rootCause: true,
  detectedAt: true,
  detectedById: true,
  detectedBy: { select: personSelection },
  assignedToId: true,
  assignedTo: { select: personSelection },
  assignedAreaId: true,
  assignedArea: { select: referenceSelection },
  attentionStartedAt: true,
  closedAt: true,
  closedBy: { select: personSelection },
  closeComment: true,
  annulledAt: true,
  annulledBy: { select: personSelection },
  annulReason: true,
  dataOrigin: true,
} as const;

export const actionSelection = {
  id: true,
  nonConformityId: true,
  type: true,
  description: true,
  responsibleId: true,
  responsible: { select: personSelection },
  committedDate: true,
  executedAt: true,
  status: true,
  isEffective: true,
  verifiedById: true,
  verifiedBy: { select: personSelection },
  verifiedAt: true,
  verificationComment: true,
  replacesActionId: true,
} as const;

/** El OPERARIO solo ve las no conformidades que detectó, salvo que se le haya
 * asignado la atención: mismo criterio de pertenencia que aplica a lotes e
 * inspecciones (docs/07-SEGURIDAD-AUTH.md). */
const accessWhere = (
  actor: NonConformityActor,
): Prisma.NonConformityWhereInput =>
  actor.role === Role.OPERARIO
    ? { OR: [{ detectedById: actor.userId }, { assignedToId: actor.userId }] }
    : {};

const listWhere = (
  query: Parameters<NonConformityReadRepositoryPort['list']>[0],
  actor: NonConformityActor,
): Prisma.NonConformityWhereInput => ({
  ...(query.status ? { status: query.status } : {}),
  ...(query.severity ? { severity: query.severity } : {}),
  ...(query.batchId ? { batchId: query.batchId } : {}),
  ...(query.stageId ? { stageId: query.stageId } : {}),
  ...(query.origin ? { origin: query.origin } : {}),
  ...(query.assignedToId ? { assignedToId: query.assignedToId } : {}),
  ...(query.assignedAreaId ? { assignedAreaId: query.assignedAreaId } : {}),
  ...(query.dateFrom || query.dateTo
    ? {
        detectedAt: {
          ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
          ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
        },
      }
    : {}),
  ...(query.search
    ? {
        OR: [
          { code: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
          { batch: { code: { contains: query.search, mode: 'insensitive' } } },
        ],
      }
    : {}),
  ...accessWhere(actor),
});

const SORTABLE_FIELDS = ['code', 'detectedAt', 'severity', 'status'];
const requestedSort = (sortBy?: string): string =>
  sortBy && SORTABLE_FIELDS.includes(sortBy) ? sortBy : 'detectedAt';

export class NonConformityRepository implements NonConformityReadRepositoryPort {
  public constructor(private readonly client: PrismaClient) {}

  public async list(
    query: Parameters<NonConformityReadRepositoryPort['list']>[0],
    actor: NonConformityActor,
  ) {
    const where = listWhere(query, actor);
    const [total, items] = await Promise.all([
      this.client.nonConformity.count({ where }),
      this.client.nonConformity.findMany({
        where,
        select: nonConformitySelection,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: {
          [requestedSort(query.sortBy)]: query.sortOrder ?? 'desc',
        },
      }),
    ]);
    return { items, total };
  }

  public findAccessibleById(id: string, actor: NonConformityActor) {
    return this.client.nonConformity.findFirst({
      where: { id, ...accessWhere(actor) },
      select: nonConformitySelection,
    });
  }

  public async findDetailById(id: string, actor: NonConformityActor) {
    const nonConformity = await this.findAccessibleById(id, actor);
    if (!nonConformity) return null;
    const actions = await this.findActions(id);
    return { nonConformity, actions };
  }

  public findActions(nonConformityId: string) {
    return this.client.correctiveAction.findMany({
      where: { nonConformityId },
      select: actionSelection,
      orderBy: { committedDate: 'asc' },
    });
  }

  public findActionById(actionId: string) {
    return this.client.correctiveAction.findUnique({
      where: { id: actionId },
      select: actionSelection,
    });
  }

  public async findReferences(
    input: CreateNonConformityRequest | UpdateNonConformityRequest,
  ) {
    const stageId = 'stageId' in input ? input.stageId : undefined;
    const assignedToId =
      'assignedToId' in input ? input.assignedToId : undefined;
    const assignedAreaId =
      'assignedAreaId' in input ? input.assignedAreaId : undefined;
    const batch =
      'batchId' in input
        ? await this.client.batch.findUnique({
            where: { id: input.batchId },
            select: { id: true, dataOrigin: true },
          })
        : null;
    const stage = stageId
      ? await this.client.processStage.findUnique({
          where: { id: stageId },
          select: { ...referenceSelection, isActive: true },
        })
      : null;
    const assignedTo = assignedToId
      ? await this.client.user.findUnique({
          where: { id: assignedToId },
          select: { ...personSelection, isActive: true },
        })
      : null;
    const assignedArea = assignedAreaId
      ? await this.client.area.findUnique({
          where: { id: assignedAreaId },
          select: { ...referenceSelection, isActive: true },
        })
      : null;
    return { batch, stage, assignedTo, assignedArea };
  }

  public async findActionReferences(
    nonConformityId: string,
    responsibleId: string,
    replacesActionId?: string,
  ) {
    const nonConformity = await this.client.nonConformity.findUnique({
      where: { id: nonConformityId },
      select: nonConformitySelection,
    });
    const responsible = await this.client.user.findUnique({
      where: { id: responsibleId },
      select: { ...personSelection, isActive: true },
    });
    const replacesAction = replacesActionId
      ? await this.client.correctiveAction.findUnique({
          where: { id: replacesActionId },
          select: {
            id: true,
            nonConformityId: true,
            status: true,
            replacementAction: { select: { id: true } },
          },
        })
      : null;
    return { nonConformity, responsible, replacesAction };
  }
}

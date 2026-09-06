import { NotificationTypeSchema } from '@sigecal/shared';

import type { Prisma, PrismaClient } from '../../generated/prisma/client.js';
import {
  ActionStatus,
  InspectionStatus,
  NCStatus,
} from '../../generated/prisma/enums.js';
import type { NotificationEntityType, NotificationType } from '@sigecal/shared';
import type {
  NotificationGenerationPort,
  NotificationRecord,
  NotificationRepositoryPort,
} from './notifications.types.js';

const selection = {
  id: true,
  type: true,
  title: true,
  message: true,
  entityType: true,
  entityId: true,
  isRead: true,
  createdAt: true,
} as const;

const knownTypes = [...NotificationTypeSchema.options];

const toRecord = (row: {
  id: string;
  type: string;
  title: string;
  message: string;
  entityType: string | null;
  entityId: string | null;
  isRead: boolean;
  createdAt: Date;
}): NotificationRecord => ({
  ...row,
  type: row.type as NotificationType,
  entityType: row.entityType as NotificationEntityType | null,
});

export class NotificationRepository implements NotificationRepositoryPort {
  public constructor(private readonly client: PrismaClient) {}

  public async list(
    userId: string,
    query: Parameters<NotificationRepositoryPort['list']>[1],
  ) {
    const where = {
      userId,
      type: { in: knownTypes },
      ...(query.isRead === undefined ? {} : { isRead: query.isRead }),
    };
    const [total, rows] = await Promise.all([
      this.client.notification.count({ where }),
      this.client.notification.findMany({
        where,
        select: selection,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return { items: rows.map(toRecord), total };
  }

  public unreadCount(userId: string): Promise<number> {
    return this.client.notification.count({
      where: { userId, isRead: false, type: { in: knownTypes } },
    });
  }

  public async markRead(
    userId: string,
    id: string,
  ): Promise<NotificationRecord | null> {
    return this.client.$transaction(async (tx) => {
      const existing = await tx.notification.findFirst({
        where: { id, userId, type: { in: knownTypes } },
        select: selection,
      });
      if (!existing) return null;
      const row = existing.isRead
        ? existing
        : await tx.notification.update({
            where: { id },
            data: { isRead: true },
            select: selection,
          });
      return toRecord(row);
    });
  }

  public async markAllRead(userId: string): Promise<number> {
    const result = await this.client.notification.updateMany({
      where: { userId, isRead: false, type: { in: knownTypes } },
      data: { isRead: true },
    });
    return result.count;
  }
}

type Candidate = Prisma.NotificationCreateManyInput;

const inspectionCandidates = (
  rows: readonly {
    id: string;
    code: string;
    status: InspectionStatus;
    responsibleId: string;
    batch: { code: string };
  }[],
): Candidate[] =>
  rows.map((row) => {
    const overdue = row.status === InspectionStatus.VENCIDA;
    return {
      userId: row.responsibleId,
      dedupeKey: `inspection:${row.id}:${overdue ? 'overdue' : 'due'}:${row.responsibleId}`,
      type: overdue ? 'INSPECTION_OVERDUE' : 'INSPECTION_DUE_SOON',
      title: overdue ? 'Inspección vencida' : 'Inspección próxima',
      message: overdue
        ? `La inspección ${row.code} del lote ${row.batch.code} está vencida.`
        : `La inspección ${row.code} del lote ${row.batch.code} está programada dentro de las próximas 48 horas.`,
      entityType: 'Inspection',
      entityId: row.id,
    };
  });

const nonConformityCandidates = (
  rows: readonly { id: string; code: string; assignedToId: string | null }[],
): Candidate[] =>
  rows.flatMap((row) =>
    row.assignedToId
      ? [
          {
            userId: row.assignedToId,
            dedupeKey: `nonconformity:${row.id}:assigned:${row.assignedToId}`,
            type: 'NONCONFORMITY_ASSIGNED',
            title: 'No conformidad asignada',
            message: `La no conformidad ${row.code} fue asignada a su atención.`,
            entityType: 'NonConformity',
            entityId: row.id,
          },
        ]
      : [],
  );

interface ActionRow {
  readonly id: string;
  readonly responsibleId: string;
  readonly committedDate: Date;
  readonly status: ActionStatus;
  readonly nonConformity: { id: string; code: string };
}

const dueActionCandidate = (
  row: ActionRow,
  base: Pick<Candidate, 'userId' | 'entityType' | 'entityId'>,
): Candidate => ({
  ...base,
  dedupeKey: `action:${row.id}:due:${row.responsibleId}`,
  type: 'ACTION_DUE_SOON',
  title: 'Acción próxima a vencer',
  message: `Una acción de la no conformidad ${row.nonConformity.code} vence dentro de las próximas 48 horas.`,
});

const actionCandidates = (
  rows: readonly ActionRow[],
  now: Date,
  dueAt: Date,
): Candidate[] =>
  rows.flatMap((row) => {
    const today = new Date(now);
    today.setUTCHours(0, 0, 0, 0);
    const base = {
      userId: row.responsibleId,
      entityType: 'NonConformity',
      entityId: row.nonConformity.id,
    };
    const assigned: Candidate = {
      ...base,
      dedupeKey: `action:${row.id}:assigned:${row.responsibleId}`,
      type: 'ACTION_ASSIGNED',
      title: 'Acción correctiva asignada',
      message: `Una acción de la no conformidad ${row.nonConformity.code} fue asignada a su responsabilidad.`,
    };
    const inWindow =
      row.status !== ActionStatus.EJECUTADA &&
      row.committedDate >= today &&
      row.committedDate <= dueAt;
    return inWindow ? [assigned, dueActionCandidate(row, base)] : [assigned];
  });

export class NotificationGenerationRepository implements NotificationGenerationPort {
  public constructor(private readonly client: PrismaClient) {}

  public async generate(now: Date, dueAt: Date): Promise<number> {
    const [inspections, nonConformities, actions] = await Promise.all([
      this.findInspections(now, dueAt),
      this.findNonConformities(),
      this.findActions(),
    ]);
    const data = [
      ...inspectionCandidates(inspections),
      ...nonConformityCandidates(nonConformities),
      ...actionCandidates(actions, now, dueAt),
    ];
    if (data.length === 0) return 0;
    return (
      await this.client.notification.createMany({ data, skipDuplicates: true })
    ).count;
  }

  private findInspections(now: Date, dueAt: Date) {
    return this.client.inspection.findMany({
      where: {
        responsible: { isActive: true },
        OR: [
          { status: InspectionStatus.VENCIDA },
          {
            status: InspectionStatus.PROGRAMADA,
            scheduledDate: { gt: now, lte: dueAt },
          },
        ],
      },
      select: {
        id: true,
        code: true,
        status: true,
        responsibleId: true,
        batch: { select: { code: true } },
      },
    });
  }

  private findNonConformities() {
    return this.client.nonConformity.findMany({
      where: {
        assignedToId: { not: null },
        assignedTo: { isActive: true },
        status: { notIn: [NCStatus.CERRADA, NCStatus.ANULADA] },
      },
      select: { id: true, code: true, assignedToId: true },
    });
  }

  private findActions() {
    return this.client.correctiveAction.findMany({
      where: {
        responsible: { isActive: true },
        status: {
          in: [
            ActionStatus.PENDIENTE,
            ActionStatus.EN_EJECUCION,
            ActionStatus.EJECUTADA,
          ],
        },
      },
      select: {
        id: true,
        responsibleId: true,
        committedDate: true,
        status: true,
        nonConformity: { select: { id: true, code: true } },
      },
    });
  }
}

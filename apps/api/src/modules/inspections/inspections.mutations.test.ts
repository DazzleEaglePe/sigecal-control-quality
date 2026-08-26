import { describe, expect, it, vi } from 'vitest';

import { Prisma, type PrismaClient } from '../../generated/prisma/client.js';
import { InspectionMutationRepository } from './inspections.mutations.js';
import {
  createInput,
  IDS,
  inspectionRecord,
} from './inspections.test-helpers.js';

const auditRecord = {
  code: 'INS-2026-0002',
  batchId: IDS.batch,
  stageId: IDS.stage,
  type: 'FISICOQUIMICO' as const,
  status: 'PROGRAMADA' as const,
  scheduledDate: new Date('2026-09-15T14:00:00.000Z'),
  executedAt: null,
  responsibleId: IDS.user,
  equipmentId: IDS.equipment,
  rescheduledFromId: null,
  changeReason: null,
  notes: null,
  dataOrigin: 'REAL' as const,
};

const transactionalClient = (tx: Prisma.TransactionClient): PrismaClient =>
  ({
    $transaction: vi.fn(
      (work: (client: Prisma.TransactionClient) => Promise<unknown>) =>
        work(tx),
    ),
  }) as unknown as PrismaClient;

const rescheduleTransaction = () => {
  const create = vi.fn().mockResolvedValue({ id: IDS.replacement });
  const updateMany = vi.fn().mockResolvedValue({ count: 1 });
  const findUniqueOrThrow = vi
    .fn()
    .mockResolvedValueOnce({
      ...auditRecord,
      status: 'REPROGRAMADA',
      changeReason: 'Cambio de fecha',
    })
    .mockResolvedValueOnce({
      ...auditRecord,
      rescheduledFromId: IDS.inspection,
    });
  const tx = {
    inspection: {
      updateMany,
      findFirst: vi.fn().mockResolvedValue({ code: 'INS-2026-0001' }),
      create,
      findUniqueOrThrow,
    },
    auditLog: { create: vi.fn().mockResolvedValue({}) },
  } as unknown as Prisma.TransactionClient;
  return { tx, create, updateMany };
};

describe('creación transaccional de inspecciones', () => {
  it('reintenta una colisión y genera el siguiente código anual', async () => {
    const create = vi.fn().mockResolvedValue({ id: IDS.inspection });
    const tx = {
      inspection: {
        findFirst: vi.fn().mockResolvedValue({ code: 'INS-2026-0041' }),
        create,
        findUniqueOrThrow: vi.fn().mockResolvedValue(auditRecord),
      },
      auditLog: { create: vi.fn().mockResolvedValue({}) },
    } as unknown as Prisma.TransactionClient;
    const collision = new Prisma.PrismaClientKnownRequestError('collision', {
      code: 'P2002',
      clientVersion: 'test',
    });
    const transaction = vi
      .fn()
      .mockRejectedValueOnce(collision)
      .mockImplementationOnce(
        (work: (client: Prisma.TransactionClient) => Promise<unknown>) =>
          work(tx),
      );
    const repository = new InspectionMutationRepository({
      $transaction: transaction,
    } as unknown as PrismaClient);

    await expect(
      repository.create(createInput, 'REAL', IDS.user),
    ).resolves.toBe(IDS.inspection);
    expect(transaction).toHaveBeenCalledTimes(2);
    const call = create.mock.calls[0]?.[0] as
      { readonly data?: { readonly code?: unknown } } | undefined;
    expect(call?.data?.code).toBe('INS-2026-0042');
  });
});

describe('vencimiento automático de inspecciones', () => {
  it('es idempotente mediante un único updateMany', async () => {
    const updateMany = vi.fn().mockResolvedValueOnce({ count: 2 });
    const repository = new InspectionMutationRepository({
      inspection: { updateMany },
    } as unknown as PrismaClient);
    const now = new Date('2026-09-16T00:00:00.000Z');

    await expect(repository.markOverdue(now)).resolves.toBe(2);
    expect(updateMany).toHaveBeenCalledWith({
      where: { status: 'PROGRAMADA', scheduledDate: { lt: now } },
      data: { status: 'VENCIDA' },
    });
  });
});

describe('reprogramación transaccional de inspecciones', () => {
  it('preserva la fecha y el registro original', async () => {
    const { tx, create, updateMany } = rescheduleTransaction();
    const repository = new InspectionMutationRepository(
      transactionalClient(tx),
    );

    await expect(
      repository.reschedule(
        inspectionRecord(),
        {
          newDate: '2026-09-20T09:00:00-05:00',
          reason: 'Cambio de fecha',
        },
        IDS.user,
      ),
    ).resolves.toBe(IDS.replacement);
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: 'REPROGRAMADA', changeReason: 'Cambio de fecha' },
      }),
    );
    const call = create.mock.calls[0]?.[0] as
      { readonly data?: { readonly rescheduledFromId?: unknown } } | undefined;
    expect(call?.data?.rescheduledFromId).toBe(IDS.inspection);
  });
});

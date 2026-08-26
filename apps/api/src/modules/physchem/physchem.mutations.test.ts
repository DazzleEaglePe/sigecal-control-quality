import { describe, expect, it, vi } from 'vitest';

import type { Prisma, PrismaClient } from '../../generated/prisma/client.js';
import { PhysChemMutationRepository } from './physchem.mutations.js';
import {
  IDS,
  inspectionContext,
  resultRecord,
  standardRecord,
} from './physchem.test-helpers.js';
import type { EvaluatedMeasurement } from './physchem.types.js';

const inspectionAuditRecord = {
  code: 'INS-2026-0001',
  batchId: IDS.batch,
  stageId: IDS.stage,
  type: 'FISICOQUIMICO' as const,
  status: 'EN_PROCESO' as const,
  scheduledDate: new Date('2026-08-25T14:00:00.000Z'),
  executedAt: new Date('2026-08-25T14:05:00.000Z'),
  responsibleId: IDS.user,
  equipmentId: IDS.equipment,
  rescheduledFromId: null,
  changeReason: null,
  notes: null,
  dataOrigin: 'REAL' as const,
};

const evaluation = (
  status: EvaluatedMeasurement['status'],
): EvaluatedMeasurement => ({
  parameterId: IDS.parameter,
  value: status === 'CONFORME' ? 15 : 21,
  status,
  standard: standardRecord(),
});

const transactionalClient = (tx: Prisma.TransactionClient): PrismaClient =>
  ({
    $transaction: vi.fn(
      (work: (client: Prisma.TransactionClient) => Promise<unknown>) =>
        work(tx),
    ),
  }) as unknown as PrismaClient;

const creationTransaction = () => {
  const resultCreate = vi.fn().mockResolvedValue({ id: IDS.result });
  const ncCreate = vi.fn().mockResolvedValue({
    id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    code: 'NC-2026-0001',
    status: 'ABIERTA',
    severity: 'MODERADA',
  });
  const inspectionUpdate = vi.fn().mockResolvedValue({ count: 1 });
  const tx = {
    physChemResult: {
      count: vi.fn().mockResolvedValue(0),
      create: resultCreate,
      groupBy: vi
        .fn()
        .mockResolvedValue([
          { parameterId: IDS.parameter, _count: { _all: 1 } },
        ]),
      findUniqueOrThrow: vi.fn().mockResolvedValue(resultRecord()),
    },
    nonConformity: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: ncCreate,
    },
    inspectionParameter: { count: vi.fn().mockResolvedValue(1) },
    inspection: {
      count: vi.fn().mockResolvedValue(1),
      updateMany: inspectionUpdate,
      findUniqueOrThrow: vi
        .fn()
        .mockResolvedValueOnce(inspectionAuditRecord)
        .mockResolvedValueOnce({
          ...inspectionAuditRecord,
          status: 'COMPLETADA',
        }),
    },
    auditLog: { create: vi.fn().mockResolvedValue({}) },
  } as unknown as Prisma.TransactionClient;
  return { tx, resultCreate, ncCreate, inspectionUpdate };
};

const correctionTransaction = () => {
  const resultUpdate = vi.fn().mockResolvedValue({ count: 1 });
  const ncUpdate = vi.fn().mockResolvedValue({});
  const resultCreate = vi.fn().mockResolvedValue({ id: IDS.replacement });
  const tx = {
    physChemResult: {
      updateMany: resultUpdate,
      create: resultCreate,
      findUniqueOrThrow: vi
        .fn()
        .mockResolvedValueOnce(resultRecord({ status: 'ANULADO' }))
        .mockResolvedValueOnce(
          resultRecord({ id: IDS.replacement, replacesId: IDS.result }),
        ),
    },
    nonConformity: { update: ncUpdate },
    auditLog: { create: vi.fn().mockResolvedValue({}) },
  } as unknown as Prisma.TransactionClient;
  return { tx, resultUpdate, ncUpdate, resultCreate };
};

describe('creación transaccional fisicoquímica', () => {
  it('genera NC automática y completa la inspección con cobertura total', async () => {
    const { tx, resultCreate, ncCreate, inspectionUpdate } =
      creationTransaction();
    const repository = new PhysChemMutationRepository(transactionalClient(tx));
    await expect(
      repository.create(
        inspectionContext(),
        [evaluation('NO_CONFORME')],
        IDS.user,
      ),
    ).resolves.toEqual([IDS.result]);
    expect(resultCreate).toHaveBeenCalledOnce();
    const ncCall = ncCreate.mock.calls[0]?.[0] as
      { readonly data?: Record<string, unknown> } | undefined;
    expect(ncCall?.data).toMatchObject({
      origin: 'AUTOMATICA_FISICOQUIMICA',
      severity: 'MODERADA',
      physChemResultId: IDS.result,
    });
    expect(inspectionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'COMPLETADA' } }),
    );
  });
});

describe('corrección transaccional fisicoquímica', () => {
  it('anula resultado y NC anterior antes de crear el reemplazo', async () => {
    const { tx, resultUpdate, ncUpdate, resultCreate } =
      correctionTransaction();
    const repository = new PhysChemMutationRepository(transactionalClient(tx));
    const current = resultRecord({
      nonConformity: {
        id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
        code: 'NC-2026-0001',
        status: 'ABIERTA',
        severity: 'MODERADA',
      },
    });
    const inspection = inspectionContext();
    const equipment = inspection.equipment;
    if (!equipment) throw new Error('Falta el equipo de prueba.');
    await repository.correct(
      { result: current, inspection, equipment },
      { reason: 'Error de digitación', value: 15, equipmentId: IDS.equipment },
      evaluation('CONFORME'),
      IDS.user,
    );
    const resultUpdateCall = resultUpdate.mock.calls[0]?.[0] as
      { readonly data?: Record<string, unknown> } | undefined;
    const ncUpdateCall = ncUpdate.mock.calls[0]?.[0] as
      { readonly data?: Record<string, unknown> } | undefined;
    const resultCreateCall = resultCreate.mock.calls[0]?.[0] as
      { readonly data?: Record<string, unknown> } | undefined;
    expect(resultUpdateCall?.data).toMatchObject({ status: 'ANULADO' });
    expect(ncUpdateCall?.data).toMatchObject({ status: 'ANULADA' });
    expect(resultCreateCall?.data).toMatchObject({ replacesId: IDS.result });
  });
});

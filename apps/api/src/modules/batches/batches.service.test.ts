import { describe, expect, it, vi } from 'vitest';
import type {
  AdvanceBatchStageRequest,
  BatchListQuery,
  CreateBatchRequest,
  RejectBatchRequest,
  UpdateBatchRequest,
} from '@sigecal/shared';

import { Prisma } from '../../generated/prisma/client.js';
import { BatchesService } from './batches.service.js';
import type {
  BatchActor,
  BatchMutationRepositoryPort,
  BatchReadRepositoryPort,
  BatchRecord,
  BatchSortField,
} from './batches.types.js';

const IDS = {
  batch: '11111111-1111-4111-a111-111111111111',
  pisco: '22222222-2222-4222-a222-222222222222',
  variety: '33333333-3333-4333-a333-333333333333',
  stage: '44444444-4444-4444-a444-444444444444',
  nextStage: '55555555-5555-4555-a555-555555555555',
  user: '66666666-6666-4666-a666-666666666666',
} as const;
const actor: BatchActor = { userId: IDS.user, role: 'JEFE_CALIDAD' };
const person = { id: IDS.user, firstName: 'Nicolle', lastName: 'Calidad' };

const batchRecord = (overrides: Partial<BatchRecord> = {}): BatchRecord => ({
  id: IDS.batch,
  code: 'LT-2026-0006',
  piscoType: { id: IDS.pisco, code: 'PURO', name: 'Puro' },
  currentStage: {
    id: IDS.stage,
    code: 'RECEPCION_UVA',
    name: 'Recepción de uva',
    sequence: 1,
  },
  status: 'EN_PROCESO',
  startDate: new Date('2026-08-24T00:00:00.000Z'),
  closeDate: null,
  rejectedAt: null,
  rejectedBy: null,
  rejectionReason: null,
  volumeLiters: new Prisma.Decimal(500),
  harvestOrigin: 'Ica',
  notes: null,
  createdBy: person,
  dataOrigin: 'REAL',
  createdAt: new Date('2026-08-24T14:00:00.000Z'),
  updatedAt: new Date('2026-08-24T14:00:00.000Z'),
  varieties: [
    {
      variety: { id: IDS.variety, code: 'QUEBRANTA', name: 'Quebranta' },
      percentage: new Prisma.Decimal(100),
    },
  ],
  openNonConformities: 0,
  hasInspections: false,
  ...overrides,
});

class MemoryReadRepository implements BatchReadRepositoryPort {
  public record = batchRecord();
  public piscoCode = 'PURO';
  public warnings = ['PENDING_INSPECTIONS'] as const;

  public list(
    _query: BatchListQuery,
    _actor: BatchActor,
    _sortBy: BatchSortField,
  ) {
    void _query;
    void _actor;
    void _sortBy;
    return Promise.resolve({ items: [this.record], total: 1 });
  }
  public findAccessibleById() {
    return Promise.resolve(this.record);
  }
  public findPiscoType(id: string) {
    return Promise.resolve({
      id,
      code: this.piscoCode,
      name: 'Tipo',
      isActive: true,
    });
  }
  public findVarieties(ids: readonly string[]) {
    return Promise.resolve(
      ids.map((id) => ({ id, code: 'UVA', name: 'Uva', isActive: true })),
    );
  }
  public findFirstStage() {
    return Promise.resolve(this.record.currentStage);
  }
  public findNextStage() {
    return Promise.resolve({
      id: IDS.nextStage,
      code: 'MOLIENDA',
      name: 'Molienda',
      sequence: 2,
    });
  }
  public activeUserExists() {
    return Promise.resolve(true);
  }
  public timeline() {
    return Promise.resolve({
      stages: [this.record.currentStage],
      visits: [],
      inspections: [],
      nonConformities: [],
    });
  }
  public advanceWarnings() {
    return Promise.resolve(this.warnings);
  }
}

class MemoryMutationRepository implements BatchMutationRepositoryPort {
  public readonly createSpy = vi.fn();
  public readonly updateSpy = vi.fn();
  public readonly advanceSpy = vi.fn();
  public readonly closeSpy = vi.fn();
  public readonly rejectSpy = vi.fn();

  public create(
    input: CreateBatchRequest,
    stageId: string,
    actorId: string,
    ip?: string,
  ) {
    this.createSpy(input, stageId, actorId, ip);
    return Promise.resolve(IDS.batch);
  }
  public update(id: string, input: UpdateBatchRequest, actorId: string) {
    this.updateSpy(id, input, actorId);
    return Promise.resolve();
  }
  public advance(
    id: string,
    current: string,
    next: string,
    input: AdvanceBatchStageRequest,
    actorId: string,
  ) {
    this.advanceSpy(id, current, next, input, actorId);
    return Promise.resolve();
  }
  public close(id: string, actorId: string) {
    this.closeSpy(id, actorId);
    return Promise.resolve();
  }
  public reject(id: string, input: RejectBatchRequest, actorId: string) {
    this.rejectSpy(id, input, actorId);
    return Promise.resolve();
  }
}

const validInput: CreateBatchRequest = {
  piscoTypeId: IDS.pisco,
  varieties: [{ varietyId: IDS.variety, percentage: 100 }],
  startDate: '2026-08-24',
  volumeLiters: 500,
};

describe('BatchesService', () => {
  it('crea un lote con la primera etapa y conserva el origen REAL del repositorio', async () => {
    const read = new MemoryReadRepository();
    const mutations = new MemoryMutationRepository();
    const result = await new BatchesService(read, mutations).create(
      validInput,
      actor,
    );

    expect(result.dataOrigin).toBe('REAL');
    expect(mutations.createSpy).toHaveBeenCalledWith(
      validInput,
      IDS.stage,
      IDS.user,
      undefined,
    );
  });

  it('rechaza composiciones incompatibles con PURO y ACHOLADO', async () => {
    const read = new MemoryReadRepository();
    const service = new BatchesService(read, new MemoryMutationRepository());
    const twoVarieties = {
      ...validInput,
      varieties: [
        ...validInput.varieties,
        { varietyId: IDS.nextStage, percentage: 0.1 },
      ],
    };
    await expect(service.create(twoVarieties, actor)).rejects.toMatchObject({
      code: 'INVALID_PISCO_COMPOSITION',
    });
    read.piscoCode = 'ACHOLADO';
    await expect(service.create(validInput, actor)).rejects.toMatchObject({
      code: 'INVALID_PISCO_COMPOSITION',
    });
  });
});

describe('protección del ciclo de vida de lotes', () => {
  it('impide actualizar un lote en estado terminal', async () => {
    const read = new MemoryReadRepository();
    read.record = batchRecord({ status: 'CERRADO' });
    const mutations = new MemoryMutationRepository();
    const service = new BatchesService(read, mutations);

    await expect(
      service.update(IDS.batch, { volumeLiters: 600 }, actor),
    ).rejects.toMatchObject({ code: 'BATCH_NOT_MUTABLE' });
    expect(mutations.updateSpy).not.toHaveBeenCalled();
  });

  it('congela la identidad después de avanzar de la etapa inicial', async () => {
    const read = new MemoryReadRepository();
    read.record = batchRecord({
      currentStage: { ...batchRecord().currentStage, sequence: 2 },
    });
    const service = new BatchesService(read, new MemoryMutationRepository());
    await expect(
      service.update(IDS.batch, { startDate: '2026-08-25' }, actor),
    ).rejects.toMatchObject({ code: 'BATCH_IDENTITY_FROZEN' });
  });
});

describe('transiciones del ciclo de vida de lotes', () => {
  it('avanza solo a la etapa inmediata y devuelve alertas no bloqueantes', async () => {
    const read = new MemoryReadRepository();
    const mutations = new MemoryMutationRepository();
    const service = new BatchesService(read, mutations);
    const input = { responsibleId: IDS.user };
    const result = await service.advance(IDS.batch, input, actor);

    expect(result.warnings).toEqual(['PENDING_INSPECTIONS']);
    expect(mutations.advanceSpy).toHaveBeenCalledWith(
      IDS.batch,
      IDS.stage,
      IDS.nextStage,
      input,
      IDS.user,
    );
  });

  it('impide que ANALISTA cierre o rechace lotes', async () => {
    const service = new BatchesService(
      new MemoryReadRepository(),
      new MemoryMutationRepository(),
    );
    await expect(
      service.close(IDS.batch, { ...actor, role: 'ANALISTA' }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });
});

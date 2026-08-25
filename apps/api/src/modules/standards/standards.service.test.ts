import { describe, expect, it } from 'vitest';

import type {
  CreateStandardRequest,
  EffectiveStandardQuery,
  StandardHistoryQuery,
  UpdateStandardRequest,
} from '@sigecal/shared';

import { Prisma } from '../../generated/prisma/client.js';
import { StandardsService } from './standards.service.js';
import type {
  StandardRecord,
  StandardRepositoryPort,
  ThresholdRepositoryPort,
} from './standards.types.js';

const id = (digit: number): string =>
  `${String(digit)}1111111-1111-4111-a111-111111111111`;
const standard = (overrides: Partial<StandardRecord> = {}): StandardRecord => ({
  id: id(1),
  parameterId: id(2),
  piscoTypeId: null,
  stageId: null,
  minValue: new Prisma.Decimal(1),
  maxValue: new Prisma.Decimal(5),
  targetValue: new Prisma.Decimal(3),
  referenceNorm: null,
  defaultSeverity: 'MODERADA',
  isProvisional: false,
  validFrom: new Date('2026-01-01T00:00:00.000Z'),
  validTo: null,
  isActive: true,
  ...overrides,
});
const query: EffectiveStandardQuery = {
  parameterId: id(2),
  piscoTypeId: id(3),
  stageId: id(4),
  date: '2026-09-01',
  dataOrigin: 'REAL',
};

class MemoryStandards implements StandardRepositoryPort {
  public records: StandardRecord[] = [];
  public overlaps: StandardRecord[] = [];
  public references = true;
  public results = 0;
  public previousId: string | undefined;
  public list(_query: StandardHistoryQuery) {
    void _query;
    return Promise.resolve(this.records);
  }
  public findById(target: string) {
    return Promise.resolve(
      this.records.find((item) => item.id === target) ?? null,
    );
  }
  public findOverlaps(_input: CreateStandardRequest) {
    void _input;
    return Promise.resolve(this.overlaps);
  }
  public findCandidates(_query: EffectiveStandardQuery) {
    void _query;
    return Promise.resolve(this.records);
  }
  public referencesExist(_input: CreateStandardRequest) {
    void _input;
    return Promise.resolve(this.references);
  }
  public resultCount() {
    return Promise.resolve(this.results);
  }
  public create(
    input: CreateStandardRequest,
    _actor: string,
    previousId?: string,
  ) {
    void _actor;
    this.previousId = previousId;
    return Promise.resolve(
      standard({
        parameterId: input.parameterId,
        piscoTypeId: input.piscoTypeId ?? null,
        stageId: input.stageId ?? null,
        isProvisional: input.isProvisional,
        validFrom: new Date(`${input.validFrom}T00:00:00.000Z`),
      }),
    );
  }
  public update(target: string, input: UpdateStandardRequest) {
    const current =
      this.records.find((item) => item.id === target) ??
      standard({ id: target });
    return Promise.resolve({
      ...current,
      isProvisional: input.isProvisional ?? current.isProvisional,
    });
  }
}

const unusedThresholds: ThresholdRepositoryPort = {
  list: () => Promise.resolve([]),
  findOverlaps: () => Promise.resolve([]),
  findCandidates: () => Promise.resolve([]),
  piscoTypeExists: () => Promise.resolve(true),
  create: () => Promise.reject(new Error('unused')),
};
const input: CreateStandardRequest = {
  parameterId: id(2),
  minValue: 1,
  maxValue: 5,
  targetValue: 3,
  defaultSeverity: 'MODERADA',
  isProvisional: true,
  validFrom: '2026-09-01',
};

describe('resolución de estándares', () => {
  it('prioriza tipo+etapa, luego tipo, etapa y general', async () => {
    const repository = new MemoryStandards();
    repository.records = [
      standard({ id: id(5) }),
      standard({ id: id(6), stageId: id(4) }),
      standard({ id: id(7), piscoTypeId: id(3) }),
      standard({ id: id(8), piscoTypeId: id(3), stageId: id(4) }),
    ];
    const result = await new StandardsService(
      repository,
      unusedThresholds,
    ).effective(query);
    expect(result.id).toBe(id(8));
  });

  it('ignora provisionales para REAL y bloquea cuando no existe alternativa confirmada', async () => {
    const repository = new MemoryStandards();
    repository.records = [
      standard({ id: id(5) }),
      standard({ id: id(8), piscoTypeId: id(3), isProvisional: true }),
    ];
    const service = new StandardsService(repository, unusedThresholds);
    expect((await service.effective(query)).id).toBe(id(5));
    repository.records = [standard({ isProvisional: true })];
    await expect(service.effective(query)).rejects.toMatchObject({
      code: 'PROVISIONAL_STANDARD_FOR_REAL_DATA',
    });
  });
});

describe('versionado de estándares', () => {
  it('cierra una única versión abierta anterior y rechaza otros solapamientos', async () => {
    const repository = new MemoryStandards();
    const service = new StandardsService(repository, unusedThresholds);
    repository.overlaps = [standard()];
    await service.create(input, id(9));
    expect(repository.previousId).toBe(id(1));
    repository.overlaps = [
      standard({ validTo: new Date('2026-12-01T00:00:00.000Z') }),
    ];
    await expect(service.create(input, id(9))).rejects.toMatchObject({
      code: 'OVERLAPPING_VALIDITY',
    });
  });

  it('impide modificar una versión ya aplicada', async () => {
    const repository = new MemoryStandards();
    repository.records = [standard()];
    repository.results = 1;
    await expect(
      new StandardsService(repository, unusedThresholds).update(
        id(1),
        { isProvisional: false },
        id(9),
      ),
    ).rejects.toMatchObject({ code: 'STANDARD_ALREADY_APPLIED' });
  });
});
